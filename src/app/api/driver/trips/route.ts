import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import User from "@/models/User";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "ALL").toUpperCase();
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "5", 10) || 5));
    const skip = (page - 1) * limit;

    await dbConnect();
    const user = await getDriverUser(req);

    const driverCondition = { driver: user._id };

    const andConditions: Array<Record<string, unknown>> = [driverCondition];

    const now = new Date();

    if (filter === "TODAY") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      andConditions.push({ updatedAt: { $gte: startOfDay } });
    } else if (filter === "THIS WEEK") {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      andConditions.push({ updatedAt: { $gte: startOfWeek } });
    } else if (filter === "COMPLETED") {
      andConditions.push({ status: "COMPLETED" });
    } else if (filter === "CANCELLED") {
      andConditions.push({ status: "CANCELLED" });
    }

    if (search) {
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");

      const matchingRiders = await User.find({
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      }).select("_id").lean();
      const riderIds = matchingRiders.map((u) => u._id);

      const searchOr: Array<Record<string, unknown>> = [
        { "pickup.address": searchRegex },
        { "dropoff.address": searchRegex },
        { vehicleType: searchRegex },
        { paymentMethod: searchRegex },
        { status: searchRegex },
        { "driverDetails.name": searchRegex },
      ];

      if (riderIds.length > 0) {
        searchOr.push({ rider: { $in: riderIds } });
      }

      andConditions.push({ $or: searchOr });
    }

    const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

    const totalCount = await Ride.countDocuments(query);
    const rides = await Ride.find(query)
      .populate("rider", "name phone rating")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = rides.map((r) => {
      const riderObj = (r.rider as unknown as { name?: string }) || {};
      return {
        id: String(r._id),
        riderName: riderObj.name || (r.driverDetails?.name ? "Passenger " + String(r._id).slice(-4) : "Rider"),
        pickup: r.pickup.address,
        dropoff: r.dropoff.address,
        fare: r.fare,
        tip: r.tip || 0,
        distance: r.distance,
        duration: r.duration,
        time: new Date(r.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        date: new Date(r.updatedAt).toLocaleDateString([], { day: "numeric", month: "short" }),
        vehicleType: r.vehicleType,
        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,
        status: r.status,
      };
    });

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      status: "success",
      data: formatted,
      totalCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Trips GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
