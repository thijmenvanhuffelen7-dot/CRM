import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { useUI } from "@/store/ui";
import { PageSkeleton } from "@/components/shared/Skeletons";
import Login from "@/pages/Login";
import { setCurrency } from "@/lib/utils";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leads = lazy(() => import("@/pages/Leads"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Campaigns = lazy(() => import("@/pages/Campaigns"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Reports = lazy(() => import("@/pages/Reports"));
const Team = lazy(() => import("@/pages/Team"));
const Settings = lazy(() => import("@/pages/Settings"));

function Protected() {
  const userId = useAuth((s) => s.userId);
  const exists = useData((s) => s.team.some((m) => m.id === userId));
  if (!userId || !exists) return <Login />;
  return <AppShell />;
}

export default function App() {
  const theme = useUI((s) => s.theme);
  const currency = useData((s) => s.agency.currency);
  setCurrency(currency);
  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={150}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="reports" element={<Reports />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster
        theme={theme}
        position="bottom-right"
        offset={16}
        toastOptions={{ classNames: { toast: "!rounded-md !border !border-border !bg-popover !text-popover-foreground !shadow-pop !text-sm", description: "!text-muted-foreground" } }}
      />
    </TooltipProvider>
  );
}
