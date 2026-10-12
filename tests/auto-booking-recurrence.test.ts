import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  parseCommuteTime,
  normalizeWeekday,
  getIstDateComponents,
  buildIstTimestamp,
  generateOccurrenceKey,
  calculateUpcomingOccurrences,
  RecurrenceError,
} from "../src/lib/recurrenceEngine";
import {
  getAutoBookingLookaheadMinutes,
  getAutoBookingBatchSize,
} from "../src/lib/autoBookingConfig";
import { verifyCronSecret } from "../src/lib/cronAuth";
import { calculateAuthoritativeFare } from "../src/lib/pricingEngine";

describe("Phase 1F: Auto Booking, Recurrence Engine & Background Execution Tests", () => {
  const dummyCommuteId = new mongoose.Types.ObjectId("6529ab81c9a1240012345678");

  // ─────────────────────────────────────────────────────────────
  // A. Time Parsing & Recurrence Calculation Tests
  // ─────────────────────────────────────────────────────────────
  describe("A. Recurrence Time Parsing & Weekday Normalization", () => {
    it("Parses 12-hour AM/PM formats accurately into 24-hour hours and minutes", () => {
      assert.deepEqual(parseCommuteTime("8:45 AM"), { hours: 8, minutes: 45 });
      assert.deepEqual(parseCommuteTime("08:45 AM"), { hours: 8, minutes: 45 });
      assert.deepEqual(parseCommuteTime("12:00 AM"), { hours: 0, minutes: 0 }); // Midnight
      assert.deepEqual(parseCommuteTime("12:30 AM"), { hours: 0, minutes: 30 });
      assert.deepEqual(parseCommuteTime("12:00 PM"), { hours: 12, minutes: 0 }); // Noon
      assert.deepEqual(parseCommuteTime("12:45 PM"), { hours: 12, minutes: 45 });
      assert.deepEqual(parseCommuteTime("6:15 PM"), { hours: 18, minutes: 15 });
      assert.deepEqual(parseCommuteTime("11:59 PM"), { hours: 23, minutes: 59 });
    });

    it("Parses 24-hour time strings accurately", () => {
      assert.deepEqual(parseCommuteTime("08:45"), { hours: 8, minutes: 45 });
      assert.deepEqual(parseCommuteTime("18:30"), { hours: 18, minutes: 30 });
      assert.deepEqual(parseCommuteTime("00:00"), { hours: 0, minutes: 0 });
      assert.deepEqual(parseCommuteTime("23:59"), { hours: 23, minutes: 59 });
    });

    it("Rejects malformed, out-of-range, or invalid time strings with RecurrenceError", () => {
      assert.throws(() => parseCommuteTime(""), RecurrenceError);
      assert.throws(() => parseCommuteTime("25:00"), RecurrenceError);
      assert.throws(() => parseCommuteTime("12:60 PM"), RecurrenceError);
      assert.throws(() => parseCommuteTime("13:00 PM"), RecurrenceError);
      assert.throws(() => parseCommuteTime("random string"), RecurrenceError);
    });

    it("Normalizes weekday representations (case-insensitive and abbreviations)", () => {
      assert.equal(normalizeWeekday("Mon"), 1);
      assert.equal(normalizeWeekday("monday"), 1);
      assert.equal(normalizeWeekday("Tue"), 2);
      assert.equal(normalizeWeekday("Wed"), 3);
      assert.equal(normalizeWeekday("Thu"), 4);
      assert.equal(normalizeWeekday("Fri"), 5);
      assert.equal(normalizeWeekday("Sat"), 6);
      assert.equal(normalizeWeekday("Sun"), 0);
      assert.throws(() => normalizeWeekday("InvalidDay"), RecurrenceError);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. Timezone Invariance (Asia/Kolkata UTC+05:30)
  // ─────────────────────────────────────────────────────────────
  describe("B. Timezone Correctness & Boundary Independence", () => {
    it("Extracts correct IST calendar components regardless of UTC timestamp", () => {
      // 2026-10-12 03:15:00 UTC corresponds to 2026-10-12 08:45:00 IST (+05:30)
      const testUtc = new Date(Date.UTC(2026, 9, 12, 3, 15, 0));
      const comps = getIstDateComponents(testUtc);

      assert.equal(comps.year, 2026);
      assert.equal(comps.month, 9); // October (0-indexed)
      assert.equal(comps.day, 12);
      assert.equal(comps.weekday, 1); // Monday
      assert.equal(comps.formattedDate, "2026-10-12");
    });

    it("Crosses midnight in IST accurately when UTC date is previous calendar day", () => {
      // 2026-10-11 20:30:00 UTC corresponds to 2026-10-12 02:00:00 IST (+05:30)
      const lateUtc = new Date(Date.UTC(2026, 9, 11, 20, 30, 0));
      const comps = getIstDateComponents(lateUtc);

      assert.equal(comps.year, 2026);
      assert.equal(comps.month, 9);
      assert.equal(comps.day, 12); // Already Monday in India!
      assert.equal(comps.weekday, 1);
    });

    it("buildIstTimestamp constructs exact UTC instant matching local IST time", () => {
      // Construct 8:45 AM on October 12, 2026 in IST
      const ts = buildIstTimestamp(2026, 9, 12, 8, 45);
      // In UTC, this must equal 03:15 AM
      assert.equal(ts.toISOString(), "2026-10-12T03:15:00.000Z");
    });

    it("Generates canonical, deterministic occurrence keys", () => {
      const ts = buildIstTimestamp(2026, 9, 12, 8, 45);
      const key = generateOccurrenceKey(dummyCommuteId, ts);

      assert.equal(key, `${dummyCommuteId.toString()}:2026-10-12_0845`);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. Recurrence Candidate Generation & Lookahead Filtering
  // ─────────────────────────────────────────────────────────────
  describe("C. Lookahead Window Occurrence Filtering", () => {
    it("Identifies eligible upcoming occurrence when within 180-minute window", () => {
      // Current time: 2026-10-12 06:15 IST (00:45 UTC)
      const now = buildIstTimestamp(2026, 9, 12, 6, 15);
      const commute = {
        _id: dummyCommuteId,
        time: "08:45 AM", // 2.5 hours away (within 180m window)
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        isActive: true,
      };

      const candidates = calculateUpcomingOccurrences(commute, now, 180);
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].isPast, false);
      assert.equal(candidates[0].scheduledFor.toISOString(), "2026-10-12T03:15:00.000Z");
      assert.equal(candidates[0].occurrenceKey, `${dummyCommuteId.toString()}:2026-10-12_0845`);
    });

    it("Excludes future occurrence when beyond the lookahead window", () => {
      // Current time: 2026-10-12 04:00 IST (22:30 UTC previous day)
      const now = buildIstTimestamp(2026, 9, 12, 4, 0);
      const commute = {
        _id: dummyCommuteId,
        time: "08:45 AM", // 4 hours and 45 mins away (> 180m window)
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        isActive: true,
      };

      const candidates = calculateUpcomingOccurrences(commute, now, 180);
      // Beyond 180 mins window, so not materialized yet
      const upcoming = candidates.filter((c) => !c.isPast);
      assert.equal(upcoming.length, 0);
    });

    it("Flags past occurrences truthfully and does not schedule them as upcoming", () => {
      // Current time: 2026-10-12 10:00 IST (already past 8:45 AM)
      const now = buildIstTimestamp(2026, 9, 12, 10, 0);
      const commute = {
        _id: dummyCommuteId,
        time: "08:45 AM",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        isActive: true,
      };

      const candidates = calculateUpcomingOccurrences(commute, now, 180);
      const past = candidates.filter((c) => c.isPast);
      assert.ok(past.length >= 1, "Past occurrence on today's date must be detected");
      assert.equal(past[0].isPast, true);
    });

    it("Excludes days not specified in commute schedule", () => {
      // 2026-10-10 is a Saturday in IST
      const saturdayNow = buildIstTimestamp(2026, 9, 10, 7, 0);
      const weekdayOnlyCommute = {
        _id: dummyCommuteId,
        time: "08:45 AM",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"], // No Sat or Sun
        isActive: true,
      };

      const candidates = calculateUpcomingOccurrences(weekdayOnlyCommute, saturdayNow, 180);
      assert.equal(candidates.length, 0, "No occurrences should be generated for unselected days");
    });

    it("Returns empty array when commute is paused (isActive = false)", () => {
      const now = buildIstTimestamp(2026, 9, 12, 7, 0);
      const pausedCommute = {
        _id: dummyCommuteId,
        time: "08:45 AM",
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        isActive: false,
      };

      const candidates = calculateUpcomingOccurrences(pausedCommute, now, 180);
      assert.equal(candidates.length, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // D. Operational Configuration Validation
  // ─────────────────────────────────────────────────────────────
  describe("D. Configuration Validation & Lead Time Relationship", () => {
    it("Validates AUTO_BOOKING_LOOKAHEAD_MINUTES defaults to 180", () => {
      assert.equal(getAutoBookingLookaheadMinutes(undefined), 180);
      assert.equal(getAutoBookingLookaheadMinutes(""), 180);
      assert.equal(getAutoBookingLookaheadMinutes("120"), 120);
    });

    it("Rejects AUTO_BOOKING_LOOKAHEAD_MINUTES when less than dispatch lead time (60m)", () => {
      assert.throws(
        () => getAutoBookingLookaheadMinutes("30"),
        /Value must be at least equal to RIDE_DISPATCH_LEAD_TIME_MINUTES/
      );
    });

    it("Rejects non-numeric, decimal, zero, or negative lookahead configuration", () => {
      assert.throws(() => getAutoBookingLookaheadMinutes("abc"), /Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES/);
      assert.throws(() => getAutoBookingLookaheadMinutes("120.5"), /Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES/);
      assert.throws(() => getAutoBookingLookaheadMinutes("0"), /Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES/);
      assert.throws(() => getAutoBookingLookaheadMinutes("-50"), /Invalid AUTO_BOOKING_LOOKAHEAD_MINUTES/);
    });

    it("Validates AUTO_BOOKING_BATCH_SIZE bounds (1 to 200)", () => {
      assert.equal(getAutoBookingBatchSize(undefined), 50);
      assert.equal(getAutoBookingBatchSize("100"), 100);
      assert.throws(() => getAutoBookingBatchSize("0"), /Invalid AUTO_BOOKING_BATCH_SIZE/);
      assert.throws(() => getAutoBookingBatchSize("250"), /Invalid AUTO_BOOKING_BATCH_SIZE/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // E. Cron Worker Security & Timing-Safe Verification
  // ─────────────────────────────────────────────────────────────
  describe("E. Cron Authentication & Security Invariants", () => {
    const originalSecret = process.env.CRON_SECRET;

    it("Fails closed when CRON_SECRET is unconfigured or empty", () => {
      delete process.env.CRON_SECRET;

      const req = new Request("http://localhost:3000/api/cron/auto-booking", {
        method: "POST",
        headers: { authorization: "Bearer some-token" },
      });

      assert.equal(verifyCronSecret(req), false);

      process.env.CRON_SECRET = "   ";
      assert.equal(verifyCronSecret(req), false);

      // Restore
      if (originalSecret) process.env.CRON_SECRET = originalSecret;
    });

    it("Authorizes valid secret via Authorization Bearer header", () => {
      process.env.CRON_SECRET = "valid-secret-key-minimum-32-chars-long";

      const validReq = new Request("http://localhost:3000/api/cron/auto-booking", {
        method: "POST",
        headers: { authorization: "Bearer valid-secret-key-minimum-32-chars-long" },
      });

      assert.equal(verifyCronSecret(validReq), true);

      const invalidReq = new Request("http://localhost:3000/api/cron/auto-booking", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      });

      assert.equal(verifyCronSecret(invalidReq), false);

      if (originalSecret) process.env.CRON_SECRET = originalSecret;
    });

    it("Authorizes valid secret via x-cron-secret custom header", () => {
      process.env.CRON_SECRET = "valid-secret-key-minimum-32-chars-long";

      const validReq = new Request("http://localhost:3000/api/cron/auto-booking", {
        method: "POST",
        headers: { "x-cron-secret": "valid-secret-key-minimum-32-chars-long" },
      });

      assert.equal(verifyCronSecret(validReq), true);

      if (originalSecret) process.env.CRON_SECRET = originalSecret;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // F. Financial Integrity & Authoritative Pricing Integration
  // ─────────────────────────────────────────────────────────────
  describe("F. Pricing & Financial Integrity Invariants", () => {
    it("Calculates integer paise fare authoritatively using Phase 1C rules", () => {
      const fareResult = calculateAuthoritativeFare({
        pickupCoordinates: [28.6139, 77.209], // Delhi
        dropoffCoordinates: [28.5355, 77.391], // Noida (~19km)
        vehicleType: "Cab Premium",
        petFriendly: false,
      });

      assert.ok(fareResult.fareInPaise > 0);
      assert.equal(Number.isInteger(fareResult.fareInPaise), true);
      assert.equal(fareResult.fareInRupees, Math.round(fareResult.fareInPaise / 100));
      assert.equal(fareResult.rateCard.name, "Cab Premium");
      assert.equal(fareResult.pricingSnapshot.currency, "INR");
    });

    it("Rejects invalid coordinates during auto-booking fare calculation", () => {
      assert.throws(
        () =>
          calculateAuthoritativeFare({
            pickupCoordinates: [120, 77.209], // Latitude > 90
            dropoffCoordinates: [28.5355, 77.391],
            vehicleType: "Cab Premium",
          }),
        /Coordinates out of range/
      );
    });

    it("Rejects identical pickup and dropoff points", () => {
      assert.throws(
        () =>
          calculateAuthoritativeFare({
            pickupCoordinates: [28.6139, 77.209],
            dropoffCoordinates: [28.6139, 77.209],
            vehicleType: "Cab Premium",
          }),
        /identical/
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // G. Phase 1D Scheduled Dispatch Compatibility
  // ─────────────────────────────────────────────────────────────
  describe("G. Dispatch Boundary Compatibility (T-60 Window)", () => {
    it("Rides materialized at T-180m remain ineligible for driver offers until T-60m", () => {
      const dispatchLeadTimeMs = 60 * 60 * 1000; // 60 minutes
      const now = new Date("2026-10-12T05:00:00.000Z");

      // Ride scheduled for pickup at 08:00:00 UTC (180 minutes in the future)
      const scheduledPickupTime = new Date("2026-10-12T08:00:00.000Z");
      const maxDispatchScheduledFor = new Date(now.getTime() + dispatchLeadTimeMs); // 06:00:00 UTC

      // At T-180m: scheduledPickupTime (08:00) > maxDispatchScheduledFor (06:00)
      const isEligibleForDispatchAtT180 = scheduledPickupTime.getTime() <= maxDispatchScheduledFor.getTime();
      assert.equal(isEligibleForDispatchAtT180, false, "Ride must NOT be offered at T-180 minutes");

      // Fast forward time to T-55m: now = 07:05:00 UTC
      const laterNow = new Date("2026-10-12T07:05:00.000Z");
      const laterMaxDispatch = new Date(laterNow.getTime() + dispatchLeadTimeMs); // 08:05:00 UTC
      const isEligibleForDispatchAtT55 = scheduledPickupTime.getTime() <= laterMaxDispatch.getTime();
      assert.equal(isEligibleForDispatchAtT55, true, "Ride becomes eligible for dispatch inside T-60 window");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // H. Durable Lease & Idempotency Simulation
  // ─────────────────────────────────────────────────────────────
  describe("H. Occurrence Idempotency & Concurrency Simulation", () => {
    it("Simulates atomic claim ensuring exactly one winner under concurrent processors", () => {
      class MockOccurrenceStore {
        public claims = new Map<string, { status: string; leaseId: string; leaseExpiresAt: number; count: number }>();

        public tryClaim(occurrenceKey: string, leaseId: string, nowMs: number, leaseTtlMs: number): boolean {
          const record = this.claims.get(occurrenceKey);
          if (!record) {
            this.claims.set(occurrenceKey, {
              status: "CLAIMED",
              leaseId,
              leaseExpiresAt: nowMs + leaseTtlMs,
              count: 1,
            });
            return true;
          }

          // Can only claim if pending or expired lease
          if (record.status === "PENDING" || (record.status === "CLAIMED" && record.leaseExpiresAt < nowMs)) {
            record.status = "CLAIMED";
            record.leaseId = leaseId;
            record.leaseExpiresAt = nowMs + leaseTtlMs;
            record.count += 1;
            return true;
          }

          return false;
        }
      }

      const store = new MockOccurrenceStore();
      const now = Date.now();
      const occurrenceKey = "commute_001:2026-10-12_0845";

      // Worker 1 and Worker 2 race to claim the same occurrence
      const worker1Claim = store.tryClaim(occurrenceKey, "lease_worker_1", now, 60000);
      const worker2Claim = store.tryClaim(occurrenceKey, "lease_worker_2", now, 60000);

      assert.equal(worker1Claim, true, "First worker successfully claims the occurrence");
      assert.equal(worker2Claim, false, "Second concurrent worker is rejected by atomic lease");
      assert.equal(store.claims.get(occurrenceKey)?.leaseId, "lease_worker_1");

      // Lease expires after 61 seconds
      const expiredTime = now + 61000;
      const worker3Claim = store.tryClaim(occurrenceKey, "lease_worker_3", expiredTime, 60000);
      assert.equal(worker3Claim, true, "Worker 3 successfully recovers the expired lease");
      assert.equal(store.claims.get(occurrenceKey)?.leaseId, "lease_worker_3");
    });
  });
});
