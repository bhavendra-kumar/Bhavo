import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function getDriverUser() {
  await dbConnect();
  const session = await getSession();

  let user = null;
  if (session?.email) {
    user = await User.findOne({ email: session.email });
  }

  // If user is logged in, ensure driver fields are populated
  if (user) {
    let needsSave = false;
    if (!user.driverVehicle?.model) {
      user.driverVehicle = {
        model: "Tata Tigor EV (White)",
        numberPlate: "DL-01-EV-4429",
        type: "Cab Premium (EV)",
        fuelType: "EV",
        batteryOrFuelLevel: 82,
        documentsVerified: true,
        insuranceValidUntil: "18 Dec 2027",
      };
      needsSave = true;
    }
    if (user.isOnline === undefined) {
      user.isOnline = true;
      needsSave = true;
    }
    if (!user.dutyState) {
      user.dutyState = "ONLINE_SEARCHING";
      needsSave = true;
    }
    if (needsSave) {
      await user.save();
    }
    return user;
  }

  // Fallback to default driver account in MongoDB
  const defaultEmail = "rajesh.driver@bhavo.in";
  let defaultDriver = await User.findOne({ email: defaultEmail });

  if (!defaultDriver) {
    defaultDriver = await User.create({
      name: "Rajesh Kumar",
      email: defaultEmail,
      password: "default_driver_secure_hash_placeholder",
      role: "DRIVER",
      phone: "+91 98765 43210",
      rating: 4.94,
      walletBalance: 4250,
      isOnline: true,
      dutyState: "ONLINE_SEARCHING",
      driverCoordinates: [28.6139, 77.2090],
      driverVehicle: {
        model: "Tata Tigor EV (White)",
        numberPlate: "DL-01-EV-4429",
        type: "Cab Premium (EV)",
        fuelType: "EV",
        batteryOrFuelLevel: 82,
        documentsVerified: true,
        insuranceValidUntil: "18 Dec 2027",
      },
      driverSettings: {
        autoAccept: false,
        audioCues: true,
        petFriendly: true,
        maxDistance: "ANY",
        destinationMode: false,
        destinationAddress: "Block C, Sector 62, Noida",
      },
    });
  }

  return defaultDriver;
}
