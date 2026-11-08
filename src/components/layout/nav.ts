import { BarChart3, CalendarDays, CheckSquare, Home, Settings, Target, Users, UsersRound } from "lucide-react";

export const nav = [
  { to: "/", label: "Dashboard", icon: Home, key: "D" },
  { to: "/leads", label: "Leads", icon: Target, key: "L" },
  { to: "/clients", label: "Clients", icon: Users, key: "C" },
  { to: "/campaigns", label: "Campaigns", icon: CalendarDays, key: "P" },
  { to: "/tasks", label: "Tasks", icon: CheckSquare, key: "T" },
  { to: "/reports", label: "Reports", icon: BarChart3, key: "R" },
  { to: "/team", label: "Team", icon: UsersRound, key: "M" },
  { to: "/settings", label: "Settings", icon: Settings, key: "S" },
] as const;
