import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { addDays, format, isToday, startOfDay } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, CheckSquare, ChevronRight, MoreHorizontal, Plus, Trash2, Users } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuCheckItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { PriorityIcon } from "@/components/shared/badges";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { MemberAvatar } from "@/components/shared/Avatar";
import { InlineDate, InlineText } from "@/components/shared/Inline";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterMenu } from "@/components/shared/FilterMenu";
import { SearchInput } from "@/components/shared/Table";
import { ListSkeleton } from "@/components/shared/Skeletons";
import { priorityOptions, useClientOptions } from "@/components/shared/options";
import { useLoading } from "@/hooks/useLoading";
import { priorities, priorityLabel } from "@/lib/constants";
import type { Task } from "@/data/types";
import { cn, relativeDay } from "@/lib/utils";

type Scope = "mine" | "team";
type Group = "overdue" | "today" | "week" | "later" | "nodate";
const groupLabels: Record<Group, string> = { overdue: "Overdue", today: "Today", week: "Next 7 days", later: "Later", nodate: "No due date" };

function groupOf(t: Task): Group {
  if (!t.dueDate) return "nodate";
  const d = new Date(t.dueDate);
  const today = startOfDay(new Date());
  if (d < today) return "overdue";
  if (isToday(d)) return "today";
  if (d < addDays(today, 7)) return "week";
  return "later";
}

