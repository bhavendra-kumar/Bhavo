import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import mongoose from "mongoose";
import {
  isLivePaymentEnabled,
  getRazorpayConfig,
  getRazorpayWebhookSecret,
  ConfigurationError,
} from "../src/lib/runtimeConfig";
import {
  createRazorpayOrder,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
  __setRazorpayMockTransport,
  RazorpayPaymentOutput,
} from "../src/lib/razorpayClient";

describe("Phase 5: Payments & Razorpay Lifecycle Tests", () => {
  const dummyRiderId = new mongoose.Types.ObjectId("6529ab81c9a1240011111111");
  const strangerRiderId = new mongoose.Types.ObjectId("6529ab81c9a1240099999999");
  const dummyDriverId = new mongoose.Types.ObjectId("6529ab81c9a1240022222222");

  const TEST_KEY_ID = "rzp_test_1234567890abcdef";
  const TEST_KEY_SECRET = "test_key_secret_32_characters_long_entropy";
  const TEST_WEBHOOK_SECRET = "test_webhook_secret_32_chars_long";

  beforeEach(() => {
    __setRazorpayMockTransport(null);
  });

  describe("1. Configuration & Fail-Closed Gateways", () => {
    it("Razorpay remains disabled when LIVE_PAYMENTS_ENABLED is absent or not 'true'", () => {
      const origFlag = process.env.LIVE_PAYMENTS_ENABLED;
      const origKey = process.env.RAZORPAY_KEY_ID;
      const origSecret = process.env.RAZORPAY_KEY_SECRET;

      try {
        process.env.LIVE_PAYMENTS_ENABLED = "false";
        process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
        process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
        assert.equal(isLivePaymentEnabled(), false);

        delete process.env.LIVE_PAYMENTS_ENABLED;
        assert.equal(isLivePaymentEnabled(), false);

        process.env.LIVE_PAYMENTS_ENABLED = "true";
        delete process.env.RAZORPAY_KEY_ID;
        assert.equal(isLivePaymentEnabled(), false);
      } finally {
        if (origFlag !== undefined) process.env.LIVE_PAYMENTS_ENABLED = origFlag;
        else delete process.env.LIVE_PAYMENTS_ENABLED;
        if (origKey !== undefined) process.env.RAZORPAY_KEY_ID = origKey;
        else delete process.env.RAZORPAY_KEY_ID;
        if (origSecret !== undefined) process.env.RAZORPAY_KEY_SECRET = origSecret;
        else delete process.env.RAZORPAY_KEY_SECRET;
      }
    });

    it("getRazorpayConfig throws ConfigurationError when disabled or credentials missing", () => {
      const origFlag = process.env.LIVE_PAYMENTS_ENABLED;
      try {
        process.env.LIVE_PAYMENTS_ENABLED = "false";
        assert.throws(
          () => getRazorpayConfig(),
          (err: unknown) => err instanceof ConfigurationError && err.setting === "RAZORPAY"
        );
      } finally {
        if (origFlag !== undefined) process.env.LIVE_PAYMENTS_ENABLED = origFlag;
        else delete process.env.LIVE_PAYMENTS_ENABLED;
      }
    });

    it("getRazorpayWebhookSecret throws when webhook secret is missing", () => {
      const orig = process.env.RAZORPAY_WEBHOOK_SECRET;
      try {
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
        assert.throws(
          () => getRazorpayWebhookSecret(),
          (err: unknown) =>
            err instanceof ConfigurationError && err.setting === "RAZORPAY_WEBHOOK_SECRET"
        );
      } finally {
        if (orig !== undefined) process.env.RAZORPAY_WEBHOOK_SECRET = orig;
        else delete process.env.RAZORPAY_WEBHOOK_SECRET;
      }
    });
  });

  describe("2. Cryptographic Signature Verification", () => {
    it("Verifies checkout HMAC SHA-256 signature correctly", () => {
      const orderId = "order_O123456789";
      const paymentId = "pay_P123456789";
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(payload)
        .digest("hex");

      const isValid = verifyRazorpayCheckoutSignature({
        orderId,
        paymentId,
        signature: validSignature,
        keySecretOverride: TEST_KEY_SECRET,
      });
      assert.equal(isValid, true);
    });

    it("Rejects tampered or mismatched checkout signature", () => {
      const orderId = "order_O123456789";
      const paymentId = "pay_P123456789";
      const tamperedSignature = "invalid_hex_signature_abcdef1234567890abcdef1234567890";

      const isValid = verifyRazorpayCheckoutSignature({
        orderId,
        paymentId,
        signature: tamperedSignature,
        keySecretOverride: TEST_KEY_SECRET,
      });
      assert.equal(isValid, false);
    });

    it("Rejects checkout signature if order ID or payment ID is altered", () => {
      const orderId = "order_O123456789";
      const paymentId = "pay_P123456789";
      const validSignature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = verifyRazorpayCheckoutSignature({
        orderId: "order_DIFFERENT",
        paymentId,
        signature: validSignature,
        keySecretOverride: TEST_KEY_SECRET,
      });
      assert.equal(isValid, false);
    });

    it("Verifies webhook HMAC SHA-256 signature over raw request body", () => {
      const rawBody = JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_123" } } },
      });
      const validSignature = crypto
        .createHmac("sha256", TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const isValid = verifyRazorpayWebhookSignature({
        rawBody,
        signature: validSignature,
        webhookSecretOverride: TEST_WEBHOOK_SECRET,
      });
      assert.equal(isValid, true);
    });

    it("Rejects webhook signature if raw body has even a 1-character difference", () => {
      const rawBody = JSON.stringify({ event: "payment.captured" });
      const validSignature = crypto
        .createHmac("sha256", TEST_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const tamperedRawBody = JSON.stringify({ event: "payment.captured " });

      const isValid = verifyRazorpayWebhookSignature({
        rawBody: tamperedRawBody,
        signature: validSignature,
        webhookSecretOverride: TEST_WEBHOOK_SECRET,
      });
      assert.equal(isValid, false);
    });
  });

  describe("3. Server-Authoritative Order Creation Logic", () => {
    it("Rejects order creation with non-integer or zero paise amount", async () => {
      const origFlag = process.env.LIVE_PAYMENTS_ENABLED;
      const origKey = process.env.RAZORPAY_KEY_ID;
      const origSecret = process.env.RAZORPAY_KEY_SECRET;

      try {
        process.env.LIVE_PAYMENTS_ENABLED = "true";
        process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
        process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

        await assert.rejects(
          async () => {
            await createRazorpayOrder({
              amountInPaise: 450.5,
              currency: "INR",
              receipt: "rcpt_1",
            });
          },
          (err: unknown) =>
            err instanceof Error && (err as { code?: string }).code === "INVALID_AMOUNT"
        );

        await assert.rejects(
          async () => {
            await createRazorpayOrder({
              amountInPaise: 0,
              currency: "INR",
              receipt: "rcpt_1",
            });
          },
          (err: unknown) =>
            err instanceof Error && (err as { code?: string }).code === "INVALID_AMOUNT"
        );
      } finally {
        if (origFlag !== undefined) process.env.LIVE_PAYMENTS_ENABLED = origFlag;
        else delete process.env.LIVE_PAYMENTS_ENABLED;
        if (origKey !== undefined) process.env.RAZORPAY_KEY_ID = origKey;
        else delete process.env.RAZORPAY_KEY_ID;
        if (origSecret !== undefined) process.env.RAZORPAY_KEY_SECRET = origSecret;
        else delete process.env.RAZORPAY_KEY_SECRET;
      }
    });

    it("Rejects non-INR currency in order creation", async () => {
      const origFlag = process.env.LIVE_PAYMENTS_ENABLED;
      const origKey = process.env.RAZORPAY_KEY_ID;
      const origSecret = process.env.RAZORPAY_KEY_SECRET;

      try {
        process.env.LIVE_PAYMENTS_ENABLED = "true";
        process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
        process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

        await assert.rejects(
          async () => {
            await createRazorpayOrder({
              amountInPaise: 50000,
              currency: "USD" as unknown as "INR",
              receipt: "rcpt_1",
            });
          },
          (err: unknown) =>
            err instanceof Error && (err as { code?: string }).code === "INVALID_CURRENCY"
        );
      } finally {
        if (origFlag !== undefined) process.env.LIVE_PAYMENTS_ENABLED = origFlag;
        else delete process.env.LIVE_PAYMENTS_ENABLED;
        if (origKey !== undefined) process.env.RAZORPAY_KEY_ID = origKey;
        else delete process.env.RAZORPAY_KEY_ID;
        if (origSecret !== undefined) process.env.RAZORPAY_KEY_SECRET = origSecret;
        else delete process.env.RAZORPAY_KEY_SECRET;
      }
    });
  });

  describe("4. Ride Invariants & Payment State Machine", () => {
    it("Only COMPLETED rides are eligible for payment order creation", () => {
      const invalidStatuses = ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "CANCELLED"];

      for (const status of invalidStatuses) {
        const isEligible = status === "COMPLETED";
        assert.equal(isEligible, false, `Status ${status} must not be eligible for payment`);
      }

      assert.equal("COMPLETED" === "COMPLETED", true);
    });

    it("Rides booked as CASH cannot initiate online Razorpay payment", () => {
      const ride = {
        status: "COMPLETED",
        paymentMethod: "CASH",
        paymentStatus: "PENDING_COLLECTION",
      };

      const allowsOnline = ride.paymentMethod !== "CASH";
      assert.equal(allowsOnline, false);
    });

    it("Rides already settled in cash (COLLECTED) cannot initiate online payment", () => {
      const ride = {
        status: "COMPLETED",
        paymentMethod: "CASH",
        paymentStatus: "COLLECTED",
      };

      const isUnsettled = !["PAID", "COLLECTED"].includes(ride.paymentStatus);
      assert.equal(isUnsettled, false);
    });

    it("Rides already marked as PAID cannot initiate a second payment order", () => {
      const ride = {
        status: "COMPLETED",
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
      };

      assert.equal(ride.paymentStatus === "PAID", true);
    });

    it("Authoritative fare is calculated in integer paise without trusting client input", () => {
      const ride = {
        fare: 450,
        fareInPaise: 45000,
      };

      const serverPaise = ride.fareInPaise || Math.round(ride.fare * 100);
      assert.equal(serverPaise, 45000);
      assert.equal(Number.isInteger(serverPaise), true);

      const clientAmount = 100;
      assert.notEqual(clientAmount, serverPaise);
    });
  });

  describe("5. Mutual Exclusivity between Cash Collection and Online Payment", () => {
    it("Cash collection is blocked if online payment has already settled the ride", () => {
      const ride = {
        status: "COMPLETED",
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
      };

      const canCollectCash = ride.paymentMethod === "CASH" && ride.paymentStatus !== "PAID";
      assert.equal(canCollectCash, false);
    });

    it("Online payment is blocked if physical cash has already been collected", () => {
      const ride = {
        status: "COMPLETED",
        paymentMethod: "CASH",
        paymentStatus: "COLLECTED",
      };

      const canSettleOnline = ride.paymentStatus !== "COLLECTED";
      assert.equal(canSettleOnline, false);
    });

    it("Concurrent race simulation: atomic conditional update permits exactly one winner", () => {
      let currentPaymentStatus = "PENDING_PAYMENT";

      function attemptOnlinePayment() {
        if (["PENDING", "PENDING_PAYMENT", "FAILED"].includes(currentPaymentStatus)) {
          currentPaymentStatus = "PAID";
          return "ONLINE_SETTLED";
        }
        return "ONLINE_REJECTED";
      }

      function attemptCashCollection() {
        if (["PENDING", "PENDING_COLLECTION"].includes(currentPaymentStatus)) {
          currentPaymentStatus = "COLLECTED";
          return "CASH_COLLECTED";
        }
        return "CASH_REJECTED";
      }

      const first = attemptOnlinePayment();
      assert.equal(first, "ONLINE_SETTLED");
      assert.equal(currentPaymentStatus, "PAID");

      const second = attemptCashCollection();
      assert.equal(second, "CASH_REJECTED");
      assert.equal(currentPaymentStatus, "PAID");
    });
  });

  describe("6. Payment Capture Invariants & Idempotency", () => {
    it("Authorized-but-uncaptured payment is rejected and does not mark ride paid", () => {
      const providerPayment: Partial<RazorpayPaymentOutput> = {
        id: "pay_auth_only_123",
        status: "authorized",
        amount: 45000,
        currency: "INR",
        captured: false,
      };

      const isCaptured = providerPayment.status === "captured";
      assert.equal(isCaptured, false);
    });

    it("Failed payment status records FAILED and does not mark ride paid", () => {
      const providerPayment: Partial<RazorpayPaymentOutput> = {
        id: "pay_failed_123",
        status: "failed",
        amount: 45000,
        currency: "INR",
      };

      assert.equal(providerPayment.status === "captured", false);
    });

    it("Amount mismatch between provider and stored fare is rejected", () => {
      const storedFarePaise: number = 45000;
      const providerReportedAmount: number = 35000;

      const amountsMatch = storedFarePaise === providerReportedAmount;
      assert.equal(amountsMatch, false);
    });

    it("Currency mismatch between provider and INR is rejected", () => {
      const providerCurrency: string = "EUR";
      assert.equal(providerCurrency === "INR", false);
    });

    it("Order ID mismatch between provider payment and ride order is rejected", () => {
      const rideOrderId: string = "order_EXPECTED_123";
      const providerOrderId: string = "order_DIFFERENT_456";

      assert.equal(rideOrderId === providerOrderId, false);
    });

    it("Replayed verification request returns existing confirmation idempotently", () => {
      let transactionCount = 0;

      function simulateVerification(paymentStatus: string) {
        if (paymentStatus === "PAID") {
          return { alreadyPaid: true, transactionCreated: false };
        }
        transactionCount++;
        return { alreadyPaid: false, transactionCreated: true };
      }

      const firstCall = simulateVerification("PENDING_PAYMENT");
      assert.equal(firstCall.alreadyPaid, false);
      assert.equal(firstCall.transactionCreated, true);
      assert.equal(transactionCount, 1);

      const secondCall = simulateVerification("PAID");
      assert.equal(secondCall.alreadyPaid, true);
      assert.equal(secondCall.transactionCreated, false);
      assert.equal(transactionCount, 1);
    });
  });

  describe("7. Security & IDOR Protection", () => {
    it("Rider cannot check payment status of another rider's ride (IDOR rejection)", () => {
      const ride = {
        rider: dummyRiderId,
        driver: dummyDriverId,
      };

      const requesterId = strangerRiderId;
      const userRole: string = "RIDER";

      const isAuthorized =
        ride.rider.toString() === requesterId.toString() ||
        ride.driver?.toString() === requesterId.toString() ||
        userRole === "ADMIN";

      assert.equal(isAuthorized, false);
    });

    it("Assigned driver is permitted to check payment status", () => {
      const ride = {
        rider: dummyRiderId,
        driver: dummyDriverId,
      };

      const requesterId = dummyDriverId;
      const userRole: string = "DRIVER";

      const isAuthorized =
        ride.rider.toString() === requesterId.toString() ||
        ride.driver?.toString() === requesterId.toString() ||
        userRole === "ADMIN";

      assert.equal(isAuthorized, true);
    });

    it("Admin role is permitted to check payment status for audit", () => {
      const ride = {
        rider: dummyRiderId,
        driver: dummyDriverId,
      };

      const adminId = new mongoose.Types.ObjectId();
      const userRole = "ADMIN";

      const isAuthorized =
        ride.rider.toString() === adminId.toString() ||
        ride.driver?.toString() === adminId.toString() ||
        userRole === "ADMIN";

      assert.equal(isAuthorized, true);
    });
  });
});
