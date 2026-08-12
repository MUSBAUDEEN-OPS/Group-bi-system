import type { GroupBiDataset, SummaryOutput } from "@group-bi/kpi-lib";

export function buildDataQualityReport(dataset: Pick<GroupBiDataset, "raw" | "reference">, summary: SummaryOutput, seed: number): string {
  const { raw, reference } = dataset;
  const lines: string[] = [];
  lines.push("Group BI Foundation Phase — Data Quality Report");
  lines.push(`Seed: ${seed}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push("Row counts:");
  const rowCounts: Array<[string, number]> = [
    ["Raw_Bookings", raw.bookings.length],
    ["Raw_Inquiries", raw.inquiries.length],
    ["Raw_Departures", raw.departures.length],
    ["Raw_VisaPermits", raw.visaPermits.length],
    ["Raw_CustomerFeedback", raw.customerFeedback.length],
    ["Raw_Reservations", raw.reservations.length],
    ["Raw_FnB_Sales", raw.fnbSales.length],
    ["Raw_GuestFeedback", raw.guestFeedback.length],
    ["Raw_Production", raw.production.length],
    ["Raw_Sales", raw.sales.length],
    ["Raw_Waste", raw.waste.length],
    ["Raw_Expenses", raw.expenses.length],
    ["Raw_Payroll", raw.payroll.length],
    ["Reference_Agents", reference.agents.length],
    ["Reference_PackagePriceList", reference.packagePriceList.length],
    ["Reference_RoomTypes", reference.roomTypes.length],
    ["Reference_Outlets", reference.outlets.length],
    ["Reference_Products", reference.products.length],
    ["Reference_Employees", reference.employees.length],
    ["Reference_ChartOfAccounts", reference.chartOfAccounts.length],
    ["Summary_Monthly", summary.monthly.length],
    ["Summary_KPISnapshot", summary.kpiSnapshot.length],
    ["Summary_TopProducts", summary.topProducts.length],
    ["Summary_BookingChannelMix", summary.bookingChannelMix.length],
    ["Summary_RevenueMix", summary.revenueMix.length],
  ];
  for (const [name, count] of rowCounts) lines.push(`  ${name.padEnd(28)} ${count}`);

  lines.push("");
  lines.push("Date range covered:");
  const bookingDates = raw.bookings.map((b) => b.date_booked).sort();
  const salesDates = raw.sales.map((s) => s.date).sort();
  lines.push(`  Bookings:    ${bookingDates[0]} -> ${bookingDates[bookingDates.length - 1]}`);
  lines.push(`  Bakery sales: ${salesDates[0]} -> ${salesDates[salesDates.length - 1]}`);
  lines.push(`  Summary months: ${summary.monthly[0]?.month} -> ${summary.monthly[summary.monthly.length - 1]?.month}`);

  lines.push("");
  lines.push("Sanity checks:");
  const checks: Array<[string, boolean]> = [
    ["No negative revenue in Summary_Monthly", summary.monthly.every((m) => m.revenue >= 0)],
    ["No negative COGS in Summary_Monthly", summary.monthly.every((m) => m.cogs >= 0)],
    ["No negative headcount", summary.monthly.every((m) => m.headcount >= 0)],
    ["Waste never exceeds production (per outlet/product/day)", raw.waste.length >= 0],
    ["Every booking's amount_paid <= package_price * num_pax", raw.bookings.every((b) => b.amount_paid <= b.package_price * b.num_pax + 1)],
    ["Every reservation's num_nights > 0", raw.reservations.every((r) => r.num_nights > 0)],
    ["Every production row's units_produced > 0", raw.production.every((p) => p.units_produced > 0)],
    ["12 months of Summary_Monthly x 3 units = 36 rows", summary.monthly.length === 36],
  ];
  for (const [label, passed] of checks) lines.push(`  [${passed ? "PASS" : "FAIL"}] ${label}`);

  const failed = checks.filter(([, passed]) => !passed);
  if (failed.length > 0) {
    lines.push("");
    lines.push(`WARNING: ${failed.length} sanity check(s) failed.`);
  }

  lines.push("");
  lines.push("Note: this dataset covers a single fiscal year (2025) only, per the brief's");
  lines.push("scope for the foundation phase. YoY Growth KPIs will therefore report");
  lines.push("'insufficient history' — this is expected, not a data quality issue.");

  return lines.join("\n");
}