export default function Tasks() {
  const loading = useLoading("tasks");
  const { tasks } = useData();
  const openQuickTask = useUI((s) => s.openQuickTask);
  const userId = useAuth((s) => s.userId);
  const clientOptions = useClientOptions();
  const team = useData((s) => s.team);
  const [scope, setScope] = useState<Scope>("mine");
  const [q, setQ] = useState("");
  const [fPriority, setFPriority] = useState<string[]>([]);
  const [fClient, setFClient] = useState<string[]>([]);
  const [fAssignee, setFAssignee] = useState<string[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [params, setParams] = useSearchParams();
  const highlight = params.get("task");

  useEffect(() => {
    if (!highlight) return;
    const t = tasks.find((x) => x.id === highlight);
    if (t && t.assigneeId !== userId) setScope("team");
    const timer = setTimeout(() => {
      document.getElementById(`task-${highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    const clear = setTimeout(() => setParams({}, { replace: true }), 2400);
    return () => {
      clearTimeout(timer);
      clearTimeout(clear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight]);

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (scope === "team" || t.assigneeId === userId) &&
          (!q || t.title.toLowerCase().includes(q.toLowerCase())) &&
          (!fPriority.length || fPriority.includes(t.priority)) &&
          (!fClient.length || (t.clientId && fClient.includes(t.clientId))) &&
          (scope === "mine" || !fAssignee.length || fAssignee.includes(t.assigneeId)),
      ),
    [tasks, scope, userId, q, fPriority, fClient, fAssignee],
  );
  const open = visible.filter((t) => !t.done);
  const done = visible.filter((t) => t.done).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const groups = (["overdue", "today", "week", "later", "nodate"] as Group[])
    .map((g) => ({
      g,
      items: open
        .filter((t) => groupOf(t) === g)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || priorities.indexOf(a.priority) - priorities.indexOf(b.priority)),
    }))
    .filter((x) => x.items.length);

  return (
    <Page>
      <PageHeader
        title="Tasks"
        description={`${open.length} open · ${groups.find((g) => g.g === "overdue")?.items.length ?? 0} overdue`}
        actions={
          <Tooltip content="Quick add" shortcut={["T"]}>
            <Button onClick={() => openQuickTask()}>
              <Plus /> New task
            </Button>
          </Tooltip>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "mine", label: "My tasks" },
              { value: "team", label: "Team tasks" },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Search tasks…" className="w-full sm:w-auto" />
          <FilterMenu label="Priority" options={priorityOptions} selected={fPriority} onChange={setFPriority} />
          <FilterMenu label="Client" options={clientOptions} selected={fClient} onChange={setFClient} />
          {scope === "team" && (
            <FilterMenu
              label="Assignee"
              icon={<Users />}
              options={team.map((m) => ({ value: m.id, label: m.name, icon: <MemberAvatar member={m} size="xs" tooltip={false} /> }))}
              selected={fAssignee}
              onChange={setFAssignee}
            />
          )}
        </div>
      </PageHeader>

      {loading ? (
        <ListSkeleton rows={8} />
      ) : open.length === 0 && done.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckSquare}
            title={tasks.length ? "Nothing here" : "No tasks yet"}
            description={tasks.length ? "No tasks match this view. Switch to Team tasks or clear filters." : "Capture to-dos for campaigns and clients. Press T anywhere to add one."}
            action={
              <Button size="sm" onClick={() => openQuickTask()}>
                <Plus /> New task <Kbd className="ml-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">T</Kbd>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {open.length === 0 && (
            <Card>
              <EmptyState compact icon={CheckCircle2} title="You're all caught up" description="Every task in this view is done. Nice work." />
            </Card>
          )}
          {groups.map(({ g, items }) => (
            <section key={g} aria-label={groupLabels[g]}>
              <h2 className={cn("mb-2 flex items-center gap-2 px-1 text-sm font-medium", g === "overdue" && "text-danger")}>
                {groupLabels[g]} <span className="text-xs font-normal tabular text-muted-foreground">{items.length}</span>
              </h2>
              <Card className="divide-y divide-border/70 overflow-hidden">
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} showAssignee={scope === "team"} highlight={t.id === highlight} />
                ))}
              </Card>
            </section>
          ))}
          {done.length > 0 && (
            <section>
              <button onClick={() => setShowDone(!showDone)} className="mb-2 flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground transition hover:text-foreground" aria-expanded={showDone}>
                <ChevronRight className={cn("size-4 transition-transform", showDone && "rotate-90")} />
                Completed <span className="text-xs font-normal tabular">{done.length}</span>
              </button>
              {showDone && (
                <Card className="divide-y divide-border/70 overflow-hidden animate-fade-in">
                  {done.map((t) => (
                    <TaskRow key={t.id} task={t} showAssignee={scope === "team"} />
                  ))}
                </Card>
              )}
            </section>
          )}
        </div>
      )}
    </Page>
  );
}

function TaskRow({ task: t, showAssignee, highlight }: { task: Task; showAssignee?: boolean; highlight?: boolean }) {
  const { clients, campaigns, team, updateTask, toggleTask, deleteTask } = useData();
  const openCampaign = useUI((s) => s.openCampaign);
  const client = clients.find((c) => c.id === t.clientId);
  const campaign = campaigns.find((c) => c.id === t.campaignId);
  const assignee = team.find((m) => m.id === t.assigneeId);
  const overdue = !t.done && t.dueDate && new Date(t.dueDate) < startOfDay(new Date());

  return (
    <div id={`task-${t.id}`} className={cn("group flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 transition-colors hover:bg-accent/40 sm:flex-nowrap", highlight && "bg-primary/[0.07]")}>
      <Checkbox
        round
        checked={t.done}
        aria-label={t.done ? `Mark ${t.title} as not done` : `Complete ${t.title}`}
        onCheckedChange={() => {
          toggleTask(t.id);
          if (!t.done) toast.success("Task completed", { description: t.title, action: { label: "Undo", onClick: () => toggleTask(t.id) } });
        }}
      />
      <DropdownMenu>
        <Tooltip content={`${priorityLabel[t.priority]} priority`}>
          <DropdownMenuTrigger className="rounded-sm p-1 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60" aria-label="Change priority">
            <PriorityIcon priority={t.priority} />
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {priorities.map((p) => (
            <DropdownMenuCheckItem key={p} checked={t.priority === p} onSelect={() => updateTask(t.id, { priority: p })}>
              <PriorityIcon priority={p} /> {priorityLabel[p]}
            </DropdownMenuCheckItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className={cn("min-w-0 flex-1 basis-[60%] sm:basis-auto", t.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>
        <InlineText value={t.title} onSave={(v) => v && updateTask(t.id, { title: v })} ariaLabel="Task title" />
      </div>
      <div className="flex items-center gap-1.5 pl-9 sm:pl-0">
        {campaign && (
          <button onClick={() => openCampaign(campaign.id)} className="hidden max-w-[160px] truncate rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition hover:text-foreground lg:inline">
            {campaign.name}
          </button>
        )}
        {client && (
          <Link to={`/clients/${client.id}`} className="flex max-w-[150px] items-center gap-1.5 truncate rounded-full border px-2 py-0.5 text-xs text-muted-foreground transition hover:text-foreground">
            <CompanyLogo name={client.name} color={client.color} size="xs" className="!size-3.5 !rounded-[3px] !text-[6px]" />
            <span className="truncate">{client.name}</span>
          </Link>
        )}
        <div className="w-[104px]">
          <InlineDate
            value={t.dueDate}
            onSave={(v) => updateTask(t.id, { dueDate: v })}
            ariaLabel="Due date"
            placeholder="Due"
            className="justify-end text-xs"
            display={(v) => <span className={cn("text-xs", overdue ? "font-medium text-danger" : "text-muted-foreground")}>{relativeDay(v)}</span>}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60" aria-label={`Assignee: ${assignee?.name ?? "none"}`}>
            <MemberAvatar member={assignee} size="sm" tooltip={showAssignee} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            {team.map((m) => (
              <DropdownMenuCheckItem key={m.id} checked={m.id === t.assigneeId} onSelect={() => updateTask(t.id, { assigneeId: m.id })}>
                <MemberAvatar member={m} size="xs" tooltip={false} /> {m.name}
              </DropdownMenuCheckItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Task actions" className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => updateTask(t.id, { dueDate: new Date(new Date().setHours(17, 0, 0, 0)).toISOString() })}>Due today</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => updateTask(t.id, { dueDate: new Date(new Date(Date.now() + 864e5).setHours(17, 0, 0, 0)).toISOString() })}>Due tomorrow</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                deleteTask(t.id);
                toast("Task deleted", { description: t.title, action: { label: "Undo", onClick: () => useData.setState((s) => ({ tasks: [t, ...s.tasks] })) } });
              }}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {t.done && t.completedAt && <span className="sr-only">Completed {format(new Date(t.completedAt), "d MMM")}</span>}
    </div>
  );
}
