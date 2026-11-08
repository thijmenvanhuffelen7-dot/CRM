import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  Globe,
  Mail,
  MoreHorizontal,
  Phone,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { Sheet, SheetClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { InlineDate, InlineNumber, InlineSelect, InlineText, PropRow } from "@/components/shared/Inline";
import { MemberAvatar } from "@/components/shared/Avatar";
import { toOptions, useMemberOptions } from "@/components/shared/options";
import { esps, niches, platforms } from "@/lib/constants";
import { cn, money, relativeDay, timeAgo } from "@/lib/utils";
import { useCan } from "@/hooks/usePermission";
import { modKey } from "@/lib/utils";

const sources = ["Referral", "Outbound", "Inbound — website", "LinkedIn", "Klaviyo partner directory", "Event"];

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-t px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LeadDrawer() {
  const { leadId, openLead } = useUI();
  const lead = useData((s) => s.leads.find((l) => l.id === leadId));
  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && openLead(null)} title={lead?.company ?? "Lead"}>
      {lead && <LeadDetail id={lead.id} />}
    </Sheet>
  );
}

function LeadDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const openLead = useUI((s) => s.openLead);
  const { leads, stages, team, activities, updateLead, moveLead, deleteLead, addLeadNote, convertLead } = useData();
  const lead = leads.find((l) => l.id === id)!;
  const stage = stages.find((s) => s.id === lead.stageId);
  const memberOptions = useMemberOptions();
  const canEdit = useCan("leads.manage");
  const [note, setNote] = useState("");
  const u = (p: Partial<typeof lead>) => updateLead(id, p);
  const days = differenceInCalendarDays(new Date(), new Date(lead.stageEnteredAt));
  const followOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date(new Date().toDateString());

  const timeline = [
    ...activities.filter((a) => a.leadId === id).map((a) => ({ id: a.id, at: a.createdAt, actorId: a.actorId, kind: "activity" as const, text: `${a.action} ${a.detail ?? ""}`.trim() })),
    ...lead.notes.map((n) => ({ id: n.id, at: n.createdAt, actorId: n.authorId, kind: "note" as const, text: n.body })),
    { id: "created", at: lead.createdAt, actorId: lead.ownerId, kind: "activity" as const, text: "created this lead" },
  ].sort((a, b) => b.at.localeCompare(a.at));

  const submitNote = () => {
    if (!note.trim()) return;
    addLeadNote(id, note.trim());
    setNote("");
  };

  return (
    <>
      <header className="flex items-start gap-3 px-5 pb-4 pt-5">
        <CompanyLogo name={lead.company} size="lg" />
        <div className="min-w-0 flex-1">
          <InlineText value={lead.company} onSave={(v) => v && u({ company: v })} ariaLabel="Company name" className="text-lg font-semibold" disabled={!canEdit} />
          {lead.domain && (
            <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              {lead.domain} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    const snapshot = lead;
                    deleteLead(id);
                    openLead(null);
                    toast("Lead deleted", { description: snapshot.company, action: { label: "Undo", onClick: () => useData.setState((s) => ({ leads: [snapshot, ...s.leads] })) } });
                  }}
                >
                  <Trash2 /> Delete lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X />
            </Button>
          </SheetClose>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        <div className="w-44">
          <InlineSelect
            ariaLabel="Stage"
            value={lead.stageId}
            onSave={(v) => {
              moveLead(id, v);
              const st = stages.find((s) => s.id === v);
              if (st?.kind === "won") toast.success(`${lead.company} marked as won 🎉`);
            }}
            options={stages.map((s) => ({ value: s.id, label: s.name }))}
            className="border"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {days === 0 ? "Entered today" : `${days} day${days === 1 ? "" : "s"} in stage`}
        </span>
        {stage?.kind === "won" &&
          (lead.convertedClientId ? (
            <Button size="sm" variant="secondary" className="ml-auto" onClick={() => { openLead(null); navigate(`/clients/${lead.convertedClientId}`); }}>
              <UserCheck /> View client <ArrowRight />
            </Button>
          ) : (
            <Button
              size="sm"
              className="ml-auto"
              disabled={!canEdit}
              onClick={() => {
                const cid = convertLead(id);
                toast.success("Converted to client", { description: `${lead.company} now has a client workspace.` });
                openLead(null);
                navigate(`/clients/${cid}`);
              }}
            >
              <Sparkles /> Convert to client
            </Button>
          ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <Section title="Deal">
          <PropRow label="Value / month" icon={<CircleDollarSign />}>
            <InlineNumber value={lead.value} onSave={(v) => u({ value: v })} format={(n) => money(n)} ariaLabel="Deal value" disabled={!canEdit} />
          </PropRow>
          <PropRow label="Owner" icon={<User />}>
            <InlineSelect value={lead.ownerId} onSave={(v) => u({ ownerId: v })} options={memberOptions} ariaLabel="Owner" />
          </PropRow>
          <PropRow label="Next follow-up" icon={<CalendarClock />}>
            <InlineDate
              value={lead.nextFollowUp}
              onSave={(v) => u({ nextFollowUp: v })}
              ariaLabel="Next follow-up"
              display={(v) => <span className={cn(followOverdue && "font-medium text-danger")}>{relativeDay(v)} · {format(new Date(v), "d MMM")}</span>}
            />
          </PropRow>
          <PropRow label="Source" icon={<Tag />}>
            <InlineSelect value={lead.source} onSave={(v) => u({ source: v })} options={toOptions(sources)} ariaLabel="Source" />
          </PropRow>
        </Section>

        <Section title="Contact">
          <PropRow label="Name" icon={<User />}>
            <InlineText value={lead.contactName} onSave={(v) => u({ contactName: v })} ariaLabel="Contact name" />
          </PropRow>
          <PropRow label="Role" icon={<Building2 />}>
            <InlineText value={lead.contactRole} onSave={(v) => u({ contactRole: v })} ariaLabel="Contact role" />
          </PropRow>
          <PropRow label="Email" icon={<Mail />}>
            <InlineText value={lead.contactEmail} onSave={(v) => u({ contactEmail: v })} ariaLabel="Contact email" display={(v) => <span className="text-primary">{v}</span>} />
          </PropRow>
          <PropRow label="Phone" icon={<Phone />}>
            <InlineText value={lead.contactPhone} onSave={(v) => u({ contactPhone: v })} ariaLabel="Phone" />
          </PropRow>
          {lead.contactEmail && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" asChild>
                <a href={`mailto:${lead.contactEmail}`}>
                  <Mail /> Email
                </a>
              </Button>
              {lead.contactPhone && (
                <Button size="sm" variant="secondary" asChild>
                  <a href={`tel:${lead.contactPhone.replace(/\s/g, "")}`}>
                    <Phone /> Call
                  </a>
                </Button>
              )}
            </div>
          )}
        </Section>

        <Section title="Store">
          <PropRow label="Store URL" icon={<Globe />}>
            <InlineText value={lead.domain} onSave={(v) => u({ domain: v.replace(/^https?:\/\//, "") })} ariaLabel="Store URL" />
          </PropRow>
          <PropRow label="Platform" icon={<ShoppingBag />}>
            <InlineSelect value={lead.platform} onSave={(v) => u({ platform: v })} options={toOptions(platforms)} ariaLabel="Platform" />
          </PropRow>
          <PropRow label="Niche" icon={<Tag />}>
            <InlineSelect value={lead.niche} onSave={(v) => u({ niche: v })} options={toOptions(niches)} ariaLabel="Niche" />
          </PropRow>
          <PropRow label="Est. revenue / yr" icon={<CircleDollarSign />}>
            <InlineNumber value={lead.estRevenue} onSave={(v) => u({ estRevenue: v })} format={(n) => money(n, { compact: true })} ariaLabel="Estimated revenue" />
          </PropRow>
          <PropRow label="Current ESP" icon={<Mail />}>
            <InlineSelect value={lead.currentEsp} onSave={(v) => u({ currentEsp: v })} options={toOptions(esps)} ariaLabel="Current ESP" />
          </PropRow>
        </Section>

        <Section title="Notes & activity">
          <div className="mb-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              aria-label="New note"
              className="min-h-[64px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitNote();
              }}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">{modKey} + Enter</span>
              <Button size="sm" onClick={submitNote} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </div>
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
            {timeline.map((t) => {
              const m = team.find((x) => x.id === t.actorId);
              return (
                <li key={t.id} className="relative flex gap-3">
                  <MemberAvatar member={m} size="sm" />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm">
                      <span className="font-medium">{m?.name.split(" ")[0] ?? "Someone"}</span>{" "}
                      {t.kind === "note" ? <span className="text-muted-foreground">added a note</span> : <span className="text-muted-foreground">{t.text}</span>}
                      <span className="ml-2 text-xs text-muted-foreground/80">{timeAgo(t.at)}</span>
                    </p>
                    {t.kind === "note" && <p className="mt-1.5 whitespace-pre-wrap rounded-md border bg-subtle px-3 py-2 text-sm">{t.text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>
        <div className="px-5 pb-6 pt-2">
          <Badge variant="outline">Created {format(new Date(lead.createdAt), "d MMM yyyy")}</Badge>
        </div>
      </div>
    </>
  );
}
