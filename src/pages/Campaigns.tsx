import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { DndContext, DragOverlay, type DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Columns3, ListChecks, Plus, Users, X } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dot } from "@/components/ui/badge";
import { inputClass } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { FilterMenu } from "@/components/shared/FilterMenu";
import { SearchInput } from "@/components/shared/Table";
import { KanbanBoard, Draggable, Droppable, pointerFirst, useBoardSensors } from "@/components/shared/Kanban";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Assignee } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { BoardSkeleton } from "@/components/shared/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { statusOptions, useClientOptions, useMemberOptions } from "@/components/shared/options";
import { campaignStatusDot, campaignStatusLabel, campaignStatuses } from "@/lib/constants";
import { useLoading } from "@/hooks/useLoading";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Campaign, CampaignStatus, Client } from "@/data/types";
import { cn } from "@/lib/utils";

type View = "month" | "week" | "board";

const readView = (): View => {
  try {
    return (localStorage.getItem("crm-campaign-view") as View) || "month";
  } catch {
    return "month";
  }
};

export default function Campaigns() {
  const loading = useLoading("campaigns");
  const { campaigns, clients, moveCampaign, updateCampaign } = useData();
  const { openCampaign, openNewCampaign } = useUI();
  const clientOptions = useClientOptions();
  const memberOptions = useMemberOptions();
  const [view, setViewState] = useState<View>(readView);
  const [cursor, setCursor] = useState(new Date());
  const [fClients, setFClients] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fAssignee, setFAssignee] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem("crm-campaign-view", v);
    } catch {
      /* ignore */
    }
  };
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const filtered = campaigns.filter((c) => {
    const d = c.sendAt.slice(0, 10);
    return (
      (!fClients.length || fClients.includes(c.clientId)) &&
      (!fStatus.length || fStatus.includes(c.status)) &&
      (!fAssignee.length || fAssignee.includes(c.assigneeId)) &&
      (!from || d >= from) &&
      (!to || d <= to) &&
      (!q || `${c.name} ${c.subject} ${clientById[c.clientId]?.name}`.toLowerCase().includes(q.toLowerCase()))
    );
  });
  const anyFilter = fClients.length || fStatus.length || fAssignee.length || from || to || q;
  const clear = () => {
    setFClients([]);
    setFStatus([]);
    setFAssignee([]);
    setFrom("");
    setTo("");
    setQ("");
  };

  const step = (dir: 1 | -1) => setCursor((c) => (view === "week" ? (dir > 0 ? addWeeks(c, 1) : subWeeks(c, 1)) : dir > 0 ? addMonths(c, 1) : subMonths(c, 1)));
  const rescheduleTo = (id: string, dayKey: string) => {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    const old = new Date(c.sendAt);
    const [y, m, d] = dayKey.split("-").map(Number);
    const next = new Date(old);
    next.setFullYear(y, m - 1, d);
    if (isSameDay(old, next)) return;
    updateCampaign(id, { sendAt: next.toISOString() });
    toast.success(`Moved to ${format(next, "EEE d MMM")}`, {
      description: c.name,
      action: { label: "Undo", onClick: () => updateCampaign(id, { sendAt: c.sendAt }) },
    });
  };

  const title = view === "week" ? `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM")} – ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy")}` : format(cursor, "MMMM yyyy");

  return (
    <Page wide>
      <PageHeader
        title="Campaign planner"
        description="Every send across every client, from idea to inbox."
        actions={
          <Button onClick={() => openNewCampaign()}>
            <Plus /> New campaign
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "month", label: "Month", icon: <CalendarDays /> },
              { value: "week", label: "Week", icon: <CalendarRange /> },
              { value: "board", label: "Board", icon: <Columns3 /> },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Search campaigns…" className="w-full sm:w-auto" />
          <FilterMenu label="Client" options={clientOptions} selected={fClients} onChange={setFClients} />
          <FilterMenu label="Status" options={statusOptions} selected={fStatus} onChange={setFStatus} icon={<ListChecks />} />
          <FilterMenu label="Assignee" options={memberOptions} selected={fAssignee} onChange={setFAssignee} icon={<Users />} />
          <div className="flex items-center gap-1">
            <input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(inputClass, "h-8 w-[136px]")} />
            <span className="text-xs text-muted-foreground">–</span>
            <input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className={cn(inputClass, "h-8 w-[136px]")} />
          </div>
          {anyFilter ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X /> Clear
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {view !== "board" && (
        <div className="mb-3 flex items-center gap-2">
          <h2 className="min-w-[180px] text-lg font-semibold tracking-tight">{title}</h2>
          <div className="flex items-center gap-1">
            <Tooltip content={view === "week" ? "Previous week" : "Previous month"}>
              <Button variant="secondary" size="icon" onClick={() => step(-1)} aria-label="Previous">
                <ChevronLeft />
              </Button>
            </Tooltip>
            <Button variant="secondary" size="default" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Tooltip content={view === "week" ? "Next week" : "Next month"}>
              <Button variant="secondary" size="icon" onClick={() => step(1)} aria-label="Next">
                <ChevronRight />
              </Button>
            </Tooltip>
          </div>
          <ClientLegend clients={clients.filter((c) => !fClients.length || fClients.includes(c.id))} />
        </div>
      )}

      {loading ? (
        view === "board" ? <BoardSkeleton cols={6} /> : <Skeleton className="h-[640px] rounded-lg" />
      ) : view === "board" ? (
        filtered.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarDays} title="No campaigns match" description="Adjust or clear the filters to see the board." action={<Button size="sm" variant="secondary" onClick={clear}>Clear filters</Button>} />
          </Card>
        ) : (
          <KanbanBoard
            columns={campaignStatuses.map((s) => ({ id: s, title: campaignStatusLabel[s], dot: campaignStatusDot[s] }))}
            items={[...filtered].sort((a, b) => a.sendAt.localeCompare(b.sendAt))}
            getColumn={(c) => c.status}
            itemLabel={(c) => c.name}
            onOpen={(c) => openCampaign(c.id)}
            onMove={(id, col) => {
              const c = campaigns.find((x) => x.id === id);
              if (!c || c.status === col) return;
              moveCampaign(id, col as CampaignStatus);
              toast.success(`Moved to ${campaignStatusLabel[col as CampaignStatus]}`, {
                description: c.name,
                action: { label: "Undo", onClick: () => updateCampaign(id, { status: c.status, approval: c.approval }) },
              });
            }}
            renderCard={(c) => <BoardCard c={c} client={clientById[c.clientId]} onOpen={() => openCampaign(c.id)} />}
            columnWidth={272}
          />
        )
      ) : (
        <CalendarView view={view} cursor={cursor} campaigns={filtered} clientById={clientById} onReschedule={rescheduleTo} onOpen={openCampaign} onCreate={(d) => openNewCampaign({ date: d.toISOString() })} />
      )}
    </Page>
  );
}

