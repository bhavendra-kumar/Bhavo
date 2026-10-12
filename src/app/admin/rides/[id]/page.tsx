"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  User,
  CreditCard,
  ShieldCheck,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface RideDetailData {
  ride: {
    id: string;
    rider: {
      id: string;
      name: string;
      email: string;
      phone: string;
      rating?: number;
      status?: string;
    } | null;
    driver: {
      id: string;
      name: string;
      email: string;
      phone: string;
      rating?: number;
      status?: string;
      isOnline?: boolean;
      dutyState?: string;
    } | null;
    driverDetails: {
      name?: string;
      phone?: string;
      vehicleNumber?: string;
      vehicleModel?: string;
    } | null;
    pickup: { address: string; landmark?: string };
    dropoff: { address: string; landmark?: string };
    vehicleType: string;
    distance: string;
    duration: string;
    fare: number;
    fareInPaise?: number;
    pricingSnapshot: {
      baseFarePaise?: number;
      distanceKm?: number;
      distanceFarePaise?: number;
      petFriendlySurchargePaise?: number;
      totalFarePaise?: number;
      currency?: string;
      rateRuleVersion?: string;
      calculatedAt?: string;
    } | null;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    cashCollectedAt?: string;
    scheduledFor?: string | null;
    isAutoBooked: boolean;
    autoBookingOccurrenceKey?: string | null;
    dispatchOfferCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export default function AdminRideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const rideId = resolvedParams.id;

  const [data, setData] = useState<RideDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/rides/${rideId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.status === "success") {
            setData(json.data);
          } else {
            setError(json.message || "Failed to load ride details");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Network error while inspecting ride");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [rideId]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading ride record...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-800">{error || "Ride record not found"}</p>
        <Link
          href="/admin/rides"
          className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ride Explorer</span>
        </Link>
      </div>
    );
  }

  const { ride } = data;

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rides"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Ride #{ride.id.slice(-8)}</h1>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-slate-900 text-white">
                {ride.status}
              </span>
              {ride.isAutoBooked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  <Zap className="w-3 h-3" /> Auto-Booked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created {new Date(ride.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Read-Only Operational Inspection</span>
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Route Details */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <MapPin className="w-4 h-4 text-teal-600" />
            <h2>Trip Route</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Pickup Location
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{ride.pickup.address}</p>
              {ride.pickup.landmark && (
                <p className="text-slate-400 text-[11px]">Landmark: {ride.pickup.landmark}</p>
              )}
            </div>
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Destination Dropoff
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{ride.dropoff.address}</p>
              {ride.dropoff.landmark && (
                <p className="text-slate-400 text-[11px]">Landmark: {ride.dropoff.landmark}</p>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-600">
              <span>Vehicle: {ride.vehicleType}</span>
              <span>Distance: {ride.distance}</span>
            </div>
          </div>
        </div>

        {/* Rider & Driver Entities */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <User className="w-4 h-4 text-teal-600" />
            <h2>Participants</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Passenger
              </span>
              {ride.rider ? (
                <div className="mt-0.5">
                  <p className="font-bold text-slate-900">{ride.rider.name}</p>
                  <p className="text-slate-500">{ride.rider.email}</p>
                  <p className="text-slate-500">{ride.rider.phone}</p>
                </div>
              ) : (
                <p className="text-slate-400">Anonymous rider</p>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                Assigned Driver
              </span>
              {ride.driver ? (
                <div className="mt-0.5">
                  <p className="font-bold text-slate-900">{ride.driver.name}</p>
                  <p className="text-slate-500">{ride.driver.email}</p>
                  <p className="text-slate-500">{ride.driver.phone}</p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Vehicle: {ride.driverDetails?.vehicleNumber || "N/A"}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No driver assigned (SEARCHING)</p>
              )}
            </div>
          </div>
        </div>

        {/* Authoritative Financial Snapshot */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <h2>Financial Integrity (Phase 1C)</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Authoritative Fare</span>
              <span className="font-bold text-slate-900 text-sm">₹{ride.fare}</span>
            </div>
            {ride.fareInPaise && (
              <div className="flex justify-between py-1 border-b border-slate-100 font-mono text-slate-600">
                <span>Integer Amount</span>
                <span>{ride.fareInPaise} paise</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-semibold text-slate-800">{ride.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Payment Status</span>
              <span
                className={`font-semibold ${
                  ride.paymentStatus === "PAID" || ride.paymentStatus === "COLLECTED"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {ride.paymentStatus}
              </span>
            </div>

            {ride.pricingSnapshot && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Snapshot Rate Breakdown:</p>
                <div className="flex justify-between">
                  <span>Base: {ride.pricingSnapshot.baseFarePaise ?? 0}p</span>
                  <span>Dist: {ride.pricingSnapshot.distanceFarePaise ?? 0}p</span>
                  <span>Surcharge: {ride.pricingSnapshot.petFriendlySurchargePaise ?? 0}p</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Version: {ride.pricingSnapshot.rateRuleVersion || "1C-AUTHORITATIVE"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Invariants & Dispatch Metadata */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Dispatch & Lifecycle Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[11px]">Scheduled Pickup Time:</span>
            <span className="font-semibold text-slate-800">
              {ride.scheduledFor ? new Date(ride.scheduledFor).toLocaleString() : "Immediate Dispatch"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Targeted Dispatch Offers:</span>
            <span className="font-semibold text-slate-800">
              {ride.dispatchOfferCount} driver offer cycles recorded
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Auto Booking Occurrence:</span>
            <span className="font-mono text-slate-800 text-[11px]">
              {ride.autoBookingOccurrenceKey || "N/A (On-demand booking)"}
            </span>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            State machine boundaries enforced: Arbitrary manual state transitions, OTP bypasses, and
            manual ledger credits are strictly forbidden to protect platform financial integrity.
          </span>
        </div>
      </div>
    </div>
  );
}
