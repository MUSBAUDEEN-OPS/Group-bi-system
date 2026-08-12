import { Suspense } from "react";
import Link from "next/link";
import type { BusinessUnit } from "@group-bi/kpi-lib";
import { getDataSource } from "@/data/getDataSource";
import { resolveRangeFromSearchParams } from "@/lib/dateRange";
import { aggregateKpi } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatNumber, formatPercent, monthLabel } from "@/lib/format";
import { UNIT_LABEL } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DataTable } from "@/components/DataTable";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];

export default async function WorkforcePage({ searchParams }: PageProps<"/workforce">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const dataSource = getDataSource();
  const snapshot = await dataSource.getKpiSnapshot();

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?${passthroughQuery(resolvedSearchParams)}`} className="text-sm text-[var(--text-secondary)] hover:underline">
          ← Group Overview
        </Link>
        <Suspense>
          <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} />
        </Suspense>
      </div>
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Workforce</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Group Headcount" starred value={groupHeadcount !== null ? formatNumber(groupHeadcount) : "—"} />
        {payrollPctByUnit.map(({ unit, value }) => (
          <StatTile key={unit} label={`Payroll Cost % — ${UNIT_LABEL[unit]}`} starred value={value !== null ? formatPercent(value) : "—"} />
        ))}
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Staff Turnover Rate" value={turnoverRate !== null ? formatPercent(turnoverRate) : "—"} upIsGood={false} />
        <StatTile label="Overtime Hours" value={overtimeHours !== null ? formatNumber(overtimeHours) : "—"} />
        <StatTile label="Overtime Cost" value={overtimeCost !== null ? formatCompactCurrency(overtimeCost) : "—"} />
      </section>

      <section aria-label="Attendance (placeholder)" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {attendanceByUnit.map(({ unit, value }) => (
          <StatTile key={unit} label={`Attendance — ${UNIT_LABEL[unit]}`} value={value !== null ? formatPercent(value) : "—"} placeholder deltaLabel="pending real attendance data" />
        ))}
      </section>

      <section aria-label="Productivity" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {productivityByUnit.map(({ unit, value }) => (
          <StatTile key={unit} label={`Revenue / Employee — ${UNIT_LABEL[unit]}`} value={value !== null ? formatCompactCurrency(value) : "—"} />
        ))}
      </section>

      <DataTable
        title={`Headcount by unit / department (as of ${lastMonth ? monthLabel(lastMonth) : "—"})`}
        rows={headcountRows}
        columns={[
          { key: "unit", header: "Unit", render: (r) => UNIT_LABEL[r.unit as BusinessUnit] ?? r.unit },
          { key: "department", header: "Department", render: (r) => r.department },
          { key: "headcount", header: "Headcount", align: "right", render: (r) => r.headcount.toString() },
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
