/**
 * Ingest FEMA National Flood Hazard Layer data for Harris County.
 *
 * Queries FEMA NFHL MapServer Layer 28 (Flood Hazard Zones)
 * for polygons with DFIRM_ID matching Harris County.
 *
 * Usage: npx tsx scripts/ingest-flood-zones.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";

const FEMA_SERVICE_URL =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";
const FLOOD_LAYER_ID = 28;

async function main() {
  const supabase = getAdminClient();

  console.log("Fetching Harris County flood zones from FEMA NFHL...");

  const geojson = await queryArcGIS({
    serviceUrl: FEMA_SERVICE_URL,
    layerId: FLOOD_LAYER_ID,
    where: "DFIRM_ID LIKE '48201C%'",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE",
  });

  console.log(`Fetched ${geojson.features.length} flood zone polygons`);

  let inserted = 0;
  let errors = 0;

  for (const feature of geojson.features) {
    const props = feature.properties || {};

    if (!feature.geometry) continue;

    // Wrap Polygon in MultiPolygon if needed to match schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geom: any = feature.geometry;
    const normalizedGeom =
      geom.type === "Polygon"
        ? { type: "MultiPolygon", coordinates: [geom.coordinates] }
        : geom;

    const { error } = await supabase.from("flood_zones").insert({
      fld_zone: props.FLD_ZONE || "X",
      zone_subtype: props.ZONE_SUBTY || null,
      sfha_tf: props.SFHA_TF === "T" || props.SFHA_TF === true,
      static_bfe: props.STATIC_BFE || null,
      geometry: normalizedGeom,
    });

    if (error) {
      errors++;
      if (errors <= 5) console.error("Insert error:", error.message);
    } else {
      inserted++;
    }

    if ((inserted + errors) % 500 === 0) {
      console.log(`Progress: ${inserted} inserted, ${errors} errors`);
    }
  }

  console.log(`Done. Inserted ${inserted} flood zones (${errors} errors).`);
}

main().catch(console.error);
