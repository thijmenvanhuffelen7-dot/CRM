/**
 * Supabase sync: loads the workspace into the client store, writes every local change
 * back to the database (diffing the store by reference), and applies other people's
 * changes live through Realtime.
 */
import { create } from "zustand";
import { toast } from "sonner";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useData } from "@/store/data";
import { useAuth } from "@/store/auth";
import { buildSeed, type SeedData } from "@/data/seed";

type Status = "signed_out" | "loading" | "ready" | "no_access" | "error";

export const useRemote = create<{ status: Status; email: string | null; error: string | null }>(() => ({
  status: "signed_out",
  email: null,
  error: null,
}));

/** Store collection -> table. */
const collections = {
  team: "team_members",
  clients: "clients",
  leads: "leads",
  campaigns: "campaigns",
  tasks: "tasks",
  metrics: "metrics",
  activities: "activities",
} as const;
type CollectionKey = keyof typeof collections;
const settingKeys = ["agency", "packages", "stages", "integrations"] as const;
type SettingKey = (typeof settingKeys)[number];

type Doc = Record<string, unknown>;
const idOf = (key: CollectionKey, item: Doc) => (key === "metrics" ? `${item.clientId}:${item.month}` : String(item.id));

/** JSON with sorted keys, so local objects compare equal to jsonb round-trips. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v)
      .filter((k) => (v as Doc)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Doc)[k])}`)
      .join(",")}}`;
  return JSON.stringify(v ?? null);
}

// table -> id -> data (null = delete)
const queue = new Map<string, Map<string, unknown | null>>();
const written = new Map<string, string>(); // `${table}:${id}` -> stable json last sent
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;
let channel: RealtimeChannel | null = null;
let unsubscribeStore: (() => void) | null = null;
let loadedFor: string | null = null;

function enqueue(table: string, id: string, data: unknown | null) {
  if (!queue.has(table)) queue.set(table, new Map());
  queue.get(table)!.set(id, data);
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 250);
}

async function flush() {
  if (!supabase) return;
  const batches = [...queue.entries()];
  queue.clear();
  for (const [table, items] of batches) {
    const upserts: { id: string; data: unknown }[] = [];
    const deletes: string[] = [];
    items.forEach((data, id) => (data === null ? deletes.push(id) : upserts.push({ id, data })));
    upserts.forEach((r) => written.set(`${table}:${r.id}`, stable(r.data)));
    deletes.forEach((id) => written.delete(`${table}:${id}`));
    const results = await Promise.all([
      ...chunk(upserts, 200).map((rows) => supabase!.from(table).upsert(rows)),
      ...chunk(deletes, 200).map((ids) => supabase!.from(table).delete().in("id", ids)),
    ]);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error("Couldn't save your change", {
        description: failed.error.code === "42501" ? "Your role doesn't allow this change." : failed.error.message,
      });
      // Re-sync with the database so the UI doesn't show a change that wasn't saved.
      const session = (await supabase.auth.getSession()).data.session;
      if (session) void load(session, true);
    }
  }
}

const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

/** Compare two store snapshots and queue the differences. */
function diff(prev: SeedData, next: SeedData) {
  (Object.keys(collections) as CollectionKey[]).forEach((key) => {
    const a = prev[key] as unknown as Doc[];
    const b = next[key] as unknown as Doc[];
    if (a === b) return;
    const table = collections[key];
    const before = new Map(a.map((x) => [idOf(key, x), x]));
    const after = new Set<string>();
    b.forEach((item) => {
      const id = idOf(key, item);
      after.add(id);
      if (before.get(id) !== item) enqueue(table, id, item);
    });
    before.forEach((_, id) => !after.has(id) && enqueue(table, id, null));
  });
  settingKeys.forEach((k) => {
    if (prev[k] !== next[k]) enqueue("settings", k, next[k]);
  });
}

async function fetchAll(table: string) {
  const rows: { id: string; data: Doc }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase!.from(table).select("id, data").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as typeof rows));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

