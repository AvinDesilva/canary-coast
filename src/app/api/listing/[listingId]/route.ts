import { NextRequest, NextResponse } from "next/server";
import { getListingById } from "@/lib/rentcast";
import { canMakeRequest, recordRequest, getRemainingRequests } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_LISTINGS } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const externalId = decodeURIComponent(listingId);

  const supabase = createServiceClient();

  if (!supabase) {
    const listing = MOCK_LISTINGS.find((l) => l.external_id === externalId);
    if (!listing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(listing);
  }

  try {
    // Check cache
    const { data: cached } = await supabase
      .from("listings")
      .select("*")
      .eq("external_id", externalId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Rentcast-Remaining": (await getRemainingRequests(supabase)).toString() },
      });
    }

    // Rate limit check
    if (!(await canMakeRequest(supabase))) {
      return NextResponse.json(
        { error: "API rate limit reached. Try again next month." },
        { status: 429, headers: { "X-Rentcast-Remaining": "0" } }
      );
    }

    // Fetch from Rentcast
    const details = await getListingById(externalId);
    await recordRequest(supabase);

    return NextResponse.json(details, {
      headers: { "X-Rentcast-Remaining": (await getRemainingRequests(supabase)).toString() },
    });
  } catch (error) {
    console.error("Listing detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
