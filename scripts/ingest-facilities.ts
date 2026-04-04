/**
 * Ingest Harris County pollutant facility data from HCPH ArcGIS service.
 *
 * Fetches two layers:
 *   Layer 0: noncarcinogenic_XYTableToPoint (20 facilities)
 *   Layer 1: carcinogenic_XYTableToPoint (10 facilities)
 *
 * Data source: Harris County Public Health cancer reference maps
 * Service: https://services3.arcgis.com/FsUrhUGHe9VfghT8/arcgis/rest/services/top_10_polluters_WFL1/FeatureServer
 *
 * Usage: npx tsx scripts/ingest-facilities.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";

const HCPH_SERVICE_URL =
  "https://services3.arcgis.com/FsUrhUGHe9VfghT8/arcgis/rest/services/top_10_polluters_WFL1/FeatureServer";

const NONCARCINOGENIC_LAYER = 0;
const CARCINOGENIC_LAYER = 1;

async function main() {
  const supabase = getAdminClient();

  console.log("Fetching Harris County pollutant facility data...");

  const [nonCarcinogenicGeoJSON, carcinogenicGeoJSON] = await Promise.all([
    queryArcGIS({
      serviceUrl: HCPH_SERVICE_URL,
      layerId: NONCARCINOGENIC_LAYER,
      outFields: "site_name,site_latitude,site_longitude",
    }),
    queryArcGIS({
      serviceUrl: HCPH_SERVICE_URL,
      layerId: CARCINOGENIC_LAYER,
      outFields: "site_name,Sum_of_total_emissions,site_latitude,site_longitude",
    }),
  ]);

  console.log(
    `Fetched ${nonCarcinogenicGeoJSON.features.length} non-carcinogenic + ${carcinogenicGeoJSON.features.length} carcinogenic facilities`
  );

  // Clear existing data before re-ingesting
  const { error: deleteError } = await supabase
    .from("pollutant_facilities")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (deleteError) {
    console.error("Failed to clear existing facilities:", deleteError.message);
    process.exit(1);
  }

  let inserted = 0;
  let errors = 0;

  const allFeatures: Array<{
    site_name: string;
    category: "carcinogenic" | "noncarcinogenic";
    total_emissions: number | null;
    latitude: number;
    longitude: number;
    point: { type: string; coordinates: number[] };
    data_source: string;
  }> = [];

  for (const feature of nonCarcinogenicGeoJSON.features) {
    const props = feature.properties || {};
    const lat = props.site_latitude;
    const lng = props.site_longitude;
    if (!lat || !lng || !props.site_name) continue;

    allFeatures.push({
      site_name: props.site_name,
      category: "noncarcinogenic",
      total_emissions: null,
      latitude: lat,
      longitude: lng,
      point: { type: "Point", coordinates: [lng, lat] },
      data_source: "HCPH",
    });
  }

  for (const feature of carcinogenicGeoJSON.features) {
    const props = feature.properties || {};
    const lat = props.site_latitude;
    const lng = props.site_longitude;
    if (!lat || !lng || !props.site_name) continue;

    allFeatures.push({
      site_name: props.site_name,
      category: "carcinogenic",
      total_emissions: props.Sum_of_total_emissions
        ? parseFloat(props.Sum_of_total_emissions)
        : null,
      latitude: lat,
      longitude: lng,
      point: { type: "Point", coordinates: [lng, lat] },
      data_source: "HCPH",
    });
  }

  for (const facility of allFeatures) {
    const { error } = await supabase.from("pollutant_facilities").insert(facility);
    if (error) {
      errors++;
      if (errors <= 5) console.error("Insert error:", error.message);
    } else {
      inserted++;
    }
  }

  console.log(
    `Done. Inserted ${inserted} facilities (${errors} errors).`
  );
}

main().catch(console.error);
