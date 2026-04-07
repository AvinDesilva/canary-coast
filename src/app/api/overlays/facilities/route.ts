import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_FACILITIES_GEOJSON } from "@/lib/mock-data";

export async function GET() {
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(MOCK_FACILITIES_GEOJSON);
  }

  const { data, error } = await supabase.rpc("get_facilities_geojson");

  if (error || !data) {
    console.error("Facilities overlay error:", error);
    return NextResponse.json(MOCK_FACILITIES_GEOJSON);
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
