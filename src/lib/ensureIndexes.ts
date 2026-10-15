
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import Transaction from "@/models/Transaction";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
import AdminAuditLog from "@/models/AdminAuditLog";
import Ticket from "@/models/Ticket";
import Commute from "@/models/Commute";

export interface IndexDeploymentReport {
  success: boolean;
  collections: {
    name: string;
    indexCount: number;
  }[];
  timestamp: string;
  error?: string;
}

export async function ensureAllIndexes(): Promise<IndexDeploymentReport> {
  await dbConnect();

  const models = [
    { name: "User", model: User },
    { name: "Ride", model: Ride },
    { name: "Transaction", model: Transaction },
    { name: "AutoBookingOccurrence", model: AutoBookingOccurrence },
    { name: "AdminAuditLog", model: AdminAuditLog },
    { name: "Ticket", model: Ticket },
    { name: "Commute", model: Commute },
  ];

  const results: { name: string; indexCount: number }[] = [];

  for (const item of models) {
    try {
      await item.model.createIndexes();
      const indexes = await item.model.collection.indexes();
      results.push({
        name: item.name,
        indexCount: indexes.length,
      });
    } catch (err: unknown) {
      console.error(`[Index Deployment Warning] Could not sync indexes for ${item.name}:`, err);
      results.push({
        name: item.name,
        indexCount: -1,
      });
    }
  }

  return {
    success: results.every((r) => r.indexCount >= 0),
    collections: results,
    timestamp: new Date().toISOString(),
  };
}
