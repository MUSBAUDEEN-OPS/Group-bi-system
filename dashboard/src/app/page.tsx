import { Suspense } from "react";
import Link from "next/link";
import type { BusinessUnit, SummaryMonthly } from "@group-bi/kpi-lib";
import { getDataSource } from "@/data/getDataSource";
import { getExchangeRate } from "@/data/exchangeRate";
import { resolveRangeFromSearchParams } from "@/lib/dateRange";
import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatPercent, formatSignedPercent } from "@/lib/format";
import { convertFromNGN, isCurrency, type Currency } from "@/lib/currency";
import { unitLabel, trendColor } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { SectionBackground } from "@/components/SectionBackground";
import { TrendArrowIcon } from "@/components/icons/TrendArrowIcon";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];
const UNIT_HREF: Record<BusinessUnit, string> = { HajjUmrah: "/hajj-umrah", Hotel: "/hotel", Bakery: "/bakery" };

function sumRevenue(monthly: SummaryMonthly[], unit: BusinessUnit, months: string[]): number | null {
  const rows = monthly.filter((m) => m.business_unit === unit && months.includes(m.month));
  if (rows.length === 0) return null;
  return rows.reduce((sum, m) => sum + m.revenue, 0);
}

function pctDelta(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return (current - prior) / prior;
}

function searchParamsToQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params.toString();
}

export default async function GroupOverviewPage({ searchParams }: PageProps<"/">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const currency: Currency = isCurrency(resolvedSearchParams.currency as string | undefined) ? (resolvedSearchParams.currency as Currency) : "NGN";
  const query = searchParamsToQuery(resolvedSearchParams);
  const t = translations[lang];
  const dataSource = getDataSource();
  const [snapshot, monthly, rateInfo] = await Promise.all([dataSource.getKpiSnapshot(), dataSource.getSummaryMonthly(), getExchangeRate()]);
  const money = (v: number) => formatCompactCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);

  const revenue = aggregateKpi(snapshot, "Group", "Consolidated Revenue", range.months);
  const revenuePrior = aggregateKpi(snapshot, "Group", "Consolidated Revenue", range.priorPeriodMonths);
  const netProfit = aggregateKpi(snapshot, "Group", "Consolidated Net Profit", range.months);
  const netProfitPrior = aggregateKpi(snapshot, "Group", "Consolidated Net Profit", range.priorPeriodMonths);
  const margin = aggregateKpi(snapshot, "Group", "Consolidated Net Profit Margin", range.months);
  const cashPosition = aggregateKpi(snapshot, "Group", "Cash Position", range.months);
  const cashPositionPrior = aggregateKpi(snapshot, "Group", "Cash Position", range.priorPeriodMonths);
  const headcount = aggregateKpi(snapshot, "Group", "Group Headcount", range.months);
  const payrollPct = aggregateKpi(snapshot, "Group", "Payroll Cost % of Revenue (Group)", range.months);

  const budgetTargetTotal = UNITS.reduce((sum, u) => sum + (aggregateKpi(snapshot, u, "Budget Target", range.months) ?? 0), 0);
  const varianceTotal = UNITS.reduce((sum, u) => sum + (aggregateKpi(snapshot, u, "Budget vs Actual Variance", range.months) ?? 0), 0);

  const revenueTrend = kpiSeries(snapshot, "Group", "Consolidated Revenue", range.months).map((p) => p.value);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SectionBackground variant="group" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.nav.groupOverview}</h1>
        <Suspense>
          <div className="flex flex-wrap items-center gap-2">
            <CurrencyToggle currentCurrency={currency} rateInfo={rateInfo} lang={lang} />
            <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} />
          </div>
        </Suspense>
      </div>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t.group.consolidatedRevenue}
          starred
          value={revenue !== null ? money(revenue) : "—"}
          deltaPct={pctDelta(revenue, revenuePrior)}
          deltaLabel={t.common.vsPriorPeriod}
          trend={revenueTrend}
        />
        <StatTile
          label={t.group.netProfit}
          starred
          value={netProfit !== null ? money(netProfit) : "—"}
          deltaPct={pctDelta(netProfit, netProfitPrior)}
          deltaLabel={margin !== null ? `${t.common.margin} ${formatPercent(margin)}` : t.common.vsPriorPeriod}
        />
        <StatTile
          label={t.group.cashPosition}
          starred
          value={cashPosition !== null ? money(cashPosition) : "—"}
          deltaPct={pctDelta(cashPosition, cashPositionPrior)}
          deltaLabel={t.common.vsPriorPeriod}
        />
        <StatTile
          label={t.group.groupHeadcount}
          starred
          value={headcount !== null ? headcount.toLocaleString() : "—"}
          deltaLabel={payrollPct !== null ? `${t.common.payrollCost} ${formatPercent(payrollPct)} ${t.common.ofRevenue}` : undefined}
        />
        <StatTile
          label={t.group.budgetVsActual}
          starred
          value={money(varianceTotal)}
          deltaLabel={budgetTargetTotal ? `${t.common.target} ${money(budgetTargetTotal)}` : undefined}
          deltaPct={budgetTargetTotal ? varianceTotal / budgetTargetTotal : null}
          upIsGood
        />
      </section>

      <section aria-label="Business unit trends" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{t.common.businessUnits}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {UNITS.map((unit) => {
            const unitRevenue = sumRevenue(monthly, unit, range.months);
            const unitRevenuePrior = sumRevenue(monthly, unit, range.priorPeriodMonths);
            const delta = pctDelta(unitRevenue, unitRevenuePrior);
            return (
              <Link
                key={unit}
                href={`${UNIT_HREF[unit]}${query ? `?${query}` : ""}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{unitLabel(unit, lang)}</div>
                  <div dir="ltr" className="text-xs text-[var(--text-muted)]">
                    {unitRevenue !== null ? money(unitRevenue) : "—"}
                  </div>
                </div>
                <div dir="ltr" className="flex items-center gap-1 text-sm font-medium" style={{ color: delta === null ? "var(--text-muted)" : trendColor(delta, true) }}>
                  {delta !== null && delta !== 0 && <TrendArrowIcon direction={delta > 0 ? "up" : "down"} color={trendColor(delta, true)} />}
                  <span>{delta === null ? "—" : formatSignedPercent(delta)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
