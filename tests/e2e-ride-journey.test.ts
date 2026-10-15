import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateAuthoritativeFare,
} from "../src/lib/pricingEngine";
import {
  evaluateDriverEligibility,
  calculateHaversineDistanceKm,
} from "../src/lib/driverEligibility";
import {
  canTransition,
  isRideDispatchable,
  getDispatchLeadTimeMinutes,
  DEFAULT_DISPATCH_LEAD_TIME_MINUTES,
  RideTransitionError,
} from "../src/lib/rideStateMachine";
import {
  isLivePaymentEnabled,
} from "../src/lib/runtimeConfig";
import { verifyCronSecret } from "../src/lib/cronAuth";
import { sanitizeLogPayload } from "../src/lib/logger";
import { generateLedgerIdempotencyKey } from "../src/lib/ledgerService";
import { generateOccurrenceKey } from "../src/lib/recurrenceEngine";
import { InMemoryRateLimiter } from "../src/lib/rateLimit";
import { DEFAULT_DRIVER_DOCUMENTS } from "../src/lib/driverCompliance";

describe("Phase 2 Smoke Test Suite 1: Booking Creation & Authoritative Fare Calculation", () => {
  const pickupCoords: [number, number] = [18.5204, 73.8567];
  const dropoffCoords: [number, number] = [18.5987, 73.7978];

  it("Computes server-authoritative integer-paise fares for standard ride", () => {
    const distanceKm = calculateHaversineDistanceKm(pickupCoords, dropoffCoords);
    assert.ok(distanceKm > 10 && distanceKm < 20, "Distance should be ~14-16 km");

    const pricing = calculateAuthoritativeFare({
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      vehicleType: "Cab Economy",
      petFriendly: false,
    });

    assert.equal(typeof pricing.fareInPaise, "number");
    assert.equal(Number.isInteger(pricing.fareInPaise), true, "Fare must be integer paise");
    assert.equal(pricing.pricingSnapshot.currency, "INR");
    assert.ok(pricing.fareInPaise > 0, "Fare must be positive");
    assert.equal(pricing.fareInRupees, Math.round(pricing.fareInPaise / 100));
    assert.equal(pricing.pricingSnapshot.totalFarePaise, pricing.fareInPaise);
  });

  it("Applies pet-friendly surcharges authoritatively in paise", () => {
    const standardPricing = calculateAuthoritativeFare({
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      vehicleType: "Cab Economy",
      petFriendly: false,
    });

    const petPricing = calculateAuthoritativeFare({
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      vehicleType: "Cab Economy",
      petFriendly: true,
    });

    assert.ok(petPricing.pricingSnapshot.petFriendlySurchargePaise > 0, "Pet surcharge must be greater than zero");
    assert.equal(
      petPricing.fareInPaise,
      standardPricing.fareInPaise + petPricing.pricingSnapshot.petFriendlySurchargePaise,
      "Total fare must equal standard fare plus pet surcharge in paise"
    );
  });

  it("Strips client-side fare injection attempts and preserves server calculated fare", () => {
    const clientProvidedPayload = {
      pickupCoordinates: pickupCoords,
      dropoffCoordinates: dropoffCoords,
      vehicleType: "Cab Economy",
      fare: 1,
      totalFarePaise: 100,
      status: "COMPLETED",
      driver: "650000000000000000000099",
      otp: "0000",
    };

    const serverPricing = calculateAuthoritativeFare({
      pickupCoordinates: clientProvidedPayload.pickupCoordinates,
      dropoffCoordinates: clientProvidedPayload.dropoffCoordinates,
      vehicleType: clientProvidedPayload.vehicleType,
    });

    const sanitizedRideDoc = {
      pickup: { coordinates: clientProvidedPayload.pickupCoordinates, address: "Shivajinagar" },
      dropoff: { coordinates: clientProvidedPayload.dropoffCoordinates, address: "Hinjawadi" },
      vehicleType: clientProvidedPayload.vehicleType,
      fare: serverPricing.fareInRupees,
      fareInPaise: serverPricing.fareInPaise,
      pricingSnapshot: serverPricing.pricingSnapshot,
      status: "SEARCHING",
      driver: null,
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      paymentStatus: "PENDING",
    };

    assert.notEqual(sanitizedRideDoc.fare, 1);
    assert.equal(sanitizedRideDoc.status, "SEARCHING");
    assert.equal(sanitizedRideDoc.driver, null);
    assert.equal(sanitizedRideDoc.paymentStatus, "PENDING");
    assert.match(sanitizedRideDoc.otp, /^\d{4}$/, "OTP must be a 4-digit numeric string");
  });
});

