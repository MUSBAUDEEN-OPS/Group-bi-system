import { Suspense } from "react";
import Link from "next/link";
import type { BusinessUnit } from "@group-bi/kpi-lib";
import { getDataSource } from "@/data/getDataSource";
import { getExchangeRate } from "@/data/exchangeRate";
import { deriveDataBounds, resolveRangeFromSearchParams } from "@/lib/dateRange";
import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { aggregateKpi } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatNumber, formatPercent, monthLabel } from "@/lib/format";
import { convertFromNGN, isCurrency, type Currency } from "@/lib/currency";
import { unitLabel } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { SectionBackground } from "@/components/SectionBackground";
import { DataTable } from "@/components/DataTable";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];

export default async function WorkforcePage({ searchParams }: PageProps<"/workforce">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const currency: Currency = isCurrency(resolvedSearchParams.currency as string | undefined) ? (resolvedSearchParams.currency as Currency) : "NGN";
  const t = translations[lang];
  const dataSource = getDataSource();
  const [snapshot, rateInfo] = await Promise.all([dataSource.getKpiSnapshot(), getExchangeRate()]);
  const range = resolveRangeFromSearchParams(resolvedSearchParams, deriveDataBounds(snapshot));
  const moneyCompact = (v: number) => formatCompactCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);

  const groupHeadcount = aggregateKpi(snapshot, "Group", "Group Headcount", range.months);
  const turnoverRate = aggregateKpi(snapshot, "Workforce", "Staff Turnover Rate", range.months);
  const overtimeHours = aggregateKpi(snapshot, "Workforce", "Overtime Hours", range.months);
  const overtimeCost = aggregateKpi(snapshot, "Workforce", "Overtime Cost", range.months);

  const payrollPctByUnit = UNITS.map((u) => ({
    unit: u,
    value: aggregateKpi(snapshot, "Workforce", `Payroll Cost % of Revenue (${u})`, range.months),
  }));
  const attendanceByUnit = UNITS.map((u) => ({
    unit: u,
    value: aggregateKpi(snapshot, "Workforce", `Attendance / Punctuality Rate (${u}) [placeholder]`, range.months),
  }));
  const productivityByUnit = UNITS.map((u) => ({
    unit: u,
    value: aggregateKpi(snapshot, "Workforce", `Productivity - Revenue per Employee (${u})`, range.months),
  }));

  const lastMonth = range.months[range.months.length - 1];
  const headcountRows = [...new Set(snapshot.filter((r) => r.business_unit === "Workforce" && r.kpi_name.startsWith("Headcount (") && r.month === lastMonth).map((r) => r.kpi_name))]
    .map((kpiName) => {
      const key = kpiName.slice("Headcount (".length, -1);
      const [unit, department] = key.split("::");
      return { unit, department, headcount: aggregateKpi(snapshot, "Workforce", kpiName, range.months) ?? 0 };
    })
    .sort((a, b) => a.unit.localeCompare(b.unit) || a.department.localeCompare(b.department));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SectionBackground variant="workforce" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?${passthroughQuery(resolvedSearchParams)}`} className="text-sm text-[var(--text-secondary)] hover:underline">
          {lang === "ar" ? "→" : "←"} {t.nav.backToGroupOverview}
        </Link>
        <Suspense>
          <div className="flex flex-wrap items-center gap-2">
            <CurrencyToggle currentCurrency={currency} rateInfo={rateInfo} lang={lang} />
            <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} bounds={range.bounds} />
          </div>
        </Suspense>
      </div>
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.workforce.pageTitle}</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t.group.groupHeadcount} starred value={groupHeadcount !== null ? formatNumber(groupHeadcount) : "—"} />
        {payrollPctByUnit.map(({ unit, value }) => (
          <StatTile key={unit} label={`${t.workforce.payrollCostPctPrefix} — ${unitLabel(unit, lang)}`} starred value={value !== null ? formatPercent(value) : "—"} />
        ))}
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t.workforce.staffTurnoverRate} value={turnoverRate !== null ? formatPercent(turnoverRate) : "—"} upIsGood={false} />
        <StatTile label={t.workforce.overtimeHours} value={overtimeHours !== null ? formatNumber(overtimeHours) : "—"} />
        <StatTile label={t.workforce.overtimeCost} value={overtimeCost !== null ? moneyCompact(overtimeCost) : "—"} />
      </section>

      <section aria-label="Attendance (placeholder)" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {attendanceByUnit.map(({ unit, value }) => (
          <StatTile
            key={unit}
            label={`${t.workforce.attendancePrefix} — ${unitLabel(unit, lang)}`}
            value={value !== null ? formatPercent(value) : "—"}
            placeholder
            placeholderLabel={t.common.placeholder}
            deltaLabel={t.workforce.pendingRealAttendanceData}
          />
        ))}
      </section>

      <section aria-label="Productivity" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {productivityByUnit.map(({ unit, value }) => (
          <StatTile key={unit} label={`${t.workforce.revenuePerEmployeePrefix} — ${unitLabel(unit, lang)}`} value={value !== null ? moneyCompact(value) : "—"} />
        ))}
      </section>

      <DataTable
        title={`${t.workforce.headcountByDeptTitle} (${t.workforce.asOf} ${lastMonth ? monthLabel(lastMonth, lang) : "—"})`}
        rows={headcountRows}
        columns={[
          { key: "unit", header: t.common.unit, render: (r) => unitLabel(r.unit as BusinessUnit, lang) ?? r.unit },
          { key: "department", header: t.common.department, render: (r) => r.department },
          { key: "headcount", header: t.common.headcount, align: "right", render: (r) => r.headcount.toString() },
        ]}
      />
    </div>
  );
}

function passthroughQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params.toString();
}
