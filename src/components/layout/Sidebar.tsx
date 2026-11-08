import { NavLink } from "react-router-dom";
import { ChevronsLeft, LogOut, Moon, Sun } from "lucide-react";
import { useUI } from "@/store/ui";
import { useData } from "@/store/data";
import { useAuth, roleLabels } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { MemberAvatar } from "@/components/shared/Avatar";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { useCurrentUser } from "@/hooks/usePermission";
import { nav } from "./nav";

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const { theme, toggleTheme } = useUI();
  const agency = useData((s) => s.agency);
  const clients = useData((s) => s.clients);
  const userId = useAuth((s) => s.userId);
  const openTasks = useData((s) => s.tasks.filter((t) => !t.done && t.assigneeId === userId).length);
  const me = useCurrentUser();
  const signOut = useAuth((s) => s.signOut);

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar print:!hidden transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[56px]" : "w-[232px]",
      )}
    >
      <div className={cn("flex h-12 items-center gap-2 px-3", collapsed && "justify-center px-0")}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-2 rounded-sm p-1 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
            <span className="grid size-6 shrink-0 place-items-center rounded-[6px] bg-primary text-[11px] font-bold text-primary-foreground">{agency.name[0]}</span>
            {!collapsed && <span className="truncate text-sm font-semibold">{agency.name}</span>}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel>{me?.email}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />} {theme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!collapsed && (
          <Tooltip content="Collapse sidebar" shortcut={["["]}>
            <button onClick={toggle} aria-label="Collapse sidebar" className="ml-auto rounded-sm p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
              <ChevronsLeft className="size-4" />
            </button>
          </Tooltip>
        )}
      </div>

      <nav className={cn("mt-1 flex flex-col gap-px px-2 py-1", collapsed && "items-center")}>
        {nav.map((item) => (
          <Tooltip key={item.to} content={item.label} shortcut={["G", item.key]} side="right" disabled={!collapsed}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex h-8 items-center gap-2.5 rounded-sm px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  isActive && "bg-accent text-foreground",
                  collapsed && "w-8 justify-center px-0",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.to === "/tasks" && openTasks > 0 && <span className="ml-auto text-xs tabular text-muted-foreground">{openTasks}</span>}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      {!collapsed && (
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground/80">Clients</p>
          {clients.map((c) => (
            <NavLink
              key={c.id}
              to={`/clients/${c.id}`}
              className={({ isActive }) =>
                cn(
                  "flex h-7 items-center gap-2 rounded-sm px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  isActive && "bg-accent text-foreground",
                )
              }
            >
              <CompanyLogo name={c.name} color={c.color} size="xs" className="!size-4 !rounded-[4px] !text-[7px]" />
              <span className="truncate">{c.name}</span>
            </NavLink>
          ))}
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      <div className={cn("flex items-center gap-2 border-t p-2", collapsed && "flex-col")}>
        <div className={cn("flex min-w-0 flex-1 items-center gap-2 px-1", collapsed && "justify-center px-0")}>
          <MemberAvatar member={me} size="md" tooltip={collapsed} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{me?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{me && roleLabels[me.role]}</p>
            </div>
          )}
        </div>
        <Tooltip content={theme === "dark" ? "Light mode" : "Dark mode"} shortcut={["Shift", "D"]}>
          <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-sm p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </Tooltip>
        {collapsed && (
          <Tooltip content="Expand sidebar" shortcut={["["]} side="right">
            <button onClick={toggle} aria-label="Expand sidebar" className="rounded-sm p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <ChevronsLeft className="size-4 rotate-180" />
            </button>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
