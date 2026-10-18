import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Commute from "@/models/Commute";
import { getSession } from "@/lib/auth";
import { parseCommuteTime, getCanonicalWeekdayName } from "@/lib/recurrenceEngine";

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

    const commutes = await Commute.find({ rider: user._id })
      .sort({ createdAt: 1 })
      .populate("lastGeneratedRideId", "status fare scheduledFor");
    return NextResponse.json({ status: "success", data: commutes });
  } catch (error) {
    console.error("[Commutes GET Error]:", error);
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
    const {
      title,
      pickup,
      dropoff,
      time,
      days = ["Mon", "Tue", "Wed", "Thu", "Fri"],
      vehicleType = "Cab Premium",
      paymentMethod = "CASH",
      petFriendly = false,
      preferredDriver = null,
    } = body;

    if (!title || !pickup?.address || !dropoff?.address || !time) {
      return NextResponse.json(
        { status: "error", message: "Title, pickup, dropoff, and time are required" },
        { status: 400 }
      );
    }

    try {
      parseCommuteTime(time);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_TIME_FORMAT",
          message: "Invalid time format. Please provide time in 12-hour (e.g. '08:45 AM') or 24-hour (e.g. '08:45') format.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          code: "INVALID_DAYS",
          message: "Please select at least one valid day of the week (Mon-Sun).",
        },
        { status: 400 }
      );
    }

    const canonicalDays: string[] = [];
    for (const d of days) {
      if (typeof d !== "string") {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_DAYS",
            message: "Day values must be strings.",
          },
          { status: 400 }
        );
      }
      try {
        canonicalDays.push(getCanonicalWeekdayName(d));
      } catch {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_DAYS",
            message: `Invalid day "${d}". Please select valid days of the week (Mon-Sun).`,
          },
          { status: 400 }
        );
      }
    }
    const uniqueDays = Array.from(new Set(canonicalDays));

    const sanitizedPaymentMethod = ["CASH", "WALLET", "UPI", "ONLINE"].includes(paymentMethod)
      ? paymentMethod
      : "CASH";

    const commute = await Commute.create({
      rider: user._id,
      title: title.trim(),
      pickup: {
        address: pickup.address.trim(),
        coordinates: pickup.coordinates || [28.6139, 77.2090],
      },
      dropoff: {
        address: dropoff.address.trim(),
        coordinates: dropoff.coordinates || [28.5355, 77.3910],
      },
      time: time.trim(),
      days: uniqueDays,
      vehicleType: typeof vehicleType === "string" ? vehicleType.trim() : "Cab Premium",
      isActive: true,
      paymentMethod: sanitizedPaymentMethod,
      petFriendly: Boolean(petFriendly),
      preferredDriver: preferredDriver || null,
    });

    return NextResponse.json({ status: "success", data: commute }, { status: 201 });
  } catch (error) {
    console.error("[Commutes POST Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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
    const {
      id,
      title,
      pickup,
      dropoff,
      vehicleType,
      preferredDriver,
      isActive,
      paymentMethod,
      petFriendly,
      time,
      days,
    } = body;

    if (!id) {
      return NextResponse.json({ status: "error", message: "Commute ID required" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};

    if (typeof title === "string" && title.trim()) {
      updateFields.title = title.trim();
    }

    if (pickup && typeof pickup === "object" && typeof pickup.address === "string" && pickup.address.trim()) {
      updateFields["pickup.address"] = pickup.address.trim();
      if (Array.isArray(pickup.coordinates) && pickup.coordinates.length === 2) {
        updateFields["pickup.coordinates"] = pickup.coordinates;
      }
    }

    if (dropoff && typeof dropoff === "object" && typeof dropoff.address === "string" && dropoff.address.trim()) {
      updateFields["dropoff.address"] = dropoff.address.trim();
      if (Array.isArray(dropoff.coordinates) && dropoff.coordinates.length === 2) {
        updateFields["dropoff.coordinates"] = dropoff.coordinates;
      }
    }

    if (typeof vehicleType === "string" && vehicleType.trim()) {
      updateFields.vehicleType = vehicleType.trim();
    }

    if (preferredDriver !== undefined) {
      updateFields.preferredDriver = preferredDriver || null;
    }

    if (typeof isActive === "boolean") {
      updateFields.isActive = isActive;
    }

    if (paymentMethod && ["CASH", "WALLET", "UPI", "ONLINE"].includes(paymentMethod)) {
      updateFields.paymentMethod = paymentMethod;
    }

    if (typeof petFriendly === "boolean") {
      updateFields.petFriendly = petFriendly;
    }

    if (time) {
      try {
        parseCommuteTime(time);
        updateFields.time = time.trim();
      } catch {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_TIME_FORMAT",
            message: "Invalid time format. Please provide time in 12-hour (e.g. '08:45 AM') or 24-hour (e.g. '08:45') format.",
          },
          { status: 400 }
        );
      }
    }

    if (days !== undefined) {
      if (!Array.isArray(days) || days.length === 0) {
        return NextResponse.json(
          {
            status: "error",
            code: "INVALID_DAYS",
            message: "Please select at least one valid day of the week (Mon-Sun).",
          },
          { status: 400 }
        );
      }
      const canonicalPatchDays: string[] = [];
      for (const d of days) {
        if (typeof d !== "string") {
          return NextResponse.json(
            {
              status: "error",
              code: "INVALID_DAYS",
              message: "Day values must be strings.",
            },
            { status: 400 }
          );
        }
        try {
          canonicalPatchDays.push(getCanonicalWeekdayName(d));
        } catch {
          return NextResponse.json(
            {
              status: "error",
              code: "INVALID_DAYS",
              message: `Invalid day "${d}". Please select valid days of the week (Mon-Sun).`,
            },
            { status: 400 }
          );
        }
      }
      updateFields.days = Array.from(new Set(canonicalPatchDays));
    }

    const commute = await Commute.findOneAndUpdate(
      { _id: id, rider: user._id },
      { $set: updateFields },
      { new: true }
    );

    if (!commute) {
      return NextResponse.json({ status: "error", message: "Commute schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", data: commute });
  } catch (error) {
    console.error("[Commutes PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Commute ID required" }, { status: 400 });
    }

    const deleted = await Commute.findOneAndDelete({ _id: id, rider: user._id });
    if (!deleted) {
      return NextResponse.json({ status: "error", message: "Commute not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Commute schedule deleted" });
  } catch (error) {
    console.error("[Commutes DELETE Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

