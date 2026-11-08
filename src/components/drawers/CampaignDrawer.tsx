import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CheckSquare,
  ExternalLink,
  PenTool,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { Sheet, SheetClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { InlineDate, InlineSelect, InlineText, PropRow } from "@/components/shared/Inline";
import { MemberAvatar } from "@/components/shared/Avatar";
import { PriorityIcon } from "@/components/shared/badges";
import { RichText } from "@/components/shared/RichText";
import { statusOptions, toOptions, useMemberOptions } from "@/components/shared/options";
import { approvalLabel, segments } from "@/lib/constants";
import type { ApprovalStatus, Campaign, CampaignStatus } from "@/data/types";
import { cn, modKey, money, num, pct, relativeDay, timeAgo } from "@/lib/utils";
import { useCan } from "@/hooks/usePermission";

const checklistItems: { key: keyof Campaign["checklist"]; label: string }[] = [
  { key: "links", label: "All links tested" },
  { key: "mobile", label: "Mobile rendering checked" },
  { key: "utm", label: "UTM parameters added" },
  { key: "spam", label: "Spam & seed test passed" },
];

export function CampaignDrawer() {
  const { campaignId, openCampaign } = useUI();
  const campaign = useData((s) => s.campaigns.find((c) => c.id === campaignId));
  return (
    <Sheet open={!!campaign} onOpenChange={(o) => !o && openCampaign(null)} title={campaign?.name ?? "Campaign"} className="max-w-[680px]">
      {campaign && <CampaignDetail id={campaign.id} />}
    </Sheet>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function CampaignDetail({ id }: { id: string }) {
  const { campaigns, clients, team, tasks, updateCampaign, moveCampaign, deleteCampaign, addComment, toggleTask } = useData();
  const { openCampaign, openQuickTask } = useUI();
  const c = campaigns.find((x) => x.id === id)!;
  const client = clients.find((x) => x.id === c.clientId);
  const memberOptions = useMemberOptions();
  const canApprove = useCan("campaigns.approve");
  const [comment, setComment] = useState("");
  const u = (p: Partial<Campaign>) => updateCampaign(id, p);
  const done = Object.values(c.checklist).filter(Boolean).length;
  const related = tasks.filter((t) => t.campaignId === id);

  const sendComment = () => {
    if (!comment.trim()) return;
    addComment(id, comment.trim());
    setComment("");
  };

  return (
    <>
      <header className="flex items-start gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0 flex-1">
          {client && (
            <Link to={`/clients/${client.id}`} onClick={() => openCampaign(null)} className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              <CompanyLogo name={client.name} color={client.color} size="xs" />
              {client.name}
            </Link>
          )}
          <InlineText value={c.name} onSave={(v) => v && u({ name: v })} ariaLabel="Campaign name" className="text-lg font-semibold" />
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openQuickTask({ clientId: c.clientId, campaignId: id })}>
                <CheckSquare /> Add task
              </DropdownMenuItem>
              <DropdownMenuItem
                destructive
                onSelect={() => {
                  const snapshot = c;
                  deleteCampaign(id);
                  openCampaign(null);
                  toast("Campaign deleted", { description: snapshot.name, action: { label: "Undo", onClick: () => useData.setState((s) => ({ campaigns: [...s.campaigns, snapshot] })) } });
                }}
              >
                <Trash2 /> Delete campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X />
            </Button>
          </SheetClose>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-5 pb-4">
          <PropRow label="Status" icon={<Send />}>
            <InlineSelect value={c.status} onSave={(v) => moveCampaign(id, v as CampaignStatus)} options={statusOptions} ariaLabel="Status" />
          </PropRow>
          <PropRow label="Send" icon={<CalendarClock />}>
            <InlineDate value={c.sendAt} withTime onSave={(v) => v && u({ sendAt: v })} ariaLabel="Send date" display={(v) => <span>{relativeDay(v)}, {new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>} />
          </PropRow>
          <PropRow label="Segment" icon={<Users />}>
            <InlineSelect value={c.segment} onSave={(v) => u({ segment: v })} options={toOptions(Array.from(new Set([...segments, c.segment])))} ariaLabel="Segment" />
          </PropRow>
          <PropRow label="Assignee" icon={<User />}>
            <InlineSelect value={c.assigneeId} onSave={(v) => u({ assigneeId: v })} options={memberOptions} ariaLabel="Assignee" />
          </PropRow>
          <PropRow label="Approval" icon={<BadgeCheck />}>
            {canApprove ? (
              <InlineSelect
                value={c.approval}
                onSave={(v) => {
                  u({ approval: v as ApprovalStatus });
                  if (v === "approved" && ["idea", "copywriting", "design", "client_review"].includes(c.status)) moveCampaign(id, "approved");
                  if (v === "approved") toast.success("Campaign approved");
                }}
                options={(Object.keys(approvalLabel) as ApprovalStatus[]).map((a) => ({
                  value: a,
                  label: approvalLabel[a],
                  icon: <span className={cn("size-1.5 rounded-full", a === "approved" ? "bg-success" : a === "changes_requested" ? "bg-danger" : a === "pending" ? "bg-warning" : "bg-muted-foreground/40")} />,
                }))}
                ariaLabel="Approval status"
              />
            ) : (
              <span className="px-0 text-sm">{approvalLabel[c.approval]}</span>
            )}
          </PropRow>
          <PropRow label="Design" icon={<PenTool />}>
            <div className="flex items-center gap-1">
              <InlineText value={c.designUrl} onSave={(v) => u({ designUrl: v })} placeholder="Paste Figma or Canva link" ariaLabel="Design link" display={(v) => <span className="truncate text-primary">{v.replace(/^https?:\/\/(www\.)?/, "")}</span>} />
              {c.designUrl && (
                <Button variant="ghost" size="icon-sm" asChild>
                  <a href={c.designUrl} target="_blank" rel="noreferrer" aria-label="Open design">
                    <ExternalLink />
                  </a>
                </Button>
              )}
            </div>
          </PropRow>
        </div>

        <Section title="Inbox">
          <div className="space-y-1">
            <PropRow label="Subject line">
              <InlineText value={c.subject} onSave={(v) => u({ subject: v })} placeholder="Add subject line" ariaLabel="Subject line" />
            </PropRow>
            <PropRow label="Preview text">
              <InlineText value={c.previewText} onSave={(v) => u({ previewText: v })} placeholder="Add preview text" ariaLabel="Preview text" />
            </PropRow>
          </div>
          {/* inbox preview */}
          <div className="mt-3 flex items-start gap-3 rounded-md border bg-subtle p-3">
            {client && <CompanyLogo name={client.name} color={client.color} size="md" className="rounded-full" />}
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{client?.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.sendAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="truncate font-medium">{c.subject || <span className="text-muted-foreground">Subject line</span>}</p>
              <p className="truncate text-muted-foreground">{c.previewText || "Preview text…"}</p>
            </div>
          </div>
          <p className={cn("mt-1.5 text-right text-xs", c.subject.length > 50 ? "text-warning" : "text-muted-foreground")}>
            Subject {c.subject.length}/50 · Preview {c.previewText.length}/90
          </p>
        </Section>

        {c.metrics && (
          <Section title="Results">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-6">
              {[
                ["Recipients", num(c.metrics.recipients, true)],
                ["Open rate", pct(c.metrics.openRate)],
                ["Click rate", pct(c.metrics.clickRate, 2)],
                ["Conversion", pct(c.metrics.conversionRate, 2)],
                ["Revenue", money(c.metrics.revenue, { compact: true })],
                ["Unsubs", pct(c.metrics.unsubRate, 2)],
              ].map(([k, v]) => (
                <div key={k} className="bg-card px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold tabular">{v}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Checklist" action={<span className="text-xs tabular text-muted-foreground">{done}/4</span>}>
          <Progress value={(done / 4) * 100} className="mb-3" barClassName={done === 4 ? "bg-success" : undefined} />
          <div className="grid gap-1 sm:grid-cols-2">
            {checklistItems.map((item) => (
              <label key={item.key} className="flex cursor-pointer items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-sm transition hover:bg-accent">
                <Checkbox checked={c.checklist[item.key]} onCheckedChange={(v) => u({ checklist: { ...c.checklist, [item.key]: !!v } })} />
                <span className={cn(c.checklist[item.key] && "text-muted-foreground line-through decoration-muted-foreground/40")}>{item.label}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Copy">
          <RichText value={c.copy} onChange={(html) => u({ copy: html })} placeholder="Write the email copy — hero, body, CTA…" />
        </Section>

        <Section
          title="Tasks"
          action={
            <Button variant="ghost" size="sm" onClick={() => openQuickTask({ clientId: c.clientId, campaignId: id })}>
              <Plus /> Add
            </Button>
          }
        >
          {related.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks linked to this campaign.</p>
          ) : (
            <ul className="space-y-1">
              {related.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 rounded-sm px-1.5 py-1 text-sm hover:bg-accent">
                  <Checkbox round checked={t.done} onCheckedChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} />
                  <PriorityIcon priority={t.priority} />
                  <span className={cn("flex-1 truncate", t.done && "text-muted-foreground line-through")}>{t.title}</span>
                  <span className="text-xs text-muted-foreground">{relativeDay(t.dueDate)}</span>
                  <MemberAvatar member={team.find((m) => m.id === t.assigneeId)} size="xs" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Comments${c.comments.length ? ` · ${c.comments.length}` : ""}`}>
          <ul className="space-y-4">
            {c.comments.map((cm) => {
              const m = team.find((x) => x.id === cm.authorId);
              return (
                <li key={cm.id} className="flex gap-3 animate-fade-in">
                  <MemberAvatar member={m} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{m?.name}</span> <span className="text-xs text-muted-foreground">{timeAgo(cm.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground/90">{cm.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={cn("relative", c.comments.length > 0 && "mt-4")}>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment…"
              aria-label="New comment"
              className="min-h-[64px] pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendComment();
              }}
            />
            <Button size="icon-sm" className="absolute bottom-2 right-2" disabled={!comment.trim()} onClick={sendComment} aria-label={`Send comment (${modKey}+Enter)`}>
              <Check />
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}
