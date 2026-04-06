import { NextResponse } from "next/server";
import { getSensorHistoryAvgAqi } from "@/lib/purpleair";
import { DEMO_MODE } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";
import demoAveragesData from "@/__fixtures__/demo-sensor-averages.json";

const CACHE_TTL_HOURS = 24;
const DEMO_AVERAGES = demoAveragesData as Record<string, { aqi_monthly: number; aqi_yearly: number }>;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sensorIndex = parseInt(id, 10);
  if (isNaN(sensorIndex)) {
    return NextResponse.json({ error: "Invalid sensor ID" }, { status: 400 });
  }

  if (DEMO_MODE) {
    const demo = DEMO_AVERAGES[String(sensorIndex)] ?? null;
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
      void supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("air_quality_history_cache" as any)
        .upsert({ sensor_index: sensorIndex, aqi_monthly, aqi_yearly, cached_at: new Date().toISOString() })
        .then(({ error }: { error: unknown }) => {
          if (error) console.error("AQ history cache write error:", error);
        });
    }

    return NextResponse.json({ aqi_monthly, aqi_yearly }, { headers: { "X-AQ-History-Cache": "miss" } });
  } catch (error) {
    console.error("Sensor history avg error:", error);
    return NextResponse.json({ error: "Failed to fetch sensor history" }, { status: 500 });
  }
}
