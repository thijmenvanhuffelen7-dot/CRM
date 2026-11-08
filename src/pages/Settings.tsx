import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Calendar, GripVertical, Lock, MessageSquare, Monitor, Moon, Package as PackageIcon, Plug, Plus, ShoppingBag, Sun, Trash2, Workflow, Zap } from "lucide-react";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { InlineNumber, InlineText, PropRow } from "@/components/shared/Inline";
import { useBoardSensors } from "@/components/shared/Kanban";
import { useCan } from "@/hooks/usePermission";
import { uid } from "@/lib/id";
import type { Integration, PipelineStage, StageKind } from "@/data/types";
import { cn, money, setCurrency } from "@/lib/utils";

const sections = [
  { id: "agency", label: "Agency profile", icon: Building2 },
  { id: "packages", label: "Packages & pricing", icon: PackageIcon },
  { id: "pipeline", label: "Pipeline stages", icon: Workflow },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "appearance", label: "Appearance", icon: Monitor },
];

export default function Settings() {
  const [params] = useSearchParams();
  const [section, setSection] = useState(params.get("section") ?? "agency");
  const canManage = useCan("settings.manage");

  return (
    <Page>
      <PageHeader title="Settings" description="Workspace configuration for the whole agency." />
      {!canManage && (
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-subtle px-3 py-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> Only admins can change workspace settings. You can still change your appearance.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              aria-current={section === s.id ? "page" : undefined}
              className={cn(
                "flex h-8 shrink-0 items-center gap-2 rounded-sm px-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                section === s.id && "bg-accent text-foreground",
              )}
            >
              <s.icon className="size-4" /> {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 animate-fade-in" key={section}>
          {section === "agency" && <AgencySection disabled={!canManage} />}
          {section === "packages" && <PackagesSection disabled={!canManage} />}
          {section === "pipeline" && <PipelineSection disabled={!canManage} />}
          {section === "integrations" && <IntegrationsSection disabled={!canManage} />}
          {section === "appearance" && <AppearanceSection />}
        </div>
      </div>
    </Page>
  );
}

function AgencySection({ disabled }: { disabled: boolean }) {
  const { agency, updateAgency } = useData();
  return (
    <Card>
      <CardHeader><CardTitle>Agency profile</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        <PropRow label="Name"><InlineText disabled={disabled} value={agency.name} onSave={(v) => v && updateAgency({ name: v })} ariaLabel="Agency name" /></PropRow>
        <PropRow label="Website"><InlineText disabled={disabled} value={agency.website} onSave={(v) => updateAgency({ website: v })} ariaLabel="Website" /></PropRow>
        <PropRow label="Email"><InlineText disabled={disabled} value={agency.email} onSave={(v) => updateAgency({ email: v })} ariaLabel="Email" /></PropRow>
        <PropRow label="Address"><InlineText disabled={disabled} value={agency.address} onSave={(v) => updateAgency({ address: v })} ariaLabel="Address" /></PropRow>
        <PropRow label="Currency">
          <div className="w-40">
            <Select
              value={agency.currency}
              onValueChange={(v) => {
                if (disabled) return;
                setCurrency(v);
                updateAgency({ currency: v as "EUR" });
              }}
              options={["EUR", "USD", "GBP"].map((c) => ({ value: c, label: c }))}
              ariaLabel="Currency"
            />
          </div>
        </PropRow>
      </CardContent>
    </Card>
  );
}

function PackagesSection({ disabled }: { disabled: boolean }) {
  const { packages, clients, upsertPackage, removePackage } = useData();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {packages.map((p) => {
          const count = clients.filter((c) => c.packageId === p.id).length;
          return (
            <Card key={p.id} className="flex flex-col p-4">
              <div className="flex items-center justify-between">
                <InlineText disabled={disabled} value={p.name} onSave={(v) => v && upsertPackage({ ...p, name: v })} ariaLabel="Package name" className="text-base font-semibold" />
                <Badge variant="outline" className="ml-2 shrink-0">{count} client{count === 1 ? "" : "s"}</Badge>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <div className="w-28 text-xl font-semibold"><InlineNumber disabled={disabled} value={p.price} onSave={(v) => upsertPackage({ ...p, price: v })} format={(n) => money(n)} ariaLabel="Price" /></div>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <InlineText disabled={disabled} multiline value={p.description} onSave={(v) => upsertPackage({ ...p, description: v })} ariaLabel="Description" className="text-muted-foreground" />
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Campaigns / mo</span>
                <div className="w-16"><InlineNumber disabled={disabled} value={p.campaignsPerMonth} onSave={(v) => upsertPackage({ ...p, campaignsPerMonth: v })} ariaLabel="Campaigns per month" /></div>
              </div>
              <ul className="mt-3 flex-1 space-y-1 border-t pt-3 text-sm">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><Zap className="size-3.5 text-primary" /> {f}</li>
                ))}
              </ul>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 self-start text-muted-foreground"
                  disabled={count > 0}
                  title={count > 0 ? "Move clients to another package first" : undefined}
                  onClick={() => { removePackage(p.id); toast(`${p.name} removed`); }}
                >
                  <Trash2 /> Remove
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      {!disabled && (
        <Button variant="secondary" onClick={() => upsertPackage({ id: uid("p"), name: "New package", price: 2000, campaignsPerMonth: 6, description: "Describe what's included.", features: ["Campaigns", "Flows", "Reporting"] })}>
          <Plus /> Add package
        </Button>
      )}
    </div>
  );
}

function SortableStage({ stage, onChange, onRemove, disabled, leadCount }: { stage: PipelineStage; onChange: (s: PipelineStage) => void; onRemove: () => void; disabled: boolean; leadCount: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-2 border-b bg-card px-3 py-2 last:border-b-0", isDragging && "relative z-10 shadow-pop")}>
      <button {...attributes} {...listeners} disabled={disabled} aria-label={`Reorder ${stage.name}`} className="cursor-grab rounded-sm p-1 text-muted-foreground hover:bg-accent disabled:cursor-default disabled:opacity-40">
        <GripVertical className="size-4" />
      </button>
      <span className={cn("size-2 rounded-full", stage.kind === "won" ? "bg-success" : stage.kind === "lost" ? "bg-muted-foreground/40" : "bg-primary")} />
      <div className="min-w-0 flex-1"><InlineText disabled={disabled} value={stage.name} onSave={(v) => v && onChange({ ...stage, name: v })} ariaLabel="Stage name" /></div>
      <div className="w-32">
        <Select
          variant="ghost"
          value={stage.kind}
          onValueChange={(v) => !disabled && onChange({ ...stage, kind: v as StageKind, probability: v === "won" ? 1 : v === "lost" ? 0 : stage.probability })}
          options={[{ value: "open", label: "Open" }, { value: "won", label: "Won" }, { value: "lost", label: "Lost" }]}
          ariaLabel="Stage type"
        />
      </div>
      <div className="w-16 text-right text-sm">
        <InlineNumber disabled={disabled || stage.kind !== "open"} value={Math.round(stage.probability * 100)} onSave={(v) => onChange({ ...stage, probability: Math.min(100, Math.max(0, v)) / 100 })} format={(n) => `${n}%`} ariaLabel="Win probability" className="justify-end" />
      </div>
      <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">{leadCount} leads</span>
      <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={disabled} aria-label={`Delete ${stage.name}`}><Trash2 /></Button>
    </li>
  );
}

function PipelineSection({ disabled }: { disabled: boolean }) {
  const { stages, leads, setStages } = useData();
  const sensors = useBoardSensors();
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = stages.findIndex((s) => s.id === e.active.id);
    const to = stages.findIndex((s) => s.id === e.over!.id);
    setStages(arrayMove(stages, from, to));
  };
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Pipeline stages</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Drag to reorder. Probability drives the weighted pipeline value.</p>
        </div>
        {!disabled && (
          <Button size="sm" variant="secondary" onClick={() => setStages([...stages.filter((s) => s.kind === "open"), { id: uid("s"), name: "New stage", kind: "open", probability: 0.3 }, ...stages.filter((s) => s.kind !== "open")])}>
            <Plus /> Add stage
          </Button>
        )}
      </CardHeader>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="border-t">
            {stages.map((s) => (
              <SortableStage
                key={s.id}
                stage={s}
                disabled={disabled}
                leadCount={leads.filter((l) => l.stageId === s.id).length}
                onChange={(n) => setStages(stages.map((x) => (x.id === s.id ? n : x)))}
                onRemove={() => {
                  if (stages.length <= 2) return toast.error("Keep at least two stages.");
                  const n = leads.filter((l) => l.stageId === s.id).length;
                  if (n && !window.confirm(`${n} leads will move to the first open stage. Continue?`)) return;
                  setStages(stages.filter((x) => x.id !== s.id));
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </Card>
  );
}

const integrationMeta: Record<Integration["id"], { name: string; desc: string; icon: typeof Zap; color: string }> = {
  klaviyo: { name: "Klaviyo", desc: "Sync campaign & flow metrics, lists and segments.", icon: Zap, color: "#111" },
  shopify: { name: "Shopify", desc: "Pull store revenue and orders to attribute email sales.", icon: ShoppingBag, color: "#5e8e3e" },
  slack: { name: "Slack", desc: "Post approvals, comments and send alerts to channels.", icon: MessageSquare, color: "#4a154b" },
  gcal: { name: "Google Calendar", desc: "Show scheduled sends and client calls on your calendar.", icon: Calendar, color: "#1a73e8" },
};

function IntegrationsSection({ disabled }: { disabled: boolean }) {
  const { integrations, toggleIntegration } = useData();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map((i) => {
          const m = integrationMeta[i.id];
          return (
            <Card key={i.id} className="flex items-start gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-md text-white" style={{ background: m.color }}>
                <m.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {m.name} {i.connected && <Badge variant="success">Connected</Badge>}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{m.desc}</p>
              </div>
              <Switch
                checked={i.connected}
                disabled={disabled}
                aria-label={`Connect ${m.name}`}
                onCheckedChange={() => {
                  toggleIntegration(i.id);
                  toast(i.connected ? `${m.name} disconnected` : `${m.name} connected`, { description: i.connected ? undefined : "Sync for this integration isn't built yet." });
                }}
              />
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Integrations are placeholders in this build. API connections will plug into the same toggles.</p>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useUI();
  return (
    <Card>
      <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid max-w-md grid-cols-2 gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={cn("overflow-hidden rounded-md border text-left transition hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", theme === t && "ring-2 ring-primary")}
            >
              <div className={cn("flex h-20 gap-1.5 p-2", t === "dark" ? "bg-[#0e0e12]" : "bg-[#f6f6f7]")}>
                <div className={cn("w-8 rounded-sm", t === "dark" ? "bg-[#18181d]" : "bg-white")} />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className={cn("h-3 w-2/3 rounded-sm", t === "dark" ? "bg-[#26262d]" : "bg-[#e4e4e7]")} />
                  <div className={cn("flex-1 rounded-sm", t === "dark" ? "bg-[#18181d]" : "bg-white")} />
                </div>
              </div>
              <p className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                {t === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />} {t === "light" ? "Light" : "Dark"}
              </p>
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>
            <span className="block font-medium">Collapsed sidebar</span>
            <span className="text-muted-foreground">Show icons only. Toggle anytime with [</span>
          </span>
          <Switch checked={sidebarCollapsed} onCheckedChange={toggleSidebar} />
        </label>
      </CardContent>
    </Card>
  );
}
