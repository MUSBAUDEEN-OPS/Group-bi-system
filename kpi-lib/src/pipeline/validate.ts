import type { GroupBiDataset } from "../types.js";

export class ReferentialIntegrityError extends Error {}

function checkFk<T>(
  rows: T[],
  getFk: (row: T) => string | null,
  validIds: Set<string>,
  label: string,
): string[] {
  const violations: string[] = [];
  for (const row of rows) {
    const fk = getFk(row);
    if (fk !== null && !validIds.has(fk)) violations.push(`${label}: unresolved FK "${fk}"`);
  }
  return violations;
}

export function validateDataset(dataset: Pick<GroupBiDataset, "raw" | "reference">): void {
  const agentIds = new Set(dataset.reference.agents.map((a) => a.agent_id));
  const departureIds = new Set(dataset.raw.departures.map((d) => d.departure_group_id));
  const bookingIds = new Set(dataset.raw.bookings.map((b) => b.booking_id));
  const roomTypeIds = new Set(dataset.reference.roomTypes.map((r) => r.room_type));
  const reservationIds = new Set(dataset.raw.reservations.map((r) => r.reservation_id));
  const outletIds = new Set(dataset.reference.outlets.map((o) => o.outlet_id));
  const productIds = new Set(dataset.reference.products.map((p) => p.product_id));
  const employeeIds = new Set(dataset.reference.employees.map((e) => e.employee_id));

  const violations: string[] = [
    ...checkFk(dataset.raw.bookings, (b) => b.agent_id, agentIds, "Raw_Bookings.agent_id"),
    ...checkFk(dataset.raw.bookings, (b) => b.departure_group_id, departureIds, "Raw_Bookings.departure_group_id"),
    ...checkFk(dataset.raw.visaPermits, (v) => v.booking_id, bookingIds, "Raw_VisaPermits.booking_id"),
    ...checkFk(dataset.raw.customerFeedback, (f) => f.booking_id, bookingIds, "Raw_CustomerFeedback.booking_id"),
    ...checkFk(dataset.raw.inquiries, (i) => i.converted_booking_id, bookingIds, "Raw_Inquiries.converted_booking_id"),
    ...checkFk(dataset.raw.reservations, (r) => r.room_type, roomTypeIds, "Raw_Reservations.room_type"),
    ...checkFk(dataset.raw.fnbSales, (s) => s.reservation_id, reservationIds, "Raw_FnB_Sales.reservation_id"),
    ...checkFk(dataset.raw.guestFeedback, (f) => f.reservation_id, reservationIds, "Raw_GuestFeedback.reservation_id"),
    ...checkFk(dataset.raw.production, (p) => p.outlet_id, outletIds, "Raw_Production.outlet_id"),
    ...checkFk(dataset.raw.production, (p) => p.product_id, productIds, "Raw_Production.product_id"),
    ...checkFk(dataset.raw.sales, (s) => s.outlet_id, outletIds, "Raw_Sales.outlet_id"),
    ...checkFk(dataset.raw.sales, (s) => s.product_id, productIds, "Raw_Sales.product_id"),
    ...checkFk(dataset.raw.waste, (w) => w.outlet_id, outletIds, "Raw_Waste.outlet_id"),
    ...checkFk(dataset.raw.waste, (w) => w.product_id, productIds, "Raw_Waste.product_id"),
    ...checkFk(dataset.raw.payroll, (p) => p.employee_id, employeeIds, "Raw_Payroll.employee_id"),
  ];

  if (violations.length > 0) {
    const sample = violations.slice(0, 15).join("\n  ");
    throw new ReferentialIntegrityError(
      `Referential integrity check failed with ${violations.length} violation(s). First ${Math.min(15, violations.length)}:\n  ${sample}`,
    );
  }
}