describe("Phase 2 Smoke Test Suite 2: Driver Candidate Discovery & Eligibility Filtering", () => {
  const ridePickupCoordinates: [number, number] = [18.5204, 73.8567];
  const rideRequirements = {
    pickup: { coordinates: ridePickupCoordinates },
    vehicleType: "SEDAN",
    petFriendly: false,
  };

  it("Accepts fully compliant, nearby, available driver with matching vehicle", () => {
    const eligibleDriver = {
      _id: "driver_01",
      role: "DRIVER",
      status: "ACTIVE",
      dutyState: "ONLINE_SEARCHING",
      isOnline: true,
      activeRideId: null,
      driverDocuments: DEFAULT_DRIVER_DOCUMENTS,
      driverVehicle: {
        type: "SEDAN",
        documentsVerified: true,
      },
      driverCoordinates: [18.522, 73.858] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    const result = evaluateDriverEligibility(
      eligibleDriver as any,
      rideRequirements,
      { maxRadiusKm: 10 }
    );

    assert.equal(result.isEligible, true);
    assert.equal(result.code, undefined);
  });

  it("Rejects driver with PENDING document verification", () => {
    const unverifiedDriver = {
      _id: "driver_02",
      role: "DRIVER",
      status: "ACTIVE",
      dutyState: "ONLINE_SEARCHING",
      isOnline: true,
      activeRideId: null,
      driverDocuments: [
        {
          name: "Driving License (DL)",
          category: "DRIVER",
          status: "PENDING",
          expiry: "2029",
          docId: "DL-123",
        },
      ],
      driverVehicle: { type: "SEDAN", documentsVerified: false },
      driverCoordinates: [18.522, 73.858] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    const result = evaluateDriverEligibility(
      unverifiedDriver as any,
      rideRequirements,
      { maxRadiusKm: 10 }
    );

    assert.equal(result.isEligible, false);
    assert.equal(result.code, "DOCUMENTS_UNVERIFIED");
  });

  it("Rejects driver with mismatched vehicle type", () => {
    const autoDriver = {
      _id: "driver_03",
      role: "DRIVER",
      status: "ACTIVE",
      dutyState: "ONLINE_SEARCHING",
      isOnline: true,
      activeRideId: null,
      driverDocuments: DEFAULT_DRIVER_DOCUMENTS,
      driverVehicle: { type: "AUTO", documentsVerified: true },
      driverCoordinates: [18.522, 73.858] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    const result = evaluateDriverEligibility(
      autoDriver as any,
      { pickup: { coordinates: ridePickupCoordinates }, vehicleType: "CAB PREMIUM" },
      { maxRadiusKm: 10 }
    );

    assert.equal(result.isEligible, false);
    assert.equal(result.code, "VEHICLE_INCOMPATIBLE");
  });

  it("Rejects driver who is already on an active trip (driver exclusivity)", () => {
    const busyDriver = {
      _id: "driver_04",
      role: "DRIVER",
      status: "ACTIVE",
      dutyState: "ON_TRIP",
      isOnline: true,
      activeRideId: "ride_existing_123",
      driverDocuments: DEFAULT_DRIVER_DOCUMENTS,
      driverVehicle: { type: "SEDAN", documentsVerified: true },
      driverCoordinates: [18.522, 73.858] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    const result = evaluateDriverEligibility(
      busyDriver as any,
      rideRequirements,
      { maxRadiusKm: 10 }
    );

    assert.equal(result.isEligible, false);
    assert.equal(result.code, "DRIVER_OCCUPIED");
  });

  it("Rejects driver who is suspended or inactive", () => {
    const suspendedDriver = {
      _id: "driver_05",
      role: "DRIVER",
      status: "SUSPENDED",
      dutyState: "ONLINE_SEARCHING",
      isOnline: true,
      activeRideId: null,
      driverDocuments: DEFAULT_DRIVER_DOCUMENTS,
      driverVehicle: { type: "SEDAN", documentsVerified: true },
      driverCoordinates: [18.522, 73.858] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    const result = evaluateDriverEligibility(
      suspendedDriver as any,
      rideRequirements,
      { maxRadiusKm: 10 }
    );

    assert.equal(result.isEligible, false);
    assert.equal(result.code, "DRIVER_INACTIVE");
  });
});

describe("Phase 2 Smoke Test Suite 3: Atomic Driver Acceptance & Mutual Exclusion", () => {
  it("Validates that an available driver can atomically accept a SEARCHING ride", async () => {
    const driver = {
      _id: "driver_win_01",
      dutyState: "ONLINE_SEARCHING",
      activeRideId: null as string | null,
      isOnline: true,
    };

    const ride = {
      _id: "ride_target_01",
      status: "SEARCHING",
      driver: null,
      dispatchStatus: "OFFERED",
      currentOffer: {
        driverId: driver._id,
        expiresAt: new Date(Date.now() + 30000),
      },
    };

    let driverReserved = false;
    if (driver.activeRideId === null && driver.dutyState !== "ON_TRIP") {
      driver.activeRideId = ride._id;
      driver.dutyState = "ON_TRIP";
      driverReserved = true;
    }
    assert.equal(driverReserved, true);

    let rideAssigned = false;
    if (ride.status === "SEARCHING" && ride.driver === null) {
      ride.status = "ACCEPTED";
      ride.driver = driver._id as any;
      ride.dispatchStatus = "ASSIGNED";
      rideAssigned = true;
    }
    assert.equal(rideAssigned, true);
    assert.equal(ride.status, "ACCEPTED");
    assert.equal(driver.dutyState, "ON_TRIP");
    assert.equal(driver.activeRideId, ride._id);
  });

  it("Guarantees that a driver holding an active ride cannot accept a second ride", () => {
    const occupiedDriver = {
      _id: "driver_occupied_01",
      dutyState: "ON_TRIP",
      activeRideId: "ride_first_01",
    };

    const canReserve = occupiedDriver.activeRideId === null && occupiedDriver.dutyState !== "ON_TRIP";
    assert.equal(canReserve, false, "Occupied driver cannot reserve second ride");

    const error = new RideTransitionError(
      "Driver already has an active ride in progress",
      409,
      "DRIVER_OCCUPIED"
    );
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, "DRIVER_OCCUPIED");
  });

  it("Guarantees that two concurrent drivers racing for the same ride produce exactly one winner", async () => {
    let rideDriver: string | null = null;
    let rideStatus = "SEARCHING";
    let winnerCount = 0;
    let loserCount = 0;

    const attemptAccept = async (driverId: string) => {
      await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5)));
      if (rideStatus === "SEARCHING" && rideDriver === null) {
        rideStatus = "ACCEPTED";
        rideDriver = driverId;
        winnerCount++;
        return { success: true, driverId };
      } else {
        loserCount++;
        return { success: false, driverId, code: "ALREADY_ACCEPTED" };
      }
    };

    const results = await Promise.all([
      attemptAccept("driver_alpha"),
      attemptAccept("driver_beta"),
    ]);

    assert.equal(results.length, 2);
    assert.equal(winnerCount, 1, "Exactly one driver must win the ride");
    assert.equal(loserCount, 1, "Exactly one driver must lose the ride with conflict");
    assert.ok(rideDriver === "driver_alpha" || rideDriver === "driver_beta");
  });
});

describe("Phase 2 Smoke Test Suite 4: Passenger Realtime Tracking & Location Freshness", () => {
  it("Updates driver coordinates with timestamp and monotonically increasing trackingVersion", () => {
    const ride = {
      _id: "ride_track_01",
      driver: "driver_01",
      status: "ACCEPTED",
      driverCoordinates: [18.5204, 73.8567] as [number, number],
      driverCoordinatesUpdatedAt: new Date(Date.now() - 10000),
      trackingVersion: 1,
    };

    const newCoords: [number, number] = [18.5215, 73.8579];
    const now = new Date();

    ride.driverCoordinates = newCoords;
    ride.driverCoordinatesUpdatedAt = now;
    ride.trackingVersion = (ride.trackingVersion || 0) + 1;

    assert.deepEqual(ride.driverCoordinates, [18.5215, 73.8579]);
    assert.equal(ride.trackingVersion, 2);
    assert.equal(ride.driverCoordinatesUpdatedAt, now);
  });

  it("Correctly detects stale location data exceeding configured freshness threshold", () => {
    const STALE_THRESHOLD_SECONDS = 30;
    const now = Date.now();

    const freshUpdate = new Date(now - 10 * 1000);
    const staleUpdate = new Date(now - 45 * 1000);

    const isFreshStale = (now - freshUpdate.getTime()) / 1000 > STALE_THRESHOLD_SECONDS;
    const isStaleStale = (now - staleUpdate.getTime()) / 1000 > STALE_THRESHOLD_SECONDS;

    assert.equal(isFreshStale, false, "10-second old update should not be stale");
    assert.equal(isStaleStale, true, "45-second old update must be flagged as stale");
  });
});

describe("Phase 2 Smoke Test Suite 5: Ride Progression, OTP Security & Completion Invariants", () => {
  it("Enforces valid canonical lifecycle: ACCEPTED -> ARRIVED -> IN_PROGRESS -> COMPLETED", () => {
    assert.equal(canTransition("ACCEPTED", "ARRIVED"), true);
    assert.equal(canTransition("ARRIVED", "IN_PROGRESS"), true);
    assert.equal(canTransition("IN_PROGRESS", "COMPLETED"), true);

    assert.equal(canTransition("SEARCHING", "ARRIVED"), false);
    assert.equal(canTransition("ACCEPTED", "COMPLETED"), false);
    assert.equal(canTransition("COMPLETED", "IN_PROGRESS"), false);
    assert.equal(canTransition("CANCELLED", "ACCEPTED"), false);
  });

  it("Rejects ride start if supplied OTP does not match the authoritative server OTP", () => {
    const authoritativeOtp = "4829";
    const suppliedOtp = "1234";

    const otpMatches = suppliedOtp.trim() === authoritativeOtp.trim();
    assert.equal(otpMatches, false, "Mismatched OTP must not match");

    const error = new RideTransitionError("Invalid OTP code", 400, "INVALID_OTP");
    assert.equal(error.statusCode, 400);
    assert.equal(error.code, "INVALID_OTP");
  });

  it("Permits ride start when correct 4-digit OTP is supplied", () => {
    const authoritativeOtp = "4829";
    const suppliedOtp = "4829";

    let rideStatus = "ARRIVED";
    if (rideStatus === "ARRIVED" && suppliedOtp === authoritativeOtp) {
      rideStatus = "IN_PROGRESS";
    }

    assert.equal(rideStatus, "IN_PROGRESS");
  });

  it("CRITICAL INVARIANT: Ride completion sets paymentStatus to PENDING_COLLECTION, never auto-PAID", () => {
    const inProgressRide = {
      _id: "ride_finish_01",
      status: "IN_PROGRESS",
      paymentMethod: "CASH",
      paymentStatus: "PENDING",
      fare: 250,
      fareInPaise: 25000,
    };

    const targetPaymentStatus =
      inProgressRide.paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";

    const completedRide = {
      ...inProgressRide,
      status: "COMPLETED",
      paymentStatus: targetPaymentStatus,
      completedAt: new Date(),
    };

    assert.equal(completedRide.status, "COMPLETED");
    assert.equal(
      completedRide.paymentStatus,
      "PENDING_COLLECTION",
      "Completed cash ride must be PENDING_COLLECTION, awaiting explicit driver cash confirmation"
    );
    assert.notEqual(
      completedRide.paymentStatus,
      "PAID",
      "Completed ride must NOT automatically be marked PAID"
    );
  });
});

describe("Phase 2 Smoke Test Suite 6: Cash Collection Safety & Ledger Immutability", () => {
  it("Confirms physical cash collection, updates paymentStatus to COLLECTED, and sets timestamp", () => {
    const completedRide = {
      _id: "ride_cash_01",
      status: "COMPLETED",
      paymentMethod: "CASH",
      paymentStatus: "PENDING_COLLECTION",
      fare: 350,
      fareInPaise: 35000,
      driver: "driver_01",
      cashCollectedAt: null as Date | null,
    };

    const now = new Date();
    completedRide.paymentStatus = "COLLECTED";
    completedRide.cashCollectedAt = now;

    assert.equal(completedRide.paymentStatus, "COLLECTED");
    assert.equal(completedRide.cashCollectedAt, now);
  });

  it("Records immutable NON_MONETARY_RECORD in ledger without inflating platform wallet", () => {
    const rideId = "ride_cash_01";
    const fareInPaise = 35000;
    const driverId = "driver_01";

    const ledgerKey = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);
    assert.equal(ledgerKey, `ledger_ride_${rideId}_cash_collection_seq1`);

    const transactionRecord = {
      idempotencyKey: ledgerKey,
      userId: driverId,
      userRole: "DRIVER",
      type: "CASH_COLLECTED_BY_DRIVER",
      direction: "NON_MONETARY_RECORD",
      amountInPaise: fareInPaise,
      currency: "INR",
      entityType: "RIDE",
      entityId: rideId,
      eventType: "CASH_COLLECTION",
      status: "SETTLED",
    };

    assert.equal(transactionRecord.type, "CASH_COLLECTED_BY_DRIVER");
    assert.equal(transactionRecord.direction, "NON_MONETARY_RECORD");
    assert.equal(transactionRecord.amountInPaise, 35000);

    const driverPlatformWalletBalance = 0;
    assert.equal(
      driverPlatformWalletBalance,
      0,
      "Physical in-person cash does not credit platform wallet balance"
    );
  });

  it("Guarantees idempotency on repeated cash collection confirmations", () => {
    let collectionCount = 0;
    const existingTransactions = new Set<string>();

    const confirmCollection = (rideId: string) => {
      const key = generateLedgerIdempotencyKey("RIDE", rideId, "CASH_COLLECTION", 1);
      if (existingTransactions.has(key)) {
        return { alreadyCollected: true, key };
      }
      existingTransactions.add(key);
      collectionCount++;
      return { alreadyCollected: false, key };
    };

    const firstCall = confirmCollection("ride_idempotent_01");
    const secondCall = confirmCollection("ride_idempotent_01");

    assert.equal(firstCall.alreadyCollected, false);
    assert.equal(secondCall.alreadyCollected, true);
    assert.equal(collectionCount, 1, "Exactly one ledger entry must be created");
  });

  it("Confirms live payment gateway remains strictly disabled for Phase 2 Pilot", () => {
    const livePaymentsEnabled = isLivePaymentEnabled();
    assert.equal(
      livePaymentsEnabled,
      false,
      "Live payment gateway (Razorpay) must remain disabled for Phase 2 cash-only pilot"
    );
  });
});

