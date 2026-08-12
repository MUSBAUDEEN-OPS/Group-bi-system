import Link from "next/link";
import { formatSignedPercent } from "@/lib/format";
import { trendColor } from "@/lib/chartColors";
import { Sparkline } from "./Sparkline";
import { StarBadgeIcon } from "./icons/StarBadgeIcon";
import { TrendArrowIcon } from "./icons/TrendArrowIcon";

export interface StatTileProps {
  label: string;
  value: string;
  starred?: boolean;
  deltaPct?: number | null;
  deltaLabel?: string;
  upIsGood?: boolean;
  trend?: number[];
  href?: string;
  placeholder?: boolean;
  placeholderLabel?: string;
  unit?: string;
}

export function StatTile({
  label,
  value,
  starred,
  deltaPct,
  deltaLabel,
  upIsGood = true,
  trend,
  href,
  placeholder,
  placeholderLabel = "placeholder",
  unit,
}: StatTileProps) {
  const body = (
    <div className="flex h-full flex-col justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)]">
          {starred && <StarBadgeIcon />}
          {label}
        </span>
        {unit && <span className="shrink-0 text-xs text-[var(--text-muted)]">{unit}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span dir="ltr" className="text-end text-2xl font-semibold text-[var(--foreground)]">
          {value}
        </span>
        {trend && trend.length > 1 && <Sparkline data={trend} />}
      </div>
      <div className="flex items-center justify-between text-xs">
        {deltaPct !== undefined && deltaPct !== null ? (
          <span dir="ltr" className="flex items-center gap-1 font-medium" style={{ color: trendColor(deltaPct, upIsGood) }}>
            {deltaPct !== 0 && <TrendArrowIcon direction={deltaPct > 0 ? "up" : "down"} color={trendColor(deltaPct, upIsGood)} />}
            {formatSignedPercent(deltaPct)} {deltaLabel ?? ""}
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">{deltaLabel ?? ""}</span>
        )}
        {placeholder && <span className="text-[var(--text-muted)] italic">{placeholderLabel}</span>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }
  return body;
}
