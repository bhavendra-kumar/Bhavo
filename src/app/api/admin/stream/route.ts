import { requireAdmin, isAuthError } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import User from "@/models/User";
import Ticket from "@/models/Ticket";
import AutoBookingOccurrence from "@/models/AutoBookingOccurrence";
import { buildSseMessage, buildSseKeepalive } from "@/lib/rideTracking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await dbConnect();

    const encoder = new TextEncoder();

    const fetchSnapshot = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        searchingRides,
        activeRides,
        completedToday,
        cancelledToday,
        onlineDrivers,
        openTickets,
        unresolvedOccurrences,
      ] = await Promise.all([
        Ride.countDocuments({ status: "SEARCHING" }),
        Ride.countDocuments({ status: { $in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } }),
        Ride.countDocuments({ status: "COMPLETED", updatedAt: { $gte: startOfDay } }),
        Ride.countDocuments({ status: "CANCELLED", updatedAt: { $gte: startOfDay } }),
        User.countDocuments({ role: "DRIVER", isOnline: true, status: "ACTIVE" }),
        Ticket.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS"] } }),
        AutoBookingOccurrence.countDocuments({ status: { $in: ["FAILED_RETRYABLE", "FAILED_PERMANENT"] } }),
      ]);

      return {
        searchingRides,
        activeRides,
        completedToday,
        cancelledToday,
        onlineDrivers,
        openTickets,
        unresolvedOccurrences,
        timestamp: new Date().toISOString(),
      };
    };

    const initialSnapshot = await fetchSnapshot();

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        let lastSnapshotHash = JSON.stringify(initialSnapshot);

        const cleanup = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {}
          }
        };

        req.signal.addEventListener("abort", () => {
          cleanup();
        });

        try {
          controller.enqueue(encoder.encode(buildSseMessage("snapshot", initialSnapshot)));
        } catch {
          cleanup();
          return;
        }

        let ticks = 0;
        const interval = setInterval(async () => {
          if (isClosed || req.signal.aborted) {
            clearInterval(interval);
            cleanup();
            return;
          }

          ticks++;

          try {
            if (ticks % 3 === 0) {
              const currentSnapshot = await fetchSnapshot();
              const currentHash = JSON.stringify(currentSnapshot);

              if (currentHash !== lastSnapshotHash) {
                lastSnapshotHash = currentHash;
                if (!isClosed) {
                  controller.enqueue(
                    encoder.encode(buildSseMessage("operations:updated", currentSnapshot))
                  );
                }
              }
            }

            if (!isClosed) {
              controller.enqueue(encoder.encode(buildSseKeepalive()));
            }
          } catch {
            clearInterval(interval);
            cleanup();
          }
        }, 5000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
