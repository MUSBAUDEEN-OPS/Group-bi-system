import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { faker } from "@faker-js/faker";
import type { BusinessUnit, GroupBiDataset } from "@group-bi/kpi-lib";
import { Rng } from "./rng.js";
import { KPI_CONFIG } from "./config.js";
import { writeCsv } from "./csv.js";
import { validateDataset } from "./validate.js";
import { summarizeDataset } from "./summarize.js";
import { buildDataQualityReport } from "./report.js";
import {
  generateAgents,
  generateChartOfAccounts,
  generateOutlets,
  generatePackagePriceList,
  generateProducts,
  generateRoomTypes,
} from "./entities/reference.js";
import { generateDepartures, generateHajjUmrahData } from "./entities/hajjUmrah.js";
import { generateHotelData } from "./entities/hotel.js";
import { generateBakeryData } from "./entities/bakery.js";
import { generateEmployees, generatePayroll } from "./entities/hr.js";
import { generateExpenses } from "./entities/finance.js";
import { monthlyBakeryRevenue, monthlyHajjUmrahRevenue, monthlyHotelFnbRevenue, monthlyHotelRoomRevenue } from "./revenue.js";

function parseSeed(): number {
  const arg = process.argv.find((a) => a.startsWith("--seed"));
  if (!arg) return 42;
  const [, value] = arg.split("=");
  if (value) return Number(value);
  const idx = process.argv.indexOf(arg);
  const next = process.argv[idx + 1];
  return next ? Number(next) : 42;
}

function main(): void {
  const seed = parseSeed();
  console.log(`Generating Group BI synthetic dataset with seed=${seed}...`);

  faker.seed(seed);
  const rng = new Rng(seed);

  const agents = generateAgents(rng);
  const packagePriceList = generatePackagePriceList();
  const roomTypes = generateRoomTypes();
  const outlets = generateOutlets();
  const products = generateProducts();
  const chartOfAccounts = generateChartOfAccounts();
  const employees = generateEmployees(rng);

  const departures = generateDepartures(rng);
  const { bookings, inquiries, visaPermits, customerFeedback } = generateHajjUmrahData(rng, departures, agents, packagePriceList);
  const { reservations, fnbSales, guestFeedback } = generateHotelData(rng, roomTypes);
  const { production, sales, waste } = generateBakeryData(rng, outlets, products);
  const payroll = generatePayroll(rng, employees);

  const monthlyRevenueByUnit: Record<BusinessUnit, Record<string, number>> = {
    HajjUmrah: monthlyHajjUmrahRevenue(bookings, departures),
    Hotel: (() => {
      const room = monthlyHotelRoomRevenue(reservations);
      const fnb = monthlyHotelFnbRevenue(fnbSales);
      const combined: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) {
        const month = `2025-${String(m).padStart(2, "0")}`;
        combined[month] = (room[month] ?? 0) + (fnb[month] ?? 0);
      }
      return combined;
    })(),
    Bakery: monthlyBakeryRevenue(sales),
  };
  const hotelFnbByMonth = monthlyHotelFnbRevenue(fnbSales);

  // Flat monthly budget target per unit: average monthly revenue x modest
  // stretch factor (brief §5 ASSUMPTION — no prior year exists to base this on).
  for (const unit of ["HajjUmrah", "Hotel", "Bakery"] as BusinessUnit[]) {
    const values = Object.values(monthlyRevenueByUnit[unit]);
    const avg = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
    for (let m = 1; m <= 12; m++) {
      const month = `2025-${String(m).padStart(2, "0")}`;
      KPI_CONFIG.budgetTargetsByUnit[unit][month] = Math.round(avg * 1.03);
    }
  }

  const expenses = generateExpenses(rng, monthlyRevenueByUnit, hotelFnbByMonth);

  const dataset: Pick<GroupBiDataset, "raw" | "reference"> = {
    raw: { bookings, inquiries, departures, visaPermits, customerFeedback, reservations, fnbSales, guestFeedback, production, sales, waste, expenses, payroll },
    reference: { agents, packagePriceList, roomTypes, outlets, products, employees, chartOfAccounts },
  };

  console.log("Validating referential integrity...");
  validateDataset(dataset);
  console.log("  OK — no referential integrity violations.");

  console.log("Precomputing summary tables...");
  const summary = summarizeDataset(dataset, KPI_CONFIG);

  const outputRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "output");
  const rawDir = path.join(outputRoot, "raw");
  const referenceDir = path.join(outputRoot, "reference");
  const summaryDir = path.join(outputRoot, "summary");

  console.log(`Writing CSVs to ${outputRoot}...`);
  writeCsv(path.join(rawDir, "Raw_Bookings.csv"), dataset.raw.bookings);
  writeCsv(path.join(rawDir, "Raw_Inquiries.csv"), dataset.raw.inquiries);
  writeCsv(path.join(rawDir, "Raw_Departures.csv"), dataset.raw.departures);
  writeCsv(path.join(rawDir, "Raw_VisaPermits.csv"), dataset.raw.visaPermits);
  writeCsv(path.join(rawDir, "Raw_CustomerFeedback.csv"), dataset.raw.customerFeedback);
  writeCsv(path.join(rawDir, "Raw_Reservations.csv"), dataset.raw.reservations);
  writeCsv(path.join(rawDir, "Raw_FnB_Sales.csv"), dataset.raw.fnbSales);
  writeCsv(path.join(rawDir, "Raw_GuestFeedback.csv"), dataset.raw.guestFeedback);
  writeCsv(path.join(rawDir, "Raw_Production.csv"), dataset.raw.production);
  writeCsv(path.join(rawDir, "Raw_Sales.csv"), dataset.raw.sales);
  writeCsv(path.join(rawDir, "Raw_Waste.csv"), dataset.raw.waste);
  writeCsv(path.join(rawDir, "Raw_Expenses.csv"), dataset.raw.expenses);
  writeCsv(path.join(rawDir, "Raw_Payroll.csv"), dataset.raw.payroll);

  writeCsv(path.join(referenceDir, "Reference_Agents.csv"), dataset.reference.agents);
  writeCsv(path.join(referenceDir, "Reference_PackagePriceList.csv"), dataset.reference.packagePriceList);
  writeCsv(path.join(referenceDir, "Reference_RoomTypes.csv"), dataset.reference.roomTypes);
  writeCsv(path.join(referenceDir, "Reference_Outlets.csv"), dataset.reference.outlets);
  writeCsv(path.join(referenceDir, "Reference_Products.csv"), dataset.reference.products);
  writeCsv(path.join(referenceDir, "Reference_Employees.csv"), dataset.reference.employees);
  writeCsv(path.join(referenceDir, "Reference_ChartOfAccounts.csv"), dataset.reference.chartOfAccounts);

  writeCsv(path.join(summaryDir, "Summary_Monthly.csv"), summary.monthly);
  writeCsv(path.join(summaryDir, "Summary_KPISnapshot.csv"), summary.kpiSnapshot);
  writeCsv(path.join(summaryDir, "Summary_TopProducts.csv"), summary.topProducts);
  writeCsv(path.join(summaryDir, "Summary_BookingChannelMix.csv"), summary.bookingChannelMix);
  writeCsv(path.join(summaryDir, "Summary_RevenueMix.csv"), summary.revenueMix);

  const report = buildDataQualityReport(dataset, summary, seed);
  fs.writeFileSync(path.join(outputRoot, "data-quality-report.txt"), report, "utf-8");
  console.log("");
  console.log(report);
}

main();
