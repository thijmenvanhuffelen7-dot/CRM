import { AlertTriangle, ArrowDown, ArrowUp, Minus, SignalHigh } from "lucide-react";
import type { ApprovalStatus, CampaignStatus, FlowStatus, Health, Priority } from "@/data/types";
import { approvalLabel, campaignStatusDot, campaignStatusLabel, flowStatusLabel, healthDot, healthLabel, priorityColor, priorityLabel } from "@/lib/constants";
import { Badge, Dot } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CampaignStatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-foreground/80", className)}>
      <Dot className={campaignStatusDot[status]} />
      {campaignStatusLabel[status]}
    </Badge>
  );
}

export function HealthBadge({ health, className }: { health: Health; className?: string }) {
  return (
    <Badge variant={health === "good" ? "success" : health === "attention" ? "warning" : "danger"} className={className}>
      <Dot className={healthDot[health]} />
      {healthLabel[health]}
    </Badge>
  );
}

export function FlowStatusBadge({ status }: { status: FlowStatus }) {
  return (
    <Badge variant={status === "live" ? "success" : status === "in_progress" ? "primary" : "outline"}>
      <Dot className={status === "live" ? "bg-success" : status === "in_progress" ? "bg-primary" : "bg-muted-foreground/40"} />
      {flowStatusLabel[status]}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const v = status === "approved" ? "success" : status === "changes_requested" ? "danger" : status === "pending" ? "warning" : "outline";
  return <Badge variant={v}>{approvalLabel[status]}</Badge>;
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const Icon = priority === "urgent" ? AlertTriangle : priority === "high" ? ArrowUp : priority === "medium" ? SignalHigh : priority === "low" ? ArrowDown : Minus;
  return <Icon aria-label={`${priorityLabel[priority]} priority`} className={cn("size-3.5 shrink-0", priorityColor[priority], className)} />;
}
