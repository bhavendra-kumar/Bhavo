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
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
