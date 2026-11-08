import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { LayoutGrid, List, Mail, Plus, Users } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/tabs";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { MemberAvatar } from "@/components/shared/Avatar";
import { HealthBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterMenu } from "@/components/shared/FilterMenu";
import { SearchInput, SortHeader, TableShell, tdClass, trClass, useSort } from "@/components/shared/Table";
import { CardGridSkeleton, ListSkeleton } from "@/components/shared/Skeletons";
import { healthOptions } from "@/components/shared/options";
import { useLoading } from "@/hooks/useLoading";
import { useCan } from "@/hooks/usePermission";
import { aggregateMonth, monthKey, mrr } from "@/lib/metrics";
import { cn, money, num, pct } from "@/lib/utils";

type View = "grid" | "table";

export default function Clients() {
  const loading = useLoading("clients");
  const { clients, packages, team, campaigns, metrics } = useData();
  const setNewClientOpen = useUI((s) => s.setNewClientOpen);
  const canBilling = useCan("billing.view");
  const canManage = useCan("clients.manage");
  const navigate = useNavigate();
  const [view, setView] = useState<View>(() => (localStorage.getItem("crm-clients-view") as View) || "grid");
  const [q, setQ] = useState("");
  const [health, setHealth] = useState<string[]>([]);
  const [pkg, setPkg] = useState<string[]>([]);
  const changeView = (v: View) => {
    setView(v);
    localStorage.setItem("crm-clients-view", v);
  };

  const pkgById = Object.fromEntries(packages.map((p) => [p.id, p]));
  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          (!q || `${c.name} ${c.domain} ${c.niche}`.toLowerCase().includes(q.toLowerCase())) &&
          (!health.length || health.includes(c.health)) &&
          (!pkg.length || pkg.includes(c.packageId)),
      ),
    [clients, q, health, pkg],
  );
  const stats = (id: string) => aggregateMonth(metrics, monthKey(), [id]);
  const upcoming = (id: string) => campaigns.filter((c) => c.clientId === id && c.status !== "sent").length;

  const { sorted, sort, toggle } = useSort(
    filtered,
    {
      name: (c) => c.name,
      package: (c) => pkgById[c.packageId]?.price ?? 0,
      retainer: (c) => c.retainer,
      manager: (c) => team.find((m) => m.id === c.accountManagerId)?.name ?? "",
      health: (c) => ["good", "attention", "at_risk"].indexOf(c.health),
      list: (c) => c.listSize,
      revenue: (c) => stats(c.id)?.revenue ?? 0,
      renewal: (c) => c.contractEnd,
    },
    "name",
  );

  return (
    <Page wide>
      <PageHeader
        title="Clients"
        description={`${clients.length} active brands${canBilling ? ` · ${money(mrr(clients))} MRR` : ""}`}
        actions={
          canManage && (
            <Button onClick={() => setNewClientOpen(true)}>
              <Plus /> Add client
            </Button>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search clients…" className="w-full sm:w-auto" />
          <FilterMenu label="Health" options={healthOptions} selected={health} onChange={setHealth} />
          <FilterMenu label="Package" options={packages.map((p) => ({ value: p.id, label: p.name }))} selected={pkg} onChange={setPkg} />
          <Segmented
            className="ml-auto"
            value={view}
            onChange={changeView}
            options={[
              { value: "grid", label: <span className="sr-only sm:not-sr-only">Grid</span>, icon: <LayoutGrid />, title: "Grid view" },
              { value: "table", label: <span className="sr-only sm:not-sr-only">Table</span>, icon: <List />, title: "Table view" },
            ]}
          />
        </div>
      </PageHeader>

      {loading ? (
        view === "grid" ? <CardGridSkeleton /> : <ListSkeleton rows={8} />
      ) : sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={clients.length ? "No clients match your filters" : "No clients yet"}
            description={clients.length ? "Try a different search or clear the filters." : "Add your first client, or convert a won lead from the pipeline."}
            action={
              clients.length ? (
                <Button variant="secondary" size="sm" onClick={() => { setQ(""); setHealth([]); setPkg([]); }}>Clear filters</Button>
              ) : (
                <Button size="sm" onClick={() => setNewClientOpen(true)}><Plus /> Add client</Button>
              )
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((c, i) => {
            const s = stats(c.id);
            const am = team.find((m) => m.id === c.accountManagerId);
            const live = c.flows.filter((f) => f.status === "live").length;
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                style={{ animationDelay: `${i * 25}ms` }}
                className="group animate-fade-in rounded-lg border bg-card p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <div className="flex items-start gap-3">
                  <CompanyLogo name={c.name} color={c.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.domain || c.niche}</p>
                  </div>
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", c.health === "good" ? "bg-success" : c.health === "attention" ? "bg-warning" : "bg-danger")} title={c.health} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{pkgById[c.packageId]?.name ?? "Custom"}</Badge>
                  <Badge variant="outline">{c.niche}</Badge>
                  <Badge variant="outline">
                    {live}/5 flows live
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">{canBilling ? "Retainer" : "List"}</p>
                    <p className="mt-0.5 text-sm font-medium tabular">{canBilling ? money(c.retainer) : num(c.listSize, true)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open rate</p>
                    <p className="mt-0.5 text-sm font-medium tabular">{s ? pct(s.openRate) : "—"}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="text-muted-foreground">{upcoming(c.id)} planned</p>
                    <MemberAvatar member={am} size="sm" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <TableShell>
          <thead className="bg-subtle">
            <tr>
              <SortHeader label="Client" k="name" sort={sort} onSort={toggle} className="pl-4" />
              <SortHeader label="Package" k="package" sort={sort} onSort={toggle} />
              {canBilling && <SortHeader label="Retainer" k="retainer" sort={sort} onSort={toggle} align="right" />}
              <SortHeader label="Account manager" k="manager" sort={sort} onSort={toggle} />
              <SortHeader label="Health" k="health" sort={sort} onSort={toggle} />
              <SortHeader label="List size" k="list" sort={sort} onSort={toggle} align="right" />
              <SortHeader label="Revenue MTD" k="revenue" sort={sort} onSort={toggle} align="right" />
              <SortHeader label="Renewal" k="renewal" sort={sort} onSort={toggle} className="pr-4" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const am = team.find((m) => m.id === c.accountManagerId);
              return (
                <tr key={c.id} className={cn(trClass, "cursor-pointer")} onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className={cn(tdClass, "pl-4")}>
                    <a href={`/clients/${c.id}`} onClick={(e) => { e.preventDefault(); navigate(`/clients/${c.id}`); }} className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:underline">
                      <CompanyLogo name={c.name} color={c.color} size="sm" />
                      <span className="font-medium">{c.name}</span>
                      <span className="hidden text-xs text-muted-foreground xl:inline">{c.niche}</span>
                    </a>
                  </td>
                  <td className={tdClass}>
                    <Badge variant="outline">{pkgById[c.packageId]?.name ?? "Custom"}</Badge>
                  </td>
                  {canBilling && <td className={cn(tdClass, "text-right tabular")}>{money(c.retainer)}</td>}
                  <td className={tdClass}>
                    <span className="flex items-center gap-2">
                      <MemberAvatar member={am} size="xs" tooltip={false} />
                      {am?.name}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <HealthBadge health={c.health} />
                  </td>
                  <td className={cn(tdClass, "text-right tabular")}>{num(c.listSize)}</td>
                  <td className={cn(tdClass, "text-right tabular")}>{money(stats(c.id)?.revenue ?? 0)}</td>
                  <td className={cn(tdClass, "pr-4 text-muted-foreground")}>{format(new Date(c.contractEnd), "d MMM yyyy")}</td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
      {!loading && view === "table" && sorted.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5" /> {sorted.length} clients · {num(sorted.reduce((a, c) => a + c.listSize, 0))} total subscribers
        </p>
      )}
    </Page>
  );
}
