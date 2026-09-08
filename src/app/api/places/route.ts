import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  // Reverse Geocoding (Coordinates -> Human Address)
  if (lat && lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "BhavoApp/1.0 (contact@bhavo.com)",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Nominatim reverse API error: ${res.status}`);
      }

      const data = await res.json();
      const addr = data.address || {};
      const streetOrLandmark =
        data.name ||
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.commercial ||
        addr.amenity ||
        data.display_name?.split(",")[0] ||
        "Pinned Location";
      const area = addr.suburb || addr.city_district || addr.city || addr.town || "";
      const formattedShort = area && streetOrLandmark !== area ? `${streetOrLandmark}, ${area}` : streetOrLandmark;

      return NextResponse.json({
        display_name: data.display_name || formattedShort,
        short_name: formattedShort,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        address: addr,
      });
    } catch (error) {
      console.error("Places API reverse geocode error:", error);
      return NextResponse.json({
        display_name: `Location (${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)})`,
        short_name: `Pinned (${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)})`,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      });
    }
  }

  // Forward Place Search
  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`,
      {
        headers: {
          "User-Agent": "BhavoApp/1.0 (contact@bhavo.com)",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Nominatim API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Places API proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

