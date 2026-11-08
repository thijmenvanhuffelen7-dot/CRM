import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { GlobalShortcuts } from "./Shortcuts";
import { NewCampaignDialog, NewClientDialog, NewLeadDialog, QuickAddTask } from "./CreateDialogs";
import { LeadDrawer } from "@/components/drawers/LeadDrawer";
import { CampaignDrawer } from "@/components/drawers/CampaignDrawer";

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <GlobalShortcuts />
      <QuickAddTask />
      <NewLeadDialog />
      <NewCampaignDialog />
      <NewClientDialog />
      <LeadDrawer />
      <CampaignDrawer />
    </div>
  );
}
