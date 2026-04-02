import { NextRequest, NextResponse } from "next/server";
import { searchListings, normalizePropertyType } from "@/lib/rentcast";
import { canMakeRequest, recordRequest, getRemainingRequests } from "@/lib/rate-limit";
import { computeSafetyScore } from "@/lib/safety";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import type { FloodRiskLevel } from "@/types/safety";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const latMin = Number(params.get("lat_min"));
  const latMax = Number(params.get("lat_max"));
  const lngMin = Number(params.get("lng_min"));
  const lngMax = Number(params.get("lng_max"));

  if (!latMin || !latMax || !lngMin || !lngMax) {
    return NextResponse.json(
      { error: "Missing bbox params: lat_min, lat_max, lng_min, lng_max" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Demo mode: return mock listings
  if (!supabase) {
    const filtered = MOCK_LISTINGS.filter(
      (l) =>
        l.latitude >= latMin &&
        l.latitude <= latMax &&
        l.longitude >= lngMin &&
        l.longitude <= lngMax
    );
    return NextResponse.json(filtered);
  }

  try {
    // Check listing cache first
    const { data: cached } = await supabase.rpc("get_listings_in_bbox", {
      lat_min: latMin,
      lng_min: lngMin,
      lat_max: latMax,
      lng_max: lngMax,
    });

    if (cached && cached.length > 0) {
      return NextResponse.json(cached, {
        headers: { "X-Rentcast-Remaining": getRemainingRequests().toString() },
      });
    }

    // Check area cache — has this bbox already been searched?
    const { data: areaCached } = await supabase.rpc("is_area_cached", {
      lat_min: latMin,
      lng_min: lngMin,
      lat_max: latMax,
      lng_max: lngMax,
    });

    if (areaCached) {
      // Area was previously searched but has zero results in this bbox
      return NextResponse.json([], {
        headers: {
          "X-Cache-Hit": "true",
          "X-Rentcast-Remaining": getRemainingRequests().toString(),
        },
      });
    }

    // Rate limit check before calling Rentcast
    if (!canMakeRequest()) {
      // Return stale cached data if available, otherwise empty
      const { data: stale } = await supabase
        .from("listings")
        .select("*")
        .gte("latitude", latMin)
        .lte("latitude", latMax)
        .gte("longitude", lngMin)
        .lte("longitude", lngMax);

      return NextResponse.json(stale ?? [], {
        headers: {
          "X-Cache-Stale": "true",
          "X-Rentcast-Remaining": "0",
        },
      });
    }

    // Cache miss — fetch from Rentcast
    const bbox = { south: latMin, north: latMax, west: lngMin, east: lngMax };
    const results = await searchListings(bbox);
    recordRequest();

    // Record the searched area in search_cache
    await supabase.from("search_cache").insert({
      bbox: `SRID=4326;POLYGON((${lngMin} ${latMin}, ${lngMax} ${latMin}, ${lngMax} ${latMax}, ${lngMin} ${latMax}, ${lngMin} ${latMin}))`,
      listing_count: results.length,
    });

    // Compute safety scores and cache
    const listings = await Promise.all(
      results.map(async (r) => {
        const { data: safety } = await supabase.rpc("get_safety_at_point", {
          lat: r.latitude,
          lng: r.longitude,
        });

        const safetyRow = safety?.[0];
        const scores = computeSafetyScore(
          safetyRow?.cancer_sir ?? null,
          (safetyRow?.flood_risk as FloodRiskLevel) ?? null
        );

        const listing = {
          external_id: r.id,
          address: r.addressLine1 || r.formattedAddress,
          city: r.city,
          state: r.state,
          zipcode: r.zipCode,
          county: r.county ?? null,
          latitude: r.latitude,
          longitude: r.longitude,
          point: `SRID=4326;POINT(${r.longitude} ${r.latitude})`,
          price: r.price ?? null,
          bedrooms: r.bedrooms ?? null,
          bathrooms: r.bathrooms ?? null,
          sqft: r.squareFootage ?? null,
          lot_sqft: r.lotSize ?? null,
          year_built: r.yearBuilt ?? null,
          home_type: normalizePropertyType(r.propertyType),
          listing_status: "FOR_SALE",
          listing_type: r.listingType ?? null,
          days_on_market: r.daysOnMarket ?? null,
          listed_date: r.listedDate ?? null,
          mls_name: r.mlsName ?? null,
          listing_agent_name: r.listingAgent?.name ?? null,
          listing_office_name: r.listingOffice?.name ?? null,
          cancer_tract_geoid: safetyRow?.cancer_tract_geoid ?? null,
          cancer_sir: safetyRow?.cancer_sir ?? null,
          flood_zone_code: safetyRow?.flood_zone ?? null,
          flood_risk_level: safetyRow?.flood_risk ?? null,
          safety_score: scores.total,
        };

        await supabase
          .from("listings")
          .upsert(listing, { onConflict: "external_id" });

        return listing;
      })
    );

    return NextResponse.json(listings, {
      headers: { "X-Rentcast-Remaining": getRemainingRequests().toString() },
    });
  } catch (error) {
    console.error("Listings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
