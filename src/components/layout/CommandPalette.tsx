import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import * as D from "@radix-ui/react-dialog";
import { CalendarPlus, CheckSquare, FileDown, LogOut, Moon, PanelLeft, Search, Sun, Target, UserPlus } from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { useAuth } from "@/store/auth";
import { Kbd } from "@/components/ui/kbd";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { CampaignStatusBadge } from "@/components/shared/badges";
import { Dot } from "@/components/ui/badge";
import { campaignStatusDot } from "@/lib/constants";
import { relativeDay } from "@/lib/utils";
import { nav } from "./nav";

const itemCls =
  "flex h-9 cursor-default select-none items-center gap-2.5 rounded-sm px-2 text-sm text-foreground/90 aria-selected:bg-accent aria-selected:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground";
const groupCls = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground";

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommandOpen);
  const ui = useUI();
  const navigate = useNavigate();
  const { clients, campaigns, leads, tasks, stages } = useData();
  const signOut = useAuth((s) => s.signOut);
  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const run = (fn: () => void) => {
    setOpen(false);
    // let the dialog close before opening another overlay
    setTimeout(fn, 10);
  };

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 dark:bg-black/60" />
        <D.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[14vh] z-[60] w-[calc(100vw-2rem)] max-w-[620px] -translate-x-1/2 overflow-hidden rounded-lg border bg-popover shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98]"
        >
          <D.Title className="sr-only">Command palette</D.Title>
          <Command loop className="flex flex-col">
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="size-4 text-muted-foreground" />
              <Command.Input autoFocus placeholder="Search clients, campaigns, leads, or type a command…" className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70" />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5 scrollbar-thin">
              <Command.Empty className="py-10 text-center text-sm text-muted-foreground">No results. Try a client or campaign name.</Command.Empty>

              <Command.Group heading="Actions" className={groupCls}>
                <Command.Item className={itemCls} onSelect={() => run(() => ui.openQuickTask())}>
                  <CheckSquare /> Create task <Kbd className="ml-auto">T</Kbd>
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(() => ui.openNewCampaign())}>
                  <CalendarPlus /> Create campaign <Kbd className="ml-auto">N</Kbd>
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(() => ui.setNewLeadOpen(true))}>
                  <Target /> Add lead
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(() => ui.setNewClientOpen(true))}>
                  <UserPlus /> Add client
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(ui.toggleTheme)} keywords={["dark", "light", "theme"]}>
                  {ui.theme === "dark" ? <Sun /> : <Moon />} Switch to {ui.theme === "dark" ? "light" : "dark"} mode
                  <span className="ml-auto flex gap-0.5"><Kbd>Shift</Kbd><Kbd>D</Kbd></span>
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(ui.toggleSidebar)}>
                  <PanelLeft /> Toggle sidebar <Kbd className="ml-auto">[</Kbd>
                </Command.Item>
                <Command.Item className={itemCls} onSelect={() => run(() => navigate("/reports"))} keywords={["pdf", "export"]}>
                  <FileDown /> Export monthly report
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Go to" className={groupCls}>
                {nav.map((n) => (
                  <Command.Item key={n.to} className={itemCls} value={`go ${n.label}`} onSelect={() => run(() => navigate(n.to))}>
                    <n.icon /> {n.label}
                    <span className="ml-auto flex gap-0.5">
                      <Kbd>G</Kbd>
                      <Kbd>{n.key}</Kbd>
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Clients" className={groupCls}>
                {clients.map((c) => (
                  <Command.Item key={c.id} value={`client ${c.name} ${c.domain} ${c.niche}`} className={itemCls} onSelect={() => run(() => navigate(`/clients/${c.id}`))}>
                    <CompanyLogo name={c.name} color={c.color} size="xs" />
                    {c.name}
                    <span className="ml-auto text-xs text-muted-foreground">{c.niche}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Campaigns" className={groupCls}>
                {campaigns
                  .slice()
                  .sort((a, b) => a.sendAt.localeCompare(b.sendAt))
                  .map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`campaign ${c.name} ${clientById[c.clientId]?.name} ${c.subject} ${c.id}`}
                      className={itemCls}
                      onSelect={() => run(() => {
                        navigate("/campaigns");
                        ui.openCampaign(c.id);
                      })}
                    >
                      <Dot className={campaignStatusDot[c.status]} />
                      <span className="truncate">{c.name}</span>
                      <span className="truncate text-muted-foreground">· {clientById[c.clientId]?.name}</span>
                      <span className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
                        <span className="text-xs text-muted-foreground">{relativeDay(c.sendAt)}</span>
                        <CampaignStatusBadge status={c.status} />
                      </span>
                    </Command.Item>
                  ))}
              </Command.Group>

              <Command.Group heading="Leads" className={groupCls}>
                {leads.map((l) => (
                  <Command.Item
                    key={l.id}
                    value={`lead ${l.company} ${l.contactName} ${l.domain}`}
                    className={itemCls}
                    onSelect={() => run(() => {
                      navigate("/leads");
                      ui.openLead(l.id);
                    })}
                  >
                    <CompanyLogo name={l.company} size="xs" />
                    {l.company}
                    <span className="ml-auto text-xs text-muted-foreground">{stages.find((s) => s.id === l.stageId)?.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Tasks" className={groupCls}>
                {tasks
                  .filter((t) => !t.done)
                  .map((t) => (
                    <Command.Item key={t.id} value={`task ${t.title} ${t.id}`} className={itemCls} onSelect={() => run(() => navigate(`/tasks?task=${t.id}`))}>
                      <CheckSquare />
                      <span className="truncate">{t.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeDay(t.dueDate)}</span>
                    </Command.Item>
                  ))}
              </Command.Group>

              <Command.Group heading="Account" className={groupCls}>
                <Command.Item className={itemCls} onSelect={() => run(signOut)}>
                  <LogOut /> Log out
                </Command.Item>
              </Command.Group>
            </Command.List>
            <div className="hidden items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
              <span className="ml-auto flex items-center gap-1"><Kbd>?</Kbd> all shortcuts</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
