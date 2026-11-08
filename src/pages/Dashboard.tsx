import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDays, format, isSameDay, isToday, startOfDay, subMonths } from "date-fns";
import { ArrowRight, CalendarDays, CheckSquare, CircleDollarSign, MailOpen, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { Page } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/Stat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dot } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Assignee, MemberAvatar } from "@/components/shared/Avatar";
import { CampaignStatusBadge, PriorityIcon } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { useLoading } from "@/hooks/useLoading";
import { useCan, useCurrentUser } from "@/hooks/usePermission";
import { aggregateMonth, delta, inWeek, monthKey, mrr } from "@/lib/metrics";
import { campaignStatusDot } from "@/lib/constants";
import { cn, money, pct, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const loading = useLoading("dashboard");
  if (loading) return <PageSkeleton />;
  return <DashboardContent />;
}

function DashboardContent() {
  const { clients, campaigns, tasks, leads, stages, metrics, activities, team, toggleTask } = useData();
  const { openCampaign, openQuickTask, openLead, setNewClientOpen } = useUI();
  const userId = useAuth((s) => s.userId);
  const me = useCurrentUser();
  const canBilling = useCan("billing.view");
  const navigate = useNavigate();
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const cur = aggregateMonth(metrics, monthKey());
  const prev = aggregateMonth(metrics, monthKey(subMonths(new Date(), 1)));
  const weekCampaigns = campaigns.filter((c) => inWeek(c.sendAt));
  const openTasks = tasks.filter((t) => !t.done);
  const overdue = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < startOfDay(new Date()));

  const todayTasks = openTasks
    .filter((t) => t.dueDate && (isToday(new Date(t.dueDate)) || new Date(t.dueDate) < startOfDay(new Date())))
    .sort((a, b) => (a.assigneeId === userId ? -1 : 1) - (b.assigneeId === userId ? -1 : 1) || a.dueDate!.localeCompare(b.dueDate!));
  const todayCampaigns = campaigns.filter((c) => isToday(new Date(c.sendAt)));

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));
  const upcoming = campaigns.filter((c) => {
    const d = new Date(c.sendAt);
    return d >= days[0] && d < addDays(days[6], 1);
  });

  const openStages = stages.filter((s) => s.kind !== "lost");
  const pipeline = openStages.map((s) => {
    const ls = leads.filter((l) => l.stageId === s.id);
    return { stage: s, count: ls.length, value: ls.reduce((a, l) => a + l.value, 0) };
  });
  const maxStage = Math.max(1, ...pipeline.map((p) => p.value));
  const weighted = leads.reduce((a, l) => a + l.value * (stages.find((s) => s.id === l.stageId)?.kind === "open" ? stages.find((s) => s.id === l.stageId)!.probability : 0), 0);

  return (
    <Page>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM")}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {greeting()}, {me?.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayCampaigns.length} send{todayCampaigns.length === 1 ? "" : "s"} and {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"} on your plate today
            {overdue.length > 0 && <span className="text-danger"> · {overdue.length} overdue</span>}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openQuickTask()}>
            <Plus /> Task
          </Button>
          <Button onClick={() => navigate("/campaigns")}>
            <CalendarDays /> Open planner
          </Button>
        </div>
      </div>

      {clients.length === 0 && leads.length === 0 && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 border-primary/30 bg-primary/[0.04] p-4">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <div className="min-w-[200px] flex-1">
            <p className="text-sm font-medium">Your workspace is empty</p>
            <p className="text-sm text-muted-foreground">Add your first client or lead to get started. Invite your team on the Team page.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/team")}>Invite team</Button>
          <Button size="sm" onClick={() => setNewClientOpen(true)}><Plus /> Add client</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active clients" value={clients.length} icon={Users} hint={`${clients.filter((c) => c.health !== "good").length} need attention`} onClick={() => navigate("/clients")} />
        {canBilling ? (
          <StatCard label="MRR" value={money(mrr(clients))} icon={CircleDollarSign} hint={`${money(mrr(clients) * 12, { compact: true })} ARR`} />
        ) : (
          <StatCard label="Pipeline leads" value={leads.filter((l) => stages.find((s) => s.id === l.stageId)?.kind === "open").length} icon={TrendingUp} hint="open deals" />
        )}
        <StatCard label="Sends this week" value={weekCampaigns.length} icon={CalendarDays} hint={`${weekCampaigns.filter((c) => c.status === "sent").length} sent so far`} onClick={() => navigate("/campaigns")} />
        <StatCard label="Open tasks" value={openTasks.length} icon={CheckSquare} hint={overdue.length ? <span className="text-danger">{overdue.length} overdue</span> : "none overdue"} onClick={() => navigate("/tasks")} />
        <StatCard label="Avg. open rate" value={cur ? pct(cur.openRate) : "—"} icon={MailOpen} delta={cur && prev ? cur.openRate - prev.openRate : null} deltaSuffix=" pts" hint="vs last month" />
        <StatCard
          label="Client revenue"
          value={cur ? money(cur.revenue, { compact: true }) : "—"}
          icon={TrendingUp}
          delta={cur && prev ? delta(cur.revenue, prev.revenue) : null}
          hint="vs last month"
          onClick={() => navigate("/reports")}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Today */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                All tasks <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {todayCampaigns.length === 0 && todayTasks.length === 0 ? (
              <EmptyState compact icon={Sparkles} title="All clear for today" description="Nothing is due. Plan ahead or pick up something from this week." action={<Button size="sm" variant="secondary" onClick={() => openQuickTask()}><Plus /> Add task</Button>} />
            ) : (
              <ul className="divide-y divide-border/60">
                {todayCampaigns.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => openCampaign(c.id)} className="flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                      <CompanyLogo name={clientById[c.clientId]?.name ?? "?"} color={clientById[c.clientId]?.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {clientById[c.clientId]?.name} · sends {format(new Date(c.sendAt), "HH:mm")}
                        </p>
                      </div>
                      <CampaignStatusBadge status={c.status} className="hidden sm:inline-flex" />
                      <Assignee id={c.assigneeId} />
                    </button>
                  </li>
                ))}
                {todayTasks.slice(0, 8).map((t) => {
                  const late = new Date(t.dueDate!) < startOfDay(new Date());
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-2 py-2.5">
                      <Checkbox round checked={t.done} onCheckedChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} className="ml-1 mr-1" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{t.title}</p>
                        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          <PriorityIcon priority={t.priority} className="size-3" />
                          {t.clientId ? clientById[t.clientId]?.name : "Internal"}
                          {late && <span className="font-medium text-danger">· Overdue</span>}
                        </p>
                      </div>
                      <Assignee id={t.assigneeId} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads">
                Board <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular">{money(pipeline.filter((p) => p.stage.kind === "open").reduce((a, p) => a + p.value, 0))}</span>
              <span className="text-xs text-muted-foreground">open / mo · {money(weighted)} weighted</span>
            </div>
            <ul className="space-y-2.5">
              {pipeline.map((p) => (
                <li key={p.stage.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.stage.name} <span className="text-xs tabular text-muted-foreground/70">· {p.count}</span>
                    </span>
                    <span className="font-medium tabular">{money(p.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-[width] duration-700", p.stage.kind === "won" ? "bg-success" : "bg-primary")} style={{ width: `${(p.value / maxStage) * 100}%`, opacity: p.stage.kind === "won" ? 1 : 0.45 + p.stage.probability * 0.9 }} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming sends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming sends</CardTitle>
            <span className="text-xs text-muted-foreground">Next 7 days · {upcoming.length} campaigns</span>
          </CardHeader>
          <CardContent>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-7 md:overflow-visible">
              {days.map((d) => {
                const list = upcoming.filter((c) => isSameDay(new Date(c.sendAt), d)).sort((a, b) => a.sendAt.localeCompare(b.sendAt));
                return (
                  <div key={d.toISOString()} className="min-w-[132px] md:min-w-0">
                    <div className={cn("mb-2 flex items-baseline gap-1.5 border-b pb-1.5 text-xs", isToday(d) ? "border-primary text-primary" : "text-muted-foreground")}>
                      <span className="font-medium">{isToday(d) ? "Today" : format(d, "EEE")}</span>
                      <span className="tabular">{format(d, "d")}</span>
                    </div>
                    <div className="space-y-1.5">
                      {list.length === 0 && <p className="py-1 text-xs text-muted-foreground/60">—</p>}
                      {list.map((c) => {
                        const cl = clientById[c.clientId];
                        return (
                          <button
                            key={c.id}
                            onClick={() => openCampaign(c.id)}
                            className="block w-full rounded-sm border bg-card px-2 py-1.5 text-left shadow-soft transition hover:-translate-y-px hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            style={{ borderLeft: `3px solid ${cl?.color}` }}
                          >
                            <p className="truncate text-xs font-medium">{c.name}</p>
                            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                              <Dot className={campaignStatusDot[c.status]} />
                              {format(new Date(c.sendAt), "HH:mm")} · {cl?.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 && <p className="text-sm text-muted-foreground">Changes your team makes will show up here.</p>}
            <ol className="space-y-3.5">
              {activities.slice(0, 8).map((a) => {
                const m = team.find((x) => x.id === a.actorId);
                const onClick =
                  a.entityType === "campaign" && campaigns.some((c) => c.id === a.entityId)
                    ? () => openCampaign(a.entityId)
                    : a.entityType === "lead" && leads.some((l) => l.id === a.entityId)
                      ? () => openLead(a.entityId)
                      : a.clientId && clientById[a.clientId]
                        ? () => navigate(`/clients/${a.clientId}`)
                        : undefined;
                return (
                  <li key={a.id} className="flex gap-2.5">
                    <MemberAvatar member={m} size="sm" />
                    <p className="min-w-0 flex-1 text-sm leading-snug">
                      <span className="font-medium">{m?.name.split(" ")[0]}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
                      {onClick ? (
                        <button onClick={onClick} className="font-medium hover:underline focus-visible:underline focus-visible:outline-none">
                          {a.entityName}
                        </button>
                      ) : (
                        <span className="font-medium">{a.entityName}</span>
                      )}{" "}
                      {a.detail && <span className="text-muted-foreground">{a.detail}</span>}
                      <span className="block text-xs text-muted-foreground/80">{timeAgo(a.createdAt)}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
