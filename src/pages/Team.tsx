import { useState } from "react";
import { toast } from "sonner";
import { Check, Mail, MoreHorizontal, Trash2, UserPlus, X } from "lucide-react";
import { useData } from "@/store/data";
import { allPermissions, permissionLabels, roleCan, roleLabels } from "@/store/auth";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { MemberAvatar } from "@/components/shared/Avatar";
import { InlineSelect } from "@/components/shared/Inline";
import { PriorityIcon } from "@/components/shared/badges";
import { CardGridSkeleton } from "@/components/shared/Skeletons";
import { useLoading } from "@/hooks/useLoading";
import { useCan, useCurrentUser } from "@/hooks/usePermission";
import { uid } from "@/lib/id";
import type { Role, TeamMember } from "@/data/types";
import { cn, relativeDay } from "@/lib/utils";
import { priorities } from "@/lib/constants";

const roles = Object.keys(roleLabels) as Role[];
const hoursPerTask = { urgent: 3, high: 2, medium: 1.5, low: 1 } as const;
const hoursPerCampaign = 3;

export default function Team() {
  const loading = useLoading("team");
  const { team, tasks, campaigns, clients, upsertMember, removeMember } = useData();
  const canManage = useCan("team.manage");
  const me = useCurrentUser();
  const [invite, setInvite] = useState(false);

  const workload = (m: TeamMember) => {
    const open = tasks.filter((t) => t.assigneeId === m.id && !t.done);
    const weekEnd = Date.now() + 7 * 864e5;
    const weekTasks = open.filter((t) => !t.dueDate || new Date(t.dueDate).getTime() < weekEnd);
    const camp = campaigns.filter((c) => c.assigneeId === m.id && c.status !== "sent" && new Date(c.sendAt).getTime() < weekEnd);
    const hours = weekTasks.reduce((a, t) => a + hoursPerTask[t.priority], 0) + camp.length * hoursPerCampaign;
    return { open, camp, hours, pct: (hours / m.capacity) * 100 };
  };

  return (
    <Page>
      <PageHeader
        title="Team"
        description={`${team.length} people · workload is estimated from tasks and campaigns due in the next 7 days`}
        actions={
          canManage && (
            <Button onClick={() => setInvite(true)}>
              <UserPlus /> Invite member
            </Button>
          )
        }
      />
      {loading ? (
        <CardGridSkeleton n={3} />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {team.map((m) => {
              const w = workload(m);
              const clientsManaged = clients.filter((c) => c.accountManagerId === m.id).length;
              const level = w.pct > 100 ? "over" : w.pct > 80 ? "high" : "ok";
              return (
                <Card key={m.id} className="flex flex-col p-4">
                  <div className="flex items-start gap-3">
                    <MemberAvatar member={m} size="lg" tooltip={false} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-semibold">
                        {m.name} {m.id === me?.id && <Badge variant="primary">You</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.title}</p>
                      <a href={`mailto:${m.email}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Mail className="size-3" /> {m.email}
                      </a>
                    </div>
                    {canManage && m.id !== me?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`}><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            destructive
                            onSelect={() => {
                              if (tasks.some((t) => t.assigneeId === m.id && !t.done)) return toast.error("Reassign their open tasks first.");
                              removeMember(m.id);
                              toast(`${m.name} removed`);
                            }}
                          >
                            <Trash2 /> Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-4">
                    {canManage ? (
                      <InlineSelect value={m.role} onSave={(v) => upsertMember({ ...m, role: v as Role })} options={roles.map((r) => ({ value: r, label: roleLabels[r] }))} ariaLabel={`${m.name} role`} className="border" />
                    ) : (
                      <Badge variant="outline">{roleLabels[m.role]}</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">This week</span>
                      <span className={cn("font-medium tabular", level === "over" ? "text-danger" : level === "high" ? "text-warning" : "text-foreground")}>
                        {w.hours.toFixed(1)}h / {m.capacity}h
                      </span>
                    </div>
                    <Progress value={w.pct} barClassName={level === "over" ? "bg-danger" : level === "high" ? "bg-warning" : undefined} />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Open tasks</p><p className="text-sm font-medium tabular">{w.open.length}</p></div>
                      <div><p className="text-muted-foreground">Campaigns</p><p className="text-sm font-medium tabular">{w.camp.length}</p></div>
                      <div><p className="text-muted-foreground">Clients</p><p className="text-sm font-medium tabular">{clientsManaged}</p></div>
                    </div>
                  </div>
                  <ul className="mt-4 flex-1 space-y-1 border-t pt-3">
                    {w.open
                      .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9") || priorities.indexOf(a.priority) - priorities.indexOf(b.priority))
                      .slice(0, 4)
                      .map((t) => (
                        <li key={t.id} className="flex items-center gap-2 text-sm">
                          <PriorityIcon priority={t.priority} />
                          <span className="min-w-0 flex-1 truncate">{t.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(t.dueDate)}</span>
                        </li>
                      ))}
                    {w.open.length === 0 && <li className="text-sm text-muted-foreground">No open tasks</li>}
                  </ul>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle>Roles & permissions</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-subtle text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="h-9 px-4 text-left font-medium">Permission</th>
                      {roles.map((r) => (
                        <th key={r} scope="col" className="h-9 px-4 text-center font-medium">{roleLabels[r]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissions.map((p) => (
                      <tr key={p} className="border-t">
                        <td className="px-4 py-2.5">{permissionLabels[p]}</td>
                        {roles.map((r) => (
                          <td key={r} className="px-4 py-2.5 text-center">
                            {roleCan(r, p) ? <Check className="mx-auto size-4 text-success" aria-label="Allowed" /> : <X className="mx-auto size-4 text-muted-foreground/40" aria-label="Not allowed" />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      <InviteDialog open={invite} onOpenChange={setInvite} />
    </Page>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const upsertMember = useData((s) => s.upsertMember);
  const [f, setF] = useState({ name: "", email: "", role: "copywriter" as Role, title: "", capacity: "40" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Invite team member" description="Add their email here, then they create an account with it on the sign-in page.">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            upsertMember({ id: uid("u"), name: f.name.trim(), email: f.email.trim().toLowerCase(), role: f.role, title: f.title || roleLabels[f.role], color: String(Math.floor(Math.random() * 360)), capacity: Number(f.capacity) || 40 });
            toast.success(`${f.name.trim()} added`, { description: `They can now create an account with ${f.email.trim()}.` });
            onOpenChange(false);
            setF({ name: "", email: "", role: "copywriter", title: "", capacity: "40" });
          }}
        >
          <Field label="Full name"><Input required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><Input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Role"><Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as Role })} options={roles.map((r) => ({ value: r, label: roleLabels[r] }))} /></Field>
          <Field label="Capacity (h / week)"><Input inputMode="numeric" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Job title" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Junior copywriter" /></Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