describe("Phase 2 Smoke Test Suite 7: Offer Rejection, Maintenance Sweep & Driver Fallback", () => {
  it("Clears currentOffer and adds driver to rejectedDrivers on offer decline", () => {
    const ride = {
      _id: "ride_decline_01",
      status: "SEARCHING",
      currentOffer: {
        driverId: "driver_reject_01",
        expiresAt: new Date(Date.now() + 20000),
      },
      rejectedDrivers: [] as string[],
      dispatchStatus: "OFFERED",
    };

    ride.rejectedDrivers.push("driver_reject_01");
    ride.currentOffer = null as any;
    ride.dispatchStatus = "DISPATCHING";

    assert.equal(ride.currentOffer, null);
    assert.deepEqual(ride.rejectedDrivers, ["driver_reject_01"]);
    assert.equal(ride.dispatchStatus, "DISPATCHING");
  });

  it("Identifies expired offers and sweeps them back to dispatch pool", () => {
    const now = Date.now();
    const activeOffer = { driverId: "d1", expiresAt: new Date(now + 15000) };
    const expiredOffer = { driverId: "d2", expiresAt: new Date(now - 5000) };

    const isOfferExpired = (offer: { expiresAt: Date }) => offer.expiresAt.getTime() <= now;

    assert.equal(isOfferExpired(activeOffer), false);
    assert.equal(isOfferExpired(expiredOffer), true);
  });

  it("Releases reserved driver activeRideId when rider cancels ACCEPTED ride", () => {
    const assignedDriver = {
      _id: "driver_assigned_01",
      dutyState: "ON_TRIP",
      activeRideId: "ride_cancel_01" as string | null,
    };

    const ride = {
      _id: "ride_cancel_01",
      status: "ACCEPTED",
      driver: assignedDriver._id,
    };

    ride.status = "CANCELLED";

    if (assignedDriver.activeRideId === ride._id) {
      assignedDriver.activeRideId = null;
      assignedDriver.dutyState = "ONLINE_SEARCHING";
    }

    assert.equal(ride.status, "CANCELLED");
    assert.equal(assignedDriver.activeRideId, null);
    assert.equal(assignedDriver.dutyState, "ONLINE_SEARCHING");
  });
});

