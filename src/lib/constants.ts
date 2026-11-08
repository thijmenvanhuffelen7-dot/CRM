import type { ApprovalStatus, CampaignStatus, FlowStatus, Health, Priority } from "@/data/types";

export const campaignStatuses: CampaignStatus[] = ["idea", "copywriting", "design", "client_review", "approved", "scheduled", "sent"];

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  idea: "Idea",
  copywriting: "Copywriting",
  design: "Design",
  client_review: "Client review",
  approved: "Approved",
  scheduled: "Scheduled",
  sent: "Sent",
};

/** Dot colour per status – kept deliberately muted; accent only for "in-flight" work. */
export const campaignStatusDot: Record<CampaignStatus, string> = {
  idea: "bg-zinc-400",
  copywriting: "bg-sky-500",
  design: "bg-violet-500",
  client_review: "bg-amber-500",
  approved: "bg-teal-500",
  scheduled: "bg-primary",
  sent: "bg-emerald-500",
};

export const approvalLabel: Record<ApprovalStatus, string> = {
  not_requested: "Not requested",
  pending: "Awaiting client",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export const priorities: Priority[] = ["urgent", "high", "medium", "low"];
export const priorityLabel: Record<Priority, string> = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
export const priorityColor: Record<Priority, string> = {
  urgent: "text-danger",
  high: "text-warning",
  medium: "text-sky-500",
  low: "text-muted-foreground",
};

export const healthLabel: Record<Health, string> = { good: "Healthy", attention: "Needs attention", at_risk: "At risk" };
export const healthDot: Record<Health, string> = { good: "bg-success", attention: "bg-warning", at_risk: "bg-danger" };

export const flowStatusLabel: Record<FlowStatus, string> = { live: "Live", in_progress: "In progress", not_built: "Not built" };

export const platforms = ["Shopify Plus", "Shopify", "WooCommerce", "BigCommerce", "Magento", "Other"];
export const esps = ["Klaviyo", "Mailchimp", "Omnisend", "Shopify Email", "Drip", "None"];
export const niches = ["Fashion", "Jewelry", "Sneakers", "Skincare", "Supplements", "Beauty", "Home", "Accessories", "Food & drink", "Other"];
export const segments = ["All subscribers", "Engaged 30d", "Engaged 90d", "VIP customers", "Repeat buyers", "Non-purchasers", "Lapsed 120d"];
