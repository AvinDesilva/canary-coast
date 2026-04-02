/**
 * Pre-warm the listings cache for all of Harris County.
 *
 * Tiles Harris County into a grid of overlapping bboxes and calls the
 * /api/listings endpoint for each tile. After a successful run the entire
 * county is cached in Supabase for 7 days, so no user browsing triggers
 * a fresh RentCast API call.
 *
 * The script respects the monthly rate limit: it reads the current usage
 * from Supabase before each request and stops if fewer than RESERVE slots
 * remain (default 5) to leave room for address lookups.
 *
 * Usage:
 *   npx tsx scripts/warmup-listings-cache.ts
 *   npx tsx scripts/warmup-listings-cache.ts --dry-run   # print tiles, no fetches
 *   npx tsx scripts/warmup-listings-cache.ts --base-url https://your-app.vercel.app
 */

import { config } from "dotenv";
import { resolve } from "path";
import { getAdminClient } from "./utils/supabase-admin";

config({ path: resolve(process.cwd(), ".env.local") });

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = process.argv.includes("--base-url")
  ? process.argv[process.argv.indexOf("--base-url") + 1]
  : "http://localhost:3000";

const DRY_RUN = process.argv.includes("--dry-run");

// Harris County bounds
const COUNTY = { south: 29.45, north: 30.15, west: -95.95, east: -94.9 };

// Tile size in degrees. 0.2° ≈ 14 miles. With 40% server-side expansion
// each tile covers ~0.28°, giving generous overlap between adjacent tiles.
const TILE_SIZE = 0.2;

// Pause between requests to avoid hammering the server (ms)
const DELAY_MS = 2000;

// Stop if remaining requests drop to or below this threshold
const RESERVE = 5;

// ── Tile generation ───────────────────────────────────────────────────────────

interface Tile {
  south: number;
  north: number;
  west: number;
  east: number;
}

function generateTiles(): Tile[] {
  const tiles: Tile[] = [];
  let lat = COUNTY.south;
  while (lat < COUNTY.north) {
    let lng = COUNTY.west;
    while (lng < COUNTY.east) {
      tiles.push({
        south: Math.round(lat * 10000) / 10000,
        north: Math.round(Math.min(lat + TILE_SIZE, COUNTY.north) * 10000) / 10000,
        west: Math.round(lng * 10000) / 10000,
        east: Math.round(Math.min(lng + TILE_SIZE, COUNTY.east) * 10000) / 10000,
      });
      lng += TILE_SIZE;
    }
    lat += TILE_SIZE;
  }
  return tiles;
}

// ── Rate limit helper ─────────────────────────────────────────────────────────

async function getRemainingRequests(): Promise<number> {
  const supabase = getAdminClient();
  const { data } = await supabase.rpc("get_api_usage", { p_provider: "rentcast" });
  return data?.[0]?.remaining ?? 45;
}

// ── Sleep helper ──────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const tiles = generateTiles();
  console.log(`Harris County tiled into ${tiles.length} cells (${TILE_SIZE}° each)`);
  console.log(`Base URL: ${BASE_URL}`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Tiles that would be fetched:");
    tiles.forEach((t, i) =>
      console.log(`  ${i + 1}. lat ${t.south}–${t.north}, lng ${t.west}–${t.east}`)
    );
    return;
  }

  let fetched = 0;
  let cached = 0;
  let skipped = 0;
  let totalListings = 0;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];

    // Check remaining quota before each request
    const remaining = await getRemainingRequests();
    if (remaining <= RESERVE) {
      console.log(`\n⚠ Only ${remaining} requests remaining — stopping to preserve reserve of ${RESERVE}.`);
      console.log(`  Completed ${i}/${tiles.length} tiles. Re-run next month to finish.`);
      break;
    }

    const url = `${BASE_URL}/api/listings?lat_min=${tile.south}&lat_max=${tile.north}&lng_min=${tile.west}&lng_max=${tile.east}`;
    process.stdout.write(`[${i + 1}/${tiles.length}] lat ${tile.south}–${tile.north}, lng ${tile.west}–${tile.east} ... `);

    try {
      const res = await fetch(url);
      const cacheHit = res.headers.get("X-Cache-Hit") === "true";
      const stale = res.headers.get("X-Cache-Stale") === "true";
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : 0;

      if (cacheHit) {
        console.log(`CACHED (empty area)`);
        cached++;
      } else if (stale) {
        console.log(`STALE (rate limit hit)`);
        skipped++;
      } else {
        console.log(`OK — ${count} listings`);
        totalListings += count;
        fetched++;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      skipped++;
    }

    if (i < tiles.length - 1) await sleep(DELAY_MS);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Cache warm-up complete
  Tiles fetched from RentCast: ${fetched}
  Tiles already cached:        ${cached}
  Tiles skipped/errored:       ${skipped}
  Total listings cached:       ${totalListings}
  Remaining API requests:      ${await getRemainingRequests()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
