import { describe, expect, it } from "vitest";
import { adr, occupancyRate, revpar } from "./hotel.js";
import type { RawReservation, ReferenceRoomType } from "./types.js";

function reservation(overrides: Partial<RawReservation>): RawReservation {
  return {
    reservation_id: "R1",
    checkin_date: "2025-01-01",
    checkout_date: "2025-01-03",
    room_type: "Standard",
    rate_per_night: 100,
    num_nights: 2,
    booking_channel: "direct",
    guest_id: "G1",
    status: "confirmed",
    ...overrides,
  };
}

const roomTypes: ReferenceRoomType[] = [{ room_type: "Standard", total_rooms: 10, standard_rate: 100 }];

describe("★ Occupancy Rate", () => {
  it("computes room-nights sold / (total_rooms * days)", () => {
    // 10 rooms * 30 days = 300 available room-nights
    const reservations = [
      reservation({ num_nights: 3, status: "confirmed" }),
      reservation({ num_nights: 3, status: "confirmed" }),
      reservation({ num_nights: 10, status: "cancelled" }), // excluded
    ];
    expect(occupancyRate(reservations, roomTypes, 30)).toBeCloseTo(6 / 300);
  });
});

describe("★ ADR", () => {
  it("computes SUM(rate*nights) / room-nights sold", () => {
    const reservations = [
      reservation({ rate_per_night: 100, num_nights: 2 }), // 200
      reservation({ rate_per_night: 150, num_nights: 1 }), // 150
    ];
    // total revenue 350, total nights 3 -> 116.67
    expect(adr(reservations)).toBeCloseTo(350 / 3);
  });
});

describe("★ RevPAR", () => {
  it("computes ADR * Occupancy Rate", () => {
    const reservations = [reservation({ rate_per_night: 100, num_nights: 3, status: "confirmed" })];
    const expectedAdr = 100;
    const expectedOcc = 3 / (10 * 30);
    expect(revpar(reservations, roomTypes, 30)).toBeCloseTo(expectedAdr * expectedOcc);
  });
});
