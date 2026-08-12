import type {
  PackageTier,
  RawBooking,
  RawCustomerFeedback,
  RawDeparture,
  RawInquiry,
  RawVisaPermit,
  Season,
} from "./types.js";

const confirmed = (b: RawBooking) => b.status === "confirmed";

export function pilgrimsServedBySeason(bookings: RawBooking[]): Record<Season, number> {
  const result: Record<Season, number> = { Hajj: 0, Umrah: 0 };
  for (const b of bookings) if (confirmed(b)) result[b.season] += b.num_pax;
  return result;
}

export function pilgrimsServedTotal(bookings: RawBooking[]): number {
  return bookings.filter(confirmed).reduce((sum, b) => sum + b.num_pax, 0);
}

export function packageRevenueByTier(bookings: RawBooking[]): Record<PackageTier, number> {
  const result: Record<PackageTier, number> = { Economy: 0, Standard: 0, VIP: 0 };
  for (const b of bookings) result[b.package_tier] += b.amount_paid;
  return result;
}

export function averageRevenuePerPilgrim(bookings: RawBooking[]): number {
  const pilgrims = pilgrimsServedTotal(bookings);
  if (pilgrims === 0) return 0;
  const revenue = bookings.filter(confirmed).reduce((sum, b) => sum + b.amount_paid, 0);
  return revenue / pilgrims;
}

export function bookingConversionRate(bookings: RawBooking[], inquiries: RawInquiry[]): number {
  if (inquiries.length === 0) return 0;
  return bookings.filter(confirmed).length / inquiries.length;
}

export function cancellationRefundRate(bookings: RawBooking[]): number {
  if (bookings.length === 0) return 0;
  const count = bookings.filter((b) => b.status === "cancelled" || b.status === "refunded").length;
  return count / bookings.length;
}

export function visaPermitCostPerPilgrim(
  visaPermits: RawVisaPermit[],
  bookings: RawBooking[],
): number {
  const bookingById = new Map(bookings.map((b) => [b.booking_id, b]));
  let totalCost = 0;
  let pilgrimsProcessed = 0;
  for (const vp of visaPermits) {
    const booking = bookingById.get(vp.booking_id);
    if (!booking) continue;
    totalCost += vp.visa_cost + vp.permit_cost;
    pilgrimsProcessed += booking.num_pax;
  }
  return pilgrimsProcessed === 0 ? 0 : totalCost / pilgrimsProcessed;
}

export function departureFillRateOverall(
  bookings: RawBooking[],
  departures: RawDeparture[],
): number {
  const paxByDeparture = new Map<string, number>();
  for (const b of bookings) {
    if (!confirmed(b)) continue;
    paxByDeparture.set(
      b.departure_group_id,
      (paxByDeparture.get(b.departure_group_id) ?? 0) + b.num_pax,
    );
  }
  const totalPax = departures.reduce(
    (sum, d) => sum + (paxByDeparture.get(d.departure_group_id) ?? 0),
    0,
  );
  const totalCapacity = departures.reduce((sum, d) => sum + d.capacity, 0);
  return totalCapacity === 0 ? 0 : totalPax / totalCapacity;
}

export function departureFillRateByGroup(
  bookings: RawBooking[],
  departures: RawDeparture[],
): Array<{ departure_group_id: string; fillRate: number }> {
  const paxByDeparture = new Map<string, number>();
  for (const b of bookings) {
    if (!confirmed(b)) continue;
    paxByDeparture.set(
      b.departure_group_id,
      (paxByDeparture.get(b.departure_group_id) ?? 0) + b.num_pax,
    );
  }
  return departures.map((d) => ({
    departure_group_id: d.departure_group_id,
    fillRate: d.capacity === 0 ? 0 : (paxByDeparture.get(d.departure_group_id) ?? 0) / d.capacity,
  }));
}

export function customerSatisfactionNPS(feedback: RawCustomerFeedback[]): number {
  if (feedback.length === 0) return 0;
  const promoters = feedback.filter((f) => f.nps_score >= 9).length;
  const detractors = feedback.filter((f) => f.nps_score <= 6).length;
  return ((promoters - detractors) / feedback.length) * 100;
}

export function repeatCustomerRate(bookings: RawBooking[]): number {
  const seasonsByCustomer = new Map<string, Set<Season>>();
  for (const b of bookings) {
    if (!seasonsByCustomer.has(b.customer_id)) seasonsByCustomer.set(b.customer_id, new Set());
    seasonsByCustomer.get(b.customer_id)!.add(b.season);
  }
  if (seasonsByCustomer.size === 0) return 0;
  const repeatCount = [...seasonsByCustomer.values()].filter((seasons) => seasons.size > 1).length;
  return repeatCount / seasonsByCustomer.size;
}
