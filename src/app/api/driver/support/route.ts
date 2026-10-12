import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ticket from "@/models/Ticket";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    const tickets = await Ticket.find({ user: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      status: "success",
      data: tickets,
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Support GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic = "FARE_DISPUTE", subject, description, isSos, coordinates } = body;

    await dbConnect();
    const user = await getDriverUser(req);

    if (isSos) {
      const sosTicket = await Ticket.create({
        user: user._id,
        category: "driver",
        subject: `[EMERGENCY SOS] Driver Distress Alert - ${user.name}`,
        description: `Emergency button triggered by Captain ${user.name} (${user.phone}). Coordinates: ${JSON.stringify(coordinates || user.driverCoordinates)}. Highway patrol and crisis desk notified.`,
        status: "OPEN",
        priority: "HIGH",
      });

      return NextResponse.json({
        status: "success",
        message: "Emergency SOS logged and command center notified immediately",
        data: sosTicket,
      });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ status: "error", message: "Ticket description is required" }, { status: 400 });
    }

    const categoryMap: Record<string, "app_issue" | "ride_issue" | "payment" | "driver" | "other"> = {
      FARE_DISPUTE: "payment",
      PAYOUT_DELAY: "payment",
      PASSENGER_CONDUCT: "driver",
      VEHICLE_DOCS: "other",
      APP_ISSUE: "app_issue",
    };

    const newTicket = await Ticket.create({
      user: user._id,
      category: categoryMap[topic] || "driver",
      subject: subject || `Captain Issue: ${topic.replace(/_/g, " ")}`,
      description: description.trim(),
      status: "OPEN",
      priority: topic === "FARE_DISPUTE" || topic === "PAYOUT_DELAY" ? "HIGH" : "MEDIUM",
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Support ticket registered successfully",
        data: newTicket,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Support POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