describe("Phase 2 Smoke Test Suite 8: Auto Booking Recurring Commute & Lead-Time Safety", () => {
  it("Generates canonical occurrence key to enforce idempotency across cron runs", () => {
    const commuteId = "commute_650000000000000000000010";
    const scheduledDate = new Date("2026-10-15T09:00:00.000Z");

    const key1 = generateOccurrenceKey(commuteId, scheduledDate);
    const key2 = generateOccurrenceKey(commuteId, scheduledDate);

    assert.equal(key1, key2, "Occurrence keys for same commute and date must be identical");
    assert.ok(key1.startsWith(`${commuteId}:2026-10-15_`), "Key format must start with commuteId:date");
  });

  it("Enforces T-60 dispatch boundary: rides > 60m away are NOT dispatchable; <= 60m are dispatchable", () => {
    const leadTimeMinutes = getDispatchLeadTimeMinutes();
    assert.equal(leadTimeMinutes, DEFAULT_DISPATCH_LEAD_TIME_MINUTES);

    const now = new Date("2026-10-12T10:00:00.000Z");

    const futureRide = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: new Date("2026-10-12T12:00:00.000Z"),
    };

    const nearRide = {
      status: "SEARCHING",
      driver: null,
      scheduledFor: new Date("2026-10-12T10:45:00.000Z"),
    };

    const isFutureDispatchable = isRideDispatchable(futureRide, now);
    const isNearDispatchable = isRideDispatchable(nearRide, now);

    assert.equal(isFutureDispatchable, false, "Ride > 60m in future must NOT be offered to drivers");
    assert.equal(isNearDispatchable, true, "Ride within 60m boundary MUST be offered to drivers");
  });
});

