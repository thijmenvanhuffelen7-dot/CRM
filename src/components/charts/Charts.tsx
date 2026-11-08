import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/utils";

const C1 = "hsl(var(--chart-1))";
const C2 = "hsl(var(--chart-2))";

interface TooltipRow {
  name: string;
  value: number;
  color: string;
  dashed?: boolean;
}

function TooltipBox({ title, rows, fmt }: { title: string; rows: TooltipRow[]; fmt: (n: number) => string }) {
  return (
    <div className="min-w-[160px] rounded-md border bg-popover px-3 py-2 text-xs shadow-pop">
      <p className="mb-1.5 font-medium text-foreground">{title}</p>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: r.dashed ? "transparent" : r.color, borderTop: r.dashed ? `2px dashed ${r.color}` : undefined }} />
            {r.name}
          </span>
          <span className="font-medium tabular text-foreground">{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block w-4" style={{ borderTop: `2px ${i.dashed ? "dashed" : "solid"} ${i.color}` }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

const axisProps = { tickLine: false, axisLine: false, tickMargin: 8, fontSize: 12 } as const;

/** Revenue over time — current period vs. previous period (same scale, one axis). */
export function RevenueChart({
  data,
  height = 260,
  format = (n: number) => money(n, { compact: true }),
}: {
  data: { label: string; current: number; previous?: number; prevLabel?: string }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const hasPrev = data.some((d) => d.previous !== undefined);
  return (
    <div style={{ height }} role="img" aria-label="Revenue over time chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C1} stopOpacity={0.16} />
              <stop offset="100%" stopColor={C1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="0" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={64} tickFormatter={(v) => format(v)} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof data)[number];
              const rows: TooltipRow[] = [{ name: "This period", value: d.current, color: C1 }];
              if (d.previous !== undefined) rows.push({ name: d.prevLabel ? `Prev. (${d.prevLabel})` : "Previous period", value: d.previous, color: C2, dashed: true });
              return <TooltipBox title={d.label} rows={rows} fmt={format} />;
            }}
          />
          {hasPrev && <Line type="monotone" dataKey="previous" stroke={C2} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }} isAnimationActive={false} />}
          <Area type="monotone" dataKey="current" stroke={C1} strokeWidth={2} fill="url(#rev-fill)" dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: "hsl(var(--card))" }} animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Single metric line (e.g. open rate %). */
export function MetricLine({ data, height = 200, format }: { data: { label: string; value: number }[]; height?: number; format: (n: number) => string }) {
  return (
    <div style={{ height }} role="img" aria-label="Metric trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={48} tickFormatter={format} domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))" }}
            content={({ active, payload }) =>
              active && payload?.length ? <TooltipBox title={(payload[0].payload as { label: string }).label} rows={[{ name: "Value", value: payload[0].value as number, color: C1 }]} fmt={format} /> : null
            }
          />
          <Line type="monotone" dataKey="value" stroke={C1} strokeWidth={2} dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: "hsl(var(--card))" }} animationDuration={600} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Campaign performance — one bar per campaign, single series. */
export function CampaignBars({
  data,
  height = 260,
  format = (n: number) => money(n, { compact: true }),
  metricLabel = "Revenue",
}: {
  data: { label: string; value: number; sub?: string }[];
  height?: number;
  format?: (n: number) => string;
  metricLabel?: string;
}) {
  return (
    <div style={{ height }} role="img" aria-label={`${metricLabel} per campaign chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval={0} tick={data.length > 5 ? false : { fontSize: 11 }} height={data.length > 5 ? 8 : 30} tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)} />
          <YAxis {...axisProps} width={64} tickFormatter={format} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof data)[number];
              return <TooltipBox title={d.sub ? `${d.label} · ${d.sub}` : d.label} rows={[{ name: metricLabel, value: d.value, color: C1 }]} fmt={format} />;
            }}
          />
          <Bar dataKey="value" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
