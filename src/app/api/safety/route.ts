import { NextRequest, NextResponse } from "next/server";
import { computeSafetyScore } from "@/lib/safety";
import { createServiceClient } from "@/lib/supabase/server";
import { HARRIS_COUNTY_BOUNDS } from "@/lib/constants";
import type { FloodRiskLevel } from "@/types/safety";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing params: lat, lng" },
      { status: 400 }
    );
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

  const supabase = createServiceClient();

  if (!supabase) {
    // Demo mode: return neutral score
    return NextResponse.json(computeSafetyScore(null, null));
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_safety_at_point", {
      lat,
      lng,
    });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = (data as any)?.[0];
    const scores = computeSafetyScore(
      row?.cancer_sir ?? null,
      (row?.flood_risk as FloodRiskLevel) ?? null,
      row?.flood_event_count ?? null
    );

    return NextResponse.json({
      ...scores,
      cancer_tract_geoid: row?.cancer_tract_geoid ?? null,
      flood_zone: row?.flood_zone ?? null,
      flood_event_count: row?.flood_event_count ?? null,
    });
  } catch (error) {
    console.error("Safety API error:", error);
    return NextResponse.json(
      { error: "Failed to compute safety score" },
      { status: 500 }
    );
  }
}
