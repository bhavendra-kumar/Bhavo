import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDriverDetails {
  name: string;
  phone: string;
  rating: number;
  vehicleNumber: string;
  vehicleModel: string;
  avatar?: string | null;
}

export interface ILocation {
  address: string;
  coordinates: [number, number]; // [lat, lng]
  landmark?: string;
}

export interface IRideMessage {
  sender: "rider" | "driver";
  text: string;
  timestamp: Date;
}

export interface IRide extends Document {
  rider: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId | null;
  driverDetails?: IDriverDetails;
  driverCoordinates?: [number, number] | null;
  pickup: ILocation;
  dropoff: ILocation;
  vehicleType: string;
  fare: number;
  distance: string;
  duration: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  otp: string;
  scheduledFor?: Date | null;
  paymentMethod: "WALLET" | "CASH" | "UPI";
  paymentStatus: "PENDING" | "PAID";
  messages: IRideMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    driverDetails: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      rating: { type: Number, default: 4.9 },
      vehicleNumber: { type: String, default: null },
      vehicleModel: { type: String, default: null },
      avatar: { type: String, default: null },
    },
    driverCoordinates: {
      type: [Number],
      default: null,
    },
    messages: {
      type: [
        {
          sender: { type: String, enum: ["rider", "driver"], required: true },
          text: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    pickup: {
      address: { type: String, required: true },
      coordinates: { type: [Number], default: [28.6139, 77.2090] }, // Default center
      landmark: { type: String, default: "" },
    },
    dropoff: {
      address: { type: String, required: true },
      coordinates: { type: [Number], default: [28.5355, 77.3910] },
      landmark: { type: String, default: "" },
    },
    vehicleType: {
      type: String,
      default: "Cab Premium",
    },
    fare: {
      type: Number,
      required: true,
      default: 0,
    },
    distance: {
      type: String,
      default: "5.2 km",
    },
    duration: {
      type: String,
      default: "15 mins",
    },
    status: {
      type: String,
      enum: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "SEARCHING",
      index: true,
    },
    otp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["WALLET", "CASH", "UPI"],
      default: "WALLET",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

const Ride: Model<IRide> = mongoose.models.Ride || mongoose.model<IRide>("Ride", RideSchema);

export default Ride;