function applyRemote(fn: () => void) {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

async function load(session: Session, silent = false) {
  if (!supabase) return;
  const email = session.user.email?.toLowerCase() ?? "";
  if (!silent) useRemote.setState({ status: "loading", email, error: null });
  try {
    const [settings, ...cols] = await Promise.all([fetchAll("settings"), ...Object.values(collections).map(fetchAll)]);
    const patch: Partial<SeedData> = {};
    (Object.keys(collections) as CollectionKey[]).forEach((key, i) => {
      (patch as Doc)[key] = cols[i].map((r) => r.data);
    });
    patch.activities = (patch.activities ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    settings.forEach((r) => {
      if ((settingKeys as readonly string[]).includes(r.id)) (patch as Doc)[r.id] = r.data;
    });
    applyRemote(() => useData.setState(patch));

    const member = useData.getState().team.find((m) => m.email.toLowerCase() === email);
    if (!member) {
      useRemote.setState({ status: "no_access" });
      return;
    }
    useAuth.getState().signIn(member.id);
    useRemote.setState({ status: "ready" });
    subscribe();
  } catch (e) {
    useRemote.setState({ status: "error", error: (e as Error).message });
  }
}

function subscribe() {
  if (!supabase) return;
  if (!unsubscribeStore) {
    unsubscribeStore = useData.subscribe((state, prev) => {
      if (applyingRemote || useRemote.getState().status !== "ready") return;
      diff(prev, state);
    });
  }
  if (channel) return;
  const keyByTable = Object.fromEntries(Object.entries(collections).map(([k, t]) => [t, k])) as Record<string, CollectionKey>;
  channel = supabase
    .channel("workspace")
    .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
      const table = payload.table;
      const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as { id?: string; data?: Doc };
      if (!row?.id) return;
      const ref = `${table}:${row.id}`;
      if (queue.get(table)?.has(row.id)) return; // local change pending, ours wins
      if (payload.eventType !== "DELETE" && written.get(ref) === stable(row.data)) return; // echo of our own write
      applyRemote(() => {
        if (table === "settings") {
          if (payload.eventType !== "DELETE" && (settingKeys as readonly string[]).includes(row.id!)) useData.setState({ [row.id as SettingKey]: row.data } as Partial<SeedData>);
          return;
        }
        const key = keyByTable[table];
        if (!key) return;
        useData.setState((s) => {
          const list = s[key] as unknown as Doc[];
          const rest = list.filter((x) => idOf(key, x) !== row.id);
          if (payload.eventType === "DELETE") return { [key]: rest } as Partial<SeedData>;
          const exists = rest.length !== list.length;
          const next = exists ? list.map((x) => (idOf(key, x) === row.id ? row.data! : x)) : key === "activities" ? [row.data!, ...list] : [...list, row.data!];
          return { [key]: next } as Partial<SeedData>;
        });
      });
      if (table === "team_members") {
        // role changes or removal of the signed-in user
        const email = useRemote.getState().email;
        const me = useData.getState().team.find((m) => m.email.toLowerCase() === email);
        if (!me) useRemote.setState({ status: "no_access" });
      }
    })
    .subscribe();
}

function teardown() {
  clearTimeout(flushTimer);
  queue.clear();
  written.clear();
  unsubscribeStore?.();
  unsubscribeStore = null;
  if (channel) void supabase?.removeChannel(channel);
  channel = null;
  loadedFor = null;
}

/** Call once at startup when Supabase is configured. */
export function startSync() {
  if (!supabase) return;
  const onSession = (session: Session | null) => {
    if (!session) {
      teardown();
      useAuth.setState({ userId: null });
      useRemote.setState({ status: "signed_out", email: null });
      return;
    }
    if (loadedFor === session.user.id) return;
    loadedFor = session.user.id;
    void load(session);
  };
  void supabase.auth.getSession().then(({ data }) => onSession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => {
    // defer: supabase-js warns against awaiting its own calls inside this callback
    setTimeout(() => onSession(session), 0);
  });
  window.addEventListener("beforeunload", () => {
    if (queue.size) void flush();
  });
}

export async function retrySync() {
  const session = (await supabase?.auth.getSession())?.data.session;
  if (session) {
    loadedFor = session.user.id;
    await load(session);
  }
}

/**
 * Replace the workspace content with the demo data set. The signed-in admin takes the place
 * of the demo admin; the demo copywriter and designer are added as placeholder members.
 */
export function loadDemoData() {
  const state = useData.getState();
  const me = state.team.find((m) => m.id === useAuth.getState().userId);
  if (!me) return;
  const seed = JSON.parse(JSON.stringify(buildSeed()).split('"u_sophie"').join(JSON.stringify(me.id))) as SeedData;
  useData.setState({
    team: [me, ...seed.team.filter((m) => m.id !== me.id)],
    clients: seed.clients,
    leads: seed.leads,
    campaigns: seed.campaigns,
    tasks: seed.tasks,
    metrics: seed.metrics,
    activities: seed.activities,
    packages: seed.packages,
    stages: seed.stages,
    integrations: seed.integrations,
    agency: state.agency.name && state.agency.name !== "My Agency" ? state.agency : seed.agency,
  });
}
