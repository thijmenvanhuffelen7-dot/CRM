import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/data/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  userId: string | null;
  signIn: (userId: string) => void;
  signOut: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      signIn: (userId) => set({ userId }),
      signOut: () => {
        set({ userId: null });
        void supabase?.auth.signOut();
      },
    }),
    { name: "crm-auth" },
  ),
);

export type Permission =
  | "settings.manage"
  | "team.manage"
  | "billing.view"
  | "leads.manage"
  | "clients.manage"
  | "clients.delete"
  | "campaigns.approve"
  | "campaigns.edit"
  | "tasks.edit";

const matrix: Record<Role, Permission[]> = {
  admin: ["settings.manage", "team.manage", "billing.view", "leads.manage", "clients.manage", "clients.delete", "campaigns.approve", "campaigns.edit", "tasks.edit"],
  account_manager: ["billing.view", "leads.manage", "clients.manage", "campaigns.approve", "campaigns.edit", "tasks.edit"],
  copywriter: ["campaigns.edit", "tasks.edit"],
  designer: ["campaigns.edit", "tasks.edit"],
};

export const roleCan = (role: Role | undefined, p: Permission) => !!role && matrix[role].includes(p);

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  account_manager: "Account manager",
  copywriter: "Copywriter",
  designer: "Designer",
};

export const permissionLabels: Record<Permission, string> = {
  "settings.manage": "Manage workspace settings",
  "team.manage": "Invite & manage team",
  "billing.view": "View retainers & MRR",
  "leads.manage": "Manage sales pipeline",
  "clients.manage": "Edit clients",
  "clients.delete": "Delete clients",
  "campaigns.approve": "Mark campaigns approved",
  "campaigns.edit": "Edit campaigns",
  "tasks.edit": "Create & edit tasks",
};
export const allPermissions = Object.keys(permissionLabels) as Permission[];
