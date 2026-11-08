export type Role = "admin" | "account_manager" | "copywriter" | "designer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  color: string; // avatar hue
  capacity: number; // hours per week
}

export interface Package {
  id: string;
  name: string;
  price: number;
  campaignsPerMonth: number;
  description: string;
  features: string[];
}

export type StageKind = "open" | "won" | "lost";
export interface PipelineStage {
  id: string;
  name: string;
  kind: StageKind;
  probability: number; // 0..1
}

export interface Note {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  company: string;
  domain: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  stageId: string;
  value: number; // estimated monthly deal value
  ownerId: string;
  stageEnteredAt: string;
  createdAt: string;
  platform: string;
  niche: string;
  estRevenue: number; // annual store revenue
  currentEsp: string;
  nextFollowUp: string | null;
  source: string;
  notes: Note[];
  convertedClientId?: string;
}

export type Health = "good" | "attention" | "at_risk";

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  primary?: boolean;
}

export interface BrandKit {
  colors: { name: string; hex: string }[];
  headingFont: string;
  bodyFont: string;
  tone: string;
  dos: string[];
  donts: string[];
}

export type FlowType = "Welcome series" | "Abandoned cart" | "Browse abandonment" | "Post-purchase" | "Win-back";
export type FlowStatus = "live" | "in_progress" | "not_built";
export interface Flow {
  id: string;
  type: FlowType;
  status: FlowStatus;
  emails: number;
  revenue30d: number;
  conversionRate: number;
}

export interface FileAsset {
  id: string;
  name: string;
  kind: "image" | "pdf" | "doc" | "figma" | "other";
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface Client {
  id: string;
  name: string;
  domain: string;
  color: string;
  niche: string;
  packageId: string;
  retainer: number;
  accountManagerId: string;
  health: Health;
  contractStart: string;
  contractEnd: string;
  listSize: number;
  esp: string;
  notes: string;
  contacts: Contact[];
  brandKit: BrandKit;
  flows: Flow[];
  files: FileAsset[];
  createdAt: string;
}

export type CampaignStatus = "idea" | "copywriting" | "design" | "client_review" | "approved" | "scheduled" | "sent";
export type ApprovalStatus = "not_requested" | "pending" | "approved" | "changes_requested";

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface CampaignMetrics {
  recipients: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  unsubRate: number;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  subject: string;
  previewText: string;
  sendAt: string;
  segment: string;
  assigneeId: string;
  status: CampaignStatus;
  copy: string;
  designUrl: string;
  checklist: { links: boolean; mobile: boolean; utm: boolean; spam: boolean };
  approval: ApprovalStatus;
  comments: Comment[];
  metrics?: CampaignMetrics;
  createdAt: string;
}

export type Priority = "urgent" | "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  dueDate: string | null;
  assigneeId: string;
  clientId?: string;
  campaignId?: string;
  createdAt: string;
  completedAt?: string;
}

export type EntityType = "lead" | "client" | "campaign" | "task" | "flow" | "file";

export interface Activity {
  id: string;
  actorId: string;
  action: string; // e.g. "moved", "created"
  entityType: EntityType;
  entityId: string;
  entityName: string;
  detail?: string;
  clientId?: string;
  leadId?: string;
  createdAt: string;
}

export interface MonthlyMetric {
  clientId: string;
  month: string; // yyyy-MM
  emailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number; // email attributed
  listSize: number;
  unsubRate: number;
}

export interface AgencyProfile {
  name: string;
  website: string;
  email: string;
  currency: "EUR" | "USD" | "GBP";
  address: string;
}

export interface Integration {
  id: "klaviyo" | "shopify" | "slack" | "gcal";
  connected: boolean;
}
