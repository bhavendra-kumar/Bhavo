import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { getDriverUser } from "@/lib/driverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const user = await getDriverUser();

    const vehicle = user.driverVehicle || {
      model: "Tata Tigor EV (White)",
      numberPlate: "DL-01-EV-4429",
      type: "Cab Premium (EV)",
      fuelType: "EV",
      batteryOrFuelLevel: 82,
      documentsVerified: true,
      insuranceValidUntil: "18 Dec 2027",
    };

    const documents = user.driverDocuments && user.driverDocuments.length > 0
      ? user.driverDocuments
      : [
          { name: "Commercial Driving License (DL)", status: "VERIFIED", expiry: "12 Oct 2029", docId: "DL-0420110094" },
          { name: "Vehicle Registration Certificate (RC)", status: "VERIFIED", expiry: "24 Mar 2034", docId: "RC-DL01EV4429" },
          { name: "Commercial Vehicle Insurance", status: "VERIFIED", expiry: "18 Dec 2027", docId: "POL-ICICI-8840" },
          { name: "State Transport Permit & Fitness", status: "VERIFIED", expiry: "15 Jan 2028", docId: "PERMIT-NCR-993" },
          { name: "Pollution Control (PUC / EV Exemption)", status: "EXEMPT", expiry: "Permanent EV Exemption", docId: "EV-GREEN-PUC" },
        ];

    return NextResponse.json({
      status: "success",
      data: {
        vehicle,
        documents,
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
    await dbConnect();
    const user = await getDriverUser();

    user.driverVehicle = {
      ...user.driverVehicle,
      ...body,
    };
    await user.save();

    return NextResponse.json({
      status: "success",
      message: "Vehicle details updated successfully",
      data: user.driverVehicle,
    });
  } catch (error) {
    console.error("[Driver Vehicle PATCH Error]:", error);
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 });
  }
}