function ClientLegend({ clients }: { clients: Client[] }) {
  return (
    <div className="no-scrollbar ml-auto hidden items-center gap-3 overflow-x-auto lg:flex">
      {clients.map((c) => (
        <span key={c.id} className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-[3px]" style={{ background: c.color }} />
          {c.name}
        </span>
      ))}
    </div>
  );
}

function BoardCard({ c, client, onOpen }: { c: Campaign; client?: Client; onOpen: () => void }) {
  const checks = Object.values(c.checklist).filter(Boolean).length;
  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={onOpen}
      className="cursor-grab rounded-md border bg-card p-3 shadow-soft transition hover:border-foreground/15 hover:shadow-pop active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {client && <CompanyLogo name={client.name} color={client.color} size="xs" className="!size-4 !text-[7px]" />}
        <span className="truncate">{client?.name}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">{c.name}</p>
      {c.subject && <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.subject}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("tabular", isToday(new Date(c.sendAt)) && "font-medium text-primary")}>{format(new Date(c.sendAt), "EEE d MMM · HH:mm")}</span>
        <span className={cn("ml-auto flex items-center gap-1 tabular", checks === 4 && "text-success")} title="Checklist">
          <ListChecks className="size-3.5" /> {checks}/4
        </span>
        <Assignee id={c.assigneeId} size="xs" />
      </div>
    </div>
  );
}

