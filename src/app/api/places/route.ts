import { NextResponse } from "next/server";

interface NominatimAddress {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  commercial?: string;
  amenity?: string;
  residential?: string;
  village?: string;
  county?: string;
  city_district?: string;
  city?: string;
  town?: string;
  state_district?: string;
  state?: string;
  country?: string;
}

interface NominatimPlace {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: NominatimAddress;
}

// In-memory cache for live queries (10-minute TTL)
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getFromCache<T>(key: string): T | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    queryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache(key: string, data: unknown): void {
  if (queryCache.size > 500) {
    const firstKey = queryCache.keys().next().value;
    if (firstKey) queryCache.delete(firstKey);
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Haversine distance in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function classifyPlace(item: NominatimPlace) {
  const lowerName = (item.name || item.display_name || "").toLowerCase();
  const osmClass = item.class || "";
  const osmType = item.type || "";

  if (
    lowerName.includes("bus stand") ||
    lowerName.includes("bus stop") ||
    lowerName.includes("bus terminal") ||
    lowerName.includes("isbt") ||
    osmType === "bus_station" ||
    osmType === "bus_stop"
  ) {
    return { category: "transit", categoryLabel: "Bus Station", glyph: "🚌" };
  }

  if (
    osmClass === "railway" ||
    osmType === "station" ||
    osmType === "subway" ||
    lowerName.includes("metro") ||
    lowerName.includes("railway") ||
    lowerName.includes("station") ||
    lowerName.includes("junction")
  ) {
    return { category: "railway", categoryLabel: "Railway Station", glyph: "🚆" };
  }

  if (
    osmClass === "aeroway" ||
    osmType === "aerodrome" ||
    lowerName.includes("airport") ||
    lowerName.includes("terminal")
  ) {
    return { category: "airport", categoryLabel: "Airport", glyph: "✈️" };
  }

  if (
    (osmClass === "amenity" && (osmType === "hospital" || osmType === "clinic")) ||
    lowerName.includes("hospital") ||
    lowerName.includes("clinic") ||
    lowerName.includes("health")
  ) {
    return { category: "hospital", categoryLabel: "Hospital", glyph: "🏥" };
  }

  if (
    lowerName.includes("temple") ||
    lowerName.includes("church") ||
    lowerName.includes("mosque") ||
    lowerName.includes("shrine") ||
    lowerName.includes("kovil") ||
    osmType === "place_of_worship" ||
    osmClass === "historic" ||
    osmClass === "tourism"
  ) {
    return { category: "landmark", categoryLabel: "Landmark / Temple", glyph: "🛕" };
  }

  if (
    osmClass === "shop" ||
    osmType === "mall" ||
    lowerName.includes("mall") ||
    lowerName.includes("market") ||
    lowerName.includes("bazaar") ||
    lowerName.includes("plaza")
  ) {
    return { category: "market", categoryLabel: "Market / Mall", glyph: "🛍️" };
  }

  if (
    lowerName.includes("college") ||
    lowerName.includes("university") ||
    lowerName.includes("institute") ||
    lowerName.includes("school") ||
    osmType === "college" ||
    osmType === "university"
  ) {
    return { category: "education", categoryLabel: "College / University", glyph: "🎓" };
  }

  if (
    lowerName.includes("tech park") ||
    lowerName.includes("cyber") ||
    lowerName.includes("sez") ||
    lowerName.includes("it park") ||
    lowerName.includes("office")
  ) {
    return { category: "tech_park", categoryLabel: "Tech Park / Hub", glyph: "🏢" };
  }

  return { category: "locality", categoryLabel: "Popular Spot", glyph: "📍" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const nearby = searchParams.get("nearby") === "true" || searchParams.get("popular") === "true";

  // ─────────────────────────────────────────────────────────────
  // 1. REVERSE GEOCODING (Coordinates -> Live Real-Time Doorstep Address)
  // ─────────────────────────────────────────────────────────────
  if (lat && lon && !q && !nearby) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const cacheKey = `rev:${parsedLat.toFixed(4)},${parsedLon.toFixed(4)}`;
    const cached = getFromCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLon}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "BhavoRealtimeTransit/2.0 (contact@bhavo.com)",
            "Accept-Language": "en",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Nominatim reverse API error: ${res.status}`);
      }

      const data = await res.json();
      const addr: NominatimAddress = data.address || {};
      const streetOrLandmark =
        data.name ||
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.commercial ||
        addr.amenity ||
        data.display_name?.split(",")[0] ||
        "Current Spot";
      const areaName = addr.village || addr.town || addr.city_district || addr.county || addr.city || "";
      const formattedShort =
        areaName && streetOrLandmark !== areaName
          ? `${streetOrLandmark}, ${areaName}`
          : streetOrLandmark;

      const result = {
        display_name: data.display_name || formattedShort,
        short_name: formattedShort,
        lat: parsedLat,
        lon: parsedLon,
        address: addr,
      };

      setInCache(cacheKey, result);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Places API reverse geocode error:", error);
      return NextResponse.json({
        display_name: `Location (${parsedLat.toFixed(4)}, ${parsedLon.toFixed(4)})`,
        short_name: `Pinned (${parsedLat.toFixed(4)}, ${parsedLon.toFixed(4)})`,
        lat: parsedLat,
        lon: parsedLon,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DYNAMIC REAL-TIME NEARBY DESTINATIONS (Rapido/Ola Style)
  // ─────────────────────────────────────────────────────────────
  if (nearby) {
    const centerLat = lat ? parseFloat(lat) : 9.5132;
    const centerLon = lon ? parseFloat(lon) : 77.6316;
    const cacheKey = `nearby_recs:${centerLat.toFixed(3)},${centerLon.toFixed(3)}`;
    const cached = getFromCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      // 1. Resolve the user's city/town/locality
      let cityName = "";
      let regionName = "";

      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerLat}&lon=${centerLon}&zoom=14&addressdetails=1`,
        {
          headers: {
            "User-Agent": "BhavoRealtimeTransit/2.0 (contact@bhavo.com)",
            "Accept-Language": "en",
          },
        }
      );

      if (revRes.ok) {
        const revData = await revRes.json();
        const addr: NominatimAddress = revData.address || {};
        cityName = addr.city || addr.town || addr.county || addr.village || addr.suburb || "";
        regionName = addr.state_district || addr.state || "";
      }

      const searchTarget = cityName || regionName || "India";

      // 2. Query essential daily destination categories in parallel
      const categoriesToQuery = [
        { cat: "transit", label: "Bus Station", query: `${searchTarget} bus stand` },
        { cat: "railway", label: "Railway Station", query: `${searchTarget} railway station` },
        { cat: "hospital", label: "Hospital", query: `${searchTarget} hospital` },
        { cat: "landmark", label: "Landmark / Temple", query: `${searchTarget} temple` },
        { cat: "market", label: "Market / Commercial", query: `${searchTarget} market` },
        { cat: "education", label: "College / Institute", query: `${searchTarget} college` },
      ];

      // Spatial bounding box around user (~12km radius)
      const d = 0.12;
      const viewbox = `${centerLon - d},${centerLat + d},${centerLon + d},${centerLat - d}`;

      const fetchCategory = async (item: { cat: string; label: string; query: string }) => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            item.query
          )}&countrycodes=in&viewbox=${viewbox}&limit=3`;
          const res = await fetch(url, {
            headers: {
              "User-Agent": "BhavoRealtimeTransit/2.0 (contact@bhavo.com)",
              "Accept-Language": "en",
            },
          });
          if (res.ok) {
            const list: NominatimPlace[] = await res.json();
            return { catItem: item, list: Array.isArray(list) ? list : [] };
          }
        } catch {
          // ignore error
        }
        return { catItem: item, list: [] };
      };

      // Also fetch any nearby stations directly in viewbox
      const viewboxStationPromise = fetch(
        `https://nominatim.openstreetmap.org/search?q=station&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&countrycodes=in&limit=4`,
        {
          headers: {
            "User-Agent": "BhavoRealtimeTransit/2.0 (contact@bhavo.com)",
            "Accept-Language": "en",
          },
        }
      )
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const [categoryResults, viewboxPlaces] = await Promise.all([
        Promise.all(categoriesToQuery.map(fetchCategory)),
        viewboxStationPromise,
      ]);

      const seenNames = new Set<string>();
      const combinedResults: Array<{
        id: string;
        place_id: number | string;
        name: string;
        short_name: string;
        display_name: string;
        area: string;
        city: string;
        subtext: string;
        category: string;
        categoryLabel: string;
        glyph: string;
        lat: number;
        lon: number;
        distanceKm: number;
        approxMinutes: number;
        fareEstimateBike: number;
        fareEstimateCab: number;
      }> = [];

      // Process direct viewbox transit places
      if (Array.isArray(viewboxPlaces)) {
        for (const item of viewboxPlaces) {
          const pLat = parseFloat(item.lat);
          const pLon = parseFloat(item.lon);
          if (isNaN(pLat) || isNaN(pLon)) continue;

          const primaryName = item.name || item.display_name.split(",")[0].trim();
          const normKey = primaryName.toLowerCase();
          if (seenNames.has(normKey)) continue;
          seenNames.add(normKey);

          const { category, categoryLabel, glyph } = classifyPlace(item);
          const distanceKm = calculateHaversineKm(centerLat, centerLon, pLat, pLon);
          const addr = item.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || "";
          const city = addr.city || addr.town || addr.county || searchTarget;

          combinedResults.push({
            id: String(item.place_id || `viewbox-${primaryName}`),
            place_id: item.place_id,
            name: primaryName,
            short_name: area && primaryName !== area ? `${primaryName}, ${area}` : primaryName,
            display_name: item.display_name,
            area,
            city,
            subtext: `${area ? area + ", " : ""}${city}`,
            category,
            categoryLabel,
            glyph,
            lat: pLat,
            lon: pLon,
            distanceKm,
            approxMinutes: Math.max(3, Math.round(distanceKm * 2.5)),
            fareEstimateBike: Math.max(20, Math.round(20 + distanceKm * 8)),
            fareEstimateCab: Math.max(40, Math.round(40 + distanceKm * 15)),
          });
        }
      }

      // Process categorized query results
      for (const { catItem, list } of categoryResults) {
        for (const item of list) {
          const pLat = parseFloat(item.lat);
          const pLon = parseFloat(item.lon);
          if (isNaN(pLat) || isNaN(pLon)) continue;

          const primaryName = item.name || item.display_name.split(",")[0].trim();
          const normKey = primaryName.toLowerCase();
          if (seenNames.has(normKey)) continue;
          seenNames.add(normKey);

          const distanceKm = calculateHaversineKm(centerLat, centerLon, pLat, pLon);
          // Only include destinations within reasonable commute radius (~35 km)
          if (distanceKm > 35) continue;

          const addr = item.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || "";
          const city = addr.city || addr.town || addr.county || searchTarget;

          const { category, categoryLabel, glyph } = classifyPlace(item);

          combinedResults.push({
            id: String(item.place_id || `rec-${primaryName}`),
            place_id: item.place_id,
            name: primaryName,
            short_name: area && primaryName !== area ? `${primaryName}, ${area}` : primaryName,
            display_name: item.display_name,
            area,
            city,
            subtext: `${area ? area + ", " : ""}${city}`,
            category: category || catItem.cat,
            categoryLabel: categoryLabel || catItem.label,
            glyph,
            lat: pLat,
            lon: pLon,
            distanceKm,
            approxMinutes: Math.max(3, Math.round(distanceKm * 2.5)),
            fareEstimateBike: Math.max(20, Math.round(20 + distanceKm * 8)),
            fareEstimateCab: Math.max(40, Math.round(40 + distanceKm * 15)),
          });
        }
      }

      // Sort by distance ascending (closest places first)
      combinedResults.sort((a, b) => a.distanceKm - b.distanceKm);

      setInCache(cacheKey, combinedResults);
      return NextResponse.json(combinedResults);
    } catch (error) {
      console.error("Places API nearby recommendations error:", error);
      return NextResponse.json([]);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. REAL-TIME FORWARD SEARCH & AUTOCOMPLETE (Zero Mock Data)
  // ─────────────────────────────────────────────────────────────
  if (!q || !q.trim()) {
    return NextResponse.json([]);
  }

  const queryTrimmed = q.trim();
  const biasLat = lat ? parseFloat(lat) : null;
  const biasLon = lon ? parseFloat(lon) : null;

  const cacheKey = `search:${queryTrimmed.toLowerCase()}:${biasLat ? biasLat.toFixed(2) : ""},${
    biasLon ? biasLon.toFixed(2) : ""
  }`;
  const cached = getFromCache(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      queryTrimmed
    )}&countrycodes=in&limit=10`;

    // Proximity bias around user coordinates
    if (biasLat !== null && biasLon !== null) {
      const d = 0.55; // ~55km regional viewbox
      url += `&viewbox=${biasLon - d},${biasLat + d},${biasLon + d},${biasLat - d}&bounded=0`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BhavoRealtimeTransit/2.0 (contact@bhavo.com)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const nominatimResults: NominatimPlace[] = await res.json();
    if (!Array.isArray(nominatimResults)) {
      return NextResponse.json([]);
    }

    const formatted = nominatimResults.map((item) => {
      const addr = item.address || {};
      const primaryName = item.name || item.display_name.split(",")[0].trim();
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || addr.residential || "";
      const cityName = addr.city || addr.town || addr.county || addr.state_district || addr.state || "India";
      const { category, categoryLabel, glyph } = classifyPlace(item);

      const pLat = parseFloat(item.lat);
      const pLon = parseFloat(item.lon);

      let distanceKm: number | undefined;
      let approxMinutes: number | undefined;

      if (biasLat !== null && biasLon !== null && !isNaN(pLat) && !isNaN(pLon)) {
        distanceKm = calculateHaversineKm(biasLat, biasLon, pLat, pLon);
        approxMinutes = Math.max(3, Math.round(distanceKm * 2.5));
      }

      return {
        id: String(item.place_id),
        place_id: item.place_id,
        name: primaryName,
        short_name: area && primaryName !== area ? `${primaryName}, ${area}` : primaryName,
        display_name: item.display_name,
        area: area || cityName,
        city: cityName,
        subtext: `${area ? area + ", " : ""}${cityName}`,
        category,
        categoryLabel,
        glyph,
        lat: item.lat,
        lon: item.lon,
        distanceKm,
        approxMinutes,
      };
    });

    setInCache(cacheKey, formatted);
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Places API live forward search error:", error);
    return NextResponse.json([]);
  }
}
