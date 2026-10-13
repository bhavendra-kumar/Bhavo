import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import {
  verifyRazorpayWebhookSignature,
  RazorpayPaymentOutput,
} from "@/lib/razorpayClient";
import { confirmOnlinePayment, PaymentError } from "@/lib/paymentService";
import { getRazorpayWebhookSecret, ConfigurationError } from "@/lib/runtimeConfig";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay
 * 
 * Secure Razorpay Webhook Endpoint
 * - Cryptographically verifies X-Razorpay-Signature over the RAW request body.
 * - Rejects unverified requests before any business processing.
 * - Idempotently processes payment.captured and order.paid events.
 * - Handles payment.failed by marking ride as payment failed without corrupting ride state.
 * - Preserves cash payment mutual exclusivity and ledger integrity.
 */
export async function POST(req: Request) {
  try {
    // 1. Read exact raw body as text before any JSON parsing
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { status: "error", code: "MISSING_WEBHOOK_SIGNATURE", message: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // 2. Cryptographically verify webhook signature against raw body
    let webhookSecret: string;
    try {
      webhookSecret = getRazorpayWebhookSecret();
    } catch (configErr) {
      if (configErr instanceof ConfigurationError) {
        return NextResponse.json(
          { status: "error", code: "WEBHOOK_NOT_CONFIGURED", message: configErr.message },
          { status: 400 }
        );
      }
      throw configErr;
    }

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      webhookSecretOverride: webhookSecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { status: "error", code: "INVALID_WEBHOOK_SIGNATURE", message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 3. Parse JSON safely after verification
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { status: "error", code: "INVALID_JSON", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const event = payload.event as string;
    if (!event) {
      return NextResponse.json(
        { status: "error", code: "MISSING_EVENT", message: "Event name missing in payload" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 4. Handle payment capture events
    if (event === "payment.captured" || event === "order.paid") {
      const payloadData = payload.payload as Record<string, Record<string, unknown>> | undefined;
      const paymentEntity = (payloadData?.payment?.entity as RazorpayPaymentOutput) || undefined;
      const orderEntity = (payloadData?.order?.entity as Record<string, unknown>) || undefined;

      const orderId = paymentEntity?.order_id || (orderEntity?.id as string);
      const paymentId = paymentEntity?.id;

      if (!orderId && !paymentId) {
        return NextResponse.json(
          { status: "error", code: "MISSING_ENTITIES", message: "Missing payment or order entities in webhook" },
          { status: 400 }
        );
      }

      // Reconcile ride by provider orderId or notes
      const notes = (paymentEntity?.notes || orderEntity?.notes || {}) as Record<string, string>;
      const noteRideId = notes.rideId;

      let ride = orderId ? await Ride.findOne({ razorpayOrderId: orderId }) : null;
      if (!ride && noteRideId) {
        ride = await Ride.findById(noteRideId);
      }

      if (!ride) {
        // Unknown ride: cannot reconcile; acknowledge safely to avoid repeated delivery
        return NextResponse.json(
          { status: "ignored", message: "No matching ride found for provider order" },
          { status: 200 }
        );
      }

      if (!paymentId) {
        return NextResponse.json(
          { status: "ignored", message: "No payment ID in capture event" },
          { status: 200 }
        );
      }

      // Execute shared idempotent payment confirmation
      const result = await confirmOnlinePayment({
        rideId: ride._id.toString(),
        razorpayOrderId: orderId || ride.razorpayOrderId || "",
        razorpayPaymentId: paymentId,
        source: "WEBHOOK",
      });

      return NextResponse.json(
        {
          status: "success",
          message: result.alreadyPaid
            ? "Webhook event already processed"
            : "Payment successfully reconciled via webhook",
          data: {
            rideId: result.ride._id,
            alreadyPaid: result.alreadyPaid,
            paymentStatus: result.ride.paymentStatus,
          },
        },
        { status: 200 }
      );
    }

    // 5. Handle payment failure events
    if (event === "payment.failed") {
      const payloadData = payload.payload as Record<string, Record<string, unknown>> | undefined;
      const paymentEntity = (payloadData?.payment?.entity as RazorpayPaymentOutput) || undefined;

      if (paymentEntity?.order_id) {
        const ride = await Ride.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (ride && ride.paymentStatus === "PENDING_PAYMENT") {
          await Ride.updateOne(
            { _id: ride._id, paymentStatus: "PENDING_PAYMENT" },
            { $set: { paymentStatus: "FAILED" } }
          );
        }
      }

      return NextResponse.json(
        { status: "success", message: "Failure event recorded safely" },
        { status: 200 }
      );
    }

    // Default: unhandled event types are acknowledged safely
    return NextResponse.json(
      { status: "acknowledged", message: `Event ${event} received` },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { status: "error", code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json(
      { status: "error", code: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
