import { useLocation, Link } from "react-router-dom";
import { CalendarPlus, CheckSquare, ChevronRight, LogOut, Moon, Plus, Search, Sun, Target, UserPlus } from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { modKey } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { useAuth } from "@/store/auth";
import { MemberAvatar } from "@/components/shared/Avatar";
import { useCan, useCurrentUser } from "@/hooks/usePermission";
import { nav } from "./nav";

function Crumbs() {
  const { pathname } = useLocation();
  const clients = useData((s) => s.clients);
  const parts = pathname.split("/").filter(Boolean);
  const root = nav.find((n) => n.to === `/${parts[0] ?? ""}`) ?? nav[0];
  const client = parts[0] === "clients" && parts[1] ? clients.find((c) => c.id === parts[1]) : undefined;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      <Link to={root.to} className="flex items-center gap-2 truncate font-medium text-muted-foreground transition hover:text-foreground">
        <root.icon className="size-4" />
        {root.label}
      </Link>
      {client && (
        <>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span className="truncate font-medium">{client.name}</span>
        </>
      )}
    </nav>
  );
}

export function Topbar() {
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const { theme, toggleTheme, openQuickTask, setNewLeadOpen, openNewCampaign, setNewClientOpen } = useUI();
  const me = useCurrentUser();
  const signOut = useAuth((s) => s.signOut);
  const canLeads = useCan("leads.manage");
  const canClients = useCan("clients.manage");

  return (
    <header className="no-print sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:px-6">
      <div className="min-w-0 flex-1">
        <Crumbs />
      </div>

      <button
        onClick={() => setCommandOpen(true)}
        aria-label="Search or jump to…"
        className="group hidden h-8 w-72 items-center gap-2 rounded-sm border bg-subtle px-2.5 text-sm text-muted-foreground transition hover:border-foreground/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:flex lg:w-80"
      >
        <Search className="size-3.5" />
        <span>Search or jump to…</span>
        <span className="ml-auto flex gap-0.5">
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="flex flex-1 items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
          <Search />
        </Button>
        <DropdownMenu>
          <Tooltip content="Create new">
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 gap-1 px-2.5" aria-label="Create new">
                <Plus /> <span className="hidden sm:inline">New</span>
              </Button>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => openQuickTask()}>
              <CheckSquare /> Task <Kbd className="ml-auto">T</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openNewCampaign()}>
              <CalendarPlus /> Campaign <Kbd className="ml-auto">N</Kbd>
            </DropdownMenuItem>
            {canLeads && (
              <DropdownMenuItem onSelect={() => setNewLeadOpen(true)}>
                <Target /> Lead
              </DropdownMenuItem>
            )}
            {canClients && (
              <DropdownMenuItem onSelect={() => setNewClientOpen(true)}>
                <UserPlus /> Client
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"} shortcut={["Shift", "D"]}>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="hidden sm:inline-flex">
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 md:hidden" aria-label="Account menu">
            <MemberAvatar member={me} size="md" tooltip={false} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-foreground">
              <span className="block truncate text-sm font-medium">{me?.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{me?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
