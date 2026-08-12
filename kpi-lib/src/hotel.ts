import type {
  BookingChannel,
  RawFnBSale,
  RawGuestFeedback,
  RawReservation,
  ReferenceRoomType,
} from "./types.js";

const notCancelled = (r: RawReservation) => r.status === "confirmed";

export function roomNightsSold(reservations: RawReservation[]): number {
  return reservations.filter(notCancelled).reduce((sum, r) => sum + r.num_nights, 0);
}

export function occupancyRate(
  reservations: RawReservation[],
  roomTypes: ReferenceRoomType[],
  periodDays: number,
): number {
  const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.total_rooms, 0);
  const availableRoomNights = totalRooms * periodDays;
  if (availableRoomNights === 0) return 0;
  return roomNightsSold(reservations) / availableRoomNights;
}

export function adr(reservations: RawReservation[]): number {
  const nights = roomNightsSold(reservations);
  if (nights === 0) return 0;
  const revenue = reservations
    .filter(notCancelled)
    .reduce((sum, r) => sum + r.rate_per_night * r.num_nights, 0);
  return revenue / nights;
}

export function revpar(
  reservations: RawReservation[],
  roomTypes: ReferenceRoomType[],
  periodDays: number,
): number {
  return adr(reservations) * occupancyRate(reservations, roomTypes, periodDays);
}

export function fnbRevenuePerOccupiedRoom(
  fnbSales: RawFnBSale[],
  reservations: RawReservation[],
): number {
  const occupiedRoomNights = roomNightsSold(reservations);
  if (occupiedRoomNights === 0) return 0;
  const revenue = fnbSales.reduce((sum, s) => sum + s.amount, 0);
  return revenue / occupiedRoomNights;
}

export function guestSatisfactionScore(guestFeedback: RawGuestFeedback[]): number {
  if (guestFeedback.length === 0) return 0;
  return guestFeedback.reduce((sum, f) => sum + f.rating, 0) / guestFeedback.length;
}

export function averageLengthOfStay(reservations: RawReservation[]): number {
  const confirmedRes = reservations.filter(notCancelled);
  if (confirmedRes.length === 0) return 0;
  return confirmedRes.reduce((sum, r) => sum + r.num_nights, 0) / confirmedRes.length;
}

export function bookingChannelMix(reservations: RawReservation[]): Record<BookingChannel, number> {
  const result: Record<BookingChannel, number> = { direct: 0, agent: 0, OTA: 0 };
  for (const r of reservations) result[r.booking_channel] += 1;
  return result;
}
