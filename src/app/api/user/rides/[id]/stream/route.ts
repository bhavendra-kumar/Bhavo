import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";
import Ride from "@/models/Ride";
import { requireRole, isAuthError } from "@/lib/auth";
import {
  formatTrackingSnapshot,
  buildSseMessage,
  buildSseKeepalive,
  isRideTerminal,
} from "@/lib/rideTracking";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/rides/[id]/stream
 *
 * Hardened Server-Sent Events (SSE) Stream for Passenger Live Tracking (Phase 1E)
 * - Requires authenticated RIDER session.
 * - Strict resource ownership (rider can stream only their own ride).
 * - Emits immediate authoritative snapshot on connection.
 * - Selective, privacy-safe field projection (OTP sent only to rider before trip start).
 * - Location freshness evaluation against authoritative 120s TTL.
 * - Periodic keepalive comments to prevent proxy dropouts.
 * - Closes cleanly on client disconnect, completion, or cancellation.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["RIDER", "USER"], req);
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return new Response("Ride not found", { status: 404 });
    }

    await dbConnect();

    // Verify ownership immediately before establishing SSE stream
    const initialRide = await Ride.findOne({ _id: id, rider: user._id });
    if (!initialRide) {
      return new Response("Ride not found", { status: 404 });
    }

    const encoder = new TextEncoder();
    const initialSnapshot = formatTrackingSnapshot(initialRide, "RIDER");

    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        let lastEmittedVersion = initialSnapshot.trackingVersion;
        let lastEmittedStatus = initialSnapshot.status;
        let lastEmittedLocationStatus = initialSnapshot.locationStatus;
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

        // If ride is already completed or cancelled, terminate stream immediately
        if (isRideTerminal(initialRide.status)) {
          cleanup();
          return;
        }

        // 2. Continuous authoritative sync interval (every 2000ms)
        const interval = setInterval(async () => {
          if (isClosed || req.signal.aborted) {
            clearInterval(interval);
            cleanup();
            return;
          }

          ticksSinceKeepalive++;

          try {
            const ride = await Ride.findOne({ _id: id, rider: user._id }).lean();

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

            const snapshot = formatTrackingSnapshot(ride, "RIDER");

            const hasChanged =
              snapshot.trackingVersion !== lastEmittedVersion ||
              snapshot.status !== lastEmittedStatus ||
              snapshot.locationStatus !== lastEmittedLocationStatus;

            if (hasChanged && !isClosed) {
              lastEmittedVersion = snapshot.trackingVersion;
              lastEmittedStatus = snapshot.status;
              lastEmittedLocationStatus = snapshot.locationStatus;
              ticksSinceKeepalive = 0;

              controller.enqueue(
                encoder.encode(
                  buildSseMessage("update", snapshot, snapshot.trackingVersion)
                )
              );
            } else if (ticksSinceKeepalive >= 5 && !isClosed) {
              // Emit keepalive comment every ~10s to prevent reverse proxy/firewall drops
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
    console.error("[Passenger SSE Stream Error]:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
