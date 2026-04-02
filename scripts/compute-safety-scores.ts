/**
 * Batch compute safety scores for all listings without scores.
 *
 * Usage: npx tsx scripts/compute-safety-scores.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import "dotenv/config";

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

const FLOOD_SCORE_MAP: Record<string, number> = {
  minimal: 100,
  undetermined: 70,
  moderate: 40,
  high: 15,
  very_high: 0,
};

async function main() {
  const supabase = getAdminClient();

  // Get listings without safety scores
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, latitude, longitude")
    .is("safety_score", null);

  if (error) throw error;
  if (!listings?.length) {
    console.log("No listings need scoring.");
    return;
  }

  console.log(`Computing scores for ${listings.length} listings...`);

  let updated = 0;
  for (const listing of listings) {
    const { data: safety } = await supabase.rpc("get_safety_at_point", {
      lat: listing.latitude,
      lng: listing.longitude,
    });

    const row = safety?.[0];
    const cancerSIR = row?.cancer_sir;
    const floodRisk = row?.flood_risk;

    const cancerScore =
      cancerSIR != null
        ? clamp(0, 100, 100 - ((cancerSIR - 0.5) / 1.5) * 100)
        : 50;

    const floodScore =
      floodRisk && floodRisk in FLOOD_SCORE_MAP
        ? FLOOD_SCORE_MAP[floodRisk]
        : 50;

    const total = Math.round(cancerScore * 0.4 + floodScore * 0.6);

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        cancer_tract_geoid: row?.cancer_tract_geoid ?? null,
        cancer_sir: cancerSIR ?? null,
        flood_zone_code: row?.flood_zone ?? null,
        flood_risk_level: floodRisk ?? null,
        safety_score: total,
      })
      .eq("id", listing.id);

    if (updateError) {
      console.error(`Error updating ${listing.id}:`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} listings with safety scores.`);
}

main().catch(console.error);
