import { useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import {
  Activity as ActivityIcon,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  Copy,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Files,
  FolderOpen,
  Globe,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  Package as PackageIcon,
  Palette,
  Phone,
  Plus,
  Star,
  Trash2,
  Upload,
  User,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { Page } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field } from "@/components/ui/input";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Assignee, MemberAvatar } from "@/components/shared/Avatar";
import { CampaignStatusBadge, FlowStatusBadge, HealthBadge, PriorityIcon } from "@/components/shared/badges";
import { InlineDate, InlineNumber, InlineSelect, InlineText, PropRow } from "@/components/shared/Inline";
import { EmptyState } from "@/components/shared/EmptyState";
import { healthOptions, toOptions, useMemberOptions } from "@/components/shared/options";
import { ReportView, type Range } from "@/components/reports/ReportView";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoading } from "@/hooks/useLoading";
import { useCan } from "@/hooks/usePermission";
import { esps, flowStatusLabel, niches } from "@/lib/constants";
import { periodAggregate } from "@/lib/metrics";
import { exportReportPdf } from "@/lib/print";
import { cn, fileSize, money, num, pct, relativeDay, timeAgo } from "@/lib/utils";
import { uid } from "@/data/seed";
import type { Client, Contact, FileAsset, FlowStatus } from "@/data/types";

const tabs = [
  { v: "overview", label: "Overview", icon: LayoutDashboard },
  { v: "brand", label: "Brand kit", icon: Palette },
  { v: "campaigns", label: "Campaigns", icon: CalendarDays },
  { v: "flows", label: "Flows", icon: Workflow },
  { v: "reports", label: "Reports", icon: BarChart3 },
  { v: "files", label: "Files", icon: Files },
  { v: "activity", label: "Activity", icon: ActivityIcon },
];

export default function ClientDetail() {
  const { id } = useParams();
  const client = useData((s) => s.clients.find((c) => c.id === id));
  const loading = useLoading(`client-${id}`, 300);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  if (!client)
    return (
      <Page>
        <EmptyState icon={FolderOpen} title="Client not found" description="It may have been removed or the link is wrong." action={<Button asChild variant="secondary" size="sm"><Link to="/clients"><ArrowLeft /> Back to clients</Link></Button>} />
      </Page>
    );

  return (
    <Page wide>
      <ClientHeader client={client} />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })} className="mt-6">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.v} value={t.v}>
              <t.icon /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {loading ? (
          <div className="grid gap-4 pt-5 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            <TabsContent value="overview"><Overview client={client} /></TabsContent>
            <TabsContent value="brand"><BrandKit client={client} /></TabsContent>
            <TabsContent value="campaigns"><ClientCampaigns client={client} /></TabsContent>
            <TabsContent value="flows"><Flows client={client} /></TabsContent>
            <TabsContent value="reports"><ClientReports client={client} /></TabsContent>
            <TabsContent value="files"><FilesTab client={client} /></TabsContent>
            <TabsContent value="activity"><ActivityTab client={client} /></TabsContent>
          </>
        )}
      </Tabs>
    </Page>
  );
}

