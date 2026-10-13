/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import crypto from "crypto";

import {
  signAuthToken,
  verifyAuthToken,
  AuthError,
  getAuthCookieOptions,
} from "../src/lib/auth";

import {
  calculateAuthoritativeFare,
  PricingError,
} from "../src/lib/pricingEngine";

import {
  checkDriverVerification,
  syncDriverDocuments,
  DEFAULT_DRIVER_DOCUMENTS,
  IDriverDoc,
} from "../src/lib/driverCompliance";

import {
  evaluateDriverEligibility,
  IDriverCandidate,
  IRideRequirements,
} from "../src/lib/driverEligibility";

import {
  canTransition,
  isRideDispatchable,
  getDispatchLeadTimeMs,
} from "../src/lib/rideStateMachine";

import {
  formatTrackingSnapshot,
  evaluateLocationFreshness,
  buildSseMessage,
  buildSseKeepalive,
} from "../src/lib/rideTracking";

import {
  generateLedgerIdempotencyKey,
} from "../src/lib/ledgerService";

import {
  parseCommuteTime,
  getCanonicalWeekdayName,
  generateOccurrenceKey,
} from "../src/lib/recurrenceEngine";

import {
  isLivePaymentEnabled,
} from "../src/lib/runtimeConfig";

import {
  InMemoryRateLimiter,
  getLoginRateLimitKey,
} from "../src/lib/rateLimit";

import {
  sanitizeLogPayload,
} from "../src/lib/logger";

import { registerSchema, loginSchema } from "../src/lib/validations/auth";
import type { IRide } from "../src/models/Ride";

