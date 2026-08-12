import {
  bakeryKpis,
  groupKpis,
  hajjUmrahKpis,
  hotelKpis,
  workforceKpis,
  type BusinessUnit,
  type GroupBiDataset,
  type KpiConfig,
  type SummaryBookingChannelMix,
  type SummaryKpiSnapshot,
  type SummaryMonthly,
  type SummaryRevenueMix,
  type SummaryTopProduct,
} from "@group-bi/kpi-lib";
import { OPEX_CATEGORY_NAMES } from "./entities/finance.js";
import {
  departureMonthLookup,
  monthlyBakeryRevenue,
  monthlyHajjUmrahRevenue,
  monthlyHotelFnbRevenue,
  monthlyHotelRoomRevenue,
} from "./revenue.js";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];
const MONTHS = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, "0")}`);

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function monthOfDate(d: string): string {
  return d.slice(0, 7);
}

export interface SummaryOutput {
  monthly: SummaryMonthly[];
  kpiSnapshot: SummaryKpiSnapshot[];
  topProducts: SummaryTopProduct[];
  bookingChannelMix: SummaryBookingChannelMix[];
  revenueMix: SummaryRevenueMix[];
}

export function summarizeDataset(
  dataset: Pick<GroupBiDataset, "raw" | "reference">,
  config: KpiConfig,
): SummaryOutput {
  const { raw, reference } = dataset;
  const snapshot: SummaryKpiSnapshot[] = [];
  const push = (business_unit: SummaryKpiSnapshot["business_unit"], month: string, kpi_name: string, kpi_value: number) =>
    snapshot.push({ month, business_unit, kpi_name, kpi_value });

  const departureMonth = departureMonthLookup(raw.departures);
  const bookingMonth = (b: { departure_group_id: string; date_booked: string }) =>
    departureMonth.get(b.departure_group_id) ?? monthOfDate(b.date_booked);

  const revenueByUnitMonth = {
    HajjUmrah: monthlyHajjUmrahRevenue(raw.bookings, raw.departures),
    Hotel: (() => {
      const room = monthlyHotelRoomRevenue(raw.reservations);
      const fnb = monthlyHotelFnbRevenue(raw.fnbSales);
      const combined: Record<string, number> = {};
      for (const m of MONTHS) combined[m] = (room[m] ?? 0) + (fnb[m] ?? 0);
      return combined;
    })(),
    Bakery: monthlyBakeryRevenue(raw.sales),
  } satisfies Record<BusinessUnit, Record<string, number>>;

  const monthly: SummaryMonthly[] = [];
  const commissionRateByAgent = new Map(reference.agents.map((a) => [a.agent_id, a.commission_rate]));

  for (const month of MONTHS) {
    const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
    const bookingsThisMonth = raw.bookings.filter((b) => bookingMonth(b) === month);
    const bookingsUpToMonth = raw.bookings.filter((b) => bookingMonth(b) <= month);
    const reservationsThisMonth = raw.reservations.filter((r) => monthOfDate(r.checkin_date) === month);
    const fnbThisMonth = raw.fnbSales.filter((s) => monthOfDate(s.date) === month);
    const guestFeedbackThisMonth = raw.guestFeedback.filter((f) => monthOfDate(f.date) === month);
    const productionThisMonth = raw.production.filter((p) => monthOfDate(p.date) === month);
    const salesThisMonth = raw.sales.filter((s) => monthOfDate(s.date) === month);
    const wasteThisMonth = raw.waste.filter((w) => monthOfDate(w.date) === month);
    const expensesThisMonth = raw.expenses.filter((e) => monthOfDate(e.date) === month);
    const payrollThisMonth = raw.payroll.filter((p) => p.month === month);
    const visaPermitsThisMonth = raw.visaPermits.filter((v) =>
      bookingsThisMonth.some((b) => b.booking_id === v.booking_id),
    );
    const departuresThisMonth = raw.departures.filter((d) => monthOfDate(d.departure_date) === month);
    const feedbackThisMonth = raw.customerFeedback.filter((f) => monthOfDate(f.survey_date) === month);
    const inquiriesThisMonth = raw.inquiries.filter((i) => monthOfDate(i.date) === month);

    // ---- Summary_Monthly (revenue/cogs/opex/profit/headcount/payroll) ----
    const headcount = workforceKpis.headcountByUnit(reference.employees, monthEnd);
    const payrollCostByUnit = workforceKpis.payrollCostByUnit(payrollThisMonth);

    for (const unit of UNITS) {
      const revenue = revenueByUnitMonth[unit][month] ?? 0;

      let cogs = 0;
      if (unit === "HajjUmrah") {
        const agentCommission = bookingsThisMonth
          .filter((b) => b.agent_id !== null && b.status !== "cancelled")
          .reduce((sum, b) => sum + b.amount_paid * (commissionRateByAgent.get(b.agent_id!) ?? 0), 0);
        cogs =
          visaPermitsThisMonth.reduce((sum, v) => sum + v.visa_cost + v.permit_cost, 0) +
          agentCommission +
          expensesThisMonth
            .filter((e) => e.business_unit === "HajjUmrah" && e.category === "Package Delivery Costs")
            .reduce((sum, e) => sum + e.amount, 0);
      } else if (unit === "Hotel") {
        const fnbCogs = expensesThisMonth
          .filter((e) => e.business_unit === "Hotel" && e.category === "F&B Cost of Goods")
          .reduce((sum, e) => sum + e.amount, 0);
        // Booking-channel commissions (OTA/agent take a cut of room revenue —
        // a real, direct cost that a room-revenue-only COGS otherwise misses).
        const channelCommissionRate: Record<string, number> = { direct: 0, agent: 0.1, OTA: 0.18 };
        const channelCommission = reservationsThisMonth
          .filter((r) => r.status === "confirmed")
          .reduce((sum, r) => sum + r.rate_per_night * r.num_nights * channelCommissionRate[r.booking_channel], 0);
        cogs = fnbCogs + channelCommission;
      } else {
        cogs = productionThisMonth.reduce((sum, p) => sum + p.ingredient_cost, 0);
      }

      const opex = expensesThisMonth
        .filter((e) => e.business_unit === unit && (OPEX_CATEGORY_NAMES as readonly string[]).includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0);

      const grossProfit = revenue - cogs;
      const payrollCost = payrollCostByUnit[unit];
      const netProfit = grossProfit - opex - payrollCost;

      monthly.push({
        month,
        business_unit: unit,
        revenue,
        cogs,
        opex,
        gross_profit: grossProfit,
        net_profit: netProfit,
        headcount: headcount[unit],
        payroll_cost: payrollCost,
      });
    }

    // ---- Hajj & Umrah KPIs ----
    const pilgrimsBySeason = hajjUmrahKpis.pilgrimsServedBySeason(bookingsThisMonth);
    push("HajjUmrah", month, "Pilgrims Served (Hajj)", pilgrimsBySeason.Hajj);
    push("HajjUmrah", month, "Pilgrims Served (Umrah)", pilgrimsBySeason.Umrah);
    push("HajjUmrah", month, "Pilgrims Served (Total)", pilgrimsBySeason.Hajj + pilgrimsBySeason.Umrah);
    const revenueByTier = hajjUmrahKpis.packageRevenueByTier(bookingsThisMonth);
    for (const tier of Object.keys(revenueByTier) as Array<keyof typeof revenueByTier>) {
      push("HajjUmrah", month, `Package Revenue (${tier})`, revenueByTier[tier]);
    }
    push("HajjUmrah", month, "Average Revenue per Pilgrim", hajjUmrahKpis.averageRevenuePerPilgrim(bookingsThisMonth));
    push(
      "HajjUmrah",
      month,
      "Booking Conversion Rate",
      hajjUmrahKpis.bookingConversionRate(bookingsThisMonth, inquiriesThisMonth),
    );
    push("HajjUmrah", month, "Cancellation / Refund Rate", hajjUmrahKpis.cancellationRefundRate(bookingsThisMonth));
    push(
      "HajjUmrah",
      month,
      "Visa & Permit Cost per Pilgrim",
      hajjUmrahKpis.visaPermitCostPerPilgrim(visaPermitsThisMonth, bookingsThisMonth),
    );
    push(
      "HajjUmrah",
      month,
      "Group Departure Fill Rate",
      hajjUmrahKpis.departureFillRateOverall(raw.bookings, departuresThisMonth),
    );
    push("HajjUmrah", month, "Customer Satisfaction (NPS)", hajjUmrahKpis.customerSatisfactionNPS(feedbackThisMonth));
    push("HajjUmrah", month, "Repeat Customer Rate (YTD)", hajjUmrahKpis.repeatCustomerRate(bookingsUpToMonth));

    // ---- Hotel KPIs ----
    const days = daysInMonth(month);
    push("Hotel", month, "Occupancy Rate", hotelKpis.occupancyRate(reservationsThisMonth, reference.roomTypes, days));
    push("Hotel", month, "ADR", hotelKpis.adr(reservationsThisMonth));
    push("Hotel", month, "RevPAR", hotelKpis.revpar(reservationsThisMonth, reference.roomTypes, days));
    push(
      "Hotel",
      month,
      "F&B Revenue per Occupied Room",
      hotelKpis.fnbRevenuePerOccupiedRoom(fnbThisMonth, reservationsThisMonth),
    );
    push("Hotel", month, "Guest Satisfaction Score", hotelKpis.guestSatisfactionScore(guestFeedbackThisMonth));
    push("Hotel", month, "Average Length of Stay", hotelKpis.averageLengthOfStay(reservationsThisMonth));

    // ---- Bakery KPIs ----
    push("Bakery", month, "Production Volume (Total)", bakeryKpis.productionVolumeTotal(productionThisMonth));
    const salesByOutlet = bakeryKpis.salesPerOutlet(salesThisMonth);
    for (const [outletId, value] of Object.entries(salesByOutlet)) {
      push("Bakery", month, `Sales per Outlet (${outletId})`, value);
    }
    const marginByProduct = bakeryKpis.grossMarginPerProductLine(salesThisMonth, productionThisMonth);
    for (const [productId, value] of Object.entries(marginByProduct)) {
      push("Bakery", month, `Gross Margin (${productId})`, value);
    }
    push("Bakery", month, "Waste / Spoilage Rate", bakeryKpis.wasteRate(wasteThisMonth, productionThisMonth));
    const costVarianceByProduct = bakeryKpis.rawMaterialCostVariance(productionThisMonth, reference.products);
    for (const [productId, value] of Object.entries(costVarianceByProduct)) {
      push("Bakery", month, `Raw Material Cost Variance (${productId})`, value);
    }
    push("Bakery", month, "Average Transaction Value", bakeryKpis.averageTransactionValue(salesThisMonth));

    // ---- Workforce KPIs ----
    const revenueSnapshotByUnit: Record<BusinessUnit, number> = {
      HajjUmrah: revenueByUnitMonth.HajjUmrah[month] ?? 0,
      Hotel: revenueByUnitMonth.Hotel[month] ?? 0,
      Bakery: revenueByUnitMonth.Bakery[month] ?? 0,
    };
    const headcountByDept = workforceKpis.headcountByUnitDepartment(reference.employees, monthEnd);
    for (const [key, value] of Object.entries(headcountByDept)) {
      push("Workforce", month, `Headcount (${key})`, value);
    }
    const payrollPctByUnit = workforceKpis.payrollCostPctRevenue(payrollThisMonth, revenueSnapshotByUnit);
    for (const unit of UNITS) {
      push("Workforce", month, `Payroll Cost % of Revenue (${unit})`, payrollPctByUnit[unit]);
    }
    const monthStart = `${month}-01`;
    push("Workforce", month, "Staff Turnover Rate", workforceKpis.staffTurnoverRate(reference.employees, monthStart, monthEnd));
    const overtime = workforceKpis.overtimeHoursAndCost(payrollThisMonth);
    push("Workforce", month, "Overtime Hours", overtime.hours);
    push("Workforce", month, "Overtime Cost", overtime.cost);
    for (const unit of UNITS) {
      push("Workforce", month, `Attendance / Punctuality Rate (${unit}) [placeholder]`, config.attendancePlaceholderByUnit[unit]);
    }
    const productivity = workforceKpis.productivityRevenuePerEmployee(revenueSnapshotByUnit, headcount);
    for (const unit of UNITS) {
      push("Workforce", month, `Productivity - Revenue per Employee (${unit})`, productivity[unit]);
    }
  }

  // ---- Group (consolidated) KPIs — computed per month from that month's Summary_Monthly rows ----
  const cashSeries = groupKpis.cashPositionSeries(
    monthly,
    raw.expenses.filter((e) => e.business_unit === "Group"),
    config.openingCashBalance,
  );
  const cashByMonth = new Map(cashSeries.map((c) => [c.month, c.balance]));

  for (const month of MONTHS) {
    const monthlyForMonth = monthly.filter((m) => m.month === month);
    push("Group", month, "Consolidated Revenue", groupKpis.consolidatedRevenue(monthlyForMonth));
    const { netProfit, margin } = groupKpis.consolidatedNetProfitMargin(monthlyForMonth);
    push("Group", month, "Consolidated Net Profit", netProfit);
    push("Group", month, "Consolidated Net Profit Margin", margin);
    push("Group", month, "EBITDA", groupKpis.ebitda(monthlyForMonth, config));
    push("Group", month, "Cash Position", cashByMonth.get(month) ?? config.openingCashBalance);
    const { headcount, payrollCostPct } = groupKpis.groupHeadcountAndPayrollPct(monthlyForMonth);
    push("Group", month, "Group Headcount", headcount);
    push("Group", month, "Payroll Cost % of Revenue (Group)", payrollCostPct);

    const roi = groupKpis.roiPerUnit(monthlyForMonth, config);
    for (const unit of UNITS) push(unit, month, "ROI", roi[unit]);

    const variances = groupKpis.budgetVsActualVariance(monthlyForMonth, config);
    for (const v of variances) {
      push(v.business_unit, month, "Budget Target", v.budget);
      push(v.business_unit, month, "Budget vs Actual Variance", v.variance);
    }
  }

  // ---- Revenue Mix (ranked/categorical — own table) ----
  const revenueMix: SummaryRevenueMix[] = [];
  for (const month of MONTHS) {
    const monthlyForMonth = monthly.filter((m) => m.month === month);
    const mix = groupKpis.revenueMixByUnit(monthlyForMonth);
    for (const unit of UNITS) {
      const revenue = monthlyForMonth.find((m) => m.business_unit === unit)?.revenue ?? 0;
      revenueMix.push({ month, business_unit: unit, revenue, pct_of_group: mix[unit] });
    }
  }

  // ---- Top Selling Products (own table) ----
  const topProducts: SummaryTopProduct[] = [];
  for (const month of MONTHS) {
    const salesThisMonth = raw.sales.filter((s) => monthOfDate(s.date) === month);
    const { byRevenue, byVolume } = bakeryKpis.topSellingProducts(salesThisMonth, reference.products, 10);
    byRevenue.forEach((p, i) =>
      topProducts.push({ month, rank_by: "revenue", rank: i + 1, product_id: p.product_id, product_name: p.product_name, value: p.value }),
    );
    byVolume.forEach((p, i) =>
      topProducts.push({ month, rank_by: "volume", rank: i + 1, product_id: p.product_id, product_name: p.product_name, value: p.value }),
    );
  }

  // ---- Booking Channel Mix (own table) ----
  const bookingChannelMix: SummaryBookingChannelMix[] = [];
  for (const month of MONTHS) {
    const reservationsThisMonth = raw.reservations.filter((r) => monthOfDate(r.checkin_date) === month);
    const mix = hotelKpis.bookingChannelMix(reservationsThisMonth);
    const total = Object.values(mix).reduce((sum, v) => sum + v, 0);
    for (const [channel, count] of Object.entries(mix)) {
      bookingChannelMix.push({
        month,
        booking_channel: channel as SummaryBookingChannelMix["booking_channel"],
        count,
        pct: total === 0 ? 0 : count / total,
      });
    }
  }

  return { monthly, kpiSnapshot: snapshot, topProducts, bookingChannelMix, revenueMix };
}
