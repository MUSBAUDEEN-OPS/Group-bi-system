import type { RawBooking, RawDeparture, RawFnBSale, RawReservation, RawSale } from "../types.js";
import { monthOf } from "../dateUtils.js";

function bucketByMonth(entries: Array<[string, number]>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [month, value] of entries) result[month] = (result[month] ?? 0) + value;
  return result;
}

// Bucketed by the *departure* month, not date_booked — bookings are made
// 10-150 days ahead of travel, so booking-date bucketing would smear the
// Hajj-season spike across the months before it instead of showing it in
// the season itself (brief §7 requires the spike to actually be visible).
export function departureMonthLookup(departures: RawDeparture[]): Map<string, string> {
  return new Map(departures.map((d) => [d.departure_group_id, monthOf(d.departure_date)]));
}

export function monthlyHajjUmrahRevenue(bookings: RawBooking[], departures: RawDeparture[]): Record<string, number> {
  const departureMonth = departureMonthLookup(departures);
  return bucketByMonth(
    bookings.map((b) => [departureMonth.get(b.departure_group_id) ?? monthOf(b.date_booked), b.amount_paid]),
  );
}

export function monthlyHotelRoomRevenue(reservations: RawReservation[]): Record<string, number> {
  return bucketByMonth(
    reservations
      .filter((r) => r.status === "confirmed")
      .map((r) => [monthOf(r.checkin_date), r.rate_per_night * r.num_nights]),
  );
}

export function monthlyHotelFnbRevenue(fnbSales: RawFnBSale[]): Record<string, number> {
  return bucketByMonth(fnbSales.map((s) => [monthOf(s.date), s.amount]));
}

export function monthlyBakeryRevenue(sales: RawSale[]): Record<string, number> {
  return bucketByMonth(sales.map((s) => [monthOf(s.date), s.units_sold * s.unit_price]));
}