function Chip({ c, client, onOpen, showTime = true, overlay }: { c: Campaign; client?: Client; onOpen?: () => void; showTime?: boolean; overlay?: boolean }) {
  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={onOpen}
      className={cn(
        "group flex w-full cursor-grab items-center gap-1.5 overflow-hidden rounded-[6px] px-1.5 py-1 text-left text-xs transition hover:brightness-[0.97] active:cursor-grabbing dark:hover:brightness-125",
        overlay && "shadow-pop",
      )}
      style={{ background: `color-mix(in srgb, ${client?.color ?? "#888"} 13%, hsl(var(--card)))`, boxShadow: `inset 2px 0 0 ${client?.color ?? "#888"}` }}
      title={`${c.name} · ${client?.name} · ${campaignStatusLabel[c.status]}`}
    >
      <Dot className={campaignStatusDot[c.status]} />
      {showTime && <span className="shrink-0 tabular text-muted-foreground">{format(new Date(c.sendAt), "HH:mm")}</span>}
      <span className={cn("truncate font-medium", c.status === "sent" && "text-muted-foreground")}>{c.name}</span>
    </div>
  );
}

function CalendarView({
  view,
  cursor,
  campaigns,
  clientById,
  onReschedule,
  onOpen,
  onCreate,
}: {
  view: "month" | "week";
  cursor: Date;
  campaigns: Campaign[];
  clientById: Record<string, Client>;
  onReschedule: (id: string, dayKey: string) => void;
  onOpen: (id: string) => void;
  onCreate: (d: Date) => void;
}) {
  const sensors = useBoardSensors();
  const [active, setActive] = useState<Campaign | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selected, setSelected] = useState(new Date());

  const days =
    view === "month"
      ? eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) })
      : eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  const byDay = (d: Date) => campaigns.filter((c) => isSameDay(new Date(c.sendAt), d)).sort((a, b) => a.sendAt.localeCompare(b.sendAt));
  const weekdays = Array.from({ length: 7 }, (_, i) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), isMobile ? "EEEEE" : "EEE"));

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    if (e.over) onReschedule(String(e.active.id), String(e.over.id).replace("day:", ""));
  };

  if (isMobile && view === "month") {
    const list = byDay(selected);
    return (
      <div className="space-y-3">
        <Card className="p-2">
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
            {weekdays.map((w, i) => (
              <span key={i} className="py-1">{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const items = byDay(d);
              const sel = isSameDay(d, selected);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelected(d)}
                  aria-label={`${format(d, "d MMMM")}, ${items.length} campaigns`}
                  aria-pressed={sel}
                  className={cn("flex h-12 flex-col items-center gap-1 rounded-sm pt-1.5 text-sm transition", !isSameMonth(d, cursor) && "text-muted-foreground/50", sel ? "bg-primary text-primary-foreground" : isToday(d) ? "text-primary font-semibold" : "hover:bg-accent")}
                >
                  <span className="tabular">{format(d, "d")}</span>
                  <span className="flex gap-0.5">
                    {items.slice(0, 3).map((c) => (
                      <span key={c.id} className="size-1 rounded-full" style={{ background: sel ? "currentColor" : clientById[c.clientId]?.color }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{format(selected, "EEEE d MMMM")}</p>
          <Button size="sm" variant="secondary" onClick={() => onCreate(selected)}>
            <Plus /> Add
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sends planned.</p>
        ) : (
          <div className="space-y-2">
            {list.map((c) => (
              <button key={c.id} onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 rounded-md border bg-card p-3 text-left shadow-soft" style={{ boxShadow: `inset 3px 0 0 ${clientById[c.clientId]?.color}` }}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{format(new Date(c.sendAt), "HH:mm")} · {clientById[c.clientId]?.name}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Dot className={campaignStatusDot[c.status]} /> {campaignStatusLabel[c.status]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerFirst} onDragStart={(e) => setActive(campaigns.find((c) => c.id === e.active.id) ?? null)} onDragCancel={() => setActive(null)} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto rounded-lg border bg-card shadow-soft scrollbar-thin">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b bg-subtle">
            {weekdays.map((w, i) => (
              <div key={i} className="px-2.5 py-2 text-xs font-medium text-muted-foreground">{w}</div>
            ))}
          </div>
          <div className={cn("grid grid-cols-7", view === "month" ? "auto-rows-[minmax(118px,1fr)]" : "auto-rows-[minmax(520px,1fr)]")}>
            {days.map((d, i) => {
              const items = byDay(d);
              const outside = view === "month" && !isSameMonth(d, cursor);
              const max = view === "month" ? 4 : 50;
              return (
                <Droppable
                  key={d.toISOString()}
                  id={`day:${format(d, "yyyy-MM-dd")}`}
                  className={cn("group/day relative flex flex-col gap-1 border-b border-r p-1.5 transition-colors", (i + 1) % 7 === 0 && "border-r-0", outside && "bg-subtle/60")}
                  activeClassName="bg-primary/[0.07] ring-1 ring-inset ring-primary/40"
                >
                  <div className="flex items-center justify-between px-1">
                    <span
                      className={cn(
                        "grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs tabular",
                        isToday(d) ? "bg-primary font-semibold text-primary-foreground" : outside ? "text-muted-foreground/50" : "text-muted-foreground",
                      )}
                    >
                      {view === "week" ? format(d, "d MMM") : format(d, "d")}
                    </span>
                    <button
                      onClick={() => onCreate(d)}
                      aria-label={`New campaign on ${format(d, "d MMMM")}`}
                      className="rounded-sm p-0.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/day:opacity-100"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  {items.slice(0, max).map((c) => (
                    <Draggable key={c.id} id={c.id} label={`${c.name}, ${format(new Date(c.sendAt), "d MMMM")}. Enter to open, Space to move.`} onActivate={() => onOpen(c.id)}>
                      {view === "week" ? (
                        <WeekCard c={c} client={clientById[c.clientId]} onOpen={() => onOpen(c.id)} />
                      ) : (
                        <Chip c={c} client={clientById[c.clientId]} onOpen={() => onOpen(c.id)} />
                      )}
                    </Draggable>
                  ))}
                  {items.length > max && <span className="px-1.5 text-[11px] font-medium text-muted-foreground">+{items.length - max} more</span>}
                </Droppable>
              );
            })}
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2,0,0,1)" }}>
        {active ? <div className="w-[160px]"><Chip c={active} client={clientById[active.clientId]} overlay /></div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function WeekCard({ c, client, onOpen }: { c: Campaign; client?: Client; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={onOpen}
      className="cursor-grab rounded-[6px] p-2 text-xs transition hover:brightness-[0.97] active:cursor-grabbing dark:hover:brightness-125"
      style={{ background: `color-mix(in srgb, ${client?.color ?? "#888"} 12%, hsl(var(--card)))`, boxShadow: `inset 2px 0 0 ${client?.color}` }}
    >
      <p className="tabular text-muted-foreground">{format(new Date(c.sendAt), "HH:mm")}</p>
      <p className="mt-0.5 line-clamp-2 font-medium leading-snug">{c.name}</p>
      <p className="mt-1 truncate text-muted-foreground">{client?.name}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-muted-foreground"><Dot className={campaignStatusDot[c.status]} />{campaignStatusLabel[c.status]}</span>
        <Assignee id={c.assigneeId} size="xs" />
      </div>
    </div>
  );
}
