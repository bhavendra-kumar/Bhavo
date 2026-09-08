import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlace extends Document {
  rider: mongoose.Types.ObjectId;
  name: string;
  address: string;
  coordinates: [number, number];
  tag: "Home" | "Work" | "Gym" | "Favourite" | "Other";
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema = new Schema<IPlace>(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number],
      default: [28.6139, 77.2090],
    },
    tag: {
      type: String,
      enum: ["Home", "Work", "Gym", "Favourite", "Other"],
      default: "Other",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Place: Model<IPlace> = mongoose.models.Place || mongoose.model<IPlace>("Place", PlaceSchema);

export default Place;
