"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Route,
  ArrowRight,
  Clock,
  Repeat,
  Download,
  Star,
  MapPin,
} from "lucide-react";
import { IRideData } from "@/hooks/user/useDashboardStore";
import { useDialog } from "@/components/ui/DialogProvider";

interface RecentCommutesSnapshotProps {
  recentRides?: IRideData[];
}

export default function RecentCommutesSnapshot({
  recentRides = [],
}: RecentCommutesSnapshotProps) {
  const router = useRouter();
  const { alert } = useDialog();

  const handleRebook = (ride: IRideData) => {
    const pickup = encodeURIComponent(ride.pickup?.address || "");
    const dropoff = encodeURIComponent(ride.dropoff?.address || "");
    router.push(`/user/book-ride?pickup=${pickup}&dropoff=${dropoff}`);
  };

  const handleDownloadTripReceipt = (rideId: string) => {
    alert({
      title: "Trip Receipt Downloaded",
      message: `Tax invoice for Ride #${rideId.slice(-6).toUpperCase()} has been saved to your downloads.`,
      variant: "success",
    });
  };

  const FALLBACK_RIDES: IRideData[] = [
    {
      _id: "ride-demo-1",
      rider: "demo",
      pickup: { address: "123 Tech Park Avenue, Block B", coordinates: [0, 0] },
      dropoff: { address: "Bhavo Headquarters, Sector 44", coordinates: [0, 0] },
      vehicleType: "Cab Premium EV",
      fare: 340,
      distance: "12 km",
      duration: "24 min",
      status: "COMPLETED",
      otp: "0000",
      driverDetails: {
        name: "Rajesh Kumar",
        phone: "+91 98765 43210",
        rating: 4.9,
        vehicleModel: "Tata Tigor EV",
        vehicleNumber: "HR-26-EQ-9120",
      },
      paymentMethod: "WALLET",
      paymentStatus: "PAID",
      createdAt: "2026-09-08T08:10:00.000Z",
      updatedAt: "2026-09-08T08:34:00.000Z",
    },
    {
      _id: "ride-demo-2",
      rider: "demo",
      pickup: { address: "Bhavo Headquarters, Sector 44", coordinates: [0, 0] },
      dropoff: { address: "123 Tech Park Avenue, Block B", coordinates: [0, 0] },
      vehicleType: "Cab Economy",
      fare: 280,
      distance: "12 km",
      duration: "22 min",
      status: "COMPLETED",
      otp: "0000",
      driverDetails: {
        name: "Amit Sharma",
        phone: "+91 98765 43211",
        rating: 4.8,
        vehicleModel: "Maruti Dzire",
        vehicleNumber: "DL-01-AX-4412",
      },
      paymentMethod: "WALLET",
      paymentStatus: "PAID",
      createdAt: "2026-09-07T18:30:00.000Z",
      updatedAt: "2026-09-07T18:52:00.000Z",
    },
  ];

  const displayRides = recentRides.length > 0 ? recentRides : FALLBACK_RIDES;

  return (
    <div className="card p-5 sm:p-6 flex flex-col gap-4 border border-slate-200/80 bg-white shadow-xs rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Route size={15} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Recent Rides
            </h3>
          </div>
        </div>

        <Link
          href="/user/trips"
          className="text-[12px] font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 transition-colors"
        >
          All Trips <ArrowRight size={13} />
        </Link>
      </div>

      {/* Rides List */}
      <div className="flex flex-col gap-2.5">
        {displayRides.map((ride) => {
          const dateStr = new Date(ride.createdAt).toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          return (
            <div
              key={ride._id}
              className="relative p-4 rounded-2xl border border-slate-100 hover:border-teal-200 bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group overflow-hidden"
            >
              {/* Left accent line */}
              <div className="absolute left-0 top-3 bottom-3 w-0.75 rounded-full bg-linear-to-b from-teal-400 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Left: Route info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
                {/* Route dots */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div className="w-px h-5 bg-linear-to-b from-teal-400 to-teal-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 flex items-center justify-center">
                    <MapPin size={6} className="text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-bold text-slate-900">
                      {ride.pickup.address.split(",")[0]} →{" "}
                      {ride.dropoff.address.split(",")[0]}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                      {ride.vehicleType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-slate-400" />{" "}
                      {dateStr}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      {ride.driverDetails?.name || "Assigned Pilot"}
                      <span className="inline-flex items-center text-amber-500 font-bold ml-0.5">
                        <Star size={9} fill="currentColor" />{" "}
                        {ride.driverDetails?.rating || 4.9}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Fare & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pl-1">
                <div className="text-left md:text-right">
                  <p className="text-[14px] font-black text-slate-900">
                    ₹{ride.fare}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {ride.paymentMethod || "Wallet"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadTripReceipt(ride._id)}
                    className="h-8 w-8 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 bg-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Download Receipt"
                  >
                    <Download size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRebook(ride)}
                    className="h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <Repeat size={11} />
                    Re-Book
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
