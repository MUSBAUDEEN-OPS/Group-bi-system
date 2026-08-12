import type {
  BookingChannel,
  RawFnBSale,
  RawGuestFeedback,
  RawReservation,
  ReferenceRoomType,
} from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { ANOMALY_MONTHS, FISCAL_YEAR_END, FISCAL_YEAR_START, VOLUME } from "../config.js";
import { eachDay, isWeekend, monthOf } from "../dates.js";

const AVG_LENGTH_OF_STAY = 2.2;
const NIGHTS_WEIGHTS = [
  { value: 1, weight: 0.35 },
  { value: 2, weight: 0.3 },
  { value: 3, weight: 0.2 },
  { value: 4, weight: 0.1 },
  { value: 5, weight: 0.03 },
  { value: 6, weight: 0.01 },
  { value: 7, weight: 0.01 },
];
const CHANNEL_WEIGHTS: Array<{ value: BookingChannel; weight: number }> = [
  { value: "direct", weight: 0.4 },
  { value: "agent", weight: 0.25 },
  { value: "OTA", weight: 0.35 },
];
const STATUS_WEIGHTS: Array<{ value: RawReservation["status"]; weight: number }> = [
  { value: "confirmed", weight: 0.9 },
  { value: "cancelled", weight: 0.06 },
  { value: "no_show", weight: 0.04 },
];

function addNights(dateIso: string, nights: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + nights);
  return d.toISOString().slice(0, 10);
}

export interface HotelDataResult {
  reservations: RawReservation[];
  fnbSales: RawFnBSale[];
  guestFeedback: RawGuestFeedback[];
}

export function generateHotelData(rng: Rng, roomTypes: ReferenceRoomType[]): HotelDataResult {
  const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.total_rooms, 0);
  const roomTypeWeights = roomTypes.map((rt) => ({ value: rt, weight: rt.total_rooms }));

  const reservations: RawReservation[] = [];
  const fnbSales: RawFnBSale[] = [];
  const guestFeedback: RawGuestFeedback[] = [];
  let resCounter = 1;
  let guestCounter = 1;
  const returningGuestPool: string[] = [];

  for (const day of eachDay(FISCAL_YEAR_START, FISCAL_YEAR_END)) {
    const weekend = isWeekend(day);
    const baseOcc = weekend ? VOLUME.hotel.baseWeekendOccupancy : VOLUME.hotel.baseWeekdayOccupancy;
    const seasonal = (VOLUME.hotel.seasonalPeakMonths as readonly string[]).includes(monthOf(day))
      ? VOLUME.hotel.seasonalPeakMultiplier
      : 1;
    const anomaly = monthOf(day) === ANOMALY_MONTHS.Hotel ? 0.72 : 1;
    const targetOcc = Math.min(baseOcc * seasonal * anomaly, 0.98);
    const newReservationsToday = Math.max(0, Math.round((totalRooms * targetOcc) / AVG_LENGTH_OF_STAY));

    for (let i = 0; i < newReservationsToday; i++) {
      const roomType = rng.weightedPick(roomTypeWeights);
      const numNights = rng.weightedPick(NIGHTS_WEIGHTS);
      const status = rng.weightedPick(STATUS_WEIGHTS);
      const ratePerNight = Math.round(roomType.standard_rate * rng.float(0.9, 1.15));
      const guestId = rng.bool(0.15) && returningGuestPool.length > 3
        ? rng.pick(returningGuestPool)
        : `GST${String(guestCounter++).padStart(5, "0")}`;
      if (!returningGuestPool.includes(guestId)) returningGuestPool.push(guestId);

      const reservationId = `RES${String(resCounter++).padStart(6, "0")}`;
      reservations.push({
        reservation_id: reservationId,
        checkin_date: day,
        checkout_date: addNights(day, numNights),
        room_type: roomType.room_type,
        rate_per_night: ratePerNight,
        num_nights: numNights,
        booking_channel: rng.weightedPick(CHANNEL_WEIGHTS),
        guest_id: guestId,
        status,
      });

      if (status === "confirmed") {
        if (rng.bool(0.7)) {
          fnbSales.push({
            date: day,
            reservation_id: reservationId,
            amount: Math.round(rng.float(15, 60) * numNights),
          });
        }
        if (rng.bool(0.35)) {
          const ratingRoll = rng.next();
          const rating = ratingRoll < 0.6 ? rng.int(4, 5) : ratingRoll < 0.85 ? 3 : rng.int(1, 2);
          guestFeedback.push({
            reservation_id: reservationId,
            rating,
            date: addNights(day, numNights + rng.int(0, 3)),
          });
        }
      }
    }

    // Walk-in F&B (restaurant/cafe guests with no room reservation).
    const walkIns = rng.int(4, 18);
    for (let i = 0; i < walkIns; i++) {
      fnbSales.push({ date: day, reservation_id: null, amount: Math.round(rng.float(8, 40)) });
    }
  }

  return { reservations, fnbSales, guestFeedback };
}
