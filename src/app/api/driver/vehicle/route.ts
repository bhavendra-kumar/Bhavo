import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError, handleAuthError } from "@/lib/auth";
import {
  checkDriverVerification,
  getDocCategory,
  syncDriverDocuments,
  IDriverDoc,
} from "@/lib/driverCompliance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const user = await getDriverUser(req);

    // Ensure documents exist and are strictly the 8 canonical documents
    user.driverDocuments = syncDriverDocuments(user.driverDocuments);
    await user.save();

    const verification = checkDriverVerification(user);

    // If documents are not verified, enforce offline
    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();
    }

    const vehicle = {
      model: user.driverVehicle?.model || "Tata Tigor EV (White)",
      numberPlate: user.driverVehicle?.numberPlate || "DL-01-EV-4429",
      type: user.driverVehicle?.type || "Cab Premium (EV)",
      fuelType: user.driverVehicle?.fuelType || "EV",
      batteryOrFuelLevel: user.driverVehicle?.batteryOrFuelLevel ?? 82,
      documentsVerified: verification.isVerified,
      insuranceValidUntil: user.driverVehicle?.insuranceValidUntil || "18 Dec 2027",
    };

    return NextResponse.json({
      status: "success",
      data: {
        vehicle,
        documents: user.driverDocuments,
        verification,
        isOnline: user.isOnline,
        dutyState: user.dutyState,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Vehicle GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, docName, docData, documents, vehicle: vehicleUpdate } = body;

    await dbConnect();
    const user = await getDriverUser(req);

    user.driverDocuments = syncDriverDocuments(user.driverDocuments);

    // 1. Action: Reject driver self-verification bypass attempts
    if (action === "VERIFY_ALL") {
      return NextResponse.json(
        {
          status: "error",
          code: "UNAUTHORIZED_OPERATION",
          message: "Drivers are not authorized to self-verify compliance documents.",
        },
        { status: 403 }
      );
    }
    // 2. Action: Reset to Pending (Simulation of unverified state for testing)
    else if (action === "RESET_PENDING") {
      user.driverDocuments = user.driverDocuments.map((doc: IDriverDoc, idx: number) => ({
        name: doc.name,
        category: getDocCategory(doc.name, doc.category),
        // Make DL and Helmets pending to demonstrate unverified duty lock
        status: (idx === 0 || idx === 7 ? "PENDING" : doc.status === "VERIFIED" ? "VERIFIED" : "PENDING") as "PENDING" | "VERIFIED",
        expiry: doc.expiry,
        docId: doc.docId,
        rejectionReason: null,
      }));
    }
    // 3. Action: Toggle single document status (Drivers can only request re-verification, NEVER self-verify)
    else if (action === "TOGGLE_DOC_STATUS" && docName) {
      return NextResponse.json(
        {
          status: "error",
          code: "UNAUTHORIZED_OPERATION",
          message: "Drivers cannot alter document verification status.",
        },
        { status: 403 }
      );
    }
    // 4. Action: Update / Submit a single document (Always forces status to PENDING review)
    else if (action === "UPDATE_DOC" && docName && docData) {
      let found = false;
      user.driverDocuments = user.driverDocuments.map((doc: IDriverDoc) => {
        if (doc.name === docName) {
          found = true;
          return {
            ...doc,
            ...docData,
            category: getDocCategory(doc.name, docData.category || doc.category),
            status: "PENDING" as const, // Strict: Driver submissions are ALWAYS pending compliance review
            updatedAt: new Date(),
          };
        }
        return doc;
      });

      if (!found) {
        user.driverDocuments.push({
          name: docName,
          category: getDocCategory(docName, docData.category),
          status: "PENDING",
          expiry: docData.expiry || "Pending",
          docId: docData.docId || "N/A",
          fileUrl: docData.fileUrl || null,
        });
      }
    }
    // 5. Direct documents array replacement (Sanitize: force PENDING on any non-existing verified docs)
    else if (Array.isArray(documents)) {
      const existingDocStatusMap = new Map(
        user.driverDocuments.map((d: IDriverDoc) => [d.name, d.status])
      );
      user.driverDocuments = documents.map((doc: IDriverDoc) => ({
        ...doc,
        category: getDocCategory(doc.name, doc.category),
        // A driver cannot elevate a document to VERIFIED if it wasn't already VERIFIED
        status: existingDocStatusMap.get(doc.name) === "VERIFIED" ? "VERIFIED" : "PENDING",
      }));
    }

    // 6. Direct vehicle details update (strip any client-supplied documentsVerified)
    if (vehicleUpdate && typeof vehicleUpdate === "object") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { documentsVerified: _ignored, ...safeVehicleUpdate } = vehicleUpdate;
      user.driverVehicle = {
        ...user.driverVehicle,
        ...safeVehicleUpdate,
      };
    } else if (body.model || body.numberPlate || body.batteryOrFuelLevel || body.fuelType) {
      const { model, numberPlate, fuelType, batteryOrFuelLevel, insuranceValidUntil, type } = body;
      user.driverVehicle = {
        ...user.driverVehicle,
        ...(model ? { model } : {}),
        ...(numberPlate ? { numberPlate } : {}),
        ...(fuelType ? { fuelType } : {}),
        ...(batteryOrFuelLevel !== undefined ? { batteryOrFuelLevel } : {}),
        ...(insuranceValidUntil ? { insuranceValidUntil } : {}),
        ...(type ? { type } : {}),
      };
    }

    // Always recalculate verification status after any change
    const verification = checkDriverVerification(user);
    if (!user.driverVehicle) user.driverVehicle = {};
    user.driverVehicle.documentsVerified = verification.isVerified;

    // STRICT: If documents are now unverified, immediately force offline
    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
    }

    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Vehicle and documents updated successfully",
      data: {
        vehicle: user.driverVehicle,
        documents: user.driverDocuments,
        verification,
        isOnline: user.isOnline,
        dutyState: user.dutyState,
      },
    });
  } catch (error) {
    if (isAuthError(error)) {
      return handleAuthError(error);
    }
    console.error("[Driver Vehicle PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
