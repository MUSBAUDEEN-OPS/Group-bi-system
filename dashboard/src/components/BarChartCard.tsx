"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { resolveFormatter, type FormatKind } from "@/lib/formatKind";
import type { Currency } from "@/lib/currency";

export interface BarChartCardProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  color?: string;
  format?: FormatKind;
  currency?: Currency;
  rate?: number;
  layout?: "horizontal" | "vertical";
}

function BarTooltip({ active, payload, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-lg">
      <div className="text-[var(--text-muted)]">{point.label}</div>
      <div dir="ltr" className="text-end font-semibold text-[var(--foreground)]">
        {valueFormatter(point.value)}
      </div>
    </div>
  );
}

export function BarChartCard({ title, data, color = "var(--series-hajj-umrah)", format = "number", currency = "NGN", rate = 1, layout = "vertical" }: BarChartCardProps) {
  const isHorizontal = layout === "horizontal";
  const valueFormatter = resolveFormatter(format, { currency, rate });
  const longestLabel = data.reduce((max, d) => Math.max(max, d.label.length), 0);
  const yAxisWidth = Math.min(200, Math.max(90, longestLabel * 7 + 20));
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <div dir="ltr" style={{ height: Math.max(160, data.length * 34) }} className="mt-auto w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{ top: 4, right: 16, bottom: 0, left: isHorizontal ? 8 : 0 }}
            barCategoryGap={6}
          >
            <CartesianGrid stroke="var(--gridline)" strokeDasharray="0" horizontal={!isHorizontal} vertical={isHorizontal} />
            {isHorizontal ? (
              <>
                <XAxis type="number" tickFormatter={valueFormatter} stroke="var(--baseline)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" stroke="var(--baseline)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={yAxisWidth} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" stroke="var(--baseline)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--baseline)" }} tickLine={false} />
                <YAxis tickFormatter={valueFormatter} stroke="var(--baseline)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
              </>
            )}
            <Tooltip cursor={{ fill: "var(--background)" }} content={(props) => <BarTooltip {...props} valueFormatter={valueFormatter} />} />
            <Bar dataKey="value" radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
