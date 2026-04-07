import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HARRIS_COUNTY_BOUNDS } from "@/lib/constants";
import type { HistoricalFloodInfo } from "@/types/safety";

const EMPTY: HistoricalFloodInfo = {
  event_count: 0,
  total_structures: 0,
  harvey: 0,
  imelda: 0,
  tax_day: 0,
  memorial_day: 0,
  allison: 0,
};

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
    return NextResponse.json(EMPTY);
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json(EMPTY);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_historical_flood_at_point", { lat, lng });

  if (error) {
    console.error("Historical flood lookup error:", error);
    return NextResponse.json(EMPTY);
  }

  const row = data?.[0];
  if (!row) return NextResponse.json(EMPTY);

  return NextResponse.json({
    event_count: row.flood_event_count ?? 0,
    total_structures: row.flood_total_structures ?? 0,
    harvey: row.flood_harvey ?? 0,
    imelda: row.flood_imelda ?? 0,
    tax_day: row.flood_tax_day ?? 0,
    memorial_day: row.flood_memorial_day ?? 0,
    allison: row.flood_allison ?? 0,
  } satisfies HistoricalFloodInfo);
}
