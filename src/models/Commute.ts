import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommute extends Document {
  rider: mongoose.Types.ObjectId;
  title: string;
  pickup: {
    address: string;
    coordinates?: [number, number];
  };
  dropoff: {
    address: string;
    coordinates?: [number, number];
  };
  time: string;
  days: string[];
  vehicleType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommuteSchema = new Schema<ICommute>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "Morning Commute",
    },
    pickup: {
      address: { type: String, required: true },
      coordinates: { type: [Number], default: [28.6139, 77.2090] },
    },
    dropoff: {
      address: { type: String, required: true },
      coordinates: { type: [Number], default: [28.5355, 77.3910] },
    },
    time: {
      type: String,
      required: true,
      default: "8:45 AM",
    },
    days: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    vehicleType: {
      type: String,
      default: "Cab Premium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Commute: Model<ICommute> = mongoose.models.Commute || mongoose.model<ICommute>("Commute", CommuteSchema);

export default Commute;
