import { NextRequest, NextResponse } from "next/server";
import { getAirQuality } from "@/lib/purpleair";
import type { AirQualityReading } from "@/types/air-quality";
import { PURPLEAIR_CACHE_TTL_MS, HARRIS_COUNTY_BOUNDS } from "@/lib/constants";

const cache = new Map<string, { data: AirQualityReading; timestamp: number }>();
const MAX_CACHE_SIZE = 500;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing params: lat, lng" }, { status: 400 });
  }

  if (
    lat < HARRIS_COUNTY_BOUNDS.sw.lat || lat > HARRIS_COUNTY_BOUNDS.ne.lat ||
    lng < HARRIS_COUNTY_BOUNDS.sw.lng || lng > HARRIS_COUNTY_BOUNDS.ne.lng
  ) {
    return NextResponse.json(
      { error: "Coordinates outside Harris County bounds" },
      { status: 400 }
    );
  }

  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PURPLEAIR_CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { "X-AQ-Cache": "hit" } });
  }

  try {
    const reading = await getAirQuality(lat, lng);

    if (!reading) {
      return NextResponse.json(
        { error: "No air quality sensors found nearby" },
        { status: 404 }
      );
    }

    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = [...cache.entries()].sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
      if (oldest) cache.delete(oldest[0]);
    }

    cache.set(cacheKey, { data: reading, timestamp: Date.now() });
    return NextResponse.json(reading, { headers: { "X-AQ-Cache": "miss" } });
  } catch (error) {
    console.error("Air quality API error:", error);
    return NextResponse.json({ error: "Failed to fetch air quality data" }, { status: 500 });
  }
}
