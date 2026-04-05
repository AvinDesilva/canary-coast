import { NextResponse } from "next/server";
import { getSensorHistoryAvgAqi } from "@/lib/purpleair";
import { DEMO_MODE } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";

const CACHE_TTL_HOURS = 24;

// Mock historical averages keyed by fake sensor_index used in MOCK_AIR_QUALITY_GEOJSON
const DEMO_AVERAGES: Record<number, { aqi_monthly: number; aqi_yearly: number }> = {
  10001: { aqi_monthly: 27, aqi_yearly: 31 },
  10002: { aqi_monthly: 20, aqi_yearly: 23 },
  10003: { aqi_monthly: 30, aqi_yearly: 34 },
  10004: { aqi_monthly: 24, aqi_yearly: 28 },
  10005: { aqi_monthly: 68, aqi_yearly: 72 },
  10006: { aqi_monthly: 80, aqi_yearly: 85 },
  10007: { aqi_monthly: 105, aqi_yearly: 112 },
  10008: { aqi_monthly: 32, aqi_yearly: 36 },
  10009: { aqi_monthly: 43, aqi_yearly: 48 },
  10010: { aqi_monthly: 16, aqi_yearly: 19 },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sensorIndex = parseInt(id, 10);
  if (isNaN(sensorIndex)) {
    return NextResponse.json({ error: "Invalid sensor ID" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const demo = DEMO_AVERAGES[sensorIndex] ?? null;
    return NextResponse.json({
      aqi_monthly: demo?.aqi_monthly ?? null,
      aqi_yearly: demo?.aqi_yearly ?? null,
    });
  }

  const supabase = createServiceClient();

  // Check Supabase cache
  if (supabase) {
    const { data: cached } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("air_quality_history_cache" as any)
      .select("aqi_monthly, aqi_yearly, cached_at")
      .eq("sensor_index", sensorIndex)
      .single();

    if (cached) {
      const row = cached as unknown as { cached_at: string; aqi_monthly: number | null; aqi_yearly: number | null };
      const ageHours = (Date.now() - new Date(row.cached_at).getTime()) / 3_600_000;
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json({
          aqi_monthly: row.aqi_monthly,
          aqi_yearly: row.aqi_yearly,
        }, { headers: { "X-AQ-History-Cache": "hit" } });
      }
    }
  }

  try {
    const DAY = 86400;
    const WEEK = 7 * DAY;
    const [aqi_monthly, aqi_yearly] = await Promise.all([
      getSensorHistoryAvgAqi(sensorIndex, 1440,  30 * DAY),  // daily avg over 30 days
      getSensorHistoryAvgAqi(sensorIndex, 10080, 52 * WEEK), // weekly avg over 52 weeks
    ]);

    // Store in Supabase cache (fire-and-forget)
    if (supabase) {
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("air_quality_history_cache" as any)
        .upsert({ sensor_index: sensorIndex, aqi_monthly, aqi_yearly, cached_at: new Date().toISOString() })
        .then(() => {})
        .catch((err: unknown) => console.error("AQ history cache write error:", err));
    }

    return NextResponse.json({ aqi_monthly, aqi_yearly }, { headers: { "X-AQ-History-Cache": "miss" } });
  } catch (error) {
    console.error("Sensor history avg error:", error);
    return NextResponse.json({ error: "Failed to fetch sensor history" }, { status: 500 });
  }
}
