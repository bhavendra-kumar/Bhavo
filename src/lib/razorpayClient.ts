import crypto from "crypto";
import { getRazorpayConfig, getRazorpayWebhookSecret } from "@/lib/runtimeConfig";

export class RazorpayClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code = "RAZORPAY_ERROR", statusCode = 500, details?: unknown) {
    super(message);
    this.name = "RazorpayClientError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface RazorpayOrderInput {
  amountInPaise: number;
  currency?: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderOutput {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentOutput {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id?: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string | null;
  captured: boolean;
  description?: string;
  card_id?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  email?: string;
  contact?: string;
  notes: Record<string, string>;
  fee?: number;
  tax?: number;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
}

export interface VerifyCheckoutSignatureInput {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecretOverride?: string;
}

export interface VerifyWebhookSignatureInput {
  rawBody: string;
  signature: string;
  webhookSecretOverride?: string;
}

type MockTransport = {
  createOrder?: (input: RazorpayOrderInput) => Promise<RazorpayOrderOutput>;
  fetchPayment?: (paymentId: string) => Promise<RazorpayPaymentOutput>;
};

let activeMockTransport: MockTransport | null = null;

export function __setRazorpayMockTransport(mock: MockTransport | null) {
  activeMockTransport = mock;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export async function createRazorpayOrder(
  input: RazorpayOrderInput
): Promise<RazorpayOrderOutput> {
  const config = getRazorpayConfig();

  if (!input.amountInPaise || !Number.isInteger(input.amountInPaise) || input.amountInPaise <= 0) {
    throw new RazorpayClientError(
      "Invalid order amount: must be a positive integer in paise",
      "INVALID_AMOUNT",
      400
    );
  }

  const currency = input.currency || "INR";
  if (currency !== "INR") {
    throw new RazorpayClientError("Only INR currency is supported", "INVALID_CURRENCY", 400);
  }

  if (activeMockTransport?.createOrder) {
    return activeMockTransport.createOrder(input);
  }

  const credentials = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountInPaise,
        currency,
        receipt: input.receipt,
        notes: input.notes || {},
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorDescription =
        (errorJson as { error?: { description?: string } })?.error?.description ||
        `Provider rejected order creation with HTTP ${res.status}`;
      throw new RazorpayClientError(
        errorDescription,
        "PROVIDER_ORDER_CREATION_FAILED",
        res.status,
        errorJson
      );
    }

    const data = (await res.json()) as RazorpayOrderOutput;
    return data;
  } catch (err) {
    if (err instanceof RazorpayClientError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new RazorpayClientError(
      `Razorpay order creation request failed: ${msg}`,
      "PROVIDER_NETWORK_ERROR",
      502
    );
  }
}

export async function fetchRazorpayPayment(
  paymentId: string
): Promise<RazorpayPaymentOutput> {
  const config = getRazorpayConfig();

  if (!paymentId || typeof paymentId !== "string" || paymentId.trim() === "") {
    throw new RazorpayClientError("Invalid paymentId provided", "INVALID_PAYMENT_ID", 400);
  }

  if (activeMockTransport?.fetchPayment) {
    return activeMockTransport.fetchPayment(paymentId);
  }

  const credentials = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  try {
    const res = await fetch(`${RAZORPAY_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorDescription =
        (errorJson as { error?: { description?: string } })?.error?.description ||
        `Provider rejected payment lookup with HTTP ${res.status}`;
      throw new RazorpayClientError(
        errorDescription,
        "PROVIDER_PAYMENT_LOOKUP_FAILED",
        res.status,
        errorJson
      );
    }

    const data = (await res.json()) as RazorpayPaymentOutput;
    return data;
  } catch (err) {
    if (err instanceof RazorpayClientError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new RazorpayClientError(
      `Razorpay payment lookup request failed: ${msg}`,
      "PROVIDER_NETWORK_ERROR",
      502
    );
  }
}

export function verifyRazorpayCheckoutSignature({
  orderId,
  paymentId,
  signature,
  keySecretOverride,
}: VerifyCheckoutSignatureInput): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  let secret: string;
  try {
    secret = keySecretOverride || getRazorpayConfig().keySecret;
  } catch {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const generatedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const generatedBuf = Buffer.from(generatedSignature, "utf-8");
  const providedBuf = Buffer.from(signature, "utf-8");

  if (generatedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuf, providedBuf);
}

export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  webhookSecretOverride,
}: VerifyWebhookSignatureInput): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  let webhookSecret: string;
  try {
    webhookSecret = webhookSecretOverride || getRazorpayWebhookSecret();
  } catch {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const generatedBuf = Buffer.from(generatedSignature, "utf-8");
  const providedBuf = Buffer.from(signature, "utf-8");

  if (generatedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuf, providedBuf);
}
