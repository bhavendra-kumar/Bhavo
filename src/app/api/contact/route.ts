import { NextResponse } from "next/server";
import { contactRateLimiter, getClientIp } from "@/lib/rateLimit";
import { sendContactNotification } from "@/lib/resend";

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
    const { firstName, lastName, email, phone, subject, message } = body;

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
      (phone !== undefined && typeof phone !== "string") ||
      (subject !== undefined && typeof subject !== "string") ||
      firstName.trim().length > 100 ||
      (typeof lastName === "string" && lastName.trim().length > 100) ||
      email.trim().length > 150 ||
      (typeof phone === "string" && phone.trim().length > 30) ||
      (typeof subject === "string" && subject.trim().length > 150) ||
      message.trim().length > 2000
    ) {
      return NextResponse.json(
        { error: "Submitted message or field length exceeds allowable limits." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Deliver form submission to bhavendrakumar007@gmail.com via Resend
    const emailResult = await sendContactNotification({
      firstName: firstName.trim(),
      lastName: typeof lastName === "string" ? lastName.trim() : undefined,
      email: email.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      subject: typeof subject === "string" ? subject.trim() : undefined,
      message: message.trim(),
      clientIp,
    });

    if (!emailResult.success) {
      console.error("[Contact API] Failed to deliver message:", emailResult.error);
      return NextResponse.json(
        {
          error:
            emailResult.error ||
            "Unable to deliver message at this time. Please try again shortly.",
        },
        { status: 502 }
      );
    }

    // Record submission for rate limiting
    await contactRateLimiter.recordFailure(`contact:${clientIp}`);

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! Bhavendra and the Bhavo team will respond shortly.",
      provider: emailResult.provider,
    });
  } catch (err: unknown) {
    console.error("Error processing contact form:", err);
    return NextResponse.json(
      { error: "Failed to submit contact message." },
      { status: 500 }
    );
  }
}

