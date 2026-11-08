import type { TeamMember } from "@/data/types";
import { cn, initials } from "@/lib/utils";
import { useData } from "@/store/data";
import { Tooltip } from "@/components/ui/tooltip";

const sizes = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-7 text-[11px]", lg: "size-9 text-xs", xl: "size-14 text-base" };

export function MemberAvatar({ member, size = "sm", className, tooltip = true }: { member?: TeamMember; size?: keyof typeof sizes; className?: string; tooltip?: boolean }) {
  const el = (
    <span
      role="img"
      aria-label={member?.name ?? "Unassigned"}
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-full font-semibold ring-2 ring-background",
        !member && "border border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground",
        sizes[size],
        className,
      )}
      style={member ? { background: `hsl(${member.color} 70% 92%)`, color: `hsl(${member.color} 55% 32%)` } : undefined}
    >
      {member ? initials(member.name) : "?"}
    </span>
  );
  if (!tooltip) return el;
  return <Tooltip content={member?.name ?? "Unassigned"}>{el}</Tooltip>;
}

export function Assignee({ id, size = "sm", tooltip }: { id?: string; size?: keyof typeof sizes; tooltip?: boolean }) {
  const m = useData((s) => s.team.find((x) => x.id === id));
  return <MemberAvatar member={m} size={size} tooltip={tooltip} />;
}

export function AvatarStack({ ids, size = "sm" }: { ids: string[]; size?: keyof typeof sizes }) {
  return (
    <div className="flex -space-x-1.5">
      {ids.map((id) => (
        <Assignee key={id} id={id} size={size} />
      ))}
    </div>
  );
}
