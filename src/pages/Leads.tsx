import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { CalendarClock, Columns3, List, Plus, Target, Users } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/shared/Kanban";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Assignee, MemberAvatar } from "@/components/shared/Avatar";
import { FilterMenu } from "@/components/shared/FilterMenu";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput, SortHeader, TableShell, tdClass, trClass, useSort } from "@/components/shared/Table";
import { BoardSkeleton, ListSkeleton } from "@/components/shared/Skeletons";
import { toOptions, useMemberOptions } from "@/components/shared/options";
import { useLoading } from "@/hooks/useLoading";
import { useCan } from "@/hooks/usePermission";
import { niches } from "@/lib/constants";
import type { Lead } from "@/data/types";
import { cn, dueLabel, money, relativeDay } from "@/lib/utils";

type View = "board" | "table";

export default function Leads() {
  const loading = useLoading("leads");
  const { leads, stages, team, moveLead } = useData();
  const { openLead, setNewLeadOpen } = useUI();
  const canManage = useCan("leads.manage");
  const memberOptions = useMemberOptions();
  const [view, setView] = useState<View>("board");
  const [q, setQ] = useState("");
  const [owners, setOwners] = useState<string[]>([]);
  const [fNiche, setFNiche] = useState<string[]>([]);
  const [fStage, setFStage] = useState<string[]>([]);
  const stageById = useMemo(() => Object.fromEntries(stages.map((s) => [s.id, s])), [stages]);

  const filtered = leads.filter(
    (l) =>
      (!q || `${l.company} ${l.domain} ${l.contactName} ${l.niche}`.toLowerCase().includes(q.toLowerCase())) &&
      (!owners.length || owners.includes(l.ownerId)) &&
      (!fNiche.length || fNiche.includes(l.niche)) &&
      (!fStage.length || fStage.includes(l.stageId)),
  );
  const open = filtered.filter((l) => stageById[l.stageId]?.kind === "open");
  const openValue = open.reduce((a, l) => a + l.value, 0);
  const weighted = open.reduce((a, l) => a + l.value * (stageById[l.stageId]?.probability ?? 0), 0);
  const won = leads.filter((l) => stageById[l.stageId]?.kind === "won").length;
  const closed = leads.filter((l) => stageById[l.stageId]?.kind !== "open").length;

  const { sorted, sort, toggle } = useSort(
    filtered,
    {
      company: (l) => l.company,
      stage: (l) => stages.findIndex((s) => s.id === l.stageId),
      value: (l) => l.value,
      owner: (l) => team.find((m) => m.id === l.ownerId)?.name ?? "",
      days: (l) => -new Date(l.stageEnteredAt).getTime(),
      followUp: (l) => l.nextFollowUp ?? "9999",
      revenue: (l) => l.estRevenue,
      niche: (l) => l.niche,
    },
    "stage",
  );

  const onMove = (id: string, stageId: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stageId === stageId) return;
    if (!canManage) return toast.error("You don't have permission to move leads.");
    const prev = lead.stageId;
    const prevEntered = lead.stageEnteredAt;
    moveLead(id, stageId);
    const st = stageById[stageId];
    toast[st.kind === "won" ? "success" : "message"](st.kind === "won" ? `${lead.company} won 🎉` : `Moved to ${st.name}`, {
      description: st.kind === "won" ? "Open the lead to convert it to a client." : lead.company,
      action:
        st.kind === "won"
          ? { label: "Open", onClick: () => openLead(id) }
          : { label: "Undo", onClick: () => useData.getState().updateLead(id, { stageId: prev, stageEnteredAt: prevEntered }) },
    });
  };

  return (
    <Page wide>
      <PageHeader
        title="Leads"
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{open.length} open deals</span>
            <span>
              <span className="font-medium text-foreground tabular">{money(openValue)}</span> / mo pipeline
            </span>
            <span>
              <span className="font-medium text-foreground tabular">{money(weighted)}</span> weighted
            </span>
            <span>{closed ? Math.round((won / closed) * 100) : 0}% win rate</span>
          </span>
        }
        actions={
          canManage && (
            <Button onClick={() => setNewLeadOpen(true)}>
              <Plus /> Add lead
            </Button>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search leads…" className="w-full sm:w-auto" />
          <FilterMenu label="Owner" options={memberOptions} selected={owners} onChange={setOwners} icon={<Users />} />
          <FilterMenu label="Niche" options={toOptions(niches)} selected={fNiche} onChange={setFNiche} />
          {view === "table" && <FilterMenu label="Stage" options={stages.map((s) => ({ value: s.id, label: s.name }))} selected={fStage} onChange={setFStage} />}
          <Segmented
            className="ml-auto"
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: <span className="sr-only sm:not-sr-only">Board</span>, icon: <Columns3 />, title: "Board view" },
              { value: "table", label: <span className="sr-only sm:not-sr-only">Table</span>, icon: <List />, title: "Table view" },
            ]}
          />
        </div>
      </PageHeader>

      {loading ? (
        view === "board" ? <BoardSkeleton cols={6} /> : <ListSkeleton rows={10} />
      ) : leads.length === 0 ? (
        <Card>
          <EmptyState icon={Target} title="Your pipeline is empty" description="Add prospects you're talking to and move them through the stages as deals progress." action={<Button size="sm" onClick={() => setNewLeadOpen(true)}><Plus /> Add first lead</Button>} />
        </Card>
      ) : view === "board" ? (
        <KanbanBoard
          columns={stages.map((s) => {
            const ls = filtered.filter((l) => l.stageId === s.id);
            return {
              id: s.id,
              title: s.name,
              dot: s.kind === "won" ? "bg-success" : s.kind === "lost" ? "bg-muted-foreground/40" : "bg-primary",
              meta: money(ls.reduce((a, l) => a + l.value, 0), { compact: true }),
            };
          })}
          items={[...filtered].sort((a, b) => b.value - a.value)}
          getColumn={(l) => l.stageId}
          itemLabel={(l) => l.company}
          onOpen={(l) => openLead(l.id)}
          onMove={onMove}
          renderCard={(l) => <LeadCard lead={l} onOpen={() => openLead(l.id)} lost={stageById[l.stageId]?.kind === "lost"} />}
          columnWidth={264}
        />
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState icon={Target} title="No leads match" description="Try another search or clear filters." />
        </Card>
      ) : (
        <TableShell>
          <thead className="bg-subtle">
            <tr>
              <SortHeader label="Company" k="company" sort={sort} onSort={toggle} className="pl-4" />
              <SortHeader label="Stage" k="stage" sort={sort} onSort={toggle} />
              <SortHeader label="Value / mo" k="value" sort={sort} onSort={toggle} align="right" />
              <SortHeader label="Niche" k="niche" sort={sort} onSort={toggle} />
              <SortHeader label="Store revenue" k="revenue" sort={sort} onSort={toggle} align="right" />
              <SortHeader label="Owner" k="owner" sort={sort} onSort={toggle} />
              <SortHeader label="In stage" k="days" sort={sort} onSort={toggle} align="right" />
              <SortHeader label="Follow-up" k="followUp" sort={sort} onSort={toggle} className="pr-4" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => {
              const owner = team.find((m) => m.id === l.ownerId);
              const st = stageById[l.stageId];
              const overdue = l.nextFollowUp && new Date(l.nextFollowUp) < new Date(new Date().toDateString());
              return (
                <tr key={l.id} className={cn(trClass, "cursor-pointer")} onClick={() => openLead(l.id)}>
                  <td className={cn(tdClass, "pl-4")}>
                    <button onClick={(e) => { e.stopPropagation(); openLead(l.id); }} className="flex items-center gap-2.5 text-left focus-visible:underline focus-visible:outline-none">
                      <CompanyLogo name={l.company} size="sm" />
                      <span>
                        <span className="block font-medium">{l.company}</span>
                        <span className="block text-xs text-muted-foreground">{l.domain}</span>
                      </span>
                    </button>
                  </td>
                  <td className={tdClass}>
                    <Badge variant={st?.kind === "won" ? "success" : st?.kind === "lost" ? "default" : "outline"}>{st?.name}</Badge>
                  </td>
                  <td className={cn(tdClass, "text-right font-medium tabular")}>{money(l.value)}</td>
                  <td className={cn(tdClass, "text-muted-foreground")}>{l.niche}</td>
                  <td className={cn(tdClass, "text-right tabular text-muted-foreground")}>{money(l.estRevenue, { compact: true })}</td>
                  <td className={tdClass}>
                    <span className="flex items-center gap-2"><MemberAvatar member={owner} size="xs" tooltip={false} />{owner?.name.split(" ")[0]}</span>
                  </td>
                  <td className={cn(tdClass, "text-right tabular text-muted-foreground")}>{differenceInCalendarDays(new Date(), new Date(l.stageEnteredAt))}d</td>
                  <td className={cn(tdClass, "pr-4", overdue ? "font-medium text-danger" : "text-muted-foreground")}>{l.nextFollowUp ? relativeDay(l.nextFollowUp) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </Page>
  );
}

function LeadCard({ lead, onOpen, lost }: { lead: Lead; onOpen: () => void; lost?: boolean }) {
  const days = differenceInCalendarDays(new Date(), new Date(lead.stageEnteredAt));
  const overdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date(new Date().toDateString());
  return (
    <div role="button" tabIndex={-1} onClick={onOpen} className={cn("cursor-grab rounded-md border bg-card p-3 shadow-soft transition hover:border-foreground/15 hover:shadow-pop active:cursor-grabbing", lost && "opacity-70")}>
      <div className="flex items-start gap-2.5">
        <CompanyLogo name={lead.company} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{lead.company}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.domain}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm font-semibold tabular">{money(lead.value)}</span>
        <span className="text-xs text-muted-foreground">/ mo</span>
        <span className="ml-auto text-xs text-muted-foreground tabular" title="Days in stage">
          {days}d
        </span>
        <Assignee id={lead.ownerId} size="xs" />
      </div>
      {lead.nextFollowUp && (
        <p className={cn("mt-2 flex items-center gap-1 border-t pt-2 text-xs", overdue ? "text-danger" : "text-muted-foreground")}>
          <CalendarClock className="size-3" /> Follow-up: {dueLabel(lead.nextFollowUp)}
        </p>
      )}
      {lead.convertedClientId && <Badge variant="success" className="mt-2">Client</Badge>}
    </div>
  );
}