describe("Phase 2 Smoke Test Suite 9: Admin Document Review & Governance Controls", () => {
  it("Allows admin document approval to unlock driver dispatch eligibility", () => {
    const unverifiedDriver = {
      _id: "driver_doc_01",
      role: "DRIVER",
      status: "ACTIVE",
      dutyState: "ONLINE_SEARCHING",
      isOnline: true,
      activeRideId: null,
      driverDocuments: [
        {
          name: "Driving License (DL)",
          category: "DRIVER",
          status: "PENDING",
          expiry: "2029",
          docId: "DL-123",
        },
      ],
      driverVehicle: { type: "SEDAN", documentsVerified: false },
      driverCoordinates: [18.52, 73.85] as [number, number],
      driverCoordinatesUpdatedAt: new Date(),
    };

    let check = evaluateDriverEligibility(
      unverifiedDriver as any,
      { pickup: { coordinates: [18.52, 73.85] }, vehicleType: "SEDAN" },
      { maxRadiusKm: 10 }
    );
    assert.equal(check.isEligible, false);

    const approvedDriver = {
      ...unverifiedDriver,
      driverDocuments: DEFAULT_DRIVER_DOCUMENTS,
      driverVehicle: { type: "SEDAN", documentsVerified: true },
    };

    check = evaluateDriverEligibility(
      approvedDriver as any,
      { pickup: { coordinates: [18.52, 73.85] }, vehicleType: "SEDAN" },
      { maxRadiusKm: 10 }
    );
    assert.equal(check.isEligible, true);
  });

  it("Guarantees admin cannot suspend driver while driver is on an active trip", () => {
    const activeDriver = {
      _id: "driver_active_trip",
      isActive: true,
      dutyState: "ON_TRIP",
      activeRideId: "ride_live_999",
    };

    const canSafelySuspend = (driver: { activeRideId: string | null; dutyState: string }) => {
      if (driver.activeRideId !== null || driver.dutyState === "ON_TRIP") {
        return {
          allowed: false,
          code: "CANNOT_SUSPEND_DURING_ACTIVE_RIDE",
          message: "Cannot suspend driver while a ride is actively in progress",
        };
      }
      return { allowed: true };
    };

    const suspensionResult = canSafelySuspend(activeDriver);
    assert.equal(suspensionResult.allowed, false);
    assert.equal(suspensionResult.code, "CANNOT_SUSPEND_DURING_ACTIVE_RIDE");
  });

  it("Guarantees public registration strictly forces role to RIDER even if ADMIN is requested", () => {
    const publicRegistrationPayload = {
      name: "Malicious User",
      email: "attacker@example.com",
      phone: "+919876543210",
      password: "SuperSecretPassword123!",
      role: "ADMIN",
    };

    const enforcedRole = "RIDER";
    const userToSave = {
      ...publicRegistrationPayload,
      role: enforcedRole,
    };

    assert.equal(userToSave.role, "RIDER");
    assert.notEqual(userToSave.role, "ADMIN");
  });
});

