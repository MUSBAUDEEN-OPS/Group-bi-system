import fs from "node:fs/promises";
import path from "node:path";
import type {
  BookingChannel,
  BusinessUnit,
  KpiScope,
  ReferenceEmployee,
  ReferenceOutlet,
  ReferenceProduct,
  ReferenceRoomType,
  SummaryBookingChannelMix,
  SummaryKpiSnapshot,
  SummaryMonthly,
  SummaryRevenueMix,
  SummaryTopProduct,
} from "@group-bi/kpi-lib";
import type { DataSource } from "./DataSource";
import { num, parseCsv, strOrNull } from "./csv";

// Server-only: reads the data generator's CSV output directly off disk.
// This is the "local-file implementation for this phase" the brief asks
// for — swap in a GoogleSheetsSource later without touching any UI code.
export class LocalFileSource implements DataSource {
  private readonly dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? process.env.GROUP_BI_DATA_DIR ?? path.join(process.cwd(), "..", "data-generator", "output");
  }

  private async readCsv(subdir: string, fileName: string): Promise<Record<string, string>[]> {
    const filePath = path.join(this.dataDir, subdir, fileName);
    const text = await fs.readFile(filePath, "utf-8");
    return parseCsv(text);
  }

  async getSummaryMonthly(): Promise<SummaryMonthly[]> {
    const rows = await this.readCsv("summary", "Summary_Monthly.csv");
    return rows.map((r) => ({
      month: r.month,
      business_unit: r.business_unit as BusinessUnit,
      revenue: num(r.revenue),
      cogs: num(r.cogs),
      opex: num(r.opex),
      gross_profit: num(r.gross_profit),
      net_profit: num(r.net_profit),
      headcount: num(r.headcount),
      payroll_cost: num(r.payroll_cost),
    }));
  }

  async getKpiSnapshot(): Promise<SummaryKpiSnapshot[]> {
    const rows = await this.readCsv("summary", "Summary_KPISnapshot.csv");
    return rows.map((r) => ({
      month: r.month,
      business_unit: r.business_unit as KpiScope,
      kpi_name: r.kpi_name,
      kpi_value: num(r.kpi_value),
    }));
  }

  async getTopProducts(): Promise<SummaryTopProduct[]> {
    const rows = await this.readCsv("summary", "Summary_TopProducts.csv");
    return rows.map((r) => ({
      month: r.month,
      rank_by: r.rank_by as "revenue" | "volume",
      rank: num(r.rank),
      product_id: r.product_id,
      product_name: r.product_name,
      value: num(r.value),
    }));
  }

  async getBookingChannelMix(): Promise<SummaryBookingChannelMix[]> {
    const rows = await this.readCsv("summary", "Summary_BookingChannelMix.csv");
    return rows.map((r) => ({
      month: r.month,
      booking_channel: r.booking_channel as BookingChannel,
      count: num(r.count),
      pct: num(r.pct),
    }));
  }

  async getRevenueMix(): Promise<SummaryRevenueMix[]> {
    const rows = await this.readCsv("summary", "Summary_RevenueMix.csv");
    return rows.map((r) => ({
      month: r.month,
      business_unit: r.business_unit as BusinessUnit,
      revenue: num(r.revenue),
      pct_of_group: num(r.pct_of_group),
    }));
  }

  async getReferenceOutlets(): Promise<ReferenceOutlet[]> {
    const rows = await this.readCsv("reference", "Reference_Outlets.csv");
    return rows.map((r) => ({ outlet_id: r.outlet_id, outlet_name: r.outlet_name, location: r.location }));
  }

  async getReferenceProducts(): Promise<ReferenceProduct[]> {
    const rows = await this.readCsv("reference", "Reference_Products.csv");
    return rows.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      category: r.category,
      standard_recipe_cost: num(r.standard_recipe_cost),
    }));
  }

  async getReferenceRoomTypes(): Promise<ReferenceRoomType[]> {
    const rows = await this.readCsv("reference", "Reference_RoomTypes.csv");
    return rows.map((r) => ({ room_type: r.room_type, total_rooms: num(r.total_rooms), standard_rate: num(r.standard_rate) }));
  }

  async getReferenceEmployees(): Promise<ReferenceEmployee[]> {
    const rows = await this.readCsv("reference", "Reference_Employees.csv");
    return rows.map((r) => ({
      employee_id: r.employee_id,
      name: r.name,
      business_unit: r.business_unit as BusinessUnit,
      department: r.department,
      role: r.role,
      hire_date: r.hire_date,
      termination_date: strOrNull(r.termination_date),
    }));
  }
}