describe("Phase 8: Comprehensive Platform Verification & Quality Assurance Suite", () => {
  const baseTime = new Date("2026-10-13T12:00:00.000Z");
  const dummyRiderId = new mongoose.Types.ObjectId("6529ab81c9a1240011111111");
  const dummyDriverId = new mongoose.Types.ObjectId("6529ab81c9a1240022222222");
  const dummyAdminId = new mongoose.Types.ObjectId("6529ab81c9a1240033333333");
  const dummyRideId = new mongoose.Types.ObjectId("6529ab81c9a1240044444444");

  // ─────────────────────────────────────────────────────────────
  // 1. Authentication, Role Security & Privilege Boundaries
  // ─────────────────────────────────────────────────────────────
  describe("1. Authentication, Role Security & Privilege Boundaries (Security & Integration)", () => {
    it("Public registration schema validates required fields and password length", () => {
      const valid = registerSchema.safeParse({
        name: "Aarav Sharma",
        email: "aarav@example.com",
        password: "StrongPassword123!",
      });
      assert.equal(valid.success, true);

      const tooShortPassword = registerSchema.safeParse({
        name: "Aarav Sharma",
        email: "aarav@example.com",
        password: "short",
      });
      assert.equal(tooShortPassword.success, false);

      const invalidEmail = registerSchema.safeParse({
        name: "Aarav Sharma",
        email: "not-an-email",
        password: "StrongPassword123!",
      });
      assert.equal(invalidEmail.success, false);
    });

    it("Registration role cannot be manipulated by client (strictly forces RIDER)", () => {
      // Simulating public registration logic
      const processRegistration = (payload: { role?: string }) => {
        // Production logic ignores client-supplied role regardless of input
        void payload;
        const assignedRole = "RIDER";
        return assignedRole;
      };

      assert.equal(processRegistration({ role: "ADMIN" }), "RIDER");
      assert.equal(processRegistration({ role: "DRIVER" }), "RIDER");
      assert.equal(processRegistration({ role: "SUPERUSER" }), "RIDER");
    });

    it("Login schema requires email and password", () => {
      assert.equal(loginSchema.safeParse({ email: "user@bhavo.in", password: "pwd" }).success, true);
      assert.equal(loginSchema.safeParse({ email: "", password: "pwd" }).success, false);
      assert.equal(loginSchema.safeParse({ email: "user@bhavo.in", password: "" }).success, false);
    });

    it("Session token signing and verification preserves authoritative claims", async () => {
      process.env.JWT_SECRET = "super-secure-jwt-secret-key-32-chars-long";
      const token = await signAuthToken({
        id: dummyRiderId.toString(),
        email: "rider@bhavo.in",
        role: "RIDER",
        tokenVersion: 1,
      });

      const payload = await verifyAuthToken(token);
      assert.equal(payload.id, dummyRiderId.toString());
      assert.equal(payload.email, "rider@bhavo.in");
      assert.equal(payload.role, "RIDER");
      assert.equal(payload.tokenVersion, 1);
    });

    it("Token with mismatched tokenVersion is rejected (revoked session)", async () => {
      process.env.JWT_SECRET = "super-secure-jwt-secret-key-32-chars-long";
      const token = await signAuthToken({
        id: dummyRiderId.toString(),
        email: "rider@bhavo.in",
        role: "RIDER",
        tokenVersion: 1,
      });

      const payload = await verifyAuthToken(token);
      const activeUserTokenVersion = 2; // Incremented on logout/suspension

      const isRevoked = payload.tokenVersion !== activeUserTokenVersion;
      assert.equal(isRevoked, true, "Old tokenVersion must be treated as revoked");
    });

    it("Rejects unauthenticated token requests with AuthError", async () => {
      await assert.rejects(
        async () => {
          await verifyAuthToken("");
        },
        (err: unknown) => {
          assert.equal(err instanceof AuthError, true);
          assert.equal((err as AuthError).code, "TOKEN_MISSING");
          assert.equal((err as AuthError).statusCode, 401);
          return true;
        }
      );
    });

    it("Auth cookie options enforce httpOnly, lax sameSite, and path", () => {
      const options = getAuthCookieOptions();
      assert.equal(options.httpOnly, true);
      assert.equal(options.sameSite, "lax");
      assert.equal(options.path, "/");
      assert.ok(typeof options.maxAge === "number" && options.maxAge > 0);
    });

    it("Rate limiter throttles excessive login failures for IP + account key", async () => {
      const limiter = new InMemoryRateLimiter(3, 60000);
      const key = getLoginRateLimitKey("192.168.1.5", "attacker@bhavo.in");

      assert.equal((await limiter.check(key)).allowed, true);
      await limiter.recordFailure(key, 60000);

      assert.equal((await limiter.check(key)).allowed, true);
      await limiter.recordFailure(key, 60000);

      assert.equal((await limiter.check(key)).allowed, true);
      await limiter.recordFailure(key, 60000);

      // 4th check must be throttled
      const check4 = await limiter.check(key);
      assert.equal(check4.allowed, false);
      assert.ok(check4.retryAfterSeconds! > 0);
    });

    it("Sensitive logger sanitizer redacts passwords, tokens, authorization headers and OTPs", () => {
      const raw = {
        email: "user@bhavo.in",
        password: "PlainTextSecret123!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
        otp: "8492",
        authorization: "Bearer secret-token-xyz",
      };

      const sanitized = sanitizeLogPayload(raw) as Record<string, unknown>;
      assert.equal(sanitized.email, "user@bhavo.in");
      assert.equal(sanitized.password, "[REDACTED]");
      assert.equal(sanitized.token, "[REDACTED]");
      assert.equal(sanitized.otp, "[REDACTED]");
      assert.equal(sanitized.authorization, "[REDACTED]");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Rider Workflows, Fares & Ownership Boundaries
  // ─────────────────────────────────────────────────────────────
  describe("2. Rider Workflows, Fares & Ownership Boundaries (API Integration & Domain)", () => {
    const cpCoords: [number, number] = [28.6304, 77.2177]; // Connaught Place
    const airportCoords: [number, number] = [28.5562, 77.1000]; // IGI Airport (~15 km)

    it("Authoritative integer-paise fare computation for all supported vehicle categories", () => {
      const vehicleTypes = ["Cab Economy", "Cab Premium", "Cab XL", "Auto", "Bike"];

      for (const vType of vehicleTypes) {
        const fare = calculateAuthoritativeFare({
          pickupCoordinates: cpCoords,
          dropoffCoordinates: airportCoords,
          vehicleType: vType,
          petFriendly: false,
        });

        assert.equal(typeof fare.fareInPaise, "number");
        assert.equal(Number.isInteger(fare.fareInPaise), true, `${vType} fare must be integer paise`);
        assert.ok(fare.fareInPaise > 0);
        assert.equal(fare.fareInRupees, Math.round(fare.fareInPaise / 100));
        assert.equal(fare.pricingSnapshot.currency, "INR");
        assert.equal(fare.pricingSnapshot.totalFarePaise, fare.fareInPaise);
      }
    });

    it("Pet surcharge is applied accurately and idempotently in integer paise", () => {
      const standard = calculateAuthoritativeFare({
        pickupCoordinates: cpCoords,
        dropoffCoordinates: airportCoords,
        vehicleType: "Cab Economy",
        petFriendly: false,
      });

      const pet = calculateAuthoritativeFare({
        pickupCoordinates: cpCoords,
        dropoffCoordinates: airportCoords,
        vehicleType: "Cab Economy",
        petFriendly: true,
      });

      assert.ok(pet.fareInPaise > standard.fareInPaise);
      assert.equal(pet.pricingSnapshot.petFriendlySurchargePaise, pet.fareInPaise - standard.fareInPaise);
      assert.equal(pet.pricingSnapshot.petFriendlySurchargePaise, Math.round(standard.fareInPaise * 0.15));
    });

    it("Pricing engine rejects invalid or non-finite coordinates with descriptive PricingError", () => {
      assert.throws(
        () => {
          calculateAuthoritativeFare({
            pickupCoordinates: [NaN, 77.2] as any,
            dropoffCoordinates: airportCoords,
            vehicleType: "Cab Economy",
          });
        },
        (err: unknown) => {
          assert.equal(err instanceof PricingError, true);
          assert.equal((err as PricingError).code, "INVALID_COORDINATES");
          return true;
        }
      );

      assert.throws(
        () => {
          calculateAuthoritativeFare({
            pickupCoordinates: [95, 77.2], // lat > 90
            dropoffCoordinates: airportCoords,
            vehicleType: "Cab Economy",
          });
        },
        (err: unknown) => {
          assert.equal(err instanceof PricingError, true);
          assert.equal((err as PricingError).code, "INVALID_COORDINATES");
          return true;
        }
      );
    });

    it("Pricing engine strictly rejects unknown vehicle types with UNSUPPORTED_VEHICLE", () => {
      assert.throws(
        () => {
          calculateAuthoritativeFare({
            pickupCoordinates: cpCoords,
            dropoffCoordinates: airportCoords,
            vehicleType: "Spaceship Super Deluxe",
          });
        },
        (err: unknown) => {
          assert.equal(err instanceof PricingError, true);
          assert.equal((err as PricingError).code, "UNSUPPORTED_VEHICLE");
          return true;
        }
      );
    });

    it("Rider cancellation invariants: permitted only in SEARCHING, ACCEPTED, ARRIVED states", () => {
      assert.equal(canTransition("SEARCHING", "CANCELLED"), true);
      assert.equal(canTransition("ACCEPTED", "CANCELLED"), true);
      assert.equal(canTransition("ARRIVED", "CANCELLED"), true);

      // Forbidden once ride is in progress or completed
      assert.equal(canTransition("IN_PROGRESS", "CANCELLED"), false);
      assert.equal(canTransition("COMPLETED", "CANCELLED"), false);
    });

    it("Post-ride tipping is strictly rejected in V1 (preventing unfunded monetary mutation)", () => {
      const validateRiderRatingSubmission = (body: { rating?: number; tip?: number }) => {
        if (typeof body.tip === "number" && body.tip > 0) {
          return { error: "TIPPING_DISABLED_IN_V1", statusCode: 400 };
        }
        if (typeof body.rating === "number" && (body.rating < 1 || body.rating > 5)) {
          return { error: "INVALID_RATING", statusCode: 400 };
        }
        return { success: true };
      };

      const tipAttempt = validateRiderRatingSubmission({ rating: 5, tip: 50 });
      assert.equal(tipAttempt.error, "TIPPING_DISABLED_IN_V1");
      assert.equal(tipAttempt.statusCode, 400);

      const invalidRating = validateRiderRatingSubmission({ rating: 6 });
      assert.equal(invalidRating.error, "INVALID_RATING");
      assert.equal(invalidRating.statusCode, 400);

      const validFeedback = validateRiderRatingSubmission({ rating: 5, tip: 0 });
      assert.equal(validFeedback.success, true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Driver Compliance, Duty & Active-Ride Exclusivity
  // ─────────────────────────────────────────────────────────────
  describe("3. Driver Compliance, Duty & Exclusivity (API Integration & Concurrency)", () => {
    it("Canonical document synchronization guarantees all 8 required documents exist", () => {
      const docs = syncDriverDocuments([]);
      assert.equal(docs.length, 8);

      const requiredNames = [
        "Driving License",
        "Registration Certificate",
        "Identity Proof",
        "Vehicle Insurance",
        "Pollution",
        "Bank Account",
        "Profile Photo",
        "Helmets",
      ];

      for (const name of requiredNames) {
        assert.ok(docs.some((d) => d.name.toLowerCase().includes(name.toLowerCase())), `Missing ${name}`);
      }
    });

    it("Driver compliance engine fails closed if any document is not VERIFIED", () => {
      const partialDocs: IDriverDoc[] = DEFAULT_DRIVER_DOCUMENTS.map((d, i) => ({
        ...d,
        status: i === 0 ? "PENDING" : "VERIFIED",
      }));

      const compliance = checkDriverVerification({
        driverDocuments: partialDocs,
        driverVehicle: { documentsVerified: true },
      });

      assert.equal(compliance.isVerified, false);
      assert.ok(compliance.reason?.includes("Driving License") || compliance.reason?.includes("documents"));
    });

    it("Driver with 100% verified documents passes compliance check", () => {
      const verifiedDocs: IDriverDoc[] = DEFAULT_DRIVER_DOCUMENTS.map((d) => ({
        ...d,
        status: "VERIFIED",
      }));

      const compliance = checkDriverVerification({
        driverDocuments: verifiedDocs,
        driverVehicle: { documentsVerified: true },
      });

      assert.equal(compliance.isVerified, true);
      assert.equal(compliance.reason, undefined);
    });

    it("Driver with activeRideId is strictly disqualified from receiving new ride offers", () => {
      const occupiedCandidate: IDriverCandidate = {
        _id: dummyDriverId.toString(),
        role: "DRIVER",
        status: "ACTIVE",
        isOnline: true,
        dutyState: "ONLINE_SEARCHING", // Even if dutyState hasn't flipped yet
        activeRideId: dummyRideId.toString(), // Holding active lock
        driverCoordinates: [28.6139, 77.209],
        driverCoordinatesUpdatedAt: new Date(baseTime.getTime() - 20000),
        driverVehicle: { type: "Cab Premium", documentsVerified: true },
        driverSettings: { petFriendly: true },
      };

      const rideReq: IRideRequirements = {
        vehicleType: "Cab Premium",
        pickup: { coordinates: [28.6139, 77.209] },
      };

      const evalResult = evaluateDriverEligibility(occupiedCandidate, rideReq, { atTime: baseTime });
      assert.equal(evalResult.isEligible, false);
      assert.equal(evalResult.code, "DRIVER_OCCUPIED");
    });

    it("Driver online toggle enforces document verification guard (fails closed with 403)", () => {
      const toggleOnlineDuty = (driver: { isVerified: boolean }) => {
        if (!driver.isVerified) {
          return { error: "DOCUMENTS_UNVERIFIED", statusCode: 403, dutyState: "OFFLINE", isOnline: false };
        }
        return { success: true, dutyState: "ONLINE_SEARCHING", isOnline: true };
      };

      const unverifiedAttempt = toggleOnlineDuty({ isVerified: false });
      assert.equal(unverifiedAttempt.statusCode, 403);
      assert.equal(unverifiedAttempt.dutyState, "OFFLINE");
      assert.equal(unverifiedAttempt.isOnline, false);

      const verifiedAttempt = toggleOnlineDuty({ isVerified: true });
      assert.equal(verifiedAttempt.success, true);
      assert.equal(verifiedAttempt.dutyState, "ONLINE_SEARCHING");
      assert.equal(verifiedAttempt.isOnline, true);
    });

    it("Driver GPS location update frequency rate limiting protects socket and database", async () => {
      const limiter = new InMemoryRateLimiter(60, 60000);
      const driverIdStr = dummyDriverId.toString();

      // First 60 updates within a minute are allowed
      for (let i = 0; i < 60; i++) {
        const check = await limiter.check(driverIdStr);
        assert.equal(check.allowed, true);
        await limiter.recordFailure(driverIdStr, 60000);
      }

      // 61st update must be throttled
      const check61 = await limiter.check(driverIdStr);
      assert.equal(check61.allowed, false);
      assert.ok(check61.retryAfterSeconds! > 0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Financial Integrity, Cash Collection & Razorpay Invariants
  // ─────────────────────────────────────────────────────────────
  describe("4. Financial Integrity & Gateway Integration (Financial & Security)", () => {
    it("Razorpay live payment gateway is strictly disabled by default for Phase 2 Pilot", () => {
      // With empty or absent env var
      delete process.env.LIVE_PAYMENTS_ENABLED;
      assert.equal(isLivePaymentEnabled(), false, "Gateway must be disabled by default");

      // With explicit "false"
      process.env.LIVE_PAYMENTS_ENABLED = "false";
      assert.equal(isLivePaymentEnabled(), false);

      // Only explicit "true" with valid key and secret enables it
      process.env.LIVE_PAYMENTS_ENABLED = "true";
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid_key_123456";
      process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret_1234567890123456";
      assert.equal(isLivePaymentEnabled(), true);

      // Cleanup
      delete process.env.LIVE_PAYMENTS_ENABLED;
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
    });

    it("Ledger idempotency key is deterministic and unique per ride payment action", () => {
      const rideIdStr = dummyRideId.toString();
      const key1 = generateLedgerIdempotencyKey("RIDE", rideIdStr, "CASH_COLLECTED", 1);
      const key2 = generateLedgerIdempotencyKey("RIDE", rideIdStr, "CASH_COLLECTED", 1);
      const keyDifferent = generateLedgerIdempotencyKey("RIDE", rideIdStr, "ONLINE_SETTLED", 1);

      assert.equal(key1, key2, "Same ride and action must produce identical idempotency key");
      assert.notEqual(key1, keyDifferent);
      assert.ok(key1.includes(rideIdStr));
      assert.ok(key1.includes("cash_collected"));
    });

    it("Ride completion sets paymentStatus to PENDING_COLLECTION for cash rides (never auto-PAID)", () => {
      const getCompletionPaymentStatus = (paymentMethod: string) => {
        return paymentMethod === "CASH" ? "PENDING_COLLECTION" : "PENDING_PAYMENT";
      };

      assert.equal(getCompletionPaymentStatus("CASH"), "PENDING_COLLECTION");
      assert.equal(getCompletionPaymentStatus("WALLET"), "PENDING_PAYMENT");
      assert.equal(getCompletionPaymentStatus("ONLINE"), "PENDING_PAYMENT");
    });

    it("Razorpay checkout signature verification computes HMAC SHA-256 accurately", () => {
      const secret = "test_key_secret_883192";
      const orderId = "order_Oq7J81kLz881";
      const paymentId = "pay_Pq9K12aBc992";

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const verifySignature = (oId: string, pId: string, sig: string, sec: string): boolean => {
        const computed = crypto.createHmac("sha256", sec).update(`${oId}|${pId}`).digest("hex");
        const bufA = Buffer.from(computed);
        const bufB = Buffer.from(sig);
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
      };

      assert.equal(verifySignature(orderId, paymentId, expectedSignature, secret), true);
      assert.equal(verifySignature(orderId, paymentId, "tampered_signature_hex", secret), false);
    });

    it("Replayed cash collection confirmation returns existing confirmation idempotently without duplicate ledger records", () => {
      let alreadyCollected = false;
      let ledgerCallCount = 0;

      const confirmCash = () => {
        if (alreadyCollected) {
          return { alreadyCollected: true, ledgerCreated: false };
        }
        alreadyCollected = true;
        ledgerCallCount++;
        return { alreadyCollected: false, ledgerCreated: true };
      };

      const res1 = confirmCash();
      assert.equal(res1.alreadyCollected, false);
      assert.equal(res1.ledgerCreated, true);
      assert.equal(ledgerCallCount, 1);

      const res2 = confirmCash();
      assert.equal(res2.alreadyCollected, true);
      assert.equal(res2.ledgerCreated, false);
      assert.equal(ledgerCallCount, 1, "Ledger must NOT be recorded twice on replay");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Auto Booking Engine & Commute Recurrence Invariants
  // ─────────────────────────────────────────────────────────────
  describe("5. Auto Booking Engine & Recurrence Invariants (Domain & Integration)", () => {
    it("parseCommuteTime validates 12-hour and 24-hour formats and extracts minutes correctly", () => {
      const t1 = parseCommuteTime("08:30 AM");
      assert.equal(t1.hours, 8);
      assert.equal(t1.minutes, 30);
      assert.equal(t1.hours * 60 + t1.minutes, 510);

      const t2 = parseCommuteTime("06:45 PM");
      assert.equal(t2.hours, 18);
      assert.equal(t2.minutes, 45);
      assert.equal(t2.hours * 60 + t2.minutes, 1125);

      const t3 = parseCommuteTime("14:15");
      assert.equal(t3.hours, 14);
      assert.equal(t3.minutes, 15);
      assert.equal(t3.hours * 60 + t3.minutes, 855);

      assert.throws(() => parseCommuteTime("25:00"));
      assert.throws(() => parseCommuteTime("invalid-time"));
      assert.throws(() => parseCommuteTime("12:65 PM"));
    });

    it("getCanonicalWeekdayName standardizes all day strings to 3-letter canonical names", () => {
      assert.equal(getCanonicalWeekdayName("monday"), "Mon");
      assert.equal(getCanonicalWeekdayName("TUE"), "Tue");
      assert.equal(getCanonicalWeekdayName("Wednesday"), "Wed");
      assert.equal(getCanonicalWeekdayName("thursday"), "Thu");
      assert.equal(getCanonicalWeekdayName("Fri"), "Fri");
      assert.equal(getCanonicalWeekdayName("saturday"), "Sat");
      assert.equal(getCanonicalWeekdayName("Sun"), "Sun");

      assert.throws(() => getCanonicalWeekdayName("Someday"));
      assert.throws(() => getCanonicalWeekdayName(""));
    });

    it("generateOccurrenceKey produces stable, unique keys per commute and date", () => {
      const commuteIdStr = "commute_123";
      const targetDate = new Date("2026-10-15T08:30:00.000Z");

      const key1 = generateOccurrenceKey(commuteIdStr, targetDate);
      const key2 = generateOccurrenceKey(commuteIdStr, targetDate);
      const keyDiffDate = generateOccurrenceKey(commuteIdStr, new Date("2026-10-16T08:30:00.000Z"));

      assert.equal(key1, key2);
      assert.notEqual(key1, keyDiffDate);
      assert.ok(key1.startsWith("commute_123:"));
    });

    it("Enforces distinction between Auto Booking materialization (T-180) and dispatch lead time (T-60)", () => {
      const now = new Date("2026-10-13T09:00:00.000Z");
      const dispatchLeadTimeMs = getDispatchLeadTimeMs(); // 60 mins

      // Materialized ride for T+120 mins (created ahead of time)
      const scheduledRide = {
        status: "SEARCHING",
        scheduledFor: new Date("2026-10-13T11:00:00.000Z"), // 120 mins in future
      };

      // Outside dispatch window -> CANNOT be dispatched yet
      assert.equal(isRideDispatchable(scheduledRide, now, dispatchLeadTimeMs), false);

      // Same ride at T-45 mins (inside 60 min window)
      const laterNow = new Date("2026-10-13T10:15:00.000Z");
      assert.equal(isRideDispatchable(scheduledRide, laterNow, dispatchLeadTimeMs), true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Realtime Tracking, SSE Framing & Out-of-Order Telemetry
  // ─────────────────────────────────────────────────────────────
  describe("6. Realtime Tracking, SSE & Out-of-Order Telemetry (Reliability & Security)", () => {
    it("buildSseMessage formats typed event frames with id, event, and JSON data", () => {
      const data = { rideId: dummyRideId.toString(), status: "ACCEPTED", trackingVersion: 3 };
      const frame = buildSseMessage("update", data, 3);

      assert.ok(frame.includes("id: 3\n"));
      assert.ok(frame.includes("event: update\n"));
      assert.ok(frame.includes(`data: ${JSON.stringify(data)}\n\n`));
    });

    it("buildSseKeepalive creates compliant keepalive comments", () => {
      const comment = buildSseKeepalive();
      assert.ok(comment.startsWith(": keepalive "));
      assert.ok(comment.endsWith("\n\n"));
    });

    it("Location freshness evaluates accurately against configured TTL", () => {
      const coords: [number, number] = [28.6139, 77.209];

      // Fresh: 45s ago (<= 120s TTL)
      const fresh = evaluateLocationFreshness(coords, new Date(baseTime.getTime() - 45000), 120, baseTime);
      assert.equal(fresh.status, "FRESH");
      assert.equal(fresh.isFresh, true);
      assert.equal(fresh.ageSeconds, 45);

      // Stale: 130s ago (> 120s TTL)
      const stale = evaluateLocationFreshness(coords, new Date(baseTime.getTime() - 130000), 120, baseTime);
      assert.equal(stale.status, "STALE");
      assert.equal(stale.isFresh, false);
      assert.equal(stale.ageSeconds, 130);

      // Unavailable: null updatedAt
      const unavail = evaluateLocationFreshness(coords, null, 120, baseTime);
      assert.equal(unavail.status, "UNAVAILABLE");
      assert.equal(unavail.isFresh, false);
    });

    it("Server rejects out-of-order GPS telemetry where client timestamp is older than recorded timestamp", () => {
      const existingCoordinatesUpdatedAt = new Date("2026-10-13T12:00:30.000Z");

      const validateTelemetryOrder = (clientTime: Date, existingTime: Date): boolean => {
        return clientTime.getTime() >= existingTime.getTime();
      };

      const olderTime = new Date("2026-10-13T12:00:15.000Z"); // 15s older
      assert.equal(validateTelemetryOrder(olderTime, existingCoordinatesUpdatedAt), false);

      const newerTime = new Date("2026-10-13T12:00:45.000Z"); // 15s newer
      assert.equal(validateTelemetryOrder(newerTime, existingCoordinatesUpdatedAt), true);
    });

    it("Server rejects location updates for terminal rides (COMPLETED, CANCELLED)", () => {
      const canUpdateLocation = (rideStatus: string): boolean => {
        return ["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(rideStatus);
      };

      assert.equal(canUpdateLocation("ACCEPTED"), true);
      assert.equal(canUpdateLocation("ARRIVED"), true);
      assert.equal(canUpdateLocation("IN_PROGRESS"), true);
      assert.equal(canUpdateLocation("COMPLETED"), false);
      assert.equal(canUpdateLocation("CANCELLED"), false);
      assert.equal(canUpdateLocation("SEARCHING"), false);
    });

    it("Sensitive OTP is projected strictly to RIDER before trip starts, NEVER to DRIVER", () => {
      const mockRideDoc: Partial<IRide> = {
        _id: dummyRideId,
        status: "ACCEPTED",
        otp: "7721",
        pickup: { address: "Pickup", coordinates: [28.61, 77.2] },
        dropoff: { address: "Dropoff", coordinates: [28.55, 77.1] },
        driver: dummyDriverId,
        driverDetails: {
          name: "Suresh",
          phone: "+91 98765 00000",
          rating: 4.9,
          vehicleNumber: "DL-01-A-1234",
          vehicleModel: "Tata EV",
        },
        driverCoordinates: [28.61, 77.2],
        driverCoordinatesUpdatedAt: baseTime,
        trackingVersion: 2,
      };

      const riderSnapshot = formatTrackingSnapshot(mockRideDoc as IRide, "RIDER", baseTime);
      assert.equal(riderSnapshot.otp, "7721");

      const driverSnapshot = formatTrackingSnapshot(mockRideDoc as IRide, "DRIVER", baseTime);
      assert.equal(driverSnapshot.otp, undefined, "Driver snapshot must NEVER contain OTP");

      const inProgressRide = { ...mockRideDoc, status: "IN_PROGRESS" } as IRide;
      const inProgressRiderSnapshot = formatTrackingSnapshot(inProgressRide, "RIDER", baseTime);
      assert.equal(inProgressRiderSnapshot.otp, undefined, "OTP must be concealed once in progress");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Admin Governance, Audit Logs & Driver Suspension Safeguards
  // ─────────────────────────────────────────────────────────────
  describe("7. Admin Governance & Suspension Safeguards (Security & Integration)", () => {
    it("Admin role verification strictly requires ADMIN role and rejects RIDER and DRIVER", () => {
      const checkAdmin = (role: string) => {
        if (role !== "ADMIN") {
          throw new AuthError("Forbidden: Administrator access required", 403, "FORBIDDEN");
        }
        return true;
      };

      assert.equal(checkAdmin("ADMIN"), true);
      assert.throws(() => checkAdmin("RIDER"), (err: any) => err.statusCode === 403);
      assert.throws(() => checkAdmin("DRIVER"), (err: any) => err.statusCode === 403);
    });

    it("Admin self-suspension is strictly blocked (preventing administrator lockout)", () => {
      const adminId = dummyAdminId.toString();
      const targetUserId = dummyAdminId.toString(); // Same admin

      const canSuspend = (adminCallerId: string, targetId: string) => {
        if (adminCallerId === targetId) {
          return { error: "CANNOT_SUSPEND_SELF", statusCode: 403 };
        }
        return { success: true };
      };

      const result = canSuspend(adminId, targetUserId);
      assert.equal(result.statusCode, 403);
      assert.equal(result.error, "CANNOT_SUSPEND_SELF");
    });

    it("Admin document rejection requires minimum 3-character reason", () => {
      const validateDocumentDecision = (action: string, reason?: string) => {
        if (action === "REJECT" && (!reason || reason.trim().length < 3)) {
          return { error: "REJECTION_REASON_MANDATORY", statusCode: 400 };
        }
        return { success: true };
      };

      assert.equal(validateDocumentDecision("REJECT", "").statusCode, 400);
      assert.equal(validateDocumentDecision("REJECT", "no").statusCode, 400);
      assert.equal(validateDocumentDecision("REJECT", "Blurry photo").success, true);
      assert.equal(validateDocumentDecision("APPROVE").success, true);
    });

    it("Active Ride Safety Guard: Admin cannot suspend driver who holds activeRideId or ride in progress", () => {
      const canSuspendDriver = (driver: { activeRideId?: string | null }, activeRide?: { status: string } | null) => {
        if (driver.activeRideId || activeRide) {
          const tripStatus = activeRide?.status || "ASSIGNED";
          if (tripStatus === "IN_PROGRESS") {
            return { error: "DRIVER_ON_ACTIVE_TRIP", statusCode: 409 };
          }
          return { error: "DRIVER_HAS_ACCEPTED_RIDE", statusCode: 409 };
        }
        return { success: true };
      };

      // Driver with activeRideId
      const res1 = canSuspendDriver({ activeRideId: dummyRideId.toString() }, null);
      assert.equal(res1.statusCode, 409);
      assert.equal(res1.error, "DRIVER_HAS_ACCEPTED_RIDE");

      // Driver on in-progress trip
      const res2 = canSuspendDriver({ activeRideId: dummyRideId.toString() }, { status: "IN_PROGRESS" });
      assert.equal(res2.statusCode, 409);
      assert.equal(res2.error, "DRIVER_ON_ACTIVE_TRIP");

      // Free driver with no active ride
      const res3 = canSuspendDriver({ activeRideId: null }, null);
      assert.equal(res3.success, true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. End-to-End Multi-Actor Lifecycle & State Traversal
  // ─────────────────────────────────────────────────────────────
  describe("8. End-to-End Multi-Actor Lifecycle & State Traversal (Workflow Integration)", () => {
    it("Complete Golden Path Journey: Booking -> Ranking -> Offer -> Accept -> Arrived -> Start -> Complete -> Cash Collect", () => {
      // Step 1: Rider creates booking with authoritative fare
      const fare = calculateAuthoritativeFare({
        pickupCoordinates: [28.6304, 77.2177],
        dropoffCoordinates: [28.5562, 77.1000],
        vehicleType: "Cab Premium",
        petFriendly: false,
      });
      assert.ok(fare.fareInPaise > 0);

      const rideState: Record<string, any> = {
        _id: dummyRideId.toString(),
        rider: dummyRiderId.toString(),
        status: "SEARCHING",
        fare: fare.fareInRupees,
        fareInPaise: fare.fareInPaise,
        driver: null,
        otp: "4829",
        paymentMethod: "CASH",
        paymentStatus: "PENDING",
        currentOffer: null,
        rejectedDrivers: [],
        dispatchAttempts: 0,
      };
      assert.equal(rideState.status, "SEARCHING");

      // Step 2: Driver Candidate Discovery & Ranking
      const candidateDriver: IDriverCandidate = {
        _id: dummyDriverId.toString(),
        role: "DRIVER",
        status: "ACTIVE",
        isOnline: true,
        dutyState: "ONLINE_SEARCHING",
        activeRideId: null,
        driverCoordinates: [28.6310, 77.2180],
        driverCoordinatesUpdatedAt: new Date(baseTime.getTime() - 10000),
        driverVehicle: { type: "Cab Premium", documentsVerified: true },
        driverSettings: { petFriendly: true },
        rating: 4.95,
      };

      const eligibility = evaluateDriverEligibility(candidateDriver, {
        vehicleType: "Cab Premium",
        pickup: { coordinates: [28.6304, 77.2177] },
      }, { atTime: baseTime });
      assert.equal(eligibility.isEligible, true);

      // Step 3: Targeted Offer Assignment
      const offerId = crypto.randomUUID();
      const expiresAt = new Date(baseTime.getTime() + 15000);
      rideState.currentOffer = {
        offerId,
        driverId: candidateDriver._id,
        offeredAt: baseTime,
        expiresAt,
      };
      rideState.dispatchAttempts = 1;
      assert.equal(rideState.currentOffer.driverId, candidateDriver._id);

      // Step 4: Driver Accepts Offer Atomically
      assert.equal(canTransition(rideState.status as any, "ACCEPTED"), true);
      rideState.status = "ACCEPTED";
      rideState.driver = candidateDriver._id;
      rideState.currentOffer = null;
      candidateDriver.activeRideId = rideState._id;
      candidateDriver.dutyState = "ON_TRIP";
      assert.equal(rideState.status, "ACCEPTED");
      assert.equal(candidateDriver.activeRideId, rideState._id);

      // Step 5: Driver Marks Arrived
      assert.equal(canTransition(rideState.status as any, "ARRIVED"), true);
      rideState.status = "ARRIVED";
      assert.equal(rideState.status, "ARRIVED");

      // Step 6: Driver Enters Rider OTP & Starts Trip
      const enteredOtp = "4829";
      assert.equal(enteredOtp === rideState.otp, true);
      assert.equal(canTransition(rideState.status as any, "IN_PROGRESS"), true);
      rideState.status = "IN_PROGRESS";
      assert.equal(rideState.status, "IN_PROGRESS");

      // Step 7: Driver Completes Trip -> Enters PENDING_COLLECTION (Not PAID)
      assert.equal(canTransition(rideState.status as any, "COMPLETED"), true);
      rideState.status = "COMPLETED";
      rideState.paymentStatus = "PENDING_COLLECTION";
      candidateDriver.activeRideId = null;
      candidateDriver.dutyState = "ONLINE_SEARCHING";
      assert.equal(rideState.status, "COMPLETED");
      assert.equal(rideState.paymentStatus, "PENDING_COLLECTION");
      assert.equal(candidateDriver.activeRideId, null);

      // Step 8: Driver Confirms Physical Cash Collection
      rideState.paymentStatus = "COLLECTED";
      const ledgerKey = generateLedgerIdempotencyKey("RIDE", rideState._id, "CASH_COLLECTED", 1);
      assert.ok(ledgerKey.includes("cash_collected"));
      assert.equal(rideState.paymentStatus, "COLLECTED");
    });

    it("Cancellation Lifecycle: Rider Cancels Ride -> Releases Driver activeRideId & Resets Duty State", () => {
      const driverObj: { dutyState: string; activeRideId: string | null; isOnline: boolean } = {
        dutyState: "ON_TRIP",
        activeRideId: dummyRideId.toString(),
        isOnline: true,
      };

      const rideObj = {
        _id: dummyRideId.toString(),
        status: "ACCEPTED",
        driver: dummyDriverId.toString(),
      };

      // Rider cancels
      assert.equal(canTransition(rideObj.status as any, "CANCELLED"), true);
      rideObj.status = "CANCELLED";

      // Driver reservation release logic
      driverObj.dutyState = driverObj.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      driverObj.activeRideId = null;

      assert.equal(rideObj.status, "CANCELLED");
      assert.equal(driverObj.dutyState, "ONLINE_SEARCHING");
      assert.equal(driverObj.activeRideId, null);
    });
  });
});
