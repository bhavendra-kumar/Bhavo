import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicket extends Document {
  user: mongoose.Types.ObjectId;
  ticketId: string;
  category: "app_issue" | "ride_issue" | "payment" | "driver" | "other";
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    category: {
      type: String,
      enum: ["app_issue", "ride_issue", "payment", "driver", "other"],
      default: "app_issue",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Ticket: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
