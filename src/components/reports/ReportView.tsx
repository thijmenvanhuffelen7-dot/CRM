import { useMemo } from "react";
import { format, parse } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useData } from "@/store/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/tabs";
import { CampaignBars, Legend, RevenueChart } from "@/components/charts/Charts";
import { Delta } from "@/components/shared/Stat";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { periodAggregate } from "@/lib/metrics";
import { cn, money, num, pct } from "@/lib/utils";

export type Range = "1" | "3" | "6";
type BarMetric = "revenue" | "openRate" | "clickRate";

const kpis = [
  { key: "openRate", label: "Open rate", fmt: (n: number) => pct(n), diff: "pts" },
  { key: "clickRate", label: "Click rate", fmt: (n: number) => pct(n, 2), diff: "pts" },
  { key: "conversionRate", label: "Conversion rate", fmt: (n: number) => pct(n, 2), diff: "pts" },
  { key: "revenuePerEmail", label: "Revenue / email", fmt: (n: number) => `€${n.toFixed(3)}`, diff: "%" },
  { key: "revenue", label: "Email revenue", fmt: (n: number) => money(n, { compact: true }), diff: "%" },
  { key: "listGrowth", label: "List growth", fmt: (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`, diff: "pts" },
  { key: "unsubRate", label: "Unsubscribe rate", fmt: (n: number) => pct(n, 2), diff: "pts", invert: true },
] as const;

export function ReportView({
  clientIds,
  range,
  onRangeChange,
  barMetric = "revenue",
  onBarMetricChange,
  printTitle,
}: {
  clientIds?: string[];
  range: Range;
  onRangeChange?: (r: Range) => void;
  barMetric?: BarMetric;
  onBarMetricChange?: (m: BarMetric) => void;
  printTitle?: string;
}) {
  const { metrics, campaigns, clients } = useData();
  const n = Number(range);
  const cur = periodAggregate(metrics, n, 0, clientIds);
  const prev = periodAggregate(metrics, n, n, clientIds);

  // trend: show at least 6 months for context, compare with the 6 months before
  const trendMonths = 6;
  const trend = useMemo(() => {
    const c = periodAggregate(metrics, trendMonths, 0, clientIds);
    const p = periodAggregate(metrics, trendMonths, trendMonths, clientIds);
    return (c?.months ?? []).map((m, i) => ({
      label: format(parse(m.month, "yyyy-MM", new Date()), "MMM"),
      current: m.revenue,
      previous: p?.months[i]?.revenue,
      prevLabel: p?.months[i] ? format(parse(p.months[i].month, "yyyy-MM", new Date()), "MMM") : undefined,
    }));
  }, [metrics, clientIds]);

  const since = new Date();
  since.setMonth(since.getMonth() - n);
  const sent = campaigns
    .filter((c) => c.status === "sent" && c.metrics && (!clientIds || clientIds.includes(c.clientId)))
    .sort((a, b) => b.sendAt.localeCompare(a.sendAt))
    .slice(0, 10)
    .reverse();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "";
  const bars = sent.map((c) => ({
    label: c.name,
    sub: `${clientIds?.length === 1 ? "" : clientName(c.clientId) + " · "}${format(new Date(c.sendAt), "d MMM")}`,
    value: c.metrics![barMetric],
  }));
  const barFmt = barMetric === "revenue" ? (v: number) => money(v, { compact: true }) : (v: number) => pct(v, barMetric === "clickRate" ? 2 : 1);

  if (!cur) {
    return (
      <Card>
        <EmptyState icon={BarChart3} title="No reporting data yet" description="Metrics appear once the Klaviyo integration syncs or the first campaigns are sent." />
      </Card>
    );
  }

  const perClient = !clientIds || clientIds.length > 1;

  return (
    <div className="space-y-4">
      {printTitle && (
        <div className="print-only mb-4">
          <h1 className="text-2xl font-semibold">{printTitle}</h1>
          <p className="text-sm text-muted-foreground">Generated {format(new Date(), "d MMMM yyyy")}</p>
        </div>
      )}
      {onRangeChange && (
        <div className="no-print flex flex-wrap items-center gap-2">
          <Segmented
            value={range}
            onChange={onRangeChange}
            options={[
              { value: "1", label: "This month" },
              { value: "3", label: "3 months" },
              { value: "6", label: "6 months" },
            ]}
          />
          <span className="text-xs text-muted-foreground">compared with the previous {n === 1 ? "month" : `${n} months`}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border shadow-soft sm:grid-cols-4 xl:grid-cols-7 print-area">
        {kpis.map((k) => {
          const v = cur[k.key];
          const p = prev?.[k.key];
          const d = p === undefined ? null : k.diff === "pts" ? v - p : ((v - p) / (p || 1)) * 100;
          return (
            <div key={k.key} className="bg-card p-4">
              <p className="truncate text-xs text-muted-foreground">{k.label}</p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight tabular">{k.fmt(v)}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Delta value={d} invert={"invert" in k && k.invert} suffix={k.diff === "pts" ? " pts" : "%"} />
                <span className="truncate">vs prev.</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3 print-area">
          <CardHeader className="flex-wrap">
            <div>
              <CardTitle>Email-attributed revenue</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 6 months vs the 6 before</p>
            </div>
            <Legend
              items={[
                { label: "This period", color: "hsl(var(--chart-1))" },
                { label: "Previous period", color: "hsl(var(--chart-2))", dashed: true },
              ]}
            />
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 print-area">
          <CardHeader className="flex-wrap">
            <div>
              <CardTitle>Campaign performance</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">Last {bars.length} sent campaigns · hover a bar for details</p>
            </div>
            {onBarMetricChange && (
              <Segmented
                size="sm"
                className="no-print"
                value={barMetric}
                onChange={onBarMetricChange}
                options={[
                  { value: "revenue", label: "Revenue" },
                  { value: "openRate", label: "Opens" },
                  { value: "clickRate", label: "Clicks" },
                ]}
              />
            )}
          </CardHeader>
          <CardContent>
            {bars.length ? (
              <CampaignBars data={bars} format={barFmt} metricLabel={barMetric === "revenue" ? "Revenue" : barMetric === "openRate" ? "Open rate" : "Click rate"} />
            ) : (
              <EmptyState compact icon={BarChart3} title="No sent campaigns" description="Performance shows up after the first send." />
            )}
          </CardContent>
        </Card>
      </div>

      {perClient ? <ClientBreakdown range={n} clientIds={clientIds} /> : <MonthlyTable cur={cur} />}
    </div>
  );
}

function MonthlyTable({ cur }: { cur: NonNullable<ReturnType<typeof periodAggregate>> }) {
  return (
    <Card className="overflow-hidden print-area">
      <CardHeader>
        <CardTitle>Monthly breakdown</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-subtle text-xs text-muted-foreground">
            <tr>
              {["Month", "Emails sent", "Open rate", "Click rate", "Conversion", "Revenue", "List size", "Unsubs"].map((h, i) => (
                <th key={h} scope="col" className={cn("h-9 px-4 font-medium", i === 0 ? "text-left" : "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...cur.months].reverse().map((m) => (
              <tr key={m.month} className="border-t">
                <td className="px-4 py-2.5 font-medium">{format(parse(m.month, "yyyy-MM", new Date()), "MMMM yyyy")}</td>
                <td className="px-4 py-2.5 text-right tabular">{num(m.emailsSent)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(m.openRate)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(m.clickRate, 2)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(m.conversionRate, 2)}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular">{money(m.revenue)}</td>
                <td className="px-4 py-2.5 text-right tabular">{num(m.listSize)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(m.unsubRate, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ClientBreakdown({ range, clientIds }: { range: number; clientIds?: string[] }) {
  const { clients, metrics } = useData();
  const rows = clients
    .filter((c) => !clientIds || clientIds.includes(c.id))
    .map((c) => ({ c, cur: periodAggregate(metrics, range, 0, [c.id]), prev: periodAggregate(metrics, range, range, [c.id]) }))
    .filter((r) => r.cur)
    .sort((a, b) => b.cur!.revenue - a.cur!.revenue);
  const max = Math.max(1, ...rows.map((r) => r.cur!.revenue));
  return (
    <Card className="overflow-hidden print-area">
      <CardHeader>
        <CardTitle>By client</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-subtle text-xs text-muted-foreground">
            <tr>
              {["Client", "Revenue", "", "Open rate", "Click rate", "Conversion", "List growth"].map((h, i) => (
                <th key={i} scope="col" className={cn("h-9 px-4 font-medium", i === 0 || i === 2 ? "text-left" : "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, cur, prev }) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2 font-medium">
                    <CompanyLogo name={c.name} color={c.color} size="xs" />
                    {c.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular">{money(cur!.revenue)}</td>
                <td className="w-[22%] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(cur!.revenue / max) * 100}%` }} />
                    </div>
                    <Delta value={prev ? ((cur!.revenue - prev.revenue) / prev.revenue) * 100 : null} className="w-14 justify-end" />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular">{pct(cur!.openRate)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(cur!.clickRate, 2)}</td>
                <td className="px-4 py-2.5 text-right tabular">{pct(cur!.conversionRate, 2)}</td>
                <td className="px-4 py-2.5 text-right tabular">{cur!.listGrowth >= 0 ? "+" : ""}{cur!.listGrowth.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
