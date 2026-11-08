import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Delta({ value, invert, className, suffix = "%" }: { value: number | null; invert?: boolean; className?: string; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular", good ? "text-success" : "text-danger", className)}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? "up" : "down"}</span>
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  invertDelta,
  deltaSuffix,
  hint,
  icon: Icon,
  className,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  invertDelta?: boolean;
  deltaSuffix?: string;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Card className={cn("p-0", onClick && "transition hover:border-foreground/15 hover:shadow-pop", className)}>
      <Comp onClick={onClick} className="block w-full rounded-lg p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="truncate">{label}</span>
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular">{value}</div>
        <div className="mt-1 flex h-4 items-center gap-1.5 text-xs text-muted-foreground">
          {delta !== undefined && <Delta value={delta} invert={invertDelta} suffix={deltaSuffix} />}
          {hint && <span className="truncate">{hint}</span>}
        </div>
      </Comp>
    </Card>
  );
}