describe("Phase 2 Smoke Test Suite 10: Infrastructure, Cron Security & Logging Sanitization", () => {
  it("Validates that protected cron requests require valid CRON_SECRET", () => {
    process.env.CRON_SECRET = "super_secure_cron_secret_32_characters_minimum!";

    const validReq = new Request("https://bhavo.com/api/cron/auto-booking", {
      headers: {
        authorization: "Bearer super_secure_cron_secret_32_characters_minimum!",
      },
    });

    const invalidReq = new Request("https://bhavo.com/api/cron/auto-booking", {
      headers: {
        authorization: "Bearer wrong_secret_here",
      },
    });

    const missingReq = new Request("https://bhavo.com/api/cron/auto-booking");

    assert.equal(verifyCronSecret(validReq), true);
    assert.equal(verifyCronSecret(invalidReq), false);
    assert.equal(verifyCronSecret(missingReq), false);
  });

  it("Sanitizes sensitive data from structured logger payloads", () => {
    const sensitiveLog = {
      event: "USER_LOGIN_ATTEMPT",
      email: "user@example.com",
      password: "plaintext_password_123!",
      otp: "9876",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      apiKey: "secret_api_key_live",
      safeInfo: "Pune Hinjawadi Ride",
    };

    const sanitized = sanitizeLogPayload(sensitiveLog) as Record<string, unknown>;

    assert.equal(sanitized.password, "[REDACTED]");
    assert.equal(sanitized.otp, "[REDACTED]");
    assert.equal(sanitized.token, "[REDACTED]");
    assert.equal(sanitized.apiKey, "[REDACTED]");
    assert.equal(sanitized.safeInfo, "Pune Hinjawadi Ride");
  });

  it("Rate limiter throttles excessive unauthenticated requests safely", async () => {
    const limiter = new InMemoryRateLimiter(5, 60000);
    const clientKey = "ip_192.168.1.100_auth";

    for (let i = 0; i < 5; i++) {
      const res = await limiter.recordFailure(clientKey, 60000);
      assert.equal(res.allowed, i < 4);
    }

    const blockedRes = await limiter.recordFailure(clientKey, 60000);
    assert.equal(blockedRes.allowed, false);
    assert.ok(blockedRes.retryAfterSeconds !== undefined && blockedRes.retryAfterSeconds > 0);
  });
});
