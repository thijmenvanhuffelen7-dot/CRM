import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed, uid, type SeedData } from "@/data/seed";
import type {
  Activity,
  AgencyProfile,
  Campaign,
  CampaignStatus,
  Client,
  Contact,
  FileAsset,
  Flow,
  Lead,
  Package,
  PipelineStage,
  Task,
  TeamMember,
} from "@/data/types";
import { useAuth } from "./auth";
import { campaignStatusLabel } from "@/lib/constants";

type Patch<T> = Partial<T>;

interface DataState extends SeedData {
  seededAt: string;
  // leads
  addLead: (l: Partial<Lead> & Pick<Lead, "company">) => Lead;
  updateLead: (id: string, p: Patch<Lead>) => void;
  moveLead: (id: string, stageId: string) => void;
  deleteLead: (id: string) => void;
  addLeadNote: (id: string, body: string) => void;
  convertLead: (id: string) => string;
  // clients
  addClient: (c: Partial<Client> & Pick<Client, "name">) => Client;
  updateClient: (id: string, p: Patch<Client>) => void;
  deleteClient: (id: string) => void;
  updateFlow: (clientId: string, flowId: string, p: Patch<Flow>) => void;
  addFile: (clientId: string, f: Omit<FileAsset, "id" | "uploadedAt" | "uploadedBy">) => void;
  removeFile: (clientId: string, fileId: string) => void;
  upsertContact: (clientId: string, c: Contact) => void;
  removeContact: (clientId: string, contactId: string) => void;
  // campaigns
  addCampaign: (c: Partial<Campaign> & Pick<Campaign, "clientId" | "name">) => Campaign;
  updateCampaign: (id: string, p: Patch<Campaign>) => void;
  moveCampaign: (id: string, status: CampaignStatus) => void;
  deleteCampaign: (id: string) => void;
  addComment: (campaignId: string, body: string) => void;
  // tasks
  addTask: (t: Partial<Task> & Pick<Task, "title">) => Task;
  updateTask: (id: string, p: Patch<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  // settings
  updateAgency: (p: Patch<AgencyProfile>) => void;
  upsertPackage: (p: Package) => void;
  removePackage: (id: string) => void;
  setStages: (s: PipelineStage[]) => void;
  toggleIntegration: (id: string) => void;
  upsertMember: (m: TeamMember) => void;
  removeMember: (id: string) => void;
  resetDemo: () => void;
}

const actor = () => useAuth.getState().userId ?? "u_sophie";
const now = () => new Date().toISOString();

const STORAGE_VERSION = 5;

export const useData = create<DataState>()(
  persist(
    (set, get) => {
      const log = (a: Omit<Activity, "id" | "createdAt" | "actorId">) =>
        set((s) => ({ activities: [{ id: uid("a"), createdAt: now(), actorId: actor(), ...a }, ...s.activities].slice(0, 300) }));

      return {
        ...buildSeed(),
        seededAt: now(),

        // ---------- Leads
        addLead: (l) => {
          const lead: Lead = {
            id: uid("l"),
            domain: "",
            contactName: "",
            contactRole: "",
            contactEmail: "",
            contactPhone: "",
            stageId: get().stages[0]?.id ?? "s_new",
            value: 0,
            ownerId: actor(),
            stageEnteredAt: now(),
            createdAt: now(),
            platform: "Shopify",
            niche: "",
            estRevenue: 0,
            currentEsp: "",
            nextFollowUp: null,
            source: "Inbound — website",
            notes: [],
            ...l,
          };
          set((s) => ({ leads: [lead, ...s.leads] }));
          log({ action: "added", entityType: "lead", entityId: lead.id, entityName: lead.company, leadId: lead.id });
          return lead;
        },
        updateLead: (id, p) => set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...p } : l)) })),
        moveLead: (id, stageId) => {
          const lead = get().leads.find((l) => l.id === id);
          if (!lead || lead.stageId === stageId) return;
          const stage = get().stages.find((st) => st.id === stageId);
          set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, stageId, stageEnteredAt: now() } : l)) }));
          log({
            action: stage?.kind === "won" ? "won" : stage?.kind === "lost" ? "lost" : "moved",
            entityType: "lead",
            entityId: id,
            entityName: lead.company,
            detail: stage?.kind === "open" ? `to ${stage.name}` : undefined,
            leadId: id,
          });
        },
        deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
        addLeadNote: (id, body) => {
          set((s) => ({
            leads: s.leads.map((l) => (l.id === id ? { ...l, notes: [{ id: uid("n"), authorId: actor(), body, createdAt: now() }, ...l.notes] } : l)),
          }));
          const lead = get().leads.find((l) => l.id === id);
          if (lead) log({ action: "added a note to", entityType: "lead", entityId: id, entityName: lead.company, leadId: id });
        },
        convertLead: (id) => {
          const lead = get().leads.find((l) => l.id === id)!;
          if (lead.convertedClientId) return lead.convertedClientId;
          const pkg = [...get().packages].sort((a, b) => Math.abs(a.price - lead.value) - Math.abs(b.price - lead.value))[0];
          const client = get().addClient({
            name: lead.company,
            domain: lead.domain,
            niche: lead.niche,
            retainer: lead.value,
            packageId: pkg?.id,
            esp: lead.currentEsp || "Klaviyo",
            notes: lead.notes.map((n) => n.body).join("\n\n"),
            contacts: lead.contactName
              ? [{ id: uid("ct"), name: lead.contactName, role: lead.contactRole, email: lead.contactEmail, phone: lead.contactPhone, primary: true }]
              : [],
          });
          set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, convertedClientId: client.id } : l)) }));
          return client.id;
        },

        // ---------- Clients
        addClient: (c) => {
          const start = new Date();
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + 1);
          const client: Client = {
            id: uid("c"),
            domain: "",
            color: `hsl(${Math.floor(Math.random() * 360)} 55% 45%)`,
            niche: "",
            packageId: get().packages[0]?.id ?? "",
            retainer: get().packages[0]?.price ?? 0,
            accountManagerId: actor(),
            health: "good",
            contractStart: start.toISOString(),
            contractEnd: end.toISOString(),
            listSize: 0,
            esp: "Klaviyo",
            notes: "",
            contacts: [],
            brandKit: { colors: [], headingFont: "", bodyFont: "", tone: "", dos: [], donts: [] },
            flows: (["Welcome series", "Abandoned cart", "Browse abandonment", "Post-purchase", "Win-back"] as const).map((type) => ({
              id: uid("f"),
              type,
              status: "not_built",
              emails: 0,
              revenue30d: 0,
              conversionRate: 0,
            })),
            files: [],
            createdAt: now(),
            ...c,
          };
          set((s) => ({ clients: [...s.clients, client] }));
          log({ action: "added client", entityType: "client", entityId: client.id, entityName: client.name, clientId: client.id });
          return client;
        },
        updateClient: (id, p) => set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
        deleteClient: (id) =>
          set((s) => ({
            clients: s.clients.filter((c) => c.id !== id),
            campaigns: s.campaigns.filter((c) => c.clientId !== id),
            tasks: s.tasks.map((t) => (t.clientId === id ? { ...t, clientId: undefined, campaignId: undefined } : t)),
          })),
        updateFlow: (clientId, flowId, p) => {
          const client = get().clients.find((c) => c.id === clientId);
          const flow = client?.flows.find((f) => f.id === flowId);
          set((s) => ({
            clients: s.clients.map((c) => (c.id === clientId ? { ...c, flows: c.flows.map((f) => (f.id === flowId ? { ...f, ...p } : f)) } : c)),
          }));
          if (client && flow && p.status && p.status !== flow.status)
            log({
              action: p.status === "live" ? "set live" : p.status === "in_progress" ? "started building" : "reset",
              entityType: "flow",
              entityId: flowId,
              entityName: flow.type,
              detail: `for ${client.name}`,
              clientId,
            });
        },
        addFile: (clientId, f) => {
          const file: FileAsset = { id: uid("fl"), uploadedAt: now(), uploadedBy: actor(), ...f };
          set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, files: [file, ...c.files] } : c)) }));
          log({ action: "uploaded", entityType: "file", entityId: file.id, entityName: file.name, clientId });
        },
        removeFile: (clientId, fileId) =>
          set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, files: c.files.filter((f) => f.id !== fileId) } : c)) })),
        upsertContact: (clientId, ct) =>
          set((s) => ({
            clients: s.clients.map((c) => {
              if (c.id !== clientId) return c;
              const exists = c.contacts.some((x) => x.id === ct.id);
              return { ...c, contacts: exists ? c.contacts.map((x) => (x.id === ct.id ? ct : x)) : [...c.contacts, ct] };
            }),
          })),
        removeContact: (clientId, contactId) =>
          set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, contacts: c.contacts.filter((x) => x.id !== contactId) } : c)) })),

        // ---------- Campaigns
        addCampaign: (c) => {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          d.setHours(10, 0, 0, 0);
          const campaign: Campaign = {
            id: uid("cp"),
            subject: "",
            previewText: "",
            sendAt: d.toISOString(),
            segment: "Engaged 90d",
            assigneeId: actor(),
            status: "idea",
            copy: "",
            designUrl: "",
            checklist: { links: false, mobile: false, utm: false, spam: false },
            approval: "not_requested",
            comments: [],
            createdAt: now(),
            ...c,
          };
          set((s) => ({ campaigns: [...s.campaigns, campaign] }));
          log({ action: "created", entityType: "campaign", entityId: campaign.id, entityName: campaign.name, clientId: campaign.clientId });
          return campaign;
        },
        updateCampaign: (id, p) => set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
        moveCampaign: (id, status) => {
          const c = get().campaigns.find((x) => x.id === id);
          if (!c || c.status === status) return;
          const patch: Partial<Campaign> = { status };
          if (status === "client_review" && c.approval === "not_requested") patch.approval = "pending";
          if (["approved", "scheduled", "sent"].includes(status)) patch.approval = "approved";
          set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
          log({
            action: status === "scheduled" ? "scheduled" : "moved",
            entityType: "campaign",
            entityId: id,
            entityName: c.name,
            detail: status === "scheduled" ? undefined : `to ${campaignStatusLabel[status]}`,
            clientId: c.clientId,
          });
        },
        deleteCampaign: (id) =>
          set((s) => ({
            campaigns: s.campaigns.filter((c) => c.id !== id),
            tasks: s.tasks.map((t) => (t.campaignId === id ? { ...t, campaignId: undefined } : t)),
          })),
        addComment: (campaignId, body) => {
          const c = get().campaigns.find((x) => x.id === campaignId);
          set((s) => ({
            campaigns: s.campaigns.map((x) =>
              x.id === campaignId ? { ...x, comments: [...x.comments, { id: uid("cm"), authorId: actor(), body, createdAt: now() }] } : x,
            ),
          }));
          if (c) log({ action: "commented on", entityType: "campaign", entityId: c.id, entityName: c.name, clientId: c.clientId });
        },

        // ---------- Tasks
        addTask: (t) => {
          const task: Task = { id: uid("t"), done: false, priority: "medium", dueDate: null, assigneeId: actor(), createdAt: now(), ...t };
          set((s) => ({ tasks: [task, ...s.tasks] }));
          log({ action: "created task", entityType: "task", entityId: task.id, entityName: task.title, clientId: task.clientId });
          return task;
        },
        updateTask: (id, p) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
        toggleTask: (id) => {
          const t = get().tasks.find((x) => x.id === id);
          if (!t) return;
          set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done, completedAt: !x.done ? now() : undefined } : x)) }));
          if (!t.done) log({ action: "completed", entityType: "task", entityId: id, entityName: t.title, clientId: t.clientId });
        },
        deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

        // ---------- Settings
        updateAgency: (p) => set((s) => ({ agency: { ...s.agency, ...p } })),
        upsertPackage: (p) =>
          set((s) => ({ packages: s.packages.some((x) => x.id === p.id) ? s.packages.map((x) => (x.id === p.id ? p : x)) : [...s.packages, p] })),
        removePackage: (id) => set((s) => ({ packages: s.packages.filter((p) => p.id !== id) })),
        setStages: (stages) => {
          const ids = new Set(stages.map((s) => s.id));
          const fallback = stages.find((s) => s.kind === "open")?.id ?? stages[0]?.id;
          set((s) => ({ stages, leads: s.leads.map((l) => (ids.has(l.stageId) ? l : { ...l, stageId: fallback })) }));
        },
        toggleIntegration: (id) =>
          set((s) => ({ integrations: s.integrations.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)) })),
        upsertMember: (m) =>
          set((s) => ({ team: s.team.some((x) => x.id === m.id) ? s.team.map((x) => (x.id === m.id ? m : x)) : [...s.team, m] })),
        removeMember: (id) => set((s) => ({ team: s.team.filter((m) => m.id !== id) })),
        resetDemo: () => set({ ...buildSeed(), seededAt: now() }),
      };
    },
    {
      name: "crm-data",
      version: STORAGE_VERSION,
      migrate: () => ({ ...buildSeed(), seededAt: new Date().toISOString() }) as unknown as DataState,
      onRehydrateStorage: () => (state) => {
        // Demo data is relative to "today": refresh it if it was seeded on an earlier day
        // and the user never touched it, so the dashboard never looks stale.
        if (state && new Date(state.seededAt).toDateString() !== new Date().toDateString() && !localStorage.getItem("crm-touched")) {
          state.resetDemo();
        }
      },
    },
  ),
);

// Mark data as user-modified after the first mutation so we stop auto-refreshing the seed.
let initialised = false;
useData.subscribe(() => {
  if (!initialised) return;
  try {
    localStorage.setItem("crm-touched", "1");
  } catch {
    /* ignore */
  }
});
setTimeout(() => (initialised = true), 0);

// ---------- selectors / helpers
export const useMember = (id?: string) => useData((s) => s.team.find((m) => m.id === id));
export const useClient = (id?: string) => useData((s) => s.clients.find((c) => c.id === id));
