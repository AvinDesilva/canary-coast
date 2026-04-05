import { NextResponse } from "next/server";
import { getSensorsForBbox } from "@/lib/purpleair";
import { HARRIS_COUNTY_BOUNDS, PURPLEAIR_CACHE_TTL_MS } from "@/lib/constants";

let cached: { data: GeoJSON.FeatureCollection; timestamp: number } | null = null;

export async function GET() {
  if (cached && Date.now() - cached.timestamp < PURPLEAIR_CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { "X-AQ-Cache": "hit" } });
  }

  try {
    const geojson = await getSensorsForBbox(
      HARRIS_COUNTY_BOUNDS.ne.lat,
      HARRIS_COUNTY_BOUNDS.sw.lng,
      HARRIS_COUNTY_BOUNDS.sw.lat,
      HARRIS_COUNTY_BOUNDS.ne.lng
    );

    cached = { data: geojson, timestamp: Date.now() };
    return NextResponse.json(geojson, { headers: { "X-AQ-Cache": "miss" } });
  } catch (error) {
    console.error("Air quality overlay error:", error);
    return NextResponse.json({ error: "Failed to fetch air quality overlay" }, { status: 500 });
  }
}
