"use client";

import { useState, useEffect } from "react";
import type { CachedListing } from "@/types/listing";
import { computeSafetyScore, getScoreBand } from "@/lib/safety";
import SafetyBadge from "@/components/Safety/SafetyBadge";
import SafetyBreakdown from "@/components/Safety/SafetyBreakdown";
import CancerTrend from "@/components/Safety/CancerTrend";
import { MOCK_ZIP_CANCER_DATA } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";
import type { FloodRiskLevel, ZipCancerRecord, HistoricalFloodInfo } from "@/types/safety";
import AirQualityCard from "@/components/Safety/AirQualityCard";

interface ListingDetailProps {
  listing: CachedListing;
  onClose: () => void;
}

export default function ListingDetail({
  listing,
  onClose,
}: ListingDetailProps) {
  const [cancerData, setCancerData] = useState<ZipCancerRecord[]>(
    DEMO_MODE ? MOCK_ZIP_CANCER_DATA : []
  );
  const [floodHistory, setFloodHistory] = useState<HistoricalFloodInfo | null>(null);

  const scores = computeSafetyScore(
    listing.cancer_sir,
    listing.flood_risk_level as FloodRiskLevel | null,
    floodHistory?.event_count ?? null
  );
  const band = listing.safety_score !== null ? getScoreBand(listing.safety_score) : null;

  const isUnlisted = listing.listing_status === "UNLISTED";
  const priceLabel = isUnlisted ? "Last Sale Price" : null;
  const price = listing.price
    ? `$${listing.price.toLocaleString("en-US")}`
    : "Price Unknown";

  useEffect(() => {
    if (DEMO_MODE || !listing.zipcode) return;
    fetch(`/api/cancer/${listing.zipcode}`)
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) setCancerData(json.data);
      })
      .catch(() => {});
  }, [listing.zipcode]);

  useEffect(() => {
    if (DEMO_MODE) return;
    fetch(`/api/historical-floods?lat=${listing.latitude}&lng=${listing.longitude}`)
      .then((r) => r.json())
      .then((json: HistoricalFloodInfo) => setFloodHistory(json))
      .catch(() => {});
  }, [listing.latitude, listing.longitude]);

  return (
    <>
      {/* Mobile backdrop — tap map to dismiss */}
      <div
        className="md:hidden fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: bottom-half sheet on mobile, right sidebar on desktop */}
    <div className="fixed z-50 bg-twilight-indigo flex flex-col overflow-y-auto animate-slide-up
      bottom-0 inset-x-0 h-[55vh] border-t-2 border-sapphire-sky
      md:inset-y-0 md:bottom-auto md:right-0 md:left-auto md:inset-x-auto md:w-[420px] md:h-full md:border-t-0 md:border-l-2">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-sapphire-sky">
        <h2 className="font-fraunces text-lg font-bold text-alice-blue truncate">
          Property Detail
        </h2>
        <button
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 hover:text-fresh-sky transition-colors"
        >
          ← Back
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
          <Stat label="Sqft" value={listing.sqft?.toLocaleString("en-US")} />
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
              <div className="text-xs text-alice-blue/50" title="Methodology: Flood sub-score blends FEMA zone classification (50%) and historical flood frequency (50%), weighted 60% of composite. Cancer SIR weighted 40%. Weights are developer-defined estimates, not published standards.">
                Composite Safety Score
              </div>
            </div>
          </div>
          <SafetyBreakdown
            cancerScore={scores.cancer}
            floodScore={scores.flood}
          />
        </div>

        {/* Air Quality */}
        <AirQualityCard lat={listing.latitude} lng={listing.longitude} />

        {/* Flood Info */}
        {(listing.flood_zone_code || floodHistory) && (
          <div className="border-2 border-sapphire-sky p-4 flex flex-col gap-3">
            {listing.flood_zone_code && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 mb-1">
                  FEMA Flood Zone
                </div>
                <div className="font-fraunces text-xl font-bold text-alice-blue">
                  Zone {listing.flood_zone_code}
                </div>
                <div className="text-xs text-alice-blue/50 mt-0.5">
                  Risk level: {listing.flood_risk_level?.replace("_", " ")}
                </div>
              </div>
            )}
            {floodHistory && floodHistory.event_count > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 mb-2">
                  Historical Flooding
                </div>
                <div className="font-fraunces text-xl font-bold text-alice-blue mb-1">
                  {floodHistory.event_count} flood event{floodHistory.event_count !== 1 ? "s" : ""}
                </div>
                <div className="text-xs text-alice-blue/50 mb-2">
                  {floodHistory.total_structures.toLocaleString()} structures flooded (1977–2019)
                </div>
                <div className="flex flex-col gap-1">
                  {floodHistory.harvey > 0 && (
                    <FloodEventRow label="Hurricane Harvey (2017)" count={floodHistory.harvey} />
                  )}
                  {floodHistory.imelda > 0 && (
                    <FloodEventRow label="Tropical Storm Imelda (2019)" count={floodHistory.imelda} />
                  )}
                  {floodHistory.memorial_day > 0 && (
                    <FloodEventRow label="Memorial Day Flood (2016)" count={floodHistory.memorial_day} />
                  )}
                  {floodHistory.tax_day > 0 && (
                    <FloodEventRow label="Tax Day Flood (2016)" count={floodHistory.tax_day} />
                  )}
                  {floodHistory.allison > 0 && (
                    <FloodEventRow label="Tropical Storm Allison (2001)" count={floodHistory.allison} />
                  )}
                </div>
              </div>
            )}
            {floodHistory && floodHistory.event_count === 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 mb-1">
                  Historical Flooding
                </div>
                <div className="text-xs text-alice-blue/50">
                  No recorded flood events in this census tract (1977–2019)
                </div>
              </div>
            )}
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
        <div className="text-alice-blue/30 pb-4 space-y-1" style={{ fontSize: "9px" }}>
          <div>
            Cancer data: Harris County Public Health / Texas Cancer Registry (DSHS).
            Flood data: FEMA NFHL + HCFCD Historical Flooding (MAAPnext). Air quality: PurpleAir (EPA-corrected).
          </div>
          <div>
            Score methodology: flood sub-score blends FEMA zone (50%) and historical event frequency (50%), weighted 60% of composite. Cancer SIR weighted 40%. Weights are developer-defined estimates, not published standards.
          </div>
          <div>Safety scores are informational only. Consult professionals before making purchasing decisions.</div>
        </div>
      </div>
    </div>
    </>
  );
}

function FloodEventRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-alice-blue/70">{label}</span>
      <span className="font-fraunces text-xs font-bold text-fresh-sky ml-2 flex-shrink-0">
        {count.toLocaleString()} structures
      </span>
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
