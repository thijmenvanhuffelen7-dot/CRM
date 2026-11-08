import { useAuth, roleCan, type Permission } from "@/store/auth";
import { useData } from "@/store/data";

export function useCurrentUser() {
  const id = useAuth((s) => s.userId);
  return useData((s) => s.team.find((m) => m.id === id));
}

export function useCan(p: Permission) {
  const me = useCurrentUser();
  return roleCan(me?.role, p);
}
