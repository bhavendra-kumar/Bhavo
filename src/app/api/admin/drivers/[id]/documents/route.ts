import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { checkDriverVerification, syncDriverDocuments, IDriverDoc } from "@/lib/driverCompliance";
import { recordAdminAudit } from "@/lib/adminAudit";
import { requireAdmin, isAuthError, handleAuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    await dbConnect();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid driver ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { docName, action, reason } = body;

    if (!docName || typeof docName !== "string" || docName.trim().length === 0) {
      return NextResponse.json(
        { status: "error", message: "Document name is required" },
        { status: 400 }
      );
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { status: "error", message: "Action must be either APPROVE or REJECT" },
        { status: 400 }
      );
    }

    if (action === "REJECT" && (!reason || typeof reason !== "string" || reason.trim().length < 3)) {
      return NextResponse.json(
        { status: "error", message: "A specific rejection reason (min 3 characters) is mandatory when rejecting documents" },
        { status: 400 }
      );
    }

    const driver = await User.findById(id);
    if (!driver || driver.role !== "DRIVER") {
      return NextResponse.json(
        { status: "error", message: "Driver not found" },
        { status: 404 }
      );
    }

    const syncedDocs: IDriverDoc[] = syncDriverDocuments(driver.driverDocuments);
    const targetDocNameLower = docName.trim().toLowerCase();

    const targetDoc = syncedDocs.find(
      (d) => d.name.toLowerCase() === targetDocNameLower
    );

    if (!targetDoc) {
      return NextResponse.json(
        { status: "error", message: `Document '${docName}' not found in driver's compliance profile` },
        { status: 404 }
      );
    }

    const beforeSnapshot = {
      name: targetDoc.name,
      status: targetDoc.status,
      rejectionReason: targetDoc.rejectionReason || null,
      expiry: targetDoc.expiry,
      docId: targetDoc.docId,
    };

    if (action === "APPROVE") {
      targetDoc.status = "VERIFIED";
      targetDoc.rejectionReason = null;
      targetDoc.updatedAt = new Date();
    } else {
      targetDoc.status = "REJECTED";
      targetDoc.rejectionReason = reason.trim();
      targetDoc.updatedAt = new Date();
    }

    const verification = checkDriverVerification({
      driverVehicle: driver.driverVehicle,
      driverDocuments: syncedDocs,
    });

    driver.driverDocuments = syncedDocs;
    if (driver.driverVehicle) {
      driver.driverVehicle.documentsVerified = verification.isVerified;
    }

    if (!verification.isVerified) {
      if (driver.dutyState === "ON_TRIP" || driver.activeRideId) {
        driver.isOnline = false;
      } else if (driver.isOnline || driver.dutyState !== "OFFLINE") {
        driver.isOnline = false;
        driver.dutyState = "OFFLINE";
      }
    }

    await driver.save();

    await recordAdminAudit({
      actor: admin._id,
      actorEmail: admin.email,
      action: action === "APPROVE" ? "DOCUMENT_APPROVE" : "DOCUMENT_REJECT",
      targetType: "DRIVER",
      targetId: driver._id.toString(),
      reason: reason?.trim() || `Compliance verification decision: ${action} for ${targetDoc.name}`,
      before: beforeSnapshot,
      after: {
        name: targetDoc.name,
        status: targetDoc.status,
        rejectionReason: targetDoc.rejectionReason || null,
        isDriverFullyVerified: verification.isVerified,
      },
      metadata: {
        docName: targetDoc.name,
        action,
        driverName: driver.name,
        driverEmail: driver.email,
      },
      req,
    });

    return NextResponse.json({
      status: "success",
      message: `Document '${targetDoc.name}' successfully ${action === "APPROVE" ? "approved" : "rejected"}.`,
      data: {
        document: targetDoc,
        verification,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Admin Document Review Error]:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update document verification status" },
      { status: 500 }
    );
  }
}
