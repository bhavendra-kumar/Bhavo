import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";
import {
  DEFAULT_DRIVER_DOCUMENTS,
  checkDriverVerification,
  getDocCategory,
  syncDriverDocuments,
} from "@/lib/driverCompliance";

export async function getDriverUser() {
  await dbConnect();
  const session = await getSession();

  let user = null;
  if (session?.email) {
    user = await User.findOne({ email: session.email });
  }

  let driverUser = null;

  // If user is logged in AND is explicitly a DRIVER, use their account
  if (user && user.role === "DRIVER") {
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

    // Strictly synchronize to the 8 required documents
    const syncedDocs = syncDriverDocuments(user.driverDocuments);
    const isDifferent =
      !user.driverDocuments ||
      user.driverDocuments.length !== syncedDocs.length ||
      user.driverDocuments.some((d: any, i: number) => d.name !== syncedDocs[i]?.name);

    if (isDifferent) {
      user.driverDocuments = syncedDocs;
      needsSave = true;
    }

    // Verify compliance status
    const compliance = checkDriverVerification(user);
    if (user.driverVehicle.documentsVerified !== compliance.isVerified) {
      user.driverVehicle.documentsVerified = compliance.isVerified;
      needsSave = true;
    }

    // STRICT: If documents are not verified, driver CANNOT be online
    if (!compliance.isVerified && user.isOnline) {
      user.isOnline = false;
      user.dutyState = "OFFLINE";
      needsSave = true;
    }

    if (user.isOnline === undefined) {
      user.isOnline = compliance.isVerified;
      needsSave = true;
    }
    if (!user.dutyState) {
      user.dutyState = user.isOnline ? "ONLINE_SEARCHING" : "OFFLINE";
      needsSave = true;
    }
    if (needsSave) {
      await user.save();
    }
    driverUser = user;
  } else {
    // Dedicated driver account in MongoDB
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
        driverDocuments: [...DEFAULT_DRIVER_DOCUMENTS],
        driverSettings: {
          autoAccept: false,
          audioCues: true,
          petFriendly: true,
          maxDistance: "ANY",
          destinationMode: false,
          destinationAddress: "Block C, Sector 62, Noida",
        },
      });
    } else {
      let needsSave = false;
      // Strictly synchronize to the 8 required documents
      const syncedDocs = syncDriverDocuments(defaultDriver.driverDocuments);
      const isDifferent =
        !defaultDriver.driverDocuments ||
        defaultDriver.driverDocuments.length !== syncedDocs.length ||
        defaultDriver.driverDocuments.some((d: any, i: number) => d.name !== syncedDocs[i]?.name);

      if (isDifferent) {
        defaultDriver.driverDocuments = syncedDocs;
        needsSave = true;
      }

      const compliance = checkDriverVerification(defaultDriver);
      if (defaultDriver.driverVehicle?.documentsVerified !== compliance.isVerified) {
        if (!defaultDriver.driverVehicle) defaultDriver.driverVehicle = {};
        defaultDriver.driverVehicle.documentsVerified = compliance.isVerified;
        needsSave = true;
      }

      // STRICT: If documents not verified, driver CANNOT be online
      if (!compliance.isVerified && defaultDriver.isOnline) {
        defaultDriver.isOnline = false;
        defaultDriver.dutyState = "OFFLINE";
        needsSave = true;
      }

      if (needsSave) {
        await defaultDriver.save();
      }
    }
    driverUser = defaultDriver;
  }

  // Ensure driver has real persistent completed rides in MongoDB
  const rideCount = await Ride.countDocuments({ driver: driverUser._id });
  if (rideCount === 0) {
    let rider = await User.findOne({ role: "RIDER" });
    if (!rider) {
      rider = await User.create({
        name: "Aarav Sharma",
        email: "aarav.rider@bhavo.in",
        password: "rider_secure_hash_placeholder",
        role: "RIDER",
        phone: "+91 98111 22334",
        rating: 4.92,
        walletBalance: 1200,
      });
    }

    const now = new Date();
    await Ride.create([
      {
        rider: rider._id,
        driver: driverUser._id,
        driverDetails: {
          name: driverUser.name,
          phone: driverUser.phone,
          rating: driverUser.rating,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
        },
        driverCoordinates: [28.6139, 77.2090],
        pickup: { address: "Sector 18 Metro Station, Gate 1, Noida", coordinates: [28.5708, 77.3261] },
        dropoff: { address: "Bhavo Tech Park, Sector 62, Noida", coordinates: [28.6250, 77.3750] },
        vehicleType: "Cab Premium",
        fare: 280,
        tip: 30,
        distance: "7.2 km",
        duration: "18 mins",
        status: "COMPLETED",
        otp: "4826",
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        riderRating: 5,
        riderCompliments: ["Smooth & Safe Driving", "Clean & Odor-free Car"],
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 25 * 60 * 1000),
      },
      {
        rider: rider._id,
        driver: driverUser._id,
        driverDetails: {
          name: driverUser.name,
          phone: driverUser.phone,
          rating: driverUser.rating,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
        },
        driverCoordinates: [28.6250, 77.3750],
        pickup: { address: "Indirapuram Habitat Center, Ghaziabad", coordinates: [28.6415, 77.3688] },
        dropoff: { address: "Noida Electronic City Metro, Noida", coordinates: [28.6280, 77.3760] },
        vehicleType: "Cab Economy",
        fare: 195,
        tip: 0,
        distance: "4.8 km",
        duration: "14 mins",
        status: "COMPLETED",
        otp: "1923",
        paymentMethod: "WALLET",
        paymentStatus: "PAID",
        riderRating: 5,
        riderCompliments: ["Punctual & Quick Pickup"],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      },
      {
        rider: rider._id,
        driver: driverUser._id,
        driverDetails: {
          name: driverUser.name,
          phone: driverUser.phone,
          rating: driverUser.rating,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
        },
        driverCoordinates: [28.5708, 77.3261],
        pickup: { address: "Botanical Garden Gate 2, Noida", coordinates: [28.5644, 77.3344] },
        dropoff: { address: "DLF Mall of India, Sector 18, Noida", coordinates: [28.5672, 77.3210] },
        vehicleType: "Cab Economy",
        fare: 140,
        tip: 20,
        distance: "3.1 km",
        duration: "10 mins",
        status: "COMPLETED",
        otp: "5512",
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        riderRating: 5,
        riderCompliments: ["Polite & Professional"],
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
      },
      {
        rider: rider._id,
        driver: driverUser._id,
        driverDetails: {
          name: driverUser.name,
          phone: driverUser.phone,
          rating: driverUser.rating,
          vehicleNumber: driverUser.driverVehicle?.numberPlate || "DL-01-EV-4429",
          vehicleModel: driverUser.driverVehicle?.model || "Tata Tigor EV",
        },
        driverCoordinates: [28.5244, 77.2066],
        pickup: { address: "Cyber City Building 10, DLF Phase 2, Gurugram", coordinates: [28.4900, 77.0900] },
        dropoff: { address: "Saket Select Citywalk, New Delhi", coordinates: [28.5284, 77.2195] },
        vehicleType: "Cab Premium",
        fare: 310,
        tip: 25,
        distance: "14.2 km",
        duration: "32 mins",
        status: "COMPLETED",
        otp: "8841",
        paymentMethod: "WALLET",
        paymentStatus: "PAID",
        riderRating: 5,
        riderCompliments: ["Smooth & Safe Driving", "Polite & Professional"],
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      },
    ]);
  }

  return driverUser;
}
