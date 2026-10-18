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
  coordinates: [number, number];
  landmark?: string;
}

export interface IRideMessage {
  sender: "rider" | "driver";
  text: string;
  timestamp: Date;
}

export interface IDispatchOffer {
  offerId: string;
  driverId: mongoose.Types.ObjectId;
  offeredAt: Date;
  expiresAt: Date;
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
  fareInPaise?: number;
  distance: string;
  duration: string;
  status: "SEARCHING" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  otp: string;
  scheduledFor?: Date | null;
  paymentMethod: "WALLET" | "CASH" | "UPI" | "ONLINE";
  paymentStatus: "PENDING" | "PAID" | "PENDING_COLLECTION" | "COLLECTED" | "PENDING_PAYMENT" | "FAILED";
  cashCollectedAt?: Date | null;
  cashCollectedBy?: mongoose.Types.ObjectId | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  paymentConfirmedAt?: Date | null;
  pricingSnapshot?: {
    baseFarePaise: number;
    distanceKm: number;
    distanceFarePaise: number;
    petFriendlySurchargePaise: number;
    totalFarePaise: number;
    currency: string;
    rateRuleVersion: string;
    calculatedAt: Date;
  } | null;
  driverCoordinatesUpdatedAt?: Date | null;
  trackingVersion?: number;
  messages: IRideMessage[];
  tip?: number;
  riderRating?: number;
  riderCompliments?: string[];
  cancellationReason?: string | null;
  cancelledBy?: "RIDER" | "DRIVER" | null;
  petFriendly?: boolean;
  preferredDriver?: mongoose.Types.ObjectId | null;
  currentOffer?: IDispatchOffer | null;
  rejectedDrivers?: mongoose.Types.ObjectId[];
  dispatchAttempts?: number;
  dispatchStatus?: "PENDING_DISPATCH" | "DISPATCHING" | "OFFERED" | "ASSIGNED" | "EXHAUSTED";
  acceptedAt?: Date | null;
  arrivedAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  commuteId?: mongoose.Types.ObjectId | null;
  autoBookingOccurrenceKey?: string | null;
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
      index: true,
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
    driverCoordinatesUpdatedAt: {
      type: Date,
      default: null,
    },
    trackingVersion: {
      type: Number,
      default: 1,
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
      coordinates: { type: [Number], default: [28.6139, 77.2090] },
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
    fareInPaise: {
      type: Number,
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
      enum: ["WALLET", "CASH", "UPI", "ONLINE"],
      default: "WALLET",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "PENDING_COLLECTION", "COLLECTED", "PENDING_PAYMENT", "FAILED"],
      default: "PENDING",
      index: true,
    },
    cashCollectedAt: {
      type: Date,
      default: null,
    },
    cashCollectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentConfirmedAt: {
      type: Date,
      default: null,
    },
    pricingSnapshot: {
      type: {
        baseFarePaise: { type: Number, required: true },
        distanceKm: { type: Number, required: true },
        distanceFarePaise: { type: Number, required: true },
        petFriendlySurchargePaise: { type: Number, default: 0 },
        totalFarePaise: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        rateRuleVersion: { type: String, default: "v1_standard" },
        calculatedAt: { type: Date, default: Date.now },
      },
      default: null,
    },
    tip: {
      type: Number,
      default: 0,
    },
    riderRating: {
      type: Number,
      default: 5,
    },
    riderCompliments: {
      type: [String],
      default: [],
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    petFriendly: {
      type: Boolean,
      default: false,
    },
    preferredDriver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentOffer: {
      type: {
        offerId: { type: String, required: true },
        driverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        offeredAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
      },
      default: null,
    },
    rejectedDrivers: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    dispatchAttempts: {
      type: Number,
      default: 0,
    },
    dispatchStatus: {
      type: String,
      enum: ["PENDING_DISPATCH", "DISPATCHING", "OFFERED", "ASSIGNED", "EXHAUSTED"],
      default: "PENDING_DISPATCH",
      index: true,
    },
    commuteId: {
      type: Schema.Types.ObjectId,
      ref: "Commute",
      default: null,
      index: true,
    },
    autoBookingOccurrenceKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

RideSchema.index({ status: 1, driver: 1, scheduledFor: 1 });
RideSchema.index({ rider: 1, status: 1 });
RideSchema.index({ _id: 1, rider: 1, status: 1 });
RideSchema.index({ _id: 1, driver: 1, status: 1 });
RideSchema.index({ "currentOffer.driverId": 1, "currentOffer.expiresAt": 1 });
RideSchema.index({ status: 1, dispatchStatus: 1, scheduledFor: 1 });
RideSchema.index({ autoBookingOccurrenceKey: 1 }, { unique: true, sparse: true });
RideSchema.index({ status: 1, createdAt: -1 });
RideSchema.index({ createdAt: -1 });

const Ride: Model<IRide> = mongoose.models.Ride || mongoose.model<IRide>("Ride", RideSchema);

export default Ride;
