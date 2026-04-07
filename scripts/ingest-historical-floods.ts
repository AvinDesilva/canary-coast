/**
 * Ingest HCFCD historical flood data into census_tracts.
 *
 * Source: Harris County Flood Control District Historical_Flooding FeatureServer
 * (MAAPnext program). Data covers 786 census tracts with flood event counts
 * and structure counts per major named storm from 1977–2019.
 *
 * Date columns contain flooded structure counts (not binary flags).
 * A value > 0 means the tract was affected by that event.
 *
 * Usage: npx tsx scripts/ingest-historical-floods.ts
 */

import { getAdminClient } from "./utils/supabase-admin";
import { queryArcGIS } from "./utils/arcgis-client";
import "dotenv/config";

const HCFCD_SERVICE_URL =
  "https://services2.arcgis.com/nLl0k0Mja5hnSeSl/arcgis/rest/services/Historical_Flooding/FeatureServer";
const LAYER_ID = 0;

// Named storm date columns in the HCFCD dataset
const EVENT_FIELDS = {
  D20170827: "flood_harvey",       // Hurricane Harvey, Aug 27 2017
  D20190919: "flood_imelda",       // Tropical Storm Imelda, Sep 19 2019
  D20160418: "flood_tax_day",      // Tax Day Flood, Apr 18 2016
  D20160527: "flood_memorial_day", // Memorial Day Flood, May 27 2016
  D20010609: "flood_allison",      // Tropical Storm Allison, Jun 9 2001
} as const;

async function main() {
  const supabase = getAdminClient();

  console.log("Fetching HCFCD historical flood data...");

  const geojson = await queryArcGIS({
    serviceUrl: HCFCD_SERVICE_URL,
    layerId: LAYER_ID,
    where: "1=1",
    outFields: `GEOID,UniqueFloodingDates,TotalCounts,${Object.keys(EVENT_FIELDS).join(",")}`,
    returnGeometry: false,
  });

  console.log(`Fetched ${geojson.features.length} census tract records`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const geoid = props.GEOID as string | null;

    if (!geoid) {
      skipped++;
      continue;
    }

    const update: Record<string, number> = {
      flood_event_count: Number(props.UniqueFloodingDates) || 0,
      flood_total_structures: Number(props.TotalCounts) || 0,
    };

    for (const [srcField, destColumn] of Object.entries(EVENT_FIELDS)) {
      update[destColumn] = Number(props[srcField]) || 0;
    }

    const { error } = await supabase
      .from("census_tracts")
      .update(update)
      .eq("geoid", geoid);

    if (error) {
      errors++;
      if (errors <= 5) console.error(`Error updating tract ${geoid}:`, error.message);
    } else {
      updated++;
    }

    if ((updated + errors) % 100 === 0) {
      console.log(`Progress: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    }
  }

  console.log(
    `Done. Updated ${updated} tracts with historical flood data (${skipped} skipped, ${errors} errors).`
  );
}

main().catch(console.error);
