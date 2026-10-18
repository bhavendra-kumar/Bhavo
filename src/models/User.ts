import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["USER", "RIDER", "DRIVER", "ADMIN"],
      default: "RIDER",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DISABLED"],
      default: "ACTIVE",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    walletBalanceInPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    legacyUnverifiedBalance: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: "+91 98765 43210",
    },
    emergencyContacts: {
      type: [
        {
          name: { type: String, required: true },
          phone: { type: String, required: true },
          relation: { type: String, default: "Contact" },
        },
      ],
      default: [
        { name: "Family Primary", phone: "+91 91234 56789", relation: "Family" },
        { name: "Emergency Contact", phone: "+91 99887 77665", relation: "Friend" },
      ],
    },
    pets: {
      type: [
        {
          name: { type: String, required: true },
          breed: { type: String, default: "Dog" },
          weight: { type: String, default: "15kg" },
        },
      ],
      default: [
        { name: "Max", breed: "Golden Retriever", weight: "25kg" },
      ],
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    dutyState: {
      type: String,
      enum: ["OFFLINE", "ONLINE_SEARCHING", "DISPATCH_ALERT", "ON_TRIP"],
      default: "OFFLINE",
    },
    activeRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    driverCoordinates: {
      type: [Number],
      default: [28.6139, 77.2090],
    },
    driverCoordinatesUpdatedAt: {
      type: Date,
      default: null,
    },
    driverVehicle: {
      model: { type: String, default: "" },
      numberPlate: { type: String, default: "" },
      type: { type: String, default: "" },
      fuelType: { type: String, default: "EV" },
      batteryOrFuelLevel: { type: Number, default: 100 },
      documentsVerified: { type: Boolean, default: false },
      insuranceValidUntil: { type: String, default: "" },
    },
    driverSettings: {
      autoAccept: { type: Boolean, default: false },
      audioCues: { type: Boolean, default: true },
      petFriendly: { type: Boolean, default: true },
      maxDistance: { type: String, default: "ANY" },
      destinationMode: { type: Boolean, default: false },
      destinationAddress: { type: String, default: "" },
    },
    driverDocuments: {
      type: [
        {
          name: { type: String, required: true },
          category: { type: String, enum: ["DRIVER", "VEHICLE"], default: "DRIVER" },
          description: { type: String, default: "" },
          status: { type: String, enum: ["VERIFIED", "PENDING", "REJECTED", "EXEMPT"], default: "PENDING" },
          expiry: { type: String, required: true },
          docId: { type: String, required: true },
          fileUrl: { type: String, default: null },
          rejectionReason: { type: String, default: null },
        },
      ],
      default: [
        {
          name: "Driving License (DL)",
          category: "DRIVER",
          description: "A valid two-wheeler driving license (front and back).",
          status: "VERIFIED",
          expiry: "12 Oct 2029",
          docId: "DL-0420110094",
        },
        {
          name: "Identity Proof",
          category: "DRIVER",
          description: "Aadhaar Card or PAN Card for identity verification.",
          status: "VERIFIED",
          expiry: "Permanent ID",
          docId: "AADHAAR-8821-4902",
        },
        {
          name: "Bank Account Details",
          category: "DRIVER",
          description: "Passbook, canceled cheque, or UPI ID/bank details to receive your daily/weekly earnings.",
          status: "VERIFIED",
          expiry: "Active Direct Deposit",
          docId: "UPI: captain.rajesh@okhdfcbank",
        },
        {
          name: "Profile Photo",
          category: "DRIVER",
          description: "A clear, recent photograph of yourself.",
          status: "VERIFIED",
          expiry: "Verified Photo ID",
          docId: "PHOTO-VERIFIED-2026",
          fileUrl: "/avatars/driver.png",
        },
        {
          name: "Vehicle Registration Certificate (RC)",
          category: "VEHICLE",
          description: "The official registration paper for your bike or vehicle. (If the RC is not in your name, an owner NOC and ID copy may be required).",
          status: "VERIFIED",
          expiry: "24 Mar 2034",
          docId: "RC-DL01EV4429",
        },
        {
          name: "Vehicle Insurance",
          category: "VEHICLE",
          description: "Active insurance papers for your vehicle.",
          status: "VERIFIED",
          expiry: "18 Dec 2027",
          docId: "POL-ICICI-8840",
        },
        {
          name: "Pollution Under Control (PUC) Certificate",
          category: "VEHICLE",
          description: "Valid pollution check certificate (required in many regions).",
          status: "VERIFIED",
          expiry: "15 Jan 2027",
          docId: "PUC-DL-993021",
        },
        {
          name: "Helmets",
          category: "VEHICLE",
          description: "Two helmets (one for the driver and an extra one for the customer, mandatory for bike taxis).",
          status: "VERIFIED",
          expiry: "ISI Marked Compliance",
          docId: "HELMET-SAFETY-CHECKED",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1, status: 1, isOnline: 1, dutyState: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ activeRideId: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
