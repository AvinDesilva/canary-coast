import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_HISTORICAL_FLOODS_GEOJSON } from "@/lib/mock-data";

export async function GET() {
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(MOCK_HISTORICAL_FLOODS_GEOJSON);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_historical_flood_geojson");

  if (error || !data) {
    console.error("Historical flood overlay error:", error);
    return NextResponse.json(MOCK_HISTORICAL_FLOODS_GEOJSON);
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
