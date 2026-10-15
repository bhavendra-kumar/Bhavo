import mongoose from "mongoose";
import Ride, { IRide } from "@/models/Ride";
import Transaction, { ITransaction } from "@/models/Transaction";
import { rupeesToPaise } from "@/lib/pricingEngine";
import {
  isLivePaymentEnabled,
  getRazorpayConfig,
} from "@/lib/runtimeConfig";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpayCheckoutSignature,
  RazorpayPaymentOutput,
} from "@/lib/razorpayClient";
import { recordFinancialEvent } from "@/lib/ledgerService";

export class PaymentError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = "PAYMENT_ERROR", statusCode = 400, details?: unknown) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface CreatePaymentOrderInput {
  rideId: string;
  riderId: mongoose.Types.ObjectId | string;
}

export interface PaymentOrderDetails {
  orderId: string;
  amountInPaise: number;
  amountInRupees: number;
  currency: "INR";
  keyId: string;
  rideId: string;
}

export interface ConfirmOnlinePaymentInput {
  rideId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  source: "CHECKOUT" | "WEBHOOK";
  riderId?: mongoose.Types.ObjectId | string;
}

export interface ConfirmOnlinePaymentResult {
  ride: IRide;
  transaction?: ITransaction;
  alreadyPaid: boolean;
  amountInRupees: number;
  amountInPaise: number;
  paymentId: string;
}

export interface GetPaymentStatusInput {
  rideId: string;
  userId: mongoose.Types.ObjectId | string;
  userRole: "RIDER" | "DRIVER" | "ADMIN" | "USER";
}

export async function createRidePaymentOrder(
  input: CreatePaymentOrderInput
): Promise<PaymentOrderDetails> {
  const { rideId, riderId } = input;

  if (!mongoose.isValidObjectId(rideId)) {
    throw new PaymentError("Invalid ride ID format", "INVALID_RIDE_ID", 400);
  }

  if (!isLivePaymentEnabled()) {
    throw new PaymentError(
      "Online payments are disabled on this system",
      "ONLINE_PAYMENTS_DISABLED",
      503
    );
  }

  const config = getRazorpayConfig();

  const ride = await Ride.findOne({
    _id: rideId,
    rider: riderId,
  });

  if (!ride) {
    throw new PaymentError("Ride not found or access denied", "RIDE_NOT_FOUND", 404);
  }

  if (ride.status !== "COMPLETED") {
    throw new PaymentError(
      `Cannot initiate payment for ride in status "${ride.status}". Ride must be COMPLETED.`,
      "RIDE_NOT_COMPLETED",
      409
    );
  }

  if (ride.paymentMethod === "CASH") {
    throw new PaymentError(
      "This ride was booked with CASH payment method. Direct driver cash collection is required.",
      "CASH_RIDE_ONLINE_PAYMENT_DISALLOWED",
      400
    );
  }

  if (ride.paymentStatus === "PAID") {
    throw new PaymentError("This ride is already marked as PAID", "ALREADY_PAID", 409);
  }

  if (ride.paymentStatus === "COLLECTED") {
    throw new PaymentError(
      "Payment for this ride has already been collected in cash by the driver",
      "ALREADY_SETTLED_IN_CASH",
      409
    );
  }

  const amountInPaise =
    ride.fareInPaise && ride.fareInPaise > 0
      ? ride.fareInPaise
      : rupeesToPaise(ride.fare);

  if (amountInPaise <= 0 || !Number.isInteger(amountInPaise)) {
    throw new PaymentError(
      "Authoritative fare is invalid or zero",
      "INVALID_FARE_AMOUNT",
      400
    );
  }

  if (ride.razorpayOrderId) {
    return {
      orderId: ride.razorpayOrderId,
      amountInPaise,
      amountInRupees: ride.fare,
      currency: "INR",
      keyId: config.keyId,
      rideId: ride._id.toString(),
    };
  }

  const receipt = `ride_${ride._id.toString().slice(-14)}`;
  const order = await createRazorpayOrder({
    amountInPaise,
    currency: "INR",
    receipt,
    notes: {
      rideId: ride._id.toString(),
      riderId: riderId.toString(),
    },
  });

  await Ride.updateOne(
    { _id: ride._id },
    {
      $set: {
        razorpayOrderId: order.id,
      },
    }
  );

  return {
    orderId: order.id,
    amountInPaise,
    amountInRupees: ride.fare,
    currency: "INR",
    keyId: config.keyId,
    rideId: ride._id.toString(),
  };
}

