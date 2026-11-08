import { useData } from "@/store/data";
import type { Option } from "@/components/ui/select";
import { MemberAvatar } from "./Avatar";
import { CompanyLogo } from "./CompanyLogo";
import { Dot } from "@/components/ui/badge";
import { campaignStatusDot, campaignStatusLabel, campaignStatuses, healthDot, healthLabel, priorities, priorityLabel } from "@/lib/constants";
import { PriorityIcon } from "./badges";
import type { Health } from "@/data/types";

export function useMemberOptions(): Option[] {
  const team = useData((s) => s.team);
  return team.map((m) => ({ value: m.id, label: m.name, icon: <MemberAvatar member={m} size="xs" tooltip={false} /> }));
}

export function useClientOptions(withNone = false): Option[] {
  const clients = useData((s) => s.clients);
  const opts = clients.map((c) => ({ value: c.id, label: c.name, icon: <CompanyLogo name={c.name} color={c.color} size="xs" /> }));
  return withNone ? [{ value: "none", label: <span className="text-muted-foreground">No client</span> }, ...opts] : opts;
}

export const statusOptions: Option[] = campaignStatuses.map((s) => ({ value: s, label: campaignStatusLabel[s], icon: <Dot className={campaignStatusDot[s]} /> }));
export const priorityOptions: Option[] = priorities.map((p) => ({ value: p, label: priorityLabel[p], icon: <PriorityIcon priority={p} /> }));
export const healthOptions: Option[] = (["good", "attention", "at_risk"] as Health[]).map((h) => ({ value: h, label: healthLabel[h], icon: <Dot className={healthDot[h]} /> }));
export const toOptions = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));
