import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`, {
      headers: {
        "User-Agent": "BhavoApp/1.0 (contact@bhavo.com)"
      }
    });
    
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
