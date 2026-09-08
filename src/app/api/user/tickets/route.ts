import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ticket from "@/models/Ticket";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    let tickets = await Ticket.find({ user: user._id }).sort({ createdAt: -1 });

    // Seed default welcome ticket if none exist
    if (tickets.length === 0) {
      tickets = await Ticket.create([
        {
          user: user._id,
          ticketId: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
          category: "app_issue",
          subject: "Welcome to Bhavo Safety & Support",
          description: "Your support desk is ready. You can raise queries about rides, payments, or route adjustments at any time.",
          status: "RESOLVED",
          priority: "LOW",
          resolutionNotes: "System onboarding complete. 24/7 emergency response is enabled on your account.",
        },
      ]);
    }

    return NextResponse.json({ status: "success", data: tickets });
  } catch (error) {
    console.error("[Tickets GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { category = "app_issue", subject, description, priority = "MEDIUM" } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { status: "error", message: "Subject and description are required" },
        { status: 400 }
      );
    }

    const newTicket = await Ticket.create({
      user: user._id,
      ticketId: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      subject,
      description,
      status: "OPEN",
      priority,
      resolutionNotes: "Assigned to Bhavo Priority Care Team. We will review shortly.",
    });

    return NextResponse.json({ status: "success", data: newTicket }, { status: 201 });
  } catch (error) {
    console.error("[Tickets POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
