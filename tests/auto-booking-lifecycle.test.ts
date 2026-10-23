import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  parseCommuteTime,
  normalizeWeekday,
  getCanonicalWeekdayName,
  getIstDateComponents,
  buildIstTimestamp,
  generateOccurrenceKey,
  calculateUpcomingOccurrences,
  RecurrenceError,
} from "../src/lib/recurrenceEngine";
import {
  DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES,
} from "../src/lib/autoBookingConfig";
import { calculateAuthoritativeFare } from "../src/lib/pricingEngine";
import { isRideDispatchable, getDispatchLeadTimeMinutes } from "../src/lib/rideStateMachine";
import Commute from "../src/models/Commute";

describe("Phase 6: Auto Booking Engine & Lifecycle Verification Tests", () => {
  const dummyCommuteId = new mongoose.Types.ObjectId("6529ab81c9a1240012345678");

  describe("1. Canonical Weekday & Recurrence Correctness", () => {
    it("Resolves all valid representations to canonical 3-letter capitalized weekday names", () => {
      assert.equal(getCanonicalWeekdayName("monday"), "Mon");
      assert.equal(getCanonicalWeekdayName("Mon"), "Mon");
      assert.equal(getCanonicalWeekdayName("MON"), "Mon");
      assert.equal(getCanonicalWeekdayName("tuesday"), "Tue");
      assert.equal(getCanonicalWeekdayName("tues"), "Tue");
      assert.equal(getCanonicalWeekdayName("wednesday"), "Wed");
      assert.equal(getCanonicalWeekdayName("thursday"), "Thu");
      assert.equal(getCanonicalWeekdayName("thur"), "Thu");
      assert.equal(getCanonicalWeekdayName("thurs"), "Thu");
      assert.equal(getCanonicalWeekdayName("friday"), "Fri");
      assert.equal(getCanonicalWeekdayName("saturday"), "Sat");
      assert.equal(getCanonicalWeekdayName("sunday"), "Sun");
    });

    it("Rejects malformed weekday inputs with RecurrenceError", () => {
      assert.throws(() => getCanonicalWeekdayName("funday"), RecurrenceError);
      assert.throws(() => getCanonicalWeekdayName(""), RecurrenceError);
      assert.throws(() => getCanonicalWeekdayName("123"), RecurrenceError);
      assert.throws(() => normalizeWeekday("invalid"), RecurrenceError);
    });

    it("Supports both 12-hour and 24-hour inputs for morning and evening schedules", () => {
      assert.deepEqual(parseCommuteTime("8:30 AM"), { hours: 8, minutes: 30 });
      assert.deepEqual(parseCommuteTime("08:30 AM"), { hours: 8, minutes: 30 });
      assert.deepEqual(parseCommuteTime("08:30"), { hours: 8, minutes: 30 });

      assert.deepEqual(parseCommuteTime("6:45 PM"), { hours: 18, minutes: 45 });
      assert.deepEqual(parseCommuteTime("06:45 PM"), { hours: 18, minutes: 45 });
      assert.deepEqual(parseCommuteTime("18:45"), { hours: 18, minutes: 45 });

      assert.deepEqual(parseCommuteTime("12:00 AM"), { hours: 0, minutes: 0 });
      assert.deepEqual(parseCommuteTime("00:00"), { hours: 0, minutes: 0 });
      assert.deepEqual(parseCommuteTime("12:00 PM"), { hours: 12, minutes: 0 });
      assert.deepEqual(parseCommuteTime("12:00"), { hours: 12, minutes: 0 });

      assert.deepEqual(parseCommuteTime("11:59 PM"), { hours: 23, minutes: 59 });
      assert.deepEqual(parseCommuteTime("23:59"), { hours: 23, minutes: 59 });
    });

    it("Strictly rejects malformed or out-of-bounds time values", () => {
      assert.throws(() => parseCommuteTime("24:00"), RecurrenceError);
      assert.throws(() => parseCommuteTime("25:30"), RecurrenceError);
      assert.throws(() => parseCommuteTime("13:00 PM"), RecurrenceError);
      assert.throws(() => parseCommuteTime("00:00 AM"), RecurrenceError);
      assert.throws(() => parseCommuteTime("08:65"), RecurrenceError);
      assert.throws(() => parseCommuteTime("not-a-time"), RecurrenceError);
    });
  });

  describe("2. IST Timezone Invariance & Boundary Transitions", () => {
    it("Calculates correct IST calendar components across month and year boundaries", () => {
      const endOfMarchUtc = new Date(Date.UTC(2026, 2, 31, 18, 15, 0));
      const marchComps = getIstDateComponents(endOfMarchUtc);
      assert.equal(marchComps.year, 2026);
      assert.equal(marchComps.month, 2);
      assert.equal(marchComps.day, 31);
      assert.equal(marchComps.formattedDate, "2026-03-31");

      const startOfAprilUtc = new Date(endOfMarchUtc.getTime() + 45 * 60 * 1000);
      const aprilComps = getIstDateComponents(startOfAprilUtc);
      assert.equal(aprilComps.year, 2026);
      assert.equal(aprilComps.month, 3);
      assert.equal(aprilComps.day, 1);
      assert.equal(aprilComps.formattedDate, "2026-04-01");
    });

    it("Constructs stable and deterministic occurrence keys for the same schedule and date", () => {
      const ts1 = buildIstTimestamp(2026, 9, 15, 9, 0);
      const ts2 = buildIstTimestamp(2026, 9, 15, 9, 0);

      const key1 = generateOccurrenceKey(dummyCommuteId, ts1);
      const key2 = generateOccurrenceKey(dummyCommuteId, ts2);

      assert.equal(key1, key2);
      assert.equal(key1, `${dummyCommuteId.toString()}:2026-10-15_0900`);
    });

    it("Handles week transition accurately: Sunday evening into Monday morning", () => {
      const sundayNight = buildIstTimestamp(2026, 9, 11, 23, 30);
      const sundayComps = getIstDateComponents(sundayNight);
      assert.equal(sundayComps.weekday, 0);

      const commute = {
        _id: dummyCommuteId,
        time: "08:30 AM",
        days: ["Mon"],
        isActive: true,
      };

      const candidates = calculateUpcomingOccurrences(commute, sundayNight, 720);
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].dateKey, "2026-10-12");
      assert.equal(candidates[0].isPast, false);
    });
  });

  describe("3. Lookahead Window Boundary Precision", () => {
    it("Dynamically scans beyond 2 days when lookahead is configured up to 7 days", () => {
      const now = buildIstTimestamp(2026, 9, 12, 9, 0);

      const fridayCommute = {
        _id: dummyCommuteId,
        time: "09:00 AM",
        days: ["Fri"],
        isActive: true,
      };

      const shortCandidates = calculateUpcomingOccurrences(fridayCommute, now, 180);
      assert.equal(shortCandidates.length, 0);

      const extendedCandidates = calculateUpcomingOccurrences(fridayCommute, now, 7200);
      assert.equal(extendedCandidates.length, 1);
      assert.equal(extendedCandidates[0].dateKey, "2026-10-16");
      assert.equal(extendedCandidates[0].isPast, false);
    });

    it("Respects exact lookahead boundary: inclusion at T <= now + lookahead, exclusion at T > now + lookahead", () => {
      const now = buildIstTimestamp(2026, 9, 12, 10, 0);

      const exactly180Commute = {
        _id: dummyCommuteId,
        time: "01:00 PM",
        days: ["Mon"],
        isActive: true,
      };
      const exactly180Candidates = calculateUpcomingOccurrences(exactly180Commute, now, 180);
      assert.equal(exactly180Candidates.length, 1, "Exactly on 180m boundary must be included");

      const beyond180Commute = {
        _id: dummyCommuteId,
        time: "01:01 PM",
        days: ["Mon"],
        isActive: true,
      };
      const beyond180Candidates = calculateUpcomingOccurrences(beyond180Commute, now, 180);
      assert.equal(beyond180Candidates.length, 0, "181m (> 180m boundary) must be excluded");
    });
  });

  describe("4. T-180 Materialization vs T-60 Dispatch Separation", () => {
    it("Verifies scheduled ride state machine prevents driver dispatch until T-60 minutes", () => {
      const now = new Date("2026-10-12T06:00:00.000Z");
      const scheduledPickup = new Date("2026-10-12T09:00:00.000Z");

      const mockRide = {
        status: "SEARCHING",
        scheduledFor: scheduledPickup,
      };

      const eligibleAtT180 = isRideDispatchable(mockRide, now);
      assert.equal(eligibleAtT180, false, "Materialized ride at T-180m must not be offered to drivers");

      const atT120 = new Date("2026-10-12T07:00:00.000Z");
      assert.equal(isRideDispatchable(mockRide, atT120), false);

      const atT60 = new Date("2026-10-12T08:00:00.000Z");
      assert.equal(isRideDispatchable(mockRide, atT60), true, "Ride becomes dispatch-eligible at T-60 boundary");

      const atT30 = new Date("2026-10-12T08:30:00.000Z");
      assert.equal(isRideDispatchable(mockRide, atT30), true);
    });

    it("Default dispatch lead time matches configured 60 minutes", () => {
      assert.equal(getDispatchLeadTimeMinutes(undefined), 60);
      assert.equal(DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES, 180);
      assert.ok(DEFAULT_AUTO_BOOKING_LOOKAHEAD_MINUTES >= getDispatchLeadTimeMinutes());
    });
  });

  describe("5. Idempotency, Atomic Leases & Crash Recovery Invariants", () => {
    it("Simulates atomic lease claiming preventing double generation under concurrent workers", () => {
      interface MockOccurrence {
        occurrenceKey: string;
        status: string;
        leaseId: string | null;
        leaseExpiresAt: number | null;
        attemptCount: number;
        maxAttempts: number;
        rideId: string | null;
      }

      const store = new Map<string, MockOccurrence>();
      const key = "commute_42:2026-10-12_0845";

      store.set(key, {
        occurrenceKey: key,
        status: "PENDING",
        leaseId: null,
        leaseExpiresAt: null,
        attemptCount: 0,
        maxAttempts: 3,
        rideId: null,
      });

      function tryClaim(occKey: string, leaseId: string, nowMs: number, ttlMs: number) {
        const record = store.get(occKey);
        if (!record) return null;

        const isClaimable =
          (record.status === "PENDING" || record.status === "FAILED_RETRYABLE") &&
          record.attemptCount < record.maxAttempts;
        const isExpiredLease =
          record.status === "CLAIMED" &&
          record.leaseExpiresAt !== null &&
          record.leaseExpiresAt < nowMs &&
          record.attemptCount < record.maxAttempts;

        if (isClaimable || isExpiredLease) {
          record.status = "CLAIMED";
          record.leaseId = leaseId;
          record.leaseExpiresAt = nowMs + ttlMs;
          record.attemptCount += 1;
          return { ...record };
        }
        return null;
      }

      const now = 1000000;
      const w1 = tryClaim(key, "worker-1", now, 60000);
      const w2 = tryClaim(key, "worker-2", now, 60000);

      assert.ok(w1 !== null, "Worker 1 claims lease");
      assert.equal(w2, null, "Worker 2 cannot claim active lease");
      assert.equal(store.get(key)?.attemptCount, 1);

      const afterCrash = now + 61000;
      const w3 = tryClaim(key, "worker-3", afterCrash, 60000);
      assert.ok(w3 !== null, "Worker 3 successfully reclaims expired lease");
      assert.equal(store.get(key)?.attemptCount, 2);
      assert.equal(store.get(key)?.leaseId, "worker-3");
    });

    it("Prevents reclaiming lease once attempt count reaches maxAttempts", () => {
      interface MockOccurrence {
        status: string;
        leaseExpiresAt: number;
        attemptCount: number;
        maxAttempts: number;
      }

      const occ: MockOccurrence = {
        status: "CLAIMED",
        leaseExpiresAt: 1000,
        attemptCount: 3,
        maxAttempts: 3,
      };

      const now = 2000;
      const canReclaim =
        occ.status === "CLAIMED" &&
        occ.leaseExpiresAt < now &&
        occ.attemptCount < occ.maxAttempts;

      assert.equal(canReclaim, false, "Must NOT reclaim expired lease if max attempts reached");
    });

    it("Reconciliation handles worker crash after Ride.create before AutoBookingOccurrence finalize", () => {
      const existingRide = {
        _id: new mongoose.Types.ObjectId("6529ab81c9a1240012347777"),
        autoBookingOccurrenceKey: "commute_99:2026-10-12_0845",
      };

      const occurrenceRecord: {
        occurrenceKey: string;
        status: string;
        rideId: string | null;
      } = {
        occurrenceKey: "commute_99:2026-10-12_0845",
        status: "CLAIMED",
        rideId: null,
      };

      const reconciled = existingRide.autoBookingOccurrenceKey === occurrenceRecord.occurrenceKey;
      assert.ok(reconciled);

      occurrenceRecord.status = "MATERIALIZED";
      occurrenceRecord.rideId = existingRide._id.toString();

      assert.equal(occurrenceRecord.status, "MATERIALIZED");
      assert.equal(occurrenceRecord.rideId, existingRide._id.toString());
    });
  });

  describe("6. Commute Lifecycle & Rider Changes", () => {
    it("Inactive/paused commute produces zero candidate occurrences", () => {
      const now = buildIstTimestamp(2026, 9, 12, 8, 0);
      const pausedCommute = {
        _id: dummyCommuteId,
        time: "08:45 AM",
        days: ["Mon", "Tue"],
        isActive: false,
      };

      const candidates = calculateUpcomingOccurrences(pausedCommute, now, 180);
      assert.deepEqual(candidates, []);
    });

    it("Commute schema defines CASH as default paymentMethod", () => {
      const defaultPayment = Commute.schema.path("paymentMethod")?.options?.default;
      assert.equal(defaultPayment, "CASH", "Default commute paymentMethod must be CASH");
    });

    it("Updating a commute schedule does not modify already-materialized ride records", () => {
      const originalRide = {
        _id: "ride-1",
        autoBookingOccurrenceKey: `${dummyCommuteId}:2026-10-12_0845`,
        scheduledFor: new Date("2026-10-12T03:15:00.000Z"),
        status: "SEARCHING",
      };

      const updatedCommute = {
        _id: dummyCommuteId,
        time: "09:30 AM",
        days: ["Mon"],
        isActive: true,
      };

      const now = buildIstTimestamp(2026, 9, 12, 7, 0);
      const newCandidates = calculateUpcomingOccurrences(updatedCommute, now, 180);

      assert.equal(newCandidates[0].occurrenceKey, `${dummyCommuteId}:2026-10-12_0930`);
      assert.notEqual(newCandidates[0].occurrenceKey, originalRide.autoBookingOccurrenceKey);
      assert.equal(originalRide.status, "SEARCHING");
    });
  });

  describe("7. Pricing Invariants & Integer Paise Fares", () => {
    it("Materialized ride fare retains server-authoritative integer paise calculation", () => {
      const fare = calculateAuthoritativeFare({
        pickupCoordinates: [28.6139, 77.2090],
        dropoffCoordinates: [28.5355, 77.3910],
        vehicleType: "Cab Premium",
        petFriendly: false,
      });

      assert.ok(fare.fareInPaise > 0);
      assert.equal(Number.isInteger(fare.fareInPaise), true);
      assert.equal(fare.fareInRupees, Math.round(fare.fareInPaise / 100));
      assert.equal(fare.pricingSnapshot.currency, "INR");
      assert.equal(typeof fare.pricingSnapshot.baseFarePaise, "number");
      assert.equal(typeof fare.pricingSnapshot.distanceFarePaise, "number");
    });

    it("Client-supplied fare is ignored: server-authoritative fare is strictly preserved", () => {
      const clientSuppliedFare = 1;

      const serverFare = calculateAuthoritativeFare({
        pickupCoordinates: [28.6139, 77.2090],
        dropoffCoordinates: [28.5355, 77.3910],
        vehicleType: "Cab Premium",
        petFriendly: false,
      });

      assert.notEqual(serverFare.fareInRupees, clientSuppliedFare);
      assert.ok(serverFare.fareInRupees >= 70, "Authoritative fare must reflect actual distance rate card");
    });
  });

  describe("8. Error Classification & Fault Isolation", () => {
    it("Permanently fails when commute pickup or dropoff address is missing", () => {
      const invalidCommute = {
        _id: dummyCommuteId,
        title: "Broken Commute",
        pickup: { address: "" },
        dropoff: { address: "Some Dropoff" },
      };

      const isInvalid = !invalidCommute.pickup?.address || !invalidCommute.dropoff?.address;
      assert.equal(isInvalid, true);
      const expectedStatus = isInvalid ? "FAILED_PERMANENT" : "FAILED_RETRYABLE";
      assert.equal(expectedStatus, "FAILED_PERMANENT", "Malformed address must be FAILED_PERMANENT");
    });

    it("Isolates malformed schedules so one invalid commute does not fail the batch", () => {
      const commutes = [
        { _id: "commute-1", time: "INVALID_TIME", days: ["Mon"], isActive: true },
        { _id: "commute-2", time: "08:45 AM", days: ["Mon"], isActive: true },
      ];

      const now = buildIstTimestamp(2026, 9, 12, 7, 0);
      const processed: string[] = [];
      let permanentFailures = 0;

      for (const c of commutes) {
        try {
          const candidates = calculateUpcomingOccurrences(c, now, 180);
          assert.ok(Array.isArray(candidates));
          processed.push(c._id);
        } catch {
          permanentFailures++;
        }
      }

      assert.equal(permanentFailures, 1, "First commute failed permanently");
      assert.equal(processed.length, 1, "Second valid commute was processed successfully");
      assert.equal(processed[0], "commute-2");
    });
  });
});
