import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Ride from "@/models/Ride";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ email: session.email });
  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        try {
          controller.close();
        } catch {}
      });

      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          const ride = await Ride.findOne({ _id: id, rider: user._id });
          if (!ride) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Ride not found" })}\n\n`));
            clearInterval(interval);
            controller.close();
            return;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ride)}\n\n`));

          // If ride is finished, close the stream
          if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
            clearInterval(interval);
            setTimeout(() => {
              try { controller.close(); } catch {}
            }, 1000);
          }
        } catch (err) {
          console.error("[SSE Error]:", err);
          clearInterval(interval);
          try { controller.close(); } catch {}
        }
      }, 2500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
