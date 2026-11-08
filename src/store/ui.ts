import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  commandOpen: boolean;
  setCommandOpen: (o: boolean) => void;
  quickTask: { open: boolean; clientId?: string; campaignId?: string };
  openQuickTask: (ctx?: { clientId?: string; campaignId?: string }) => void;
  closeQuickTask: () => void;
  leadId: string | null;
  openLead: (id: string | null) => void;
  campaignId: string | null;
  openCampaign: (id: string | null) => void;
  newLeadOpen: boolean;
  setNewLeadOpen: (o: boolean) => void;
  newCampaign: { open: boolean; date?: string; clientId?: string };
  openNewCampaign: (ctx?: { date?: string; clientId?: string }) => void;
  closeNewCampaign: () => void;
  newClientOpen: boolean;
  setNewClientOpen: (o: boolean) => void;
}

const applyTheme = (t: Theme) => {
  document.documentElement.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem("crm-theme", t);
  } catch {
    /* ignore */
  }
};

const initialTheme: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light";

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      theme: initialTheme,
      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
      commandOpen: false,
      setCommandOpen: (o) => set({ commandOpen: o }),
      quickTask: { open: false },
      openQuickTask: (ctx) => set({ quickTask: { open: true, ...ctx } }),
      closeQuickTask: () => set({ quickTask: { open: false } }),
      leadId: null,
      openLead: (id) => set({ leadId: id }),
      campaignId: null,
      openCampaign: (id) => set({ campaignId: id }),
      newLeadOpen: false,
      setNewLeadOpen: (o) => set({ newLeadOpen: o }),
      newCampaign: { open: false },
      openNewCampaign: (ctx) => set({ newCampaign: { open: true, ...ctx } }),
      closeNewCampaign: () => set({ newCampaign: { open: false } }),
      newClientOpen: false,
      setNewClientOpen: (o) => set({ newClientOpen: o }),
    }),
    { name: "crm-ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) },
  ),
);
