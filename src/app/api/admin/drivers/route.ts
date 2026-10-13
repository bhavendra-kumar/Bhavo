import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { checkDriverVerification, IDriverDoc } from "@/lib/driverCompliance";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const statusFilter = searchParams.get("status") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const conditions: Record<string, unknown>[] = [{ role: "DRIVER" }];

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(search) });
      } else {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        conditions.push({
          $or: [
            { name: regex },
            { email: regex },
            { phone: regex },
            { "driverVehicle.numberPlate": regex },
          ],
        });
      }
    }

    if (statusFilter === "VERIFIED") {
      conditions.push({
        "driverVehicle.documentsVerified": true,
        "driverDocuments.status": { $nin: ["PENDING", "REJECTED"] },
      });
    } else if (statusFilter === "REJECTED") {
      conditions.push({
        "driverDocuments.status": "REJECTED",
      });
    } else if (statusFilter === "PENDING") {
      conditions.push({
        "driverDocuments.status": { $ne: "REJECTED" },
        $or: [
          { "driverDocuments.status": "PENDING" },
          { "driverVehicle.documentsVerified": { $ne: true } },
          { driverDocuments: { $size: 0 } },
          { driverDocuments: { $exists: false } },
        ],
      });
    }

    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const totalMatching = await User.countDocuments(query);
    const drivers = await User.find(query)
      .select("name email phone status isOnline dutyState rating driverVehicle driverDocuments createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const mappedDrivers = drivers.map((driver) => {
      const driverRecord = driver as {
        _id: unknown;
        name: string;
        email: string;
        phone?: string;
        status?: string;
        isOnline?: boolean;
        dutyState?: string;
        rating?: number;
        driverVehicle?: {
          model?: string;
          numberPlate?: string;
          type?: string;
          documentsVerified?: boolean;
        };
        driverDocuments?: IDriverDoc[];
        createdAt?: Date;
      };

      const verification = checkDriverVerification(driverRecord);

      return {
        id: driverRecord._id?.toString(),
        name: driverRecord.name,
        email: driverRecord.email,
        phone: driverRecord.phone || "N/A",
        status: driverRecord.status || "ACTIVE",
        isOnline: Boolean(driverRecord.isOnline),
        dutyState: driverRecord.dutyState || "OFFLINE",
        rating: driverRecord.rating ?? 5.0,
        vehicle: {
          model: driverRecord.driverVehicle?.model || "N/A",
          numberPlate: driverRecord.driverVehicle?.numberPlate || "N/A",
          type: driverRecord.driverVehicle?.type || "Standard",
          documentsVerified: driverRecord.driverVehicle?.documentsVerified ?? true,
        },
        verification: {
          isVerified: verification.isVerified,
          totalDocs: verification.totalDocs,
          verifiedCount: verification.verifiedCount,
          pendingCount: verification.pendingDocs.length,
          rejectedCount: verification.rejectedDocs.length,
          reason: verification.reason || null,
        },
        createdAt: driverRecord.createdAt,
      };
    });

    return NextResponse.json({
      status: "success",
      data: {
        drivers: mappedDrivers,
        pagination: {
          page,
          limit,
          total: totalMatching,
          pages: Math.ceil(totalMatching / limit),
        },
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Drivers List Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve drivers list" },
      { status: 500 }
    );
  }
}
