"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatSignedPercent, monthLabelShort } from "@/lib/format";
import { resolveFormatter, type FormatKind } from "@/lib/formatKind";

export interface TrendChartProps {
  title: string;
  series: Array<{ month: string; value: number }>;
  color?: string;
  format?: FormatKind;
  allowComparison?: boolean;
}

type Comparison = "value" | "mom" | "yoy";

function ValueTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-lg">
      <div className="text-[var(--text-muted)]">{monthLabelShort(label)}</div>
      <div className="font-semibold text-[var(--foreground)]">{valueFormatter(payload[0].value)}</div>
    </div>
  );
}

export function TrendChart({ title, series, color = "var(--series-hajj-umrah)", format = "number", allowComparison = true }: TrendChartProps) {
  const [comparison, setComparison] = useState<Comparison>("value");
  const valueFormatter = resolveFormatter(format);

  const momSeries = useMemo(
    () =>
      series.map((point, i) => {
        const prev = series[i - 1];
        const change = prev && prev.value !== 0 ? (point.value - prev.value) / prev.value : null;
        return { month: point.month, value: change };
      }),
    [series],
  );

  const hasInsufficientHistory = comparison === "yoy";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        {allowComparison && (
          <div className="no-print flex gap-2 rounded-full border border-[var(--border)] p-1 text-xs">
            {(["value", "mom", "yoy"] as Comparison[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setComparison(mode)}
                className={`flex min-h-11 items-center rounded-full px-3 font-medium ${
                  comparison === mode ? "bg-[var(--brand-navy)] text-white" : "text-[var(--text-secondary)]"
                }`}
                aria-pressed={comparison === mode}
              >
                {mode === "value" ? "Value" : mode === "mom" ? "MoM %" : "YoY %"}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasInsufficientHistory ? (
        <div className="flex h-48 items-center justify-center text-center text-sm text-[var(--text-muted)]">
          Insufficient history for YoY comparison — this dataset covers a single fiscal year (2025).
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparison === "mom" ? momSeries : series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--gridline)" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabelShort}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                axisLine={{ stroke: "var(--baseline)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => (comparison === "mom" ? formatSignedPercent(v, 0) : valueFormatter(v))}
                stroke="var(--baseline)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={comparison === "mom" ? 48 : 56}
              />
              <Tooltip
                content={(props) => (
                  <ValueTooltip {...props} valueFormatter={comparison === "mom" ? (v: number) => formatSignedPercent(v) : valueFormatter} />
                )}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 0 }} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
