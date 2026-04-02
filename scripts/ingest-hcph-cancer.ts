/**
 * Ingest per-cancer-type SIR data from Harris County Public Health (HCPH) into
 * the tract_cancer_data table (one row per census tract × cancer type).
 *
 * The HCPH ArcGIS service is census-tract level, not zip-code level.
 * Geometry for each tract is already stored in the census_tracts table via
 * ingest-census-tracts.ts — this script only handles the SIR values.
 *
 * HC_ layers (17–33) are Harris County specific. Each layer is one cancer type.
 * Fields: GEOID, SIR, lowr_CI, uppr_CI, observd, expectd, cancer (type label)
 *
 * Usage: npx tsx scripts/ingest-hcph-cancer.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";
import "dotenv/config";

const HCPH_SERVICE_URL =
  "https://services3.arcgis.com/FsUrhUGHe9VfghT8/arcgis/rest/services/cancer_maps_new_WFL1/FeatureServer";

// HC_ layers: Harris County census-tract level, one layer per cancer type.
// Layer IDs 17–33 mirror TX_ layers 0–16 in the same order.
const HC_LAYERS: Array<{ layerId: number; cancerType: string }> = [
  { layerId: 17, cancerType: "urinary_bladder" },
  { layerId: 18, cancerType: "thyroid" },
  { layerId: 19, cancerType: "skin" },
  { layerId: 20, cancerType: "rectum" },
  { layerId: 21, cancerType: "prostate" },
  { layerId: 22, cancerType: "pancreas" },
  { layerId: 23, cancerType: "ovary" },
  { layerId: 24, cancerType: "myeloma" },
  { layerId: 25, cancerType: "lymphoma" },
  { layerId: 26, cancerType: "lung" },
  { layerId: 27, cancerType: "liver" },
  { layerId: 28, cancerType: "leukemia" },
  { layerId: 29, cancerType: "kidney" },
  { layerId: 30, cancerType: "colon" },
  { layerId: 31, cancerType: "cervix" },
  { layerId: 32, cancerType: "breast" },
  { layerId: 33, cancerType: "brain" },
];

// Study period for the current HCPH dataset
const YEAR_START = 2013;
const YEAR_END = 2021;

async function main() {
  const supabase = getAdminClient();

  let totalUpserted = 0;

  for (const { layerId, cancerType } of HC_LAYERS) {
    console.log(`\nIngesting layer ${layerId} (${cancerType})...`);

    const geojson = await queryArcGIS({
      serviceUrl: HCPH_SERVICE_URL,
      layerId,
      outFields: "GEOID,SIR,lowr_CI,uppr_CI,observd,expectd",
      outSR: 4326,
    });

    console.log(`  ${geojson.features.length} census tracts`);

    let layerUpserted = 0;
    for (const feature of geojson.features) {
      const props = feature.properties ?? {};
      const geoid = props.GEOID as string | undefined;
      if (!geoid) continue;

      const { error } = await supabase.from("tract_cancer_data").upsert(
        {
          tract_geoid: geoid,
          cancer_type: cancerType,
          year_start: YEAR_START,
          year_end: YEAR_END,
          sir: props.SIR ?? null,
          observed_cases: props.observd ?? null,
          expected_cases: props.expectd ?? null,
          confidence_low: props.lowr_CI ?? null,
          confidence_high: props.uppr_CI ?? null,
        },
        { onConflict: "tract_geoid,cancer_type,year_start,year_end" }
      );

      if (error) {
        console.error(`  Error upserting ${geoid} (${cancerType}):`, error.message);
      } else {
        layerUpserted++;
      }
    }

    console.log(`  Upserted ${layerUpserted} rows`);
    totalUpserted += layerUpserted;
  }

  console.log(`\nDone. Total rows upserted: ${totalUpserted}`);
}

main().catch(console.error);
