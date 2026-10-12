import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { getDriverUser } from "@/lib/driverAuth";
import { isAuthError } from "@/lib/auth";
import {
  formatTrackingSnapshot,
  buildSseMessage,
  buildSseKeepalive,
  isRideTerminal,
} from "@/lib/rideTracking";

export const dynamic = "force-dynamic";

/**
 * GET /api/driver/rides/[id]/stream
 *
 * Hardened Server-Sent Events (SSE) Stream for Assigned Driver Live Trip Sync (Phase 1E)
 * - Requires authenticated DRIVER session.
 * - Strict assignment verification (driver can stream only rides assigned to them).
 * - Emits immediate authoritative snapshot on connection.
 * - OTP is strictly excluded from driver stream payloads.
 * - Periodic keepalive comments to prevent proxy dropouts.
 * - Closes cleanly on client disconnect, completion, or cancellation.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const driverUser = await getDriverUser(req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return new Response("Ride not found", { status: 404 });
    }

    // Verify driver assignment immediately before establishing stream
    const initialRide = await Ride.findOne({ _id: id, driver: driverUser._id });
    if (!initialRide) {
      return new Response("Ride not found or not assigned to driver", { status: 404 });
    }

    const encoder = new TextEncoder();
    const initialSnapshot = formatTrackingSnapshot(initialRide, "DRIVER");

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        let lastEmittedVersion = initialSnapshot.trackingVersion;
        let lastEmittedStatus = initialSnapshot.status;
        let ticksSinceKeepalive = 0;

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

        // 1. Send immediate authoritative snapshot upon connection
        try {
          controller.enqueue(
            encoder.encode(
              buildSseMessage("snapshot", initialSnapshot, initialSnapshot.trackingVersion)
            )
          );
        } catch {
          cleanup();
          return;
        }

        // If ride is already terminal, close stream immediately
        if (isRideTerminal(initialRide.status)) {
          cleanup();
          return;
        }

        // 2. Periodic sync interval (every 2000ms)
        const interval = setInterval(async () => {
          if (isClosed || req.signal.aborted) {
            clearInterval(interval);
            cleanup();
            return;
          }

          ticksSinceKeepalive++;

          try {
            const ride = await Ride.findOne({ _id: id, driver: driverUser._id }).lean();

            if (!ride) {
              if (!isClosed) {
                try {
                  controller.enqueue(
                    encoder.encode(
                      buildSseMessage("error", { code: "RIDE_NOT_FOUND", message: "Ride not found" })
                    )
                  );
                } catch {}
              }
              clearInterval(interval);
              cleanup();
              return;
            }

            const snapshot = formatTrackingSnapshot(ride, "DRIVER");

            const hasChanged =
              snapshot.trackingVersion !== lastEmittedVersion ||
              snapshot.status !== lastEmittedStatus;

            if (hasChanged && !isClosed) {
              lastEmittedVersion = snapshot.trackingVersion;
              lastEmittedStatus = snapshot.status;
              ticksSinceKeepalive = 0;

              controller.enqueue(
                encoder.encode(
                  buildSseMessage("update", snapshot, snapshot.trackingVersion)
                )
              );
            } else if (ticksSinceKeepalive >= 5 && !isClosed) {
              ticksSinceKeepalive = 0;
              controller.enqueue(encoder.encode(buildSseKeepalive()));
            }

            // Cleanly close stream when ride reaches a terminal state
            if (snapshot.isTerminal) {
              clearInterval(interval);
              if (!isClosed) {
                try {
                  controller.enqueue(
                    encoder.encode(buildSseMessage("terminal", snapshot, snapshot.trackingVersion))
                  );
                } catch {}
              }
              cleanup();
            }
          } catch {
            clearInterval(interval);
            cleanup();
          }
        }, 2000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (isAuthError(err)) {
      return new Response(err.message, { status: err.statusCode });
    }
    console.error("[Driver SSE Stream Error]:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
