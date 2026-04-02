/**
 * Ingest cancer SIR data from Harris County Public Health (HCPH) ArcGIS service.
 *
 * Fetches HC_ layers (17–33) which contain census-tract-level Standardized
 * Incidence Ratios (SIRs) compared to the Texas state average (SIR > 1.0 means
 * higher than state average). Upserts into the census_tracts table.
 *
 * Fallback: If HCPH is unavailable, uses CDC PLACES cancer prevalence data.
 *
 * Usage: npx tsx scripts/ingest-cancer-data.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";
import "dotenv/config";

const HCPH_SERVICE_URL =
  "https://services3.arcgis.com/FsUrhUGHe9VfghT8/arcgis/rest/services/cancer_maps_new_WFL1/FeatureServer";

const CDC_PLACES_URL =
  "https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/PLACES_LocalData_for_BetterHealth/FeatureServer";
const CDC_TRACT_LAYER = 2;

// HC_ layers are Harris County census-tract level (layers 17–33).
// Same order as TX_ layers 0–16; column = null means no dedicated column in schema.
const HC_LAYERS: Array<{ layerId: number; column: string | null; label: string }> = [
  { layerId: 17, column: null,                  label: "urinary_bladder" },
  { layerId: 18, column: null,                  label: "thyroid" },
  { layerId: 19, column: null,                  label: "skin" },
  { layerId: 20, column: null,                  label: "rectum" },
  { layerId: 21, column: "cancer_sir_prostate", label: "prostate" },
  { layerId: 22, column: null,                  label: "pancreas" },
  { layerId: 23, column: null,                  label: "ovary" },
  { layerId: 24, column: null,                  label: "myeloma" },
  { layerId: 25, column: null,                  label: "lymphoma" },
  { layerId: 26, column: "cancer_sir_lung",     label: "lung_and_bronchus" },
  { layerId: 27, column: null,                  label: "liver" },
  { layerId: 28, column: null,                  label: "leukemia" },
  { layerId: 29, column: null,                  label: "kidney" },
  { layerId: 30, column: "cancer_sir_colon",    label: "colon" },
  { layerId: 31, column: null,                  label: "cervix" },
  { layerId: 32, column: "cancer_sir_breast",   label: "breast" },
  { layerId: 33, column: "cancer_sir_brain",    label: "brain" },
];

async function ingestFromHCPH() {
  const supabase = getAdminClient();

  // Accumulate per-tract data across all cancer type layers
  const tractData = new Map<
    string,
    { sirs: number[]; updates: Record<string, number> }
  >();

  for (const { layerId, column, label } of HC_LAYERS) {
    console.log(`\nFetching layer ${layerId} (${label})...`);

    const geojson = await queryArcGIS({
      serviceUrl: HCPH_SERVICE_URL,
      layerId,
      outFields: "GEOID,SIR,lowr_CI,uppr_CI,observd,expectd",
      outSR: 4326,
    });

    console.log(`  ${geojson.features.length} census tracts`);

    for (const feature of geojson.features) {
      const props = feature.properties ?? {};
      const geoid = props.GEOID as string | undefined;
      if (!geoid) continue;

      if (!tractData.has(geoid)) {
        tractData.set(geoid, { sirs: [], updates: {} });
      }

      const entry = tractData.get(geoid)!;
      const sir = props.SIR as number | null;

      if (sir != null) entry.sirs.push(sir);
      if (column && sir != null) entry.updates[column] = sir;
    }
  }

  console.log(`\nUpdating ${tractData.size} census tracts...`);
  let updated = 0;
  let skipped = 0;

  for (const [geoid, { sirs, updates }] of tractData) {
    const overallSIR =
      sirs.length > 0
        ? Math.round((sirs.reduce((a, b) => a + b, 0) / sirs.length) * 1000) / 1000
        : null;

    // UPDATE only — geometry must already exist from ingest-census-tracts.ts.
    // Rows without geometry are skipped to avoid the NOT NULL constraint.
    const { data, error } = await supabase
      .from("census_tracts")
      .update({
        cancer_sir_overall: overallSIR,
        ...updates,
        data_source: "harris_county_ph",
      })
      .eq("geoid", geoid)
      .select("geoid");

    if (error) {
      console.error(`Error updating tract ${geoid}:`, error.message);
    } else if (!data || data.length === 0) {
      skipped++;
    } else {
      updated++;
    }
  }

  console.log(`Done. Updated ${updated} tracts, skipped ${skipped} (no geometry row).`);;
}

async function ingestFromCDCPlaces() {
  const supabase = getAdminClient();

  console.log("Using CDC PLACES fallback (Harris County, FIPS=48201)...");

  const geojson = await queryArcGIS({
    serviceUrl: CDC_PLACES_URL,
    layerId: CDC_TRACT_LAYER,
    where: "CountyFIPS='48201'",
    outFields: "TractFIPS,CANCER_CrudePrev,CANCER_Crude95CI",
  });

  console.log(`Fetched ${geojson.features.length} tracts from CDC PLACES`);

  let updated = 0;
  for (const feature of geojson.features) {
    const props = feature.properties ?? {};
    const geoid = props.TractFIPS as string | undefined;
    if (!geoid) continue;

    const { error } = await supabase.from("census_tracts").upsert(
      {
        geoid,
        cancer_prevalence_pct: props.CANCER_CrudePrev ?? null,
        data_source: "cdc_places",
      },
      { onConflict: "geoid" }
    );

    if (!error) updated++;
  }

  console.log(`Done. Updated cancer data for ${updated} tracts.`);
}

async function main() {
  try {
    await ingestFromHCPH();
  } catch (err) {
    console.error("HCPH ingestion failed:", err);
    console.log("Falling back to CDC PLACES...");
    await ingestFromCDCPlaces();
  }
}

main().catch(console.error);