function ClientHeader({ client }: { client: Client }) {
  const { packages, updateClient, deleteClient } = useData();
  const { openNewCampaign, openQuickTask } = useUI();
  const canDelete = useCan("clients.delete");
  const canEdit = useCan("clients.manage");
  const navigate = useNavigate();
  const pkg = packages.find((p) => p.id === client.packageId);
  return (
    <div className="flex flex-wrap items-start gap-4">
      <CompanyLogo name={client.name} color={client.color} size="xl" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <HealthBadge health={client.health} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {client.domain && (
            <a href={`https://${client.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
              <Globe className="size-3.5" /> {client.domain}
            </a>
          )}
          <span>{client.niche}</span>
          <span className="inline-flex items-center gap-1"><PackageIcon className="size-3.5" /> {pkg?.name ?? "Custom"}</span>
          <span>{client.esp}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => openQuickTask({ clientId: client.id })}>
          <CheckSquare /> Task
        </Button>
        <Button onClick={() => openNewCampaign({ clientId: client.id })}>
          <CalendarPlus /> Campaign
        </Button>
        {(canDelete || canEdit) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onSelect={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}>
                  <Copy /> Copy link
                </DropdownMenuItem>
              )}
              {canEdit &&
                healthOptions.map((h) => (
                  <DropdownMenuItem key={h.value} onSelect={() => updateClient(client.id, { health: h.value as Client["health"] })}>
                    {h.icon} Mark {String(h.label).toLowerCase()}
                  </DropdownMenuItem>
                ))}
              {canDelete && (
                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    if (!window.confirm(`Delete ${client.name}? Its campaigns will be removed too.`)) return;
                    deleteClient(client.id);
                    navigate("/clients");
                    toast("Client deleted", { description: client.name });
                  }}
                >
                  <Trash2 /> Delete client
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ client }: { client: Client }) {
  const { packages, updateClient, campaigns, tasks, metrics, removeContact, toggleTask } = useData();
  const openCampaign = useUI((s) => s.openCampaign);
  const memberOptions = useMemberOptions();
  const canBilling = useCan("billing.view");
  const canEdit = useCan("clients.manage");
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const u = (p: Partial<Client>) => updateClient(client.id, p);
  const upcoming = campaigns.filter((c) => c.clientId === client.id && c.status !== "sent").sort((a, b) => a.sendAt.localeCompare(b.sendAt)).slice(0, 5);
  const openTasks = tasks.filter((t) => t.clientId === client.id && !t.done);
  const m = periodAggregate(metrics, 1, 0, [client.id]);
  const renewalSoon = new Date(client.contractEnd).getTime() - Date.now() < 60 * 864e5;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border shadow-soft sm:grid-cols-4">
          {[
            ["Revenue this month", m ? money(m.revenue) : "—"],
            ["Open rate", m ? pct(m.openRate) : "—"],
            ["List size", num(client.listSize)],
            ["Flows live", `${client.flows.filter((f) => f.status === "live").length} / ${client.flows.length}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-card p-4">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="mt-1 text-lg font-semibold tabular">{v}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <InlineText multiline value={client.notes} onSave={(v) => u({ notes: v })} placeholder="Add context about goals, preferences, upcoming launches…" ariaLabel="Client notes" disabled={!canEdit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming campaigns</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="?tab=campaigns">View all</Link></Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {upcoming.length === 0 ? (
              <EmptyState compact icon={CalendarDays} title="Nothing planned" description="No upcoming campaigns for this client." />
            ) : (
              <ul>
                {upcoming.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => openCampaign(c.id)} className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition hover:bg-accent">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{relativeDay(c.sendAt)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                      <CampaignStatusBadge status={c.status} />
                      <Assignee id={c.assigneeId} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Open tasks · {openTasks.length}</CardTitle></CardHeader>
          <CardContent className="px-2 pb-2">
            {openTasks.length === 0 ? (
              <p className="px-2 pb-2 text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              <ul>
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-accent/60">
                    <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={t.done} onChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} />
                    <PriorityIcon priority={t.priority} />
                    <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                    <span className={cn("text-xs", t.dueDate && isPast(new Date(t.dueDate)) ? "text-danger" : "text-muted-foreground")}>{relativeDay(t.dueDate)}</span>
                    <Assignee id={t.assigneeId} size="xs" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-0.5">
            <PropRow label="Account manager"><InlineSelect value={client.accountManagerId} onSave={(v) => u({ accountManagerId: v })} options={memberOptions} ariaLabel="Account manager" /></PropRow>
            <PropRow label="Package">
              <InlineSelect
                value={client.packageId}
                onSave={(v) => u({ packageId: v, retainer: packages.find((p) => p.id === v)?.price ?? client.retainer })}
                options={packages.map((p) => ({ value: p.id, label: p.name }))}
                ariaLabel="Package"
              />
            </PropRow>
            {canBilling && (
              <PropRow label="Retainer / mo"><InlineNumber value={client.retainer} onSave={(v) => u({ retainer: v })} format={(n) => money(n)} ariaLabel="Retainer" disabled={!canEdit} /></PropRow>
            )}
            <PropRow label="Health"><InlineSelect value={client.health} onSave={(v) => u({ health: v as Client["health"] })} options={healthOptions} ariaLabel="Health" /></PropRow>
            <PropRow label="Contract start"><InlineDate value={client.contractStart} onSave={(v) => v && u({ contractStart: v })} ariaLabel="Contract start" display={(v) => format(new Date(v), "d MMM yyyy")} /></PropRow>
            <PropRow label="Renewal">
              <InlineDate value={client.contractEnd} onSave={(v) => v && u({ contractEnd: v })} ariaLabel="Contract end" display={(v) => <span className={cn(renewalSoon && "font-medium text-warning")}>{format(new Date(v), "d MMM yyyy")}</span>} />
            </PropRow>
            <PropRow label="Niche"><InlineSelect value={client.niche} onSave={(v) => u({ niche: v })} options={toOptions(Array.from(new Set([...niches, client.niche].filter(Boolean))))} ariaLabel="Niche" /></PropRow>
            <PropRow label="ESP"><InlineSelect value={client.esp} onSave={(v) => u({ esp: v })} options={toOptions(esps)} ariaLabel="ESP" /></PropRow>
            <PropRow label="Store URL"><InlineText value={client.domain} onSave={(v) => u({ domain: v.replace(/^https?:\/\//, "") })} ariaLabel="Store URL" /></PropRow>
            <PropRow label="List size"><InlineNumber value={client.listSize} onSave={(v) => u({ listSize: v })} format={(n) => num(n)} ariaLabel="List size" /></PropRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            {canEdit && (
              <Button variant="ghost" size="icon-sm" aria-label="Add contact" onClick={() => setEditContact({ id: uid("ct"), name: "", role: "", email: "" })}>
                <Plus />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1 px-2 pb-2">
            {client.contacts.length === 0 && <p className="px-2 pb-2 text-sm text-muted-foreground">No contacts yet.</p>}
            {client.contacts.map((ct) => (
              <div key={ct.id} className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent/60">
                <span className="mt-0.5 grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {ct.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {ct.name} {ct.primary && <Star className="size-3 fill-warning text-warning" aria-label="Primary contact" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{ct.role}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    <a href={`mailto:${ct.email}`} className="inline-flex items-center gap-1 text-primary hover:underline"><Mail className="size-3" />{ct.email}</a>
                    {ct.phone && <a href={`tel:${ct.phone}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><Phone className="size-3" />{ct.phone}</a>}
                  </div>
                </div>
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${ct.name}`} className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditContact(ct)}><User /> Edit</DropdownMenuItem>
                      <DropdownMenuItem destructive onSelect={() => removeContact(client.id, ct.id)}><Trash2 /> Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ContactDialog clientId={client.id} contact={editContact} onClose={() => setEditContact(null)} />
    </div>
  );
}

function ContactDialog({ clientId, contact, onClose }: { clientId: string; contact: Contact | null; onClose: () => void }) {
  const upsert = useData((s) => s.upsertContact);
  const [f, setF] = useState<Contact | null>(contact);
  if (contact && f?.id !== contact.id) setF(contact);
  return (
    <Dialog open={!!contact} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={contact?.name ? "Edit contact" : "Add contact"}>
        {f && (
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              upsert(clientId, f);
              onClose();
              toast.success("Contact saved");
            }}
          >
            <Field label="Name"><Input required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Role"><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="accent-[hsl(var(--primary))]" checked={!!f.primary} onChange={(e) => setF({ ...f, primary: e.target.checked })} /> Primary contact
            </label>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save contact</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Brand kit ---------------- */
function ListEditor({ items, onChange, placeholder, tone }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; tone: "do" | "dont" }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="group flex items-start gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent/60">
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "do" ? "bg-success" : "bg-danger")} />
            <span className="flex-1">{it}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${it}`} className="rounded-sm p-0.5 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100">
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onChange([...items, draft.trim()]);
          setDraft("");
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-7" />
      </form>
    </div>
  );
}

function BrandKit({ client }: { client: Client }) {
  const updateClient = useData((s) => s.updateClient);
  const bk = client.brandKit;
  const set = (p: Partial<Client["brandKit"]>) => updateClient(client.id, { brandKit: { ...bk, ...p } });
  const [newColor, setNewColor] = useState({ name: "", hex: "#4f46e5" });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="grid h-28 flex-1 place-items-center rounded-md border bg-subtle">
            <CompanyLogo name={client.name} color={client.color} size="xl" />
          </div>
          <div className="grid h-28 flex-1 place-items-center rounded-md border" style={{ background: client.color }}>
            <span className="text-lg font-semibold tracking-tight text-white">{client.name}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Typography</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          <PropRow label="Headings"><InlineText value={bk.headingFont} onSave={(v) => set({ headingFont: v })} placeholder="e.g. Canela" ariaLabel="Heading font" /></PropRow>
          <PropRow label="Body"><InlineText value={bk.bodyFont} onSave={(v) => set({ bodyFont: v })} placeholder="e.g. Inter" ariaLabel="Body font" /></PropRow>
          <div className="mt-3 rounded-md border bg-subtle p-4">
            <p className="text-xl font-semibold" style={{ fontFamily: `${bk.headingFont}, Georgia, serif` }}>The new collection is here</p>
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: `${bk.bodyFont}, system-ui` }}>Thoughtfully made pieces for everyday wear — shop the edit before it's gone.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Colours</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bk.colors.map((c, i) => (
              <div key={i} className="group overflow-hidden rounded-md border">
                <div className="relative h-16" style={{ background: c.hex }}>
                  <button onClick={() => set({ colors: bk.colors.filter((_, j) => j !== i) })} aria-label={`Remove ${c.name}`} className="absolute right-1 top-1 rounded-sm bg-black/30 p-0.5 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
                    <X className="size-3" />
                  </button>
                </div>
                <button
                  className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs transition hover:bg-accent"
                  onClick={() => { navigator.clipboard?.writeText(c.hex); toast.success(`Copied ${c.hex}`); }}
                  title="Copy hex"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono uppercase text-muted-foreground">{c.hex}</span>
                </button>
              </div>
            ))}
            <Popover>
              <PopoverTrigger className="grid h-[94px] place-items-center rounded-md border border-dashed text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
                <span className="flex items-center gap-1"><Plus className="size-4" /> Add colour</span>
              </PopoverTrigger>
              <PopoverContent className="w-60 space-y-2">
                <Input placeholder="Name" value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} aria-label="Colour name" />
                <div className="flex gap-2">
                  <input type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="h-8 w-10 cursor-pointer rounded-sm border bg-transparent" aria-label="Pick colour" />
                  <Input value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} aria-label="Hex value" className="font-mono" />
                </div>
                <Button size="sm" className="w-full" onClick={() => { set({ colors: [...bk.colors, { name: newColor.name || "Colour", hex: newColor.hex }] }); setNewColor({ name: "", hex: "#4f46e5" }); }}>
                  Add
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tone of voice</CardTitle></CardHeader>
        <CardContent>
          <InlineText multiline value={bk.tone} onSave={(v) => set({ tone: v })} placeholder="Describe how the brand sounds…" ariaLabel="Tone of voice" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Do's</CardTitle></CardHeader>
        <CardContent><ListEditor tone="do" items={bk.dos} onChange={(v) => set({ dos: v })} placeholder="Add a do and press Enter" /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Don'ts</CardTitle></CardHeader>
        <CardContent><ListEditor tone="dont" items={bk.donts} onChange={(v) => set({ donts: v })} placeholder="Add a don't and press Enter" /></CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Campaigns ---------------- */
function ClientCampaigns({ client }: { client: Client }) {
  const all = useData((s) => s.campaigns);
  const campaigns = all.filter((c) => c.clientId === client.id).sort((a, b) => b.sendAt.localeCompare(a.sendAt));
  const { openCampaign, openNewCampaign } = useUI();
  if (!campaigns.length)
    return (
      <Card>
        <EmptyState icon={CalendarDays} title="No campaigns yet" description={`Plan the first campaign for ${client.name}.`} action={<Button size="sm" onClick={() => openNewCampaign({ clientId: client.id })}><Plus /> New campaign</Button>} />
      </Card>
    );
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-subtle text-xs text-muted-foreground">
            <tr>
              {["Campaign", "Send date", "Segment", "Status", "Open rate", "Revenue", "Owner"].map((h, i) => (
                <th key={h} scope="col" className={cn("h-9 px-3 font-medium", i >= 4 && i <= 5 ? "text-right" : "text-left", i === 0 && "pl-4")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} onClick={() => openCampaign(c.id)} className="cursor-pointer border-t transition hover:bg-accent/50">
                <td className="px-3 py-2.5 pl-4">
                  <button className="text-left font-medium focus-visible:underline focus-visible:outline-none" onClick={(e) => { e.stopPropagation(); openCampaign(c.id); }}>{c.name}</button>
                  <p className="max-w-[320px] truncate text-xs text-muted-foreground">{c.subject}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{format(new Date(c.sendAt), "EEE d MMM, HH:mm")}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{c.segment}</td>
                <td className="px-3 py-2.5"><CampaignStatusBadge status={c.status} /></td>
                <td className="px-3 py-2.5 text-right tabular">{c.metrics ? pct(c.metrics.openRate) : "—"}</td>
                <td className="px-3 py-2.5 text-right tabular">{c.metrics ? money(c.metrics.revenue) : "—"}</td>
                <td className="px-3 py-2.5"><Assignee id={c.assigneeId} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------------- Flows ---------------- */
const flowDescriptions: Record<string, string> = {
  "Welcome series": "Triggered on newsletter sign-up. Introduces the brand and drives the first order.",
  "Abandoned cart": "Recovers checkouts started but not completed.",
  "Browse abandonment": "Follows up on product views without add-to-cart.",
  "Post-purchase": "Thank-you, cross-sell and review requests after an order.",
  "Win-back": "Re-engages customers who haven't purchased in 120+ days.",
};

function Flows({ client }: { client: Client }) {
  const updateFlow = useData((s) => s.updateFlow);
  const live = client.flows.filter((f) => f.status === "live");
  const total = live.reduce((a, f) => a + f.revenue30d, 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card px-4 py-3 shadow-soft">
        <div><p className="text-xs text-muted-foreground">Flows live</p><p className="text-lg font-semibold tabular">{live.length} / {client.flows.length}</p></div>
        <div><p className="text-xs text-muted-foreground">Flow revenue (30d)</p><p className="text-lg font-semibold tabular">{money(total)}</p></div>
        <div className="min-w-[160px] flex-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {client.flows.map((f) => (
              <div key={f.id} className={cn("h-full border-r-2 border-card last:border-r-0", f.status === "live" ? "bg-success" : f.status === "in_progress" ? "bg-primary" : "bg-transparent")} style={{ width: `${100 / client.flows.length}%` }} />
            ))}
          </div>
          <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-success" /> Live</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" /> In progress</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-muted-foreground/30" /> Not built</span>
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {client.flows.map((f) => (
          <Card key={f.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={cn("grid size-8 place-items-center rounded-md border", f.status === "live" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                  <Zap className="size-4" />
                </span>
                <p className="font-semibold">{f.type}</p>
              </div>
              <FlowStatusBadge status={f.status} />
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{flowDescriptions[f.type]}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
              <div><p className="text-muted-foreground">Emails</p><p className="mt-0.5 text-sm font-medium tabular">{f.emails || "—"}</p></div>
              <div><p className="text-muted-foreground">Conv. rate</p><p className="mt-0.5 text-sm font-medium tabular">{f.conversionRate ? pct(f.conversionRate) : "—"}</p></div>
              <div><p className="text-muted-foreground">Revenue 30d</p><p className="mt-0.5 text-sm font-medium tabular">{f.revenue30d ? money(f.revenue30d, { compact: true }) : "—"}</p></div>
            </div>
            <div className="mt-3">
              <InlineSelect
                value={f.status}
                ariaLabel={`${f.type} status`}
                onSave={(v) => {
                  const status = v as FlowStatus;
                  updateFlow(client.id, f.id, {
                    status,
                    emails: status === "not_built" ? 0 : f.emails || 3,
                    revenue30d: status === "live" ? f.revenue30d || Math.round(client.listSize * 0.04) : 0,
                    conversionRate: status === "live" ? f.conversionRate || 2.4 : 0,
                  });
                  toast.success(`${f.type} → ${flowStatusLabel[status]}`);
                }}
                options={(["live", "in_progress", "not_built"] as FlowStatus[]).map((s) => ({ value: s, label: `Set ${flowStatusLabel[s].toLowerCase()}` }))}
                className="border"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Reports ---------------- */
function ClientReports({ client }: { client: Client }) {
  const [range, setRange] = useState<Range>("1");
  const [bar, setBar] = useState<"revenue" | "openRate" | "clickRate">("revenue");
  return (
    <div>
      <div className="no-print mb-3 flex justify-end">
        <Button variant="secondary" onClick={() => exportReportPdf(`${client.name} — ${format(new Date(), "MMMM yyyy")} report`)}>
          <FileText /> Export as PDF
        </Button>
      </div>
      <div id="print-root">
        <ReportView clientIds={[client.id]} range={range} onRangeChange={setRange} barMetric={bar} onBarMetricChange={setBar} printTitle={`${client.name} · Email marketing report`} />
      </div>
    </div>
  );
}

/* ---------------- Files ---------------- */
const fileIcon = (k: FileAsset["kind"]) => (k === "image" ? FileImage : k === "pdf" || k === "doc" ? FileText : k === "figma" ? Palette : File);

function FilesTab({ client }: { client: Client }) {
  const { addFile, removeFile, team } = useData();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const kind: FileAsset["kind"] = f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : /word|text/.test(f.type) ? "doc" : "other";
      addFile(client.id, { name: f.name, kind, size: f.size, url: kind === "image" && f.size < 400_000 ? URL.createObjectURL(f) : undefined });
    });
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition", drag ? "border-primary bg-primary/5" : "bg-subtle")}
      >
        <Upload className="mb-2 size-5 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Brand guidelines, product shots, logos — up to 25 MB each</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={() => input.current?.click()}>Browse files</Button>
        <input ref={input} type="file" multiple hidden onChange={(e) => handle(e.target.files)} />
      </div>
      {client.files.length === 0 ? (
        <EmptyState compact icon={Files} title="No files yet" description="Upload brand assets so the whole team works from the same source." />
      ) : (
        <Card className="divide-y overflow-hidden">
          {client.files.map((f) => {
            const Icon = fileIcon(f.kind);
            const by = team.find((m) => m.id === f.uploadedBy);
            return (
              <div key={f.id} className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-accent/50">
                {f.url && f.kind === "image" ? (
                  <img src={f.url} alt="" className="size-8 rounded-sm border object-cover" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-sm border bg-subtle text-muted-foreground"><Icon className="size-4" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.kind === "figma" ? "Figma link" : fileSize(f.size)} · {by?.name.split(" ")[0]} · {timeAgo(f.uploadedAt)}</p>
                </div>
                {f.url && (
                  <Button variant="ghost" size="icon-sm" asChild><a href={f.url} target="_blank" rel="noreferrer" aria-label={`Open ${f.name}`}><ExternalLink /></a></Button>
                )}
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${f.name}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => { removeFile(client.id, f.id); toast("File removed", { description: f.name }); }}>
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ---------------- Activity ---------------- */
function ActivityTab({ client }: { client: Client }) {
  const { activities, team, campaigns } = useData();
  const openCampaign = useUI((s) => s.openCampaign);
  const ids = new Set(campaigns.filter((c) => c.clientId === client.id).map((c) => c.id));
  const list = activities.filter((a) => a.clientId === client.id || ids.has(a.entityId));
  if (!list.length) return <Card><EmptyState icon={ActivityIcon} title="No activity yet" description="Changes to campaigns, flows and files for this client show up here." /></Card>;
  return (
    <Card className="p-5">
      <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
        {list.map((a) => {
          const m = team.find((x) => x.id === a.actorId);
          return (
            <li key={a.id} className="relative flex gap-3">
              <MemberAvatar member={m} size="md" />
              <div className="pt-1 text-sm">
                <span className="font-medium">{m?.name}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
                {a.entityType === "campaign" && ids.has(a.entityId) ? (
                  <button className="font-medium hover:underline" onClick={() => openCampaign(a.entityId)}>{a.entityName}</button>
                ) : (
                  <span className="font-medium">{a.entityName}</span>
                )}{" "}
                {a.detail && <span className="text-muted-foreground">{a.detail}</span>}
                <p className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "d MMM, HH:mm")} · {timeAgo(a.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <Badge variant="outline" className="mt-5">Client since {format(new Date(client.contractStart), "MMMM yyyy")}</Badge>
    </Card>
  );
}
