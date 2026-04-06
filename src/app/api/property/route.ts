import { NextRequest, NextResponse } from "next/server";
import { lookupProperty, normalizePropertyType } from "@/lib/rentcast";
import { canMakeRequest, recordRequest, getRemainingRequests } from "@/lib/rate-limit";
import { computeSafetyScore } from "@/lib/safety";
import { createServiceClient } from "@/lib/supabase/server";
import type { CachedListing } from "@/types/listing";
import type { FloodRiskLevel } from "@/types/safety";
import mockPropertyData from "@/__fixtures__/mock-property.json";

const MOCK_PROPERTY_RESULT = mockPropertyData as unknown as CachedListing;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Missing required param: address" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Demo mode
  if (!supabase) {
    return NextResponse.json(MOCK_PROPERTY_RESULT);
  }

  // Rate limit check
  if (!(await canMakeRequest(supabase))) {
    return NextResponse.json(
      { error: "API rate limit reached. Try again next month." },
      { status: 429, headers: { "X-Rentcast-Remaining": "0" } }
    );
  }

  try {
    const property = await lookupProperty(address);
    await recordRequest(supabase);

    // Compute safety score from PostGIS
    const { data: safety } = await supabase.rpc("get_safety_at_point", {
      lat: property.latitude,
      lng: property.longitude,
    });

    const safetyRow = safety?.[0];
    const scores = computeSafetyScore(
      safetyRow?.cancer_sir ?? null,
      (safetyRow?.flood_risk as FloodRiskLevel) ?? null
    );

    // Get most recent tax assessment value as price proxy
    const taxAssessments = property.taxAssessments ?? {};
    const latestYear = Object.keys(taxAssessments).sort().at(-1);
    const taxValue = latestYear ? taxAssessments[latestYear]?.value : null;

    const result: CachedListing = {
      id: property.id,
      external_id: property.id,
      address: property.addressLine1 || property.formattedAddress,
      city: property.city,
      state: property.state,
      zipcode: property.zipCode,
      county: property.county ?? null,
      latitude: property.latitude,
      longitude: property.longitude,
      price: property.lastSalePrice ?? taxValue ?? null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      sqft: property.squareFootage ?? null,
      lot_sqft: property.lotSize ?? null,
      year_built: property.yearBuilt ?? null,
      home_type: normalizePropertyType(property.propertyType),
      listing_status: "UNLISTED",
      listing_type: null,
      days_on_market: null,
      listed_date: property.lastSaleDate ?? null,
      mls_name: null,
      listing_agent_name: null,
      listing_office_name: null,
      cancer_tract_geoid: safetyRow?.cancer_tract_geoid ?? null,
      cancer_sir: safetyRow?.cancer_sir ?? null,
      flood_zone_code: safetyRow?.flood_zone ?? null,
      flood_risk_level: safetyRow?.flood_risk ?? null,
      safety_score: scores.total,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    return NextResponse.json(result, {
      headers: { "X-Rentcast-Remaining": (await getRemainingRequests(supabase)).toString() },
    });
  } catch (error) {
    console.error("Property lookup error:", error);
    return NextResponse.json(
      { error: "Property not found or lookup failed" },
      { status: 404 }
    );
  }
}
