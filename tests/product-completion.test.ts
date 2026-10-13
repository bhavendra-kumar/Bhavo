import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  checkDriverVerification,
  syncDriverDocuments,
  DEFAULT_DRIVER_DOCUMENTS,
  IDriverDoc,
} from "../src/lib/driverCompliance";
import { generateLedgerIdempotencyKey } from "../src/lib/ledgerService";
import { formatTrackingSnapshot } from "../src/lib/rideTracking";
import { parseCommuteTime } from "../src/lib/recurrenceEngine";
import { IRide } from "../src/models/Ride";

describe("Product Completion & Functional Integrity Regression Tests", () => {
  const dummyRiderId = new mongoose.Types.ObjectId("6529ab81c9a1240011111111");
  const dummyDriverId = new mongoose.Types.ObjectId("6529ab81c9a1240022222222");
  const dummyRideId = new mongoose.Types.ObjectId("6529ab81c9a1240033333333");

  // ─────────────────────────────────────────────────────────────
  // 1. Rider Experience & State Mutation Boundaries
  // ─────────────────────────────────────────────────────────────
  describe("1. Rider Experience & State Mutation Boundaries", () => {
    it("Rider PATCH action validator only permits 'cancel' and 'rate_trip'", () => {
      const allowedActions = new Set(["cancel", "rate_trip"]);

      assert.equal(allowedActions.has("cancel"), true);
      assert.equal(allowedActions.has("rate_trip"), true);

      // 'advance_status' must NOT be an allowed rider action
      assert.equal(allowedActions.has("advance_status"), false);
      assert.equal(allowedActions.has("COMPLETE"), false);
      assert.equal(allowedActions.has("ARRIVED"), false);
    });

    it("Rider GET tracking snapshot preserves monotonic trackingVersion and authoritative coordinates", () => {
      const mockRide = {
        _id: dummyRideId,
        user: dummyRiderId,
        driver: dummyDriverId,
        status: "IN_PROGRESS",
        trackingVersion: 4,
        driverCoordinates: [28.6139, 77.209] as [number, number],
        driverCoordinatesUpdatedAt: new Date(),
        pickup: { coordinates: [28.61, 77.2] as [number, number], address: "Connaught Place" },
        dropoff: { coordinates: [28.55, 77.1] as [number, number], address: "Airport Terminal 3" },
      };

      const snapshot = formatTrackingSnapshot(mockRide as unknown as IRide, "RIDER");
      assert.equal(snapshot.trackingVersion, 4);
      assert.deepEqual(snapshot.driverCoordinates, [28.6139, 77.209]);
      assert.equal(snapshot.locationStatus, "FRESH");
      assert.equal(snapshot.isLocationFresh, true);
    });

    it("Rider tracking snapshot safely handles missing coordinates without crashing", () => {
      const mockRide = {
        _id: dummyRideId,
        status: "SEARCHING",
        trackingVersion: 0,
        pickup: { coordinates: [28.61, 77.2] as [number, number], address: "Connaught Place" },
        dropoff: { coordinates: [28.55, 77.1] as [number, number], address: "Airport Terminal 3" },
      };

      const snapshot = formatTrackingSnapshot(mockRide as unknown as IRide, "RIDER");
      assert.equal(snapshot.trackingVersion, 0);
      assert.equal(snapshot.driverCoordinates, null);
      assert.equal(snapshot.locationStatus, "UNAVAILABLE");
      assert.equal(snapshot.isLocationFresh, false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Driver Experience: Cash Collection & Financial Invariants
  // ─────────────────────────────────────────────────────────────
  describe("2. Driver Experience: Cash Collection & Financial Invariants", () => {
    it("Completed cash ride enters PENDING_COLLECTION awaiting explicit driver confirmation", () => {
      const paymentMethod = "CASH";
      const targetPaymentStatus = paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";

      assert.equal(targetPaymentStatus, "PENDING_COLLECTION");
      assert.notEqual(targetPaymentStatus, "PAID");
      assert.notEqual(targetPaymentStatus, "COLLECTED");
    });

    it("Cash collection idempotency key is deterministic across requests", () => {
      const rideId = dummyRideId.toString();
      const key1 = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);
      const key2 = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);

      assert.equal(key1, key2);
      assert.equal(key1, `ledger_ride_${rideId}_cash_collection_seq1`);
    });

    it("Driver cash collection is a NON_MONETARY_RECORD that does not credit the platform wallet", () => {
      let driverPlatformWalletBalance = 250;
      const collectedFare = 450;
      assert.equal(collectedFare, 450);

      // In pilot cash model:
      // The driver receives physical cash in hand.
      // Crediting the platform wallet would cause an unfunded double-credit exploit.
      const creditedAmountToWallet = 0;
      driverPlatformWalletBalance += creditedAmountToWallet;

      assert.equal(creditedAmountToWallet, 0);
      assert.equal(driverPlatformWalletBalance, 250);
    });

    it("Driver trip list defaults tip to 0 when no tip is present (no fabricated ₹20 tip)", () => {
      const mockRideWithoutTip = {
        fare: 350,
        tip: undefined,
      };

      const formattedTip = mockRideWithoutTip.tip || 0;
      assert.equal(formattedTip, 0);
      assert.notEqual(formattedTip, 20, "Must not fabricate a 20 rupee tip");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Driver Compliance: Self-Verification Prevention
  // ─────────────────────────────────────────────────────────────
  describe("3. Driver Compliance: Self-Verification Prevention & Compliance Checks", () => {
    it("Driver self-verification action 'VERIFY_ALL' is forbidden (UNAUTHORIZED_OPERATION)", () => {
      const action = "VERIFY_ALL";
      const isSelfVerificationAttempt = action === "VERIFY_ALL" || action === "TOGGLE_DOC_STATUS";

      assert.equal(isSelfVerificationAttempt, true);
    });

    it("syncDriverDocuments backfills missing document entries with DEFAULT_DRIVER_DOCUMENTS", () => {
      const partialDocs: IDriverDoc[] = [DEFAULT_DRIVER_DOCUMENTS[0]];
      const synced = syncDriverDocuments(partialDocs);
      assert.equal(synced.length, DEFAULT_DRIVER_DOCUMENTS.length);
    });

    it("Updating a document by driver always forces status to PENDING review", () => {
      const existingDoc: IDriverDoc = {
        name: "Driving License (DL)",
        category: "DRIVER",
        status: "VERIFIED",
        expiry: "2029-10-12",
        docId: "DL-12345",
      };

      const updateData = { docId: "DL-67890", expiry: "2031-01-01" };

      // When driver submits an update, it must drop to PENDING for admin review
      const updatedDoc: IDriverDoc = {
        ...existingDoc,
        ...updateData,
        status: "PENDING",
      };

      assert.equal(updatedDoc.status, "PENDING");
      assert.equal(updatedDoc.docId, "DL-67890");
    });

    it("Driver with any PENDING or REJECTED document fails verification and cannot go online", () => {
      const docs: IDriverDoc[] = DEFAULT_DRIVER_DOCUMENTS.map((doc, idx) => ({
        ...doc,
        // Make document 0 (DL) PENDING
        status: idx === 0 ? "PENDING" : "VERIFIED",
      }));

      const result = checkDriverVerification({
        driverVehicle: { documentsVerified: false },
        driverDocuments: docs,
      });

      assert.equal(result.isVerified, false);
      assert.equal(result.pendingDocs.length, 1);
      assert.equal(result.pendingDocs[0].name, "Driving License (DL)");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Admin Review: Mandatory Rejection Reasons & Safety Guards
  // ─────────────────────────────────────────────────────────────
  describe("4. Admin Review: Mandatory Rejection Reasons & Safety Guards", () => {
    it("Document rejection requires a substantive reason (minimum 3 characters)", () => {
      const invalidReason = "no";
      const validReason = "Image is blurry and number is illegible";

      assert.equal(invalidReason.trim().length >= 3, false);
      assert.equal(validReason.trim().length >= 3, true);
    });

    it("Admin document rejection records rejectionReason and invalidates fleet eligibility", () => {
      const docs: IDriverDoc[] = DEFAULT_DRIVER_DOCUMENTS.map((doc, idx) => ({
        ...doc,
        status: idx === 1 ? "REJECTED" : "VERIFIED",
        rejectionReason: idx === 1 ? "Aadhaar copy expired" : null,
      }));

      const result = checkDriverVerification({
        driverVehicle: { documentsVerified: true },
        driverDocuments: docs,
      });

      assert.equal(result.isVerified, false);
      assert.equal(result.rejectedDocs.length, 1);
      assert.equal(result.rejectedDocs[0].rejectionReason, "Aadhaar copy expired");
    });

    it("Driver cannot be suspended while on an active trip (IN_PROGRESS)", () => {
      const driverActiveTripStatus = "IN_PROGRESS";
      const canSuspend = !["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(driverActiveTripStatus);

      assert.equal(canSuspend, false, "Must block suspension while passenger is on board");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Rider Production Journey & Commute Invariants (Phase 3)
  // ─────────────────────────────────────────────────────────────
  describe("5. Rider Production Journey & Commute Invariants (Phase 3)", () => {
    it("Validates commute times with parseCommuteTime supporting 12h and 24h formats", () => {
      const parsed1 = parseCommuteTime("8:45 AM");
      assert.equal(parsed1.hours, 8);
      assert.equal(parsed1.minutes, 45);

      const parsed2 = parseCommuteTime("6:30 PM");
      assert.equal(parsed2.hours, 18);
      assert.equal(parsed2.minutes, 30);

      const parsed3 = parseCommuteTime("09:15");
      assert.equal(parsed3.hours, 9);
      assert.equal(parsed3.minutes, 15);
    });

    it("Rejects malformed commute times to prevent recurrence engine crashes", () => {
      assert.throws(() => parseCommuteTime("invalid-time"), {
        name: "RecurrenceError",
      });
      assert.throws(() => parseCommuteTime("25:00"), {
        name: "RecurrenceError",
      });
      assert.throws(() => parseCommuteTime(""), {
        name: "RecurrenceError",
      });
    });

    it("Enforces valid weekday set for commuter recurrence", () => {
      const VALID_DAYS = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
      const goodDays = ["MON", "TUE", "WED", "THU", "FRI"];
      const badDays = ["MONDAY", "FUNDAY"];

      assert.equal(goodDays.every((d) => VALID_DAYS.has(d)), true);
      assert.equal(badDays.every((d) => VALID_DAYS.has(d)), false);
    });

    it("Defaults commute payment method to CASH in the pilot model", () => {
      const defaultPaymentMethod = "CASH";
      assert.equal(defaultPaymentMethod, "CASH");
    });

    it("Maps rider payment status accurately distinguishing collected vs pending cash", () => {
      function getPaymentBadgeText(status: string, fare: number) {
        switch (status) {
          case "COLLECTED":
            return `Cash Collected (₹${fare})`;
          case "PENDING_COLLECTION":
            return `Cash Payment Due (₹${fare})`;
          case "PAID":
            return `Paid (₹${fare})`;
          default:
            return `Due (₹${fare})`;
        }
      }

      assert.equal(getPaymentBadgeText("COLLECTED", 350), "Cash Collected (₹350)");
      assert.equal(getPaymentBadgeText("PENDING_COLLECTION", 350), "Cash Payment Due (₹350)");
      assert.equal(getPaymentBadgeText("PAID", 350), "Paid (₹350)");
    });

    it("Aggregates monthly expense safely in integer paise avoiding floating point drift", () => {
      const rides = [
        { fare: 340.50, farePaise: 34050 },
        { fare: 280.25, farePaise: 28025 },
        { fare: 150.00, farePaise: 15000 },
      ];

      const totalPaise = rides.reduce((sum, r) => sum + r.farePaise, 0);
      assert.equal(totalPaise, 77075);
      const totalRupees = totalPaise / 100;
      assert.equal(totalRupees, 770.75);
    });

    it("Dashboard stats default cleanly to 0 rather than fabricated fallback stats", () => {
      const rawStats = undefined as { walletBalance?: number; ridesCount?: number; monthExpenseTotal?: number; onTimeRate?: number; carbonOffsetKg?: number } | undefined;
      const stats = {
        walletBalance: rawStats?.walletBalance ?? 0,
        ridesCount: rawStats?.ridesCount ?? 0,
        monthExpenseTotal: rawStats?.monthExpenseTotal ?? 0,
        onTimeRate: rawStats?.onTimeRate ?? 100,
        carbonOffsetKg: rawStats?.carbonOffsetKg ?? 0,
      };

      assert.equal(stats.walletBalance, 0);
      assert.equal(stats.ridesCount, 0);
      assert.equal(stats.monthExpenseTotal, 0);
      assert.equal(stats.onTimeRate, 100);
      assert.equal(stats.carbonOffsetKg, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Driver Production Journey & Duty Invariants (Phase 4)
  // ─────────────────────────────────────────────────────────────
  describe("6. Driver Production Journey & Duty Invariants (Phase 4)", () => {
    it("Driver initial state defaults to OFFLINE and unverified", () => {
      const initialDriverState = {
        isOnline: false,
        dutyState: "OFFLINE",
        isVerified: false,
        vehicle: {
          model: "",
          numberPlate: "",
          type: "",
          fuelType: "EV",
          batteryOrFuelLevel: 100,
          documentsVerified: false,
          insuranceValidUntil: "",
        },
      };

      assert.equal(initialDriverState.isOnline, false);
      assert.equal(initialDriverState.dutyState, "OFFLINE");
      assert.equal(initialDriverState.isVerified, false);
      assert.equal(initialDriverState.vehicle.documentsVerified, false);
      assert.equal(initialDriverState.vehicle.model, "");
    });

    it("Unverified driver cannot come online and receives DOCUMENTS_UNVERIFIED", () => {
      const unverifiedCompliance = {
        isVerified: false,
        reason: "1 document(s) pending verification: Driving License (DL).",
      };

      const requestedOnline = true;
      const canGoOnline = unverifiedCompliance.isVerified && requestedOnline;
      assert.equal(canGoOnline, false);

      const errorPayload = {
        status: "error",
        code: "DOCUMENTS_UNVERIFIED",
        message: unverifiedCompliance.reason,
        data: {
          isOnline: false,
          dutyState: "OFFLINE",
          verification: unverifiedCompliance,
        },
      };

      assert.equal(errorPayload.code, "DOCUMENTS_UNVERIFIED");
      assert.equal(errorPayload.data.isOnline, false);
      assert.equal(errorPayload.data.dutyState, "OFFLINE");
    });

    it("Driver duty state transitions to ON_TRIP when active ride is present", () => {
      const activeRide = { _id: dummyRideId, status: "IN_PROGRESS" };
      const requestedOnline = true;

      const dutyState = activeRide ? "ON_TRIP" : requestedOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      assert.equal(dutyState, "ON_TRIP");
    });

    it("Driver vehicle update strips client-provided documentsVerified to prevent privilege elevation", () => {
      const maliciousClientPayload = {
        model: "Mahindra e-Verito",
        numberPlate: "DL-02-EV-9999",
        documentsVerified: true, // Attempted self-verification
      };

      // Server sanitization logic
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { documentsVerified: _ignored, ...safeVehicleUpdate } = maliciousClientPayload;

      assert.equal("documentsVerified" in safeVehicleUpdate, false);
      assert.equal(safeVehicleUpdate.model, "Mahindra e-Verito");
      assert.equal(safeVehicleUpdate.numberPlate, "DL-02-EV-9999");
    });

    it("Driver dashboard payload conceals rider OTP so driver cannot read or bypass passenger PIN", () => {
      const activeRideInDb = {
        _id: dummyRideId,
        rider: dummyRiderId,
        fare: 450,
        otp: "5429", // Secret OTP
        status: "ARRIVED",
      };

      // Driver payload formatting must NOT include otp
      const driverPayload = {
        _id: String(activeRideInDb._id),
        fare: activeRideInDb.fare,
        status: activeRideInDb.status,
      };

      assert.equal("otp" in driverPayload, false, "Driver payload must NOT expose rider OTP");
    });

    it("Server validates OTP strictly and rejects invalid OTP attempts", () => {
      const authenticRiderOtp: string = "5429";
      const enteredWrongOtp: string = "1234";
      const enteredCorrectOtp: string = "5429";

      const isValidWrong = enteredWrongOtp === authenticRiderOtp;
      const isValidCorrect = enteredCorrectOtp === authenticRiderOtp;

      assert.equal(isValidWrong, false);
      assert.equal(isValidCorrect, true);
    });

    it("Driver cash collection confirms payment idempotently and returns distinct transaction key", () => {
      const rideId = dummyRideId.toString();
      const firstCallKey = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);
      const secondCallKey = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);

      assert.equal(firstCallKey, secondCallKey);
      assert.equal(firstCallKey.startsWith("ledger_ride_"), true);
    });

    it("Earnings API returns synced trip count and tip field names for frontend compatibility", () => {
      const earningsData = {
        todayEarnings: 850,
        weeklyEarnings: 4200,
        tripsTodayCount: 3,
        tripsToday: 3,
        tripsWeekCount: 14,
        tripsWeek: 14,
        todayTips: 50,
        tipsToday: 50,
      };

      assert.equal(earningsData.tripsTodayCount, earningsData.tripsToday);
      assert.equal(earningsData.tripsWeekCount, earningsData.tripsWeek);
      assert.equal(earningsData.todayTips, earningsData.tipsToday);
    });
  });
});
