import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_CANCER_GEOJSON } from "@/lib/mock-data";

export async function GET() {
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(MOCK_CANCER_GEOJSON);
  }

  const { data, error } = await supabase.rpc("get_cancer_geojson");

  if (error || !data) {
    console.error("Cancer overlay error:", error);
    return NextResponse.json(MOCK_CANCER_GEOJSON);
  }

  return NextResponse.json(data);
}
