import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { useAuth } from "@/store/auth";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Kbd } from "@/components/ui/kbd";
import { priorityOptions, statusOptions, toOptions, useClientOptions, useMemberOptions } from "@/components/shared/options";
import type { CampaignStatus, Priority } from "@/data/types";
import { niches, platforms, segments } from "@/lib/constants";
import { modKey } from "@/lib/utils";

const dateInput = (d: Date) => format(d, "yyyy-MM-dd");

export function QuickAddTask() {
  const { quickTask, closeQuickTask } = useUI();
  const addTask = useData((s) => s.addTask);
  const campaigns = useData((s) => s.campaigns);
  const userId = useAuth((s) => s.userId)!;
  const memberOptions = useMemberOptions();
  const clientOptions = useClientOptions(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState(dateInput(new Date()));
  const [assignee, setAssignee] = useState(userId);
  const [clientId, setClientId] = useState("none");
  const [campaignId, setCampaignId] = useState("none");

  useEffect(() => {
    if (quickTask.open) {
      setTitle("");
      setPriority("medium");
      setDue(dateInput(new Date()));
      setAssignee(userId);
      setClientId(quickTask.clientId ?? "none");
      setCampaignId(quickTask.campaignId ?? "none");
    }
  }, [quickTask.open, quickTask.clientId, quickTask.campaignId, userId]);

  const campaignOptions = [
    { value: "none", label: <span className="text-muted-foreground">No campaign</span> },
    ...campaigns.filter((c) => clientId === "none" || c.clientId === clientId).filter((c) => c.status !== "sent").map((c) => ({ value: c.id, label: c.name })),
  ];

  const submit = (keepOpen = false) => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      priority,
      dueDate: due ? new Date(`${due}T17:00`).toISOString() : null,
      assigneeId: assignee,
      clientId: clientId === "none" ? undefined : clientId,
      campaignId: campaignId === "none" ? undefined : campaignId,
    });
    toast.success("Task created", { description: title.trim() });
    if (keepOpen) setTitle("");
    else closeQuickTask();
  };

  return (
    <Dialog open={quickTask.open} onOpenChange={(o) => !o && closeQuickTask()}>
      <DialogContent title="New task" hideClose className="max-w-xl p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit(true);
            }
          }}
        >
          <div className="px-4 pt-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">New task</p>
            <input
              autoFocus
              aria-label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-transparent py-1 text-lg font-medium outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2">
            <Select variant="ghost" ariaLabel="Priority" value={priority} onValueChange={(v) => setPriority(v as Priority)} options={priorityOptions} triggerClassName="border h-7" />
            <input
              type="date"
              aria-label="Due date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="h-7 rounded-sm border bg-transparent px-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60"
            />
            <Select variant="ghost" ariaLabel="Assignee" value={assignee} onValueChange={setAssignee} options={memberOptions} triggerClassName="border h-7" />
            <Select
              variant="ghost"
              ariaLabel="Client"
              value={clientId}
              onValueChange={(v) => {
                setClientId(v);
                setCampaignId("none");
              }}
              options={clientOptions}
              triggerClassName="border h-7"
            />
            <Select variant="ghost" ariaLabel="Campaign" value={campaignId} onValueChange={setCampaignId} options={campaignOptions} triggerClassName="border h-7 max-w-[200px]" />
          </div>
          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Kbd>{modKey}</Kbd>
              <Kbd>↵</Kbd> create & add another
            </span>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="ghost" onClick={closeQuickTask}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Create task <Kbd className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">↵</Kbd>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewLeadDialog() {
  const { newLeadOpen, setNewLeadOpen, openLead } = useUI();
  const addLead = useData((s) => s.addLead);
  const stages = useData((s) => s.stages);
  const [f, setF] = useState({ company: "", domain: "", contactName: "", contactEmail: "", value: "2000", niche: "Fashion", platform: "Shopify Plus", stageId: "" });
  useEffect(() => {
    if (newLeadOpen) setF({ company: "", domain: "", contactName: "", contactEmail: "", value: "2000", niche: "Fashion", platform: "Shopify Plus", stageId: stages[0]?.id ?? "" });
  }, [newLeadOpen, stages]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
      <DialogContent title="Add lead" description="Add a prospect to the sales pipeline.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.company.trim()) return;
            const lead = addLead({ ...f, company: f.company.trim(), domain: f.domain.replace(/^https?:\/\//, "").replace(/\/$/, ""), value: Number(f.value) || 0 });
            setNewLeadOpen(false);
            toast.success("Lead added", { description: lead.company, action: { label: "Open", onClick: () => openLead(lead.id) } });
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Field label="Company" className="sm:col-span-2">
            <Input autoFocus required value={f.company} onChange={set("company")} placeholder="e.g. Saltwater Swim" />
          </Field>
          <Field label="Store URL">
            <Input value={f.domain} onChange={set("domain")} placeholder="store.com" />
          </Field>
          <Field label="Est. value / month">
            <Input inputMode="numeric" value={f.value} onChange={set("value")} />
          </Field>
          <Field label="Contact name">
            <Input value={f.contactName} onChange={set("contactName")} />
          </Field>
          <Field label="Contact email">
            <Input type="email" value={f.contactEmail} onChange={set("contactEmail")} />
          </Field>
          <Field label="Niche">
            <Select value={f.niche} onValueChange={(v) => setF({ ...f, niche: v })} options={toOptions(niches)} />
          </Field>
          <Field label="Platform">
            <Select value={f.platform} onValueChange={(v) => setF({ ...f, platform: v })} options={toOptions(platforms)} />
          </Field>
          <Field label="Stage" className="sm:col-span-2">
            <Select value={f.stageId} onValueChange={(v) => setF({ ...f, stageId: v })} options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setNewLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!f.company.trim()}>
              Add lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewCampaignDialog() {
  const { newCampaign, closeNewCampaign, openCampaign } = useUI();
  const addCampaign = useData((s) => s.addCampaign);
  const clients = useData((s) => s.clients);
  const userId = useAuth((s) => s.userId)!;
  const clientOptions = useClientOptions();
  const memberOptions = useMemberOptions();
  const [f, setF] = useState({ name: "", clientId: "", date: "", time: "10:00", segment: "Engaged 90d", assigneeId: userId, status: "idea" as CampaignStatus });

  useEffect(() => {
    if (newCampaign.open) {
      const d = newCampaign.date ? new Date(newCampaign.date) : new Date(Date.now() + 3 * 864e5);
      setF({ name: "", clientId: newCampaign.clientId ?? clients[0]?.id ?? "", date: dateInput(d), time: "10:00", segment: "Engaged 90d", assigneeId: userId, status: "idea" });
    }
  }, [newCampaign.open, newCampaign.date, newCampaign.clientId, clients, userId]);

  return (
    <Dialog open={newCampaign.open} onOpenChange={(o) => !o && closeNewCampaign()}>
      <DialogContent title="New campaign" description="Plan a campaign — you can fill in copy and design later.">
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a client first to plan campaigns.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!f.name.trim() || !f.clientId) return;
              const c = addCampaign({
                name: f.name.trim(),
                clientId: f.clientId,
                sendAt: new Date(`${f.date}T${f.time}`).toISOString(),
                segment: f.segment,
                assigneeId: f.assigneeId,
                status: f.status,
              });
              closeNewCampaign();
              toast.success("Campaign created", { description: c.name, action: { label: "Open", onClick: () => openCampaign(c.id) } });
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Campaign name" className="sm:col-span-2">
              <Input autoFocus required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Black Friday early access" />
            </Field>
            <Field label="Client">
              <Select value={f.clientId} onValueChange={(v) => setF({ ...f, clientId: v })} options={clientOptions} />
            </Field>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as CampaignStatus })} options={statusOptions} />
            </Field>
            <Field label="Send date">
              <Input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </Field>
            <Field label="Send time">
              <Input type="time" required value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
            </Field>
            <Field label="Segment">
              <Select value={f.segment} onValueChange={(v) => setF({ ...f, segment: v })} options={toOptions(segments)} />
            </Field>
            <Field label="Assignee">
              <Select value={f.assigneeId} onValueChange={(v) => setF({ ...f, assigneeId: v })} options={memberOptions} />
            </Field>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={closeNewCampaign}>
                Cancel
              </Button>
              <Button type="submit" disabled={!f.name.trim()}>
                Create campaign
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NewClientDialog() {
  const { newClientOpen, setNewClientOpen } = useUI();
  const addClient = useData((s) => s.addClient);
  const packages = useData((s) => s.packages);
  const memberOptions = useMemberOptions();
  const userId = useAuth((s) => s.userId)!;
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", domain: "", niche: "Fashion", packageId: "", accountManagerId: userId });
  useEffect(() => {
    if (newClientOpen) setF({ name: "", domain: "", niche: "Fashion", packageId: packages[0]?.id ?? "", accountManagerId: userId });
  }, [newClientOpen, packages, userId]);

  return (
    <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
      <DialogContent title="Add client" description="Create a client workspace with flows, brand kit and reporting.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.name.trim()) return;
            const pkg = packages.find((p) => p.id === f.packageId);
            const c = addClient({ ...f, name: f.name.trim(), retainer: pkg?.price ?? 0 });
            setNewClientOpen(false);
            toast.success("Client added", { description: c.name });
            navigate(`/clients/${c.id}`);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Field label="Brand name" className="sm:col-span-2">
            <Input autoFocus required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Noorde Studio" />
          </Field>
          <Field label="Store URL">
            <Input value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="brand.com" />
          </Field>
          <Field label="Niche">
            <Select value={f.niche} onValueChange={(v) => setF({ ...f, niche: v })} options={toOptions(niches)} />
          </Field>
          <Field label="Package">
            <Select value={f.packageId} onValueChange={(v) => setF({ ...f, packageId: v })} options={packages.map((p) => ({ value: p.id, label: `${p.name} · €${p.price.toLocaleString()}` }))} />
          </Field>
          <Field label="Account manager">
            <Select value={f.accountManagerId} onValueChange={(v) => setF({ ...f, accountManagerId: v })} options={memberOptions} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setNewClientOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!f.name.trim()}>
              Add client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
