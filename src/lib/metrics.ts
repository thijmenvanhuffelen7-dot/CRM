import { endOfWeek, format, isWithinInterval, startOfWeek, subMonths } from "date-fns";
import type { Campaign, Client, MonthlyMetric } from "@/data/types";

export const monthKey = (d = new Date()) => format(d, "yyyy-MM");

export function thisWeek(d = new Date()) {
  return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) };
}

export const inWeek = (iso: string, d = new Date()) => isWithinInterval(new Date(iso), thisWeek(d));

export function aggregateMonth(metrics: MonthlyMetric[], month: string, clientIds?: string[]) {
  const rows = metrics.filter((m) => m.month === month && (!clientIds || clientIds.includes(m.clientId)));
  if (!rows.length) return null;
  const sent = rows.reduce((a, r) => a + r.emailsSent, 0);
  // weighted by volume so big lists count proportionally
  const w = (k: keyof MonthlyMetric) => rows.reduce((a, r) => a + (r[k] as number) * r.emailsSent, 0) / (sent || 1);
  const revenue = rows.reduce((a, r) => a + r.revenue, 0);
  return {
    month,
    emailsSent: sent,
    openRate: w("openRate"),
    clickRate: w("clickRate"),
    conversionRate: w("conversionRate"),
    unsubRate: w("unsubRate"),
    revenue,
    revenuePerEmail: revenue / (sent || 1),
    listSize: rows.reduce((a, r) => a + r.listSize, 0),
  };
}
export type Aggregate = NonNullable<ReturnType<typeof aggregateMonth>>;

export function series(metrics: MonthlyMetric[], months = 12, clientIds?: string[]) {
  const out: Aggregate[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const a = aggregateMonth(metrics, monthKey(subMonths(new Date(), i)), clientIds);
    if (a) out.push(a);
  }
  return out;
}

export function delta(cur: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export const mrr = (clients: Client[]) => clients.reduce((a, c) => a + c.retainer, 0);

export const sentCampaigns = (campaigns: Campaign[]) => campaigns.filter((c) => c.status === "sent" && c.metrics);

/** Aggregate N months ending `offset` months ago (offset 0 = current month). */
export function periodAggregate(metrics: MonthlyMetric[], months: number, offset = 0, clientIds?: string[]) {
  const ms: Aggregate[] = [];
  for (let i = offset + months - 1; i >= offset; i--) {
    const a = aggregateMonth(metrics, monthKey(subMonths(new Date(), i)), clientIds);
    if (a) ms.push(a);
  }
  if (!ms.length) return null;
  const sent = ms.reduce((a, m) => a + m.emailsSent, 0);
  const w = (k: "openRate" | "clickRate" | "conversionRate" | "unsubRate") => ms.reduce((a, m) => a + m[k] * m.emailsSent, 0) / (sent || 1);
  const revenue = ms.reduce((a, m) => a + m.revenue, 0);
  const before = aggregateMonth(metrics, monthKey(subMonths(new Date(), offset + months)), clientIds);
  const startList = before?.listSize ?? ms[0].listSize;
  const endList = ms[ms.length - 1].listSize;
  return {
    months: ms,
    emailsSent: sent,
    openRate: w("openRate"),
    clickRate: w("clickRate"),
    conversionRate: w("conversionRate"),
    unsubRate: w("unsubRate"),
    revenue,
    revenuePerEmail: revenue / (sent || 1),
    listSize: endList,
    listGrowth: startList ? ((endList - startList) / startList) * 100 : 0,
  };
}
