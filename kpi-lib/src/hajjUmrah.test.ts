import { describe, expect, it } from "vitest";
import {
  cancellationRefundRate,
  customerSatisfactionNPS,
  packageRevenueByTier,
  pilgrimsServedBySeason,
} from "./hajjUmrah.js";
import type { RawBooking, RawCustomerFeedback } from "./types.js";

function booking(overrides: Partial<RawBooking>): RawBooking {
  return {
    booking_id: "B1",
    date_booked: "2025-01-01",
    pilgrim_name: "Test Pilgrim",
    customer_id: "C1",
    package_tier: "Standard",
    package_price: 3000,
    num_pax: 1,
    agent_id: null,
    status: "confirmed",
    departure_group_id: "D1",
    payment_status: "paid",
    amount_paid: 3000,
    season: "Hajj",
    inquiry_source: "website",
    ...overrides,
  };
}

describe("★ Pilgrims Served", () => {
  it("sums num_pax for confirmed bookings, grouped by season", () => {
    const bookings = [
      booking({ num_pax: 2, season: "Hajj", status: "confirmed" }),
      booking({ num_pax: 3, season: "Hajj", status: "confirmed" }),
      booking({ num_pax: 5, season: "Hajj", status: "cancelled" }), // excluded
      booking({ num_pax: 4, season: "Umrah", status: "confirmed" }),
    ];
    expect(pilgrimsServedBySeason(bookings)).toEqual({ Hajj: 5, Umrah: 4 });
  });
});

describe("★ Package Revenue by Tier", () => {
  it("sums amount_paid grouped by package_tier", () => {
    const bookings = [
      booking({ package_tier: "Economy", amount_paid: 1000 }),
      booking({ package_tier: "Economy", amount_paid: 1500 }),
      booking({ package_tier: "VIP", amount_paid: 9000 }),
    ];
    expect(packageRevenueByTier(bookings)).toEqual({ Economy: 2500, Standard: 0, VIP: 9000 });
  });
});

describe("★ Cancellation / Refund Rate", () => {
  it("computes (cancelled + refunded) / total", () => {
    const bookings = [
      booking({ status: "confirmed" }),
      booking({ status: "confirmed" }),
      booking({ status: "cancelled" }),
      booking({ status: "refunded" }),
    ];
    expect(cancellationRefundRate(bookings)).toBe(0.5);
  });
});

describe("★ Customer Satisfaction (NPS)", () => {
  it("computes %promoters(9-10) - %detractors(0-6)", () => {
    const feedback: RawCustomerFeedback[] = [
      { booking_id: "B1", nps_score: 10, survey_date: "2025-01-01", comments: "" }, // promoter
      { booking_id: "B2", nps_score: 9, survey_date: "2025-01-01", comments: "" }, // promoter
      { booking_id: "B3", nps_score: 7, survey_date: "2025-01-01", comments: "" }, // passive
      { booking_id: "B4", nps_score: 3, survey_date: "2025-01-01", comments: "" }, // detractor
    ];
    // promoters = 2/4 = 50%, detractors = 1/4 = 25% -> NPS = 25
    expect(customerSatisfactionNPS(feedback)).toBe(25);
  });
});
