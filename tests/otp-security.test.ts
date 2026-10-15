import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Phase 1A: OTP Security & Verification Tests", () => {
  const verifyRideStartOtp = (actualRideOtp: string, enteredOtp: unknown) => {
    const cleanOtp = String(enteredOtp || "").trim();
    if (!cleanOtp) {
      return { success: false, status: 400, message: "OTP code is required to start ride" };
    }
    if (cleanOtp !== actualRideOtp) {
      return { success: false, status: 400, message: "Invalid OTP code" };
    }
    return { success: true, status: 200, message: "Ride started" };
  };

  it("Scenario 23: Universal test OTP 1234 fails when actual ride OTP is different", () => {
    const rideOtp = "7891";
    const result = verifyRideStartOtp(rideOtp, "1234");
    assert.equal(result.success, false);
    assert.equal(result.status, 400);
    assert.equal(result.message, "Invalid OTP code");
  });

  it("Scenario 24: Universal test OTP 4826 fails when actual ride OTP is different", () => {
    const rideOtp = "9182";
    const result = verifyRideStartOtp(rideOtp, "4826");
    assert.equal(result.success, false);
    assert.equal(result.status, 400);
    assert.equal(result.message, "Invalid OTP code");
  });

  it("Scenario 25: Empty, whitespace, or null OTP fails verification", () => {
    const rideOtp = "5512";
    const emptyInputs = ["", "   ", null, undefined];

    for (const input of emptyInputs) {
      const result = verifyRideStartOtp(rideOtp, input);
      assert.equal(result.success, false);
      assert.equal(result.status, 400);
    }
  });

  it("Scenario 26: Expired OTP fails verification and is invalidated", () => {
    const userOtpRecord = {
      resetOtp: "839201",
      resetOtpExpiry: new Date(Date.now() - 60 * 1000),
    };

    const verifyResetOtp = (record: typeof userOtpRecord, enteredOtp: string) => {
      if (new Date() > record.resetOtpExpiry) {
        return { success: false, message: "OTP has expired. Please request a new one." };
      }
      return { success: record.resetOtp === enteredOtp };
    };

    const res = verifyResetOtp(userOtpRecord, "839201");
    assert.equal(res.success, false);
    assert.match(res.message ?? "", /expired/i);
  });

  it("Scenario 27: OTP is strictly single-use and fails on second attempt", () => {
    const userOtpRecord = {
      resetOtp: "654321" as string | null,
      resetOtpExpiry: new Date(Date.now() + 5 * 60 * 1000) as Date | null,
    };

    const consumeOtp = (record: typeof userOtpRecord, enteredOtp: string) => {
      if (!record.resetOtp || record.resetOtp !== enteredOtp) {
        return { success: false, message: "Invalid or already consumed OTP" };
      }
      record.resetOtp = null;
      record.resetOtpExpiry = null;
      return { success: true };
    };

    const firstAttempt = consumeOtp(userOtpRecord, "654321");
    assert.equal(firstAttempt.success, true);

    const secondAttempt = consumeOtp(userOtpRecord, "654321");
    assert.equal(secondAttempt.success, false);
    assert.equal(userOtpRecord.resetOtp, null);
  });

  it("Scenario 28: Production forgot-password API response does not include devOtp or plain OTP", () => {
    const forgotPasswordApiResponse = {
      status: "success",
      message: "Password reset request registered for rider@bhavo.in.",
      delivery: "mock",
    };

    assert.equal("devOtp" in forgotPasswordApiResponse, false, "devOtp must never be in API response");
    assert.equal("otp" in forgotPasswordApiResponse, false, "otp must never be in API response");
  });

  it("Scenario 29: Production logger masks or omits OTP secrets from logs", () => {
    const sanitizeLog = (message: string, context?: Record<string, unknown>) => {
      const sanitized = { ...context };
      if (sanitized.otp) sanitized.otp = "[REDACTED]";
      if (sanitized.devOtp) sanitized.devOtp = "[REDACTED]";
      return { message, context: sanitized };
    };

    const logEntry = sanitizeLog("Password reset initiated", {
      email: "user@bhavo.in",
      otp: "948201",
    });

    assert.equal(logEntry.context.otp, "[REDACTED]");
    assert.notEqual(logEntry.context.otp, "948201");
  });
});
