import { NextResponse } from "next/server";
import { contactRateLimiter, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await contactRateLimiter.check(`contact:${clientIp}`);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many contact submissions. Please wait before submitting another message.",
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, message } = body;

    if (!firstName || !email || !message) {
      return NextResponse.json(
        { error: "First name, email, and message are required." },
        { status: 400 }
      );
    }

    if (
      typeof firstName !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      (lastName !== undefined && typeof lastName !== "string") ||
      firstName.trim().length > 100 ||
      (typeof lastName === "string" && lastName.trim().length > 100) ||
      email.trim().length > 150 ||
      message.trim().length > 2000
    ) {
      return NextResponse.json(
        { error: "Submitted message or field length exceeds allowable limits." },
        { status: 400 }
      );
    }

    // Record submission against rate limit
    await contactRateLimiter.recordFailure(`contact:${clientIp}`);

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! The Bhavo team will respond shortly.",
    });
  } catch (err: unknown) {
    console.error("Error processing contact form:", err);
    return NextResponse.json(
      { error: "Failed to submit contact message." },
      { status: 500 }
    );
  }
}
