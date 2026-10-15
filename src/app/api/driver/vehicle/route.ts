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

    user.driverDocuments = syncDriverDocuments(user.driverDocuments);
    await user.save();

    const verification = checkDriverVerification(user);

    if (!verification.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      await user.save();
    }

    const vehicle = {
      model: user.driverVehicle?.model || "",
      numberPlate: user.driverVehicle?.numberPlate || "",
      type: user.driverVehicle?.type || "",
      fuelType: user.driverVehicle?.fuelType || "EV",
      batteryOrFuelLevel: user.driverVehicle?.batteryOrFuelLevel ?? 100,
      documentsVerified: verification.isVerified,
      insuranceValidUntil: user.driverVehicle?.insuranceValidUntil || "",
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
    else if (action === "RESET_PENDING") {
      user.driverDocuments = user.driverDocuments.map((doc: IDriverDoc, idx: number) => ({
        name: doc.name,
        category: getDocCategory(doc.name, doc.category),
        status: (idx === 0 || idx === 7 ? "PENDING" : doc.status === "VERIFIED" ? "VERIFIED" : "PENDING") as "PENDING" | "VERIFIED",
        expiry: doc.expiry,
        docId: doc.docId,
        rejectionReason: null,
      }));
    }
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
    else if (action === "UPDATE_DOC" && docName && docData) {
      let found = false;
      user.driverDocuments = user.driverDocuments.map((doc: IDriverDoc) => {
        if (doc.name === docName) {
          found = true;
          return {
            ...doc,
            ...docData,
            category: getDocCategory(doc.name, docData.category || doc.category),
            status: "PENDING" as const,
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
    else if (Array.isArray(documents)) {
      const existingDocStatusMap = new Map(
        user.driverDocuments.map((d: IDriverDoc) => [d.name, d.status])
      );
      user.driverDocuments = documents.map((doc: IDriverDoc) => ({
        ...doc,
        category: getDocCategory(doc.name, doc.category),
        status: existingDocStatusMap.get(doc.name) === "VERIFIED" ? "VERIFIED" : "PENDING",
      }));
    }

    if (vehicleUpdate && typeof vehicleUpdate === "object") {
      const safeVehicleUpdate = { ...vehicleUpdate } as Record<string, unknown>;
      delete safeVehicleUpdate.documentsVerified;
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

    const verification = checkDriverVerification(user);
    if (!user.driverVehicle) user.driverVehicle = {};
    user.driverVehicle.documentsVerified = verification.isVerified;

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
