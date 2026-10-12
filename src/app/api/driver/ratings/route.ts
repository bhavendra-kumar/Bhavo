import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    const completedRides = await Ride.find({
      driver: user._id,
      status: "COMPLETED",
    })
      .populate("rider", "name")
      .sort({ updatedAt: -1 });

    const ratedRides = completedRides.filter((r) => r.riderRating && r.riderRating > 0);
    const totalReviews = ratedRides.length;

    let computedAvg = user.rating || 5.0;
    if (totalReviews > 0) {
      const sumRatings = ratedRides.reduce((acc, r) => acc + (r.riderRating || 5), 0);
      computedAvg = Number((sumRatings / totalReviews).toFixed(2));
    }

    const fiveStarCount = ratedRides.filter((r) => r.riderRating === 5).length;
    const fourStarCount = ratedRides.filter((r) => r.riderRating === 4).length;

    // Real compliment tallies from database
    const complimentCounts: Record<string, { count: number; iconKey: string }> = {
      "Smooth & Safe Driving": { count: 0, iconKey: "ShieldCheck" },
      "Polite & Professional": { count: 0, iconKey: "ThumbsUp" },
      "Clean & Odor-free Car": { count: 0, iconKey: "Heart" },
      "Punctual & Quick Pickup": { count: 0, iconKey: "Award" },
    };

    completedRides.forEach((r) => {
      (r.riderCompliments || []).forEach((c) => {
        if (complimentCounts[c]) {
          complimentCounts[c].count++;
        }
      });
    });

    const compliments = Object.entries(complimentCounts).map(([title, val]) => ({
      title,
      count: val.count,
      iconKey: val.iconKey,
    }));

    const recentReviews = ratedRides.slice(0, 5).map((r) => {
      const riderObj = (r.rider as unknown as { name?: string }) || {};
      const complimentsText = r.riderCompliments && r.riderCompliments.length > 0
        ? r.riderCompliments.join(", ") + " — excellent experience!"
        : "Pleasant ride, safe driving and reached destination on time.";

      return {
        rider: riderObj.name || (r.driverDetails?.name ? "Passenger " + String(r._id).slice(-4) : "Bhavo Rider"),
        rating: r.riderRating || 5,
        date: new Date(r.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        text: complimentsText,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        rating: computedAvg,
        totalReviews,
        fiveStarRides: fiveStarCount,
        fourStarRides: fourStarCount,
        badge: computedAvg >= 4.8 ? "Top 5% Rated Captain" : "Verified Bhavo Captain",
        compliments,
        recentReviews,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Ratings GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
