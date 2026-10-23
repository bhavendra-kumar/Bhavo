import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface IpLocationResponse {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  success?: boolean;
}

let cachedIpLocation: { data: { city: string; region: string; coordinates: [number, number]; address: string }; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  try {
    if (cachedIpLocation && Date.now() - cachedIpLocation.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ status: "success", data: cachedIpLocation.data, cached: true });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    let clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "";

    // Ignore loopback/private IPs for the external query
    if (!clientIp || clientIp === "::1" || clientIp.startsWith("127.") || clientIp.startsWith("192.168.") || clientIp.startsWith("10.")) {
      clientIp = "";
    }

    const targetUrl = clientIp ? `https://ipwho.is/${clientIp}` : "https://ipwho.is/";

    const res = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`IP Geolocation HTTP ${res.status}`);
    }

    const data: IpLocationResponse = await res.json();

    if (data.success !== false && data.latitude && data.longitude) {
      const city = data.city || data.region || "Delhi";
      const region = data.region || "Delhi";
      const formattedAddress = `${city}, ${region}`;

      const locationData = {
        city,
        region,
        coordinates: [data.latitude, data.longitude] as [number, number],
        address: formattedAddress,
      };

      cachedIpLocation = {
        data: locationData,
        timestamp: Date.now(),
      };

      return NextResponse.json({
        status: "success",
        data: locationData,
      });
    }

    // Fallback to Delhi default
    return NextResponse.json({
      status: "success",
      data: {
        city: "Delhi",
        region: "Delhi",
        coordinates: [28.6139, 77.2090],
        address: "New Delhi, Delhi",
      },
    });
  } catch (error) {
    console.warn("IP Geolocation API error:", error);
    return NextResponse.json({
      status: "success",
      data: {
        city: "Delhi",
        region: "Delhi",
        coordinates: [28.6139, 77.2090],
        address: "New Delhi, Delhi",
      },
    });
  }
}