export async function confirmOnlinePayment(
  input: ConfirmOnlinePaymentInput
): Promise<ConfirmOnlinePaymentResult> {
  const { rideId, razorpayOrderId, razorpayPaymentId, razorpaySignature, source, riderId } = input;

  if (!mongoose.isValidObjectId(rideId)) {
    throw new PaymentError("Invalid ride ID format", "INVALID_RIDE_ID", 400);
  }

  if (!razorpayOrderId || typeof razorpayOrderId !== "string" || razorpayOrderId.trim() === "") {
    throw new PaymentError("Razorpay order ID is required", "MISSING_ORDER_ID", 400);
  }

  if (!razorpayPaymentId || typeof razorpayPaymentId !== "string" || razorpayPaymentId.trim() === "") {
    throw new PaymentError("Razorpay payment ID is required", "MISSING_PAYMENT_ID", 400);
  }

  const query: Record<string, unknown> = { _id: rideId };
  if (riderId) {
    query.rider = riderId;
  }

  const ride = await Ride.findOne(query);
  if (!ride) {
    throw new PaymentError("Ride not found or access denied", "RIDE_NOT_FOUND", 404);
  }

  if (ride.status !== "COMPLETED") {
    throw new PaymentError(
      `Cannot settle payment for ride in status "${ride.status}". Ride must be COMPLETED.`,
      "RIDE_NOT_COMPLETED",
      409
    );
  }

  if (ride.paymentStatus === "COLLECTED") {
    throw new PaymentError(
      "Ride is already settled in physical cash. Online payment cannot be confirmed.",
      "ALREADY_SETTLED_IN_CASH",
      409
    );
  }

  const expectedFareInPaise =
    ride.fareInPaise && ride.fareInPaise > 0
      ? ride.fareInPaise
      : rupeesToPaise(ride.fare);

  if (ride.paymentStatus === "PAID") {
    const existingTx = await Transaction.findOne({
      entityType: "RIDE",
      entityId: ride._id.toString(),
      eventType: "ONLINE_PAYMENT_CAPTURED",
    });

    return {
      ride,
      transaction: (existingTx as ITransaction) || undefined,
      alreadyPaid: true,
      amountInRupees: ride.fare,
      amountInPaise: expectedFareInPaise,
      paymentId: ride.razorpayPaymentId || razorpayPaymentId,
    };
  }

  if (ride.razorpayOrderId && ride.razorpayOrderId !== razorpayOrderId) {
    throw new PaymentError(
      `Submitted order ID does not match the authoritative order on this ride`,
      "ORDER_MISMATCH",
      400
    );
  }

  if (source === "CHECKOUT") {
    if (!razorpaySignature) {
      throw new PaymentError("Razorpay checkout signature is required", "MISSING_SIGNATURE", 400);
    }

    const isValidSig = verifyRazorpayCheckoutSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValidSig) {
      throw new PaymentError("Invalid Razorpay payment signature", "INVALID_SIGNATURE", 400);
    }
  }

  let providerPayment: RazorpayPaymentOutput;
  try {
    providerPayment = await fetchRazorpayPayment(razorpayPaymentId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new PaymentError(
      `Could not verify payment status with provider: ${msg}`,
      "PROVIDER_VERIFICATION_FAILED",
      502
    );
  }

  if (providerPayment.status !== "captured") {
    throw new PaymentError(
      `Payment is in uncaptured status: "${providerPayment.status}". Only CAPTURED payments mark a ride as paid.`,
      "PAYMENT_NOT_CAPTURED",
      400
    );
  }

  if (providerPayment.currency !== "INR") {
    throw new PaymentError(
      `Provider reported unsupported currency "${providerPayment.currency}". Must be INR.`,
      "CURRENCY_MISMATCH",
      400
    );
  }

  if (providerPayment.amount !== expectedFareInPaise) {
    throw new PaymentError(
      `Provider payment amount (₹${providerPayment.amount / 100}) does not match authoritative fare (₹${expectedFareInPaise / 100})`,
      "AMOUNT_MISMATCH",
      400
    );
  }

  if (providerPayment.order_id && providerPayment.order_id !== razorpayOrderId) {
    throw new PaymentError(
      `Provider payment order ID "${providerPayment.order_id}" does not match requested order "${razorpayOrderId}"`,
      "PROVIDER_ORDER_MISMATCH",
      400
    );
  }

  const now = new Date();

  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: ride._id,
      status: "COMPLETED",
      paymentStatus: { $in: ["PENDING", "PENDING_PAYMENT", "FAILED"] },
    },
    {
      $set: {
        paymentStatus: "PAID",
        paymentMethod: ride.paymentMethod === "CASH" ? "ONLINE" : ride.paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || null,
        paymentConfirmedAt: now,
      },
    },
    { new: true }
  );

  if (!updatedRide) {
    const rechecked = await Ride.findById(ride._id);
    if (rechecked && rechecked.paymentStatus === "PAID") {
      const existingTx = await Transaction.findOne({
        entityType: "RIDE",
        entityId: ride._id.toString(),
        eventType: "ONLINE_PAYMENT_CAPTURED",
      });
      return {
        ride: rechecked,
        transaction: (existingTx as ITransaction) || undefined,
        alreadyPaid: true,
        amountInRupees: rechecked.fare,
        amountInPaise: expectedFareInPaise,
        paymentId: rechecked.razorpayPaymentId || razorpayPaymentId,
      };
    }
    if (rechecked && rechecked.paymentStatus === "COLLECTED") {
      throw new PaymentError(
        "Race condition detected: ride was settled in physical cash during payment verification",
        "ALREADY_SETTLED_IN_CASH",
        409
      );
    }
    throw new PaymentError("Failed to update ride payment status atomically", "UPDATE_FAILED", 409);
  }

  const { transaction } = await recordFinancialEvent({
    userId: updatedRide.rider,
    userRole: "RIDER",
    type: "FARE_PAYMENT",
    direction: "CREDIT",
    amountInPaise: expectedFareInPaise,
    entityType: "RIDE",
    entityId: updatedRide._id.toString(),
    eventType: "ONLINE_PAYMENT_CAPTURED",
    sequence: 1,
    description: `Online payment of ₹${updatedRide.fare} captured via Razorpay (${razorpayPaymentId})`,
    metadata: {
      razorpayOrderId,
      razorpayPaymentId,
      source,
      providerPaymentMethod: providerPayment.method,
      settledAt: now.toISOString(),
    },
  });

  return {
    ride: updatedRide,
    transaction,
    alreadyPaid: false,
    amountInRupees: updatedRide.fare,
    amountInPaise: expectedFareInPaise,
    paymentId: razorpayPaymentId,
  };
}

