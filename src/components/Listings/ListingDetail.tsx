"use client";

import type { CachedListing } from "@/types/listing";
import { computeSafetyScore, getScoreBand } from "@/lib/safety";
import SafetyBadge from "@/components/Safety/SafetyBadge";
import SafetyBreakdown from "@/components/Safety/SafetyBreakdown";
import CancerTrend from "@/components/Safety/CancerTrend";
import { MOCK_ZIP_CANCER_DATA } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";
import type { FloodRiskLevel } from "@/types/safety";

interface ListingDetailProps {
  listing: CachedListing;
  onClose: () => void;
}

export default function ListingDetail({
  listing,
  onClose,
}: ListingDetailProps) {
  const scores = computeSafetyScore(
    listing.cancer_sir,
    listing.flood_risk_level as FloodRiskLevel | null
  );
  const band = listing.safety_score !== null ? getScoreBand(listing.safety_score) : null;

  const isUnlisted = listing.listing_status === "UNLISTED";
  const priceLabel = isUnlisted ? "Last Sale Price" : null;
  const price = listing.price
    ? `$${listing.price.toLocaleString()}`
    : "Price Unknown";

  const cancerData = DEMO_MODE ? MOCK_ZIP_CANCER_DATA : [];

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-twilight-indigo border-l-2 border-sapphire-sky z-50 flex flex-col overflow-y-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-sapphire-sky">
        <h2 className="font-fraunces text-lg font-bold text-alice-blue truncate">
          Property Detail
        </h2>
        <button
          onClick={onClose}
          className="text-alice-blue/60 hover:text-fresh-sky text-xl font-bold transition-colors"
        >
          \u00d7
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Price + Address */}
        <div>
          {priceLabel && (
            <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/50 mb-1">
              {priceLabel}
            </div>
          )}
          <div className="font-fraunces text-4xl font-bold text-alice-blue leading-none mb-2">
            {price}
          </div>
          {isUnlisted && (
            <div className="inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-sapphire-sky/30 text-alice-blue/70 border border-sapphire-sky mb-2">
              Not Listed for Sale
            </div>
          )}
          <div className="text-sm text-alice-blue/70">{listing.address}</div>
          <div className="text-xs text-alice-blue/50 mt-1">
            {listing.city}, {listing.state} {listing.zipcode}
          </div>
        </div>

        {/* Property Stats */}
        <div className="flex gap-4 border-2 border-sapphire-sky p-4">
          <Stat label="Beds" value={listing.bedrooms} />
          <Stat label="Baths" value={listing.bathrooms} />
          <Stat label="Sqft" value={listing.sqft?.toLocaleString()} />
          <Stat label="Year" value={listing.year_built} />
          {!isUnlisted && listing.days_on_market != null && (
            <Stat label="DOM" value={listing.days_on_market} />
          )}
        </div>

        {/* Safety Score */}
        <div className="border-2 border-sapphire-sky p-4">
          <div className="flex items-center gap-4 mb-4">
            <SafetyBadge score={listing.safety_score} size="lg" />
            <div>
              <div className="font-fraunces text-2xl font-bold" style={{ color: band?.color }}>
                {band?.label ?? "Unknown"}
              </div>
              <div className="text-xs text-alice-blue/50">
                Composite Safety Score
              </div>
            </div>
          </div>
          <SafetyBreakdown
            cancerScore={scores.cancer}
            floodScore={scores.flood}
          />
        </div>

        {/* Flood Info */}
        {listing.flood_zone_code && (
          <div className="border-2 border-sapphire-sky p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 mb-1">
              FEMA Flood Zone
            </div>
            <div className="font-fraunces text-xl font-bold text-alice-blue">
              Zone {listing.flood_zone_code}
            </div>
            <div className="text-xs text-alice-blue/50 mt-1">
              Risk level: {listing.flood_risk_level?.replace("_", " ")}
            </div>
          </div>
        )}

        {/* Cancer Trend */}
        <div className="border-2 border-sapphire-sky p-4">
          <CancerTrend
            data={cancerData}
            zipCode={listing.zipcode}
          />
        </div>

        {/* Attribution */}
        <div className="text-alice-blue/30 pb-4" style={{ fontSize: "9px" }}>
          Cancer data: Harris County Public Health / Texas Cancer Registry
          (DSHS). Flood data: FEMA National Flood Hazard Layer. Safety scores
          are informational only. Consult professionals before making purchasing
          decisions.
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex-1 text-center">
      <div className="font-fraunces text-lg font-bold text-alice-blue">
        {value ?? "--"}
      </div>
      <div className="text-xs text-alice-blue/50 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
