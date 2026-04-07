import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_FLOOD_GEOJSON } from "@/lib/mock-data";

export async function GET() {
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(MOCK_FLOOD_GEOJSON);
  }

  // Fetch flood zones as GeoJSON — use ST_AsGeoJSON to convert PostGIS geometry
  const { data, error } = await supabase.rpc("get_flood_geojson");

  if (error || !data) {
    console.error("Flood overlay error:", error);
    return NextResponse.json(MOCK_FLOOD_GEOJSON);
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
