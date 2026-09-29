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
    walletBalance: {
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
    // Driver-specific telemetry and preferences
    isOnline: {
      type: Boolean,
      default: true,
    },
    dutyState: {
      type: String,
      enum: ["OFFLINE", "ONLINE_SEARCHING", "DISPATCH_ALERT", "ON_TRIP"],
      default: "ONLINE_SEARCHING",
    },
    driverCoordinates: {
      type: [Number],
      default: [28.6139, 77.2090], // Delhi NCR center
    },
    driverVehicle: {
      model: { type: String, default: "Tata Tigor EV (White)" },
      numberPlate: { type: String, default: "DL-01-EV-4429" },
      type: { type: String, default: "Cab Premium (EV)" },
      fuelType: { type: String, default: "EV" },
      batteryOrFuelLevel: { type: Number, default: 82 },
      documentsVerified: { type: Boolean, default: true },
      insuranceValidUntil: { type: String, default: "18 Dec 2027" },
    },
    driverSettings: {
      autoAccept: { type: Boolean, default: false },
      audioCues: { type: Boolean, default: true },
      petFriendly: { type: Boolean, default: true },
      maxDistance: { type: String, default: "ANY" },
      destinationMode: { type: Boolean, default: false },
      destinationAddress: { type: String, default: "Block C, Sector 62, Noida" },
    },
    driverDocuments: {
      type: [
        {
          name: { type: String, required: true },
          status: { type: String, default: "VERIFIED" },
          expiry: { type: String, required: true },
          docId: { type: String, required: true },
        },
      ],
      default: [
        { name: "Commercial Driving License (DL)", status: "VERIFIED", expiry: "12 Oct 2029", docId: "DL-0420110094" },
        { name: "Vehicle Registration Certificate (RC)", status: "VERIFIED", expiry: "24 Mar 2034", docId: "RC-DL01EV4429" },
        { name: "Commercial Vehicle Insurance", status: "VERIFIED", expiry: "18 Dec 2027", docId: "POL-ICICI-8840" },
        { name: "State Transport Permit & Fitness", status: "VERIFIED", expiry: "15 Jan 2028", docId: "PERMIT-NCR-993" },
        { name: "Pollution Control (PUC / EV Exemption)", status: "EXEMPT", expiry: "Permanent EV Exemption", docId: "EV-GREEN-PUC" },
      ],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
