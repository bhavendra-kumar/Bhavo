import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, message } = body;

    if (!firstName || !email || !message) {
      return NextResponse.json(
        { error: "First name, email, and message are required." },
        { status: 400 }
      );
    }

    // Successfully received contact submission
    console.log("[Bhavo Contact Form]", {
      name: `${firstName} ${lastName || ""}`.trim(),
      email,
      message,
      receivedAt: new Date().toISOString(),
    });

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
