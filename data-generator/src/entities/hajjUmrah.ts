import { faker } from "@faker-js/faker";
import type {
  PackageTier,
  RawBooking,
  RawCustomerFeedback,
  RawDeparture,
  RawInquiry,
  RawVisaPermit,
  ReferenceAgent,
  ReferencePackagePriceListEntry,
  Season,
} from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { ANOMALY_MONTHS, FISCAL_YEAR_START, HAJJ_SEASON, UMRAH_HIGH_SEASON_WINDOWS, VOLUME } from "../config.js";
import { eachDay, isInAnyWindow, monthOf } from "../dates.js";

const INQUIRY_SOURCES = ["Facebook Ads", "Instagram", "Referral", "Walk-in", "Website", "WhatsApp", "Radio"];
const TIER_WEIGHTS: Array<{ value: PackageTier; weight: number }> = [
  { value: "Economy", weight: 0.5 },
  { value: "Standard", weight: 0.35 },
  { value: "VIP", weight: 0.15 },
];

function isAnomalyMonth(dateIso: string): boolean {
  return monthOf(dateIso) === ANOMALY_MONTHS.HajjUmrah;
}

export function generateDepartures(rng: Rng): RawDeparture[] {
  const departures: RawDeparture[] = [];
  let counter = 1;

  const hajjDays = eachDay(HAJJ_SEASON.start, HAJJ_SEASON.end);
  const hajjDepartureDates = [hajjDays[1], hajjDays[4], hajjDays[8], hajjDays[12]].filter(Boolean);
  for (const date of hajjDepartureDates) {
    departures.push({
      departure_group_id: `DEP${String(counter++).padStart(3, "0")}`,
      departure_date: date,
      season: "Hajj",
      capacity: rng.int(180, 260),
      destination: "Makkah",
    });
  }

  // A Umrah departure roughly every 8-10 days across the fiscal year.
  let cursor = "2025-01-05";
  while (cursor <= "2025-12-25") {
    const inHighSeason = isInAnyWindow(cursor, UMRAH_HIGH_SEASON_WINDOWS);
    const baseCapacity = rng.int(50, 90);
    departures.push({
      departure_group_id: `DEP${String(counter++).padStart(3, "0")}`,
      departure_date: cursor,
      season: "Umrah",
      capacity: inHighSeason ? Math.round(baseCapacity * 1.5) : baseCapacity,
      destination: "Makkah & Madinah",
    });
    const gapDays = rng.int(7, 11);
    const next = new Date(`${cursor}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + gapDays);
    cursor = next.toISOString().slice(0, 10);
  }

  return departures.sort((a, b) => a.departure_date.localeCompare(b.departure_date));
}

export interface HajjUmrahBookingResult {
  bookings: RawBooking[];
  inquiries: RawInquiry[];
  visaPermits: RawVisaPermit[];
  customerFeedback: RawCustomerFeedback[];
}

function daysBefore(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysAfter(dateIso: string, days: number): string {
  return daysBefore(dateIso, -days);
}

function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

export function generateHajjUmrahData(
  rng: Rng,
  departures: RawDeparture[],
  agents: ReferenceAgent[],
  priceList: ReferencePackagePriceListEntry[],
): HajjUmrahBookingResult {
  const bookings: RawBooking[] = [];
  const inquiries: RawInquiry[] = [];
  const visaPermits: RawVisaPermit[] = [];
  const customerFeedback: RawCustomerFeedback[] = [];

  const priceByTierSeason = new Map(priceList.map((p) => [`${p.package_tier}::${p.season}`, p.base_price]));
  const customerPool: string[] = [];
  const nameByCustomerId = new Map<string, string>();
  let bookingCounter = 1;
  let inquiryCounter = 1;
  let customerCounter = 1;

  for (const departure of departures) {
    const anomalous = isAnomalyMonth(departure.departure_date);
    const fillRate = anomalous ? rng.float(0.35, 0.55) : rng.float(0.65, 0.95);
    const targetPax = Math.round(departure.capacity * fillRate);
    let paxAssigned = 0;

    while (paxAssigned < targetPax) {
      const numPax = Math.min(rng.int(1, 4), targetPax - paxAssigned);
      paxAssigned += numPax;

      const reuseExisting = customerPool.length > 5 && rng.bool(0.18);
      const customerId = reuseExisting ? rng.pick(customerPool) : `CUS${String(customerCounter++).padStart(4, "0")}`;
      if (!reuseExisting) {
        customerPool.push(customerId);
        nameByCustomerId.set(customerId, faker.person.fullName());
      }
      const pilgrimName = nameByCustomerId.get(customerId)!;

      const tier = rng.weightedPick(TIER_WEIGHTS);
      const basePrice = priceByTierSeason.get(`${tier}::${departure.season}`) ?? 2000;
      const packagePrice = Math.round(basePrice * rng.float(0.95, 1.08));

      const cancelRate = anomalous ? 0.22 : 0.07;
      const roll = rng.next();
      const status: RawBooking["status"] = roll < cancelRate * 0.6 ? "cancelled" : roll < cancelRate ? "refunded" : "confirmed";

      const paymentRoll = rng.next();
      const paymentStatus: RawBooking["payment_status"] =
        status !== "confirmed" ? "unpaid" : paymentRoll < 0.65 ? "paid" : paymentRoll < 0.88 ? "partial" : "unpaid";
      const totalDue = packagePrice * numPax;
      const amountPaid =
        paymentStatus === "paid" ? totalDue : paymentStatus === "partial" ? Math.round(totalDue * rng.float(0.3, 0.7)) : 0;

      const bookedDaysBefore = rng.int(10, 150);
      // Clamp into the fiscal year: keeps every raw event inside the single
      // fiscal year this dataset models, so revenue never falls in an
      // out-of-range month that Summary_Monthly wouldn't pick up.
      const dateBooked = maxDate(daysBefore(departure.departure_date, bookedDaysBefore), FISCAL_YEAR_START);
      const inquirySource = rng.pick(INQUIRY_SOURCES);
      const agentId = rng.bool(0.55) ? rng.pick(agents).agent_id : null;

      const bookingId = `BK${String(bookingCounter++).padStart(5, "0")}`;
      bookings.push({
        booking_id: bookingId,
        date_booked: dateBooked,
        pilgrim_name: pilgrimName,
        customer_id: customerId,
        package_tier: tier,
        package_price: packagePrice,
        num_pax: numPax,
        agent_id: agentId,
        status,
        departure_group_id: departure.departure_group_id,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        season: departure.season,
        inquiry_source: inquirySource,
      });

      inquiries.push({
        inquiry_id: `INQ${String(inquiryCounter++).padStart(6, "0")}`,
        date: maxDate(daysBefore(dateBooked, rng.int(1, 10)), FISCAL_YEAR_START),
        source: inquirySource,
        package_tier_interest: tier,
        season: departure.season,
        converted_booking_id: status === "cancelled" ? null : bookingId,
      });

      if (status !== "cancelled") {
        const visaBase = departure.season === "Hajj" ? 450 : 180;
        visaPermits.push({
          booking_id: bookingId,
          visa_cost: Math.round(visaBase * numPax * rng.float(0.9, 1.1)),
          permit_cost: Math.round(visaBase * 0.3 * numPax * rng.float(0.9, 1.1)),
          processed_date: daysAfter(dateBooked, rng.int(3, 20)),
        });
      }

      if (status === "confirmed" && rng.bool(0.4)) {
        const npsRoll = rng.next();
        const npsScore = npsRoll < 0.55 ? rng.int(9, 10) : npsRoll < 0.8 ? rng.int(7, 8) : rng.int(0, 6);
        customerFeedback.push({
          booking_id: bookingId,
          nps_score: npsScore,
          survey_date: daysAfter(departure.departure_date, rng.int(1, 14)),
          comments: faker.lorem.sentence(),
        });
      }
    }
  }

  // Non-converting inquiries — brings the total inquiry pool up to the
  // configured inquiry:booking ratio so Booking Conversion Rate is meaningful.
  const targetInquiryCount = Math.round(bookings.length * VOLUME.hajjUmrah.inquiryToBookingRatio);
  while (inquiries.length < targetInquiryCount) {
    const season: Season = rng.bool(0.4) ? "Hajj" : "Umrah";
    inquiries.push({
      inquiry_id: `INQ${String(inquiryCounter++).padStart(6, "0")}`,
      date: rng.pick(eachDayCache()),
      source: rng.pick(INQUIRY_SOURCES),
      package_tier_interest: rng.weightedPick(TIER_WEIGHTS),
      season,
      converted_booking_id: null,
    });
  }

  return { bookings, inquiries, visaPermits, customerFeedback };
}

let cachedDays: string[] | null = null;
function eachDayCache(): string[] {
  if (!cachedDays) cachedDays = eachDay("2025-01-01", "2025-12-31");
  return cachedDays;
}