export async function getRidePaymentStatus(
  input: GetPaymentStatusInput
): Promise<{
  rideId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  fareInRupees: number;
  fareInPaise: number;
  razorpayOrderId?: string | null;
  paymentConfirmedAt?: Date | null;
  isOnlinePaymentEnabled: boolean;
}> {
  const { rideId, userId, userRole } = input;

  if (!mongoose.isValidObjectId(rideId)) {
    throw new PaymentError("Invalid ride ID format", "INVALID_RIDE_ID", 400);
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new PaymentError("Ride not found", "RIDE_NOT_FOUND", 404);
  }

  const isRider = ride.rider.toString() === userId.toString();
  const isDriver = ride.driver && ride.driver.toString() === userId.toString();
  const isAdmin = userRole === "ADMIN";

  if (!isRider && !isDriver && !isAdmin) {
    throw new PaymentError("Access denied to this ride's payment status", "FORBIDDEN", 403);
  }

  const fareInPaise =
    ride.fareInPaise && ride.fareInPaise > 0
      ? ride.fareInPaise
      : rupeesToPaise(ride.fare);

  return {
    rideId: ride._id.toString(),
    status: ride.status,
    paymentMethod: ride.paymentMethod,
    paymentStatus: ride.paymentStatus,
    fareInRupees: ride.fare,
    fareInPaise,
    razorpayOrderId: ride.razorpayOrderId || null,
    paymentConfirmedAt: ride.paymentConfirmedAt || null,
    isOnlinePaymentEnabled: isLivePaymentEnabled(),
  };
}
