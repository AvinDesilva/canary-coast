/**
 * Ingest Harris County census tract boundaries from US Census TIGER/Line.
 *
 * Uses the Census Bureau's TIGERweb ArcGIS service to fetch tract geometries
 * for Harris County (COUNTYFP = '201', STATEFP = '48').
 *
 * Usage: npx tsx scripts/ingest-census-tracts.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";

// Use HCPH FeatureServer for geometry — consistent 11-digit GEOIDs, same source
// as cancer data. Any HC_ layer works since all share the same tract boundaries;
// layer 17 (urinary_bladder) is used as a lightweight geometry-only fetch.
const HCPH_SERVICE_URL =
  "https://services3.arcgis.com/FsUrhUGHe9VfghT8/arcgis/rest/services/cancer_maps_new_WFL1/FeatureServer";
const HC_GEOMETRY_LAYER = 17;

async function main() {
  const supabase = getAdminClient();

  console.log("Fetching Harris County census tract boundaries from HCPH...");

  const geojson = await queryArcGIS({
    serviceUrl: HCPH_SERVICE_URL,
    layerId: HC_GEOMETRY_LAYER,
    outFields: "GEOID,NAME",
    outSR: 4326,
  });

  console.log(`Fetched ${geojson.features.length} census tracts`);

  let upserted = 0;
  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const geoid = props.GEOID || props.geoid;

    if (!geoid || !feature.geometry) continue;

    // Normalize to MultiPolygon — the column type requires it and TIGERweb
    // returns Polygon for single-ring tracts.
    const geom = feature.geometry as GeoJSON.Geometry;
    const multiPolygon: GeoJSON.MultiPolygon =
      geom.type === "Polygon"
        ? { type: "MultiPolygon", coordinates: [geom.coordinates] }
        : (geom as GeoJSON.MultiPolygon);

    const { error } = await supabase.from("census_tracts").upsert(
      {
        geoid,
        tract_name: props.NAME || null,
        geometry: multiPolygon,
        data_source: "harris_county_ph",
      },
      { onConflict: "geoid" }
    );

    if (error) {
      console.error(`Error upserting tract ${geoid}:`, error.message);
    } else {
      upserted++;
    }
  }

  console.log(`Done. Upserted ${upserted} census tracts.`);
}

main().catch(console.error);
