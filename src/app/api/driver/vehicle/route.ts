import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";
import {
  DEFAULT_DRIVER_DOCUMENTS,
  checkDriverVerification,
  getDocCategory,
  syncDriverDocuments,
  IDriverDoc,
} from "@/lib/driverCompliance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();

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
    console.error("[Driver Vehicle GET Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, docName, docData, documents, vehicle: vehicleUpdate } = body;

    await dbConnect();
    const user = await getDriverUser();

    user.driverDocuments = syncDriverDocuments(user.driverDocuments);

    // 1. Action: Fast Approve All Documents (Simulation / Admin verification)
    if (action === "VERIFY_ALL") {
      user.driverDocuments = user.driverDocuments.map((doc: any) => ({
        name: doc.name,
        category: getDocCategory(doc.name, doc.category),
        status: "VERIFIED",
        expiry: doc.expiry || "12 Oct 2029",
        docId: doc.docId || "DOC-VERIFIED",
        rejectionReason: null,
      }));
      if (user.driverVehicle) {
        user.driverVehicle.documentsVerified = true;
      }
    }
    // 2. Action: Reset to Pending (Simulation of unverified state)
    else if (action === "RESET_PENDING") {
      user.driverDocuments = user.driverDocuments.map((doc: any, idx: number) => ({
        name: doc.name,
        category: getDocCategory(doc.name, doc.category),
        // Make DL and Helmets pending to demonstrate unverified duty lock
        status: idx === 0 || idx === 7 ? "PENDING" : "VERIFIED",
        expiry: doc.expiry,
        docId: doc.docId,
        rejectionReason: null,
      }));
      if (user.driverVehicle) {
        user.driverVehicle.documentsVerified = false;
      }
    }
    // 3. Action: Toggle single document status between VERIFIED and PENDING
    else if (action === "TOGGLE_DOC_STATUS" && docName) {
      user.driverDocuments = user.driverDocuments.map((doc: any) => {
        if (doc.name === docName) {
          const nextStatus = doc.status === "VERIFIED" ? "PENDING" : "VERIFIED";
          return {
            ...doc,
            category: getDocCategory(doc.name, doc.category),
            status: nextStatus,
            rejectionReason: nextStatus === "PENDING" ? "Awaiting document verification by Bhavo compliance team" : null,
          };
        }
        return doc;
      });
    }
    // 4. Action: Update / Submit a single document
    else if (action === "UPDATE_DOC" && docName && docData) {
      let found = false;
      user.driverDocuments = user.driverDocuments.map((doc: any) => {
        if (doc.name === docName) {
          found = true;
          return {
            ...doc,
            ...docData,
            category: getDocCategory(doc.name, docData.category || doc.category),
            status: docData.status || "PENDING", // new uploads default to PENDING review
            updatedAt: new Date(),
          };
        }
        return doc;
      });

      if (!found) {
        user.driverDocuments.push({
          name: docName,
          category: getDocCategory(docName, docData.category),
          status: docData.status || "PENDING",
          expiry: docData.expiry || "Pending",
          docId: docData.docId || "N/A",
          fileUrl: docData.fileUrl || null,
        });
      }
    }
    // 5. Direct documents array replacement
    else if (Array.isArray(documents)) {
      user.driverDocuments = documents.map((doc: any) => ({
        ...doc,
        category: getDocCategory(doc.name, doc.category),
      }));
    }

    // 6. Direct vehicle details update
    if (vehicleUpdate && typeof vehicleUpdate === "object") {
      user.driverVehicle = {
        ...user.driverVehicle,
        ...vehicleUpdate,
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
    console.error("[Driver Vehicle PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
