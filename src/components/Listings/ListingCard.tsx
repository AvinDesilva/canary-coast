"use client";

import type { CachedListing } from "@/types/listing";
import SafetyBadge from "@/components/Safety/SafetyBadge";

interface ListingCardProps {
  listing: CachedListing;
  index: number;
  onClick: () => void;
}

export default function ListingCard({
  listing,
  index,
  onClick,
}: ListingCardProps) {
  const price = listing.price
    ? `$${listing.price.toLocaleString()}`
    : "Price TBD";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-full border-2 border-emerald bg-dusk-blue p-5 transition-all duration-200 hover:border-fresh-sky animate-slide-up group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-fraunces text-lg font-bold text-alice-blue leading-tight mb-1 truncate">
            {price}
          </div>
          <div className="text-xs text-alice-blue/70 truncate">
            {listing.address}
          </div>
          <div className="text-xs text-alice-blue/50 mt-1">
            {[
              listing.bedrooms && `${listing.bedrooms}bd`,
              listing.bathrooms && `${listing.bathrooms}ba`,
              listing.sqft && `${listing.sqft.toLocaleString()}sqft`,
            ]
              .filter(Boolean)
              .join(" \u00b7 ")}
          </div>
        </div>
        <div title="Composite Safety Score: FEMA flood zone risk (60%) + cancer incidence rate (40%). Higher score = lower measured risk.">
          <SafetyBadge score={listing.safety_score} size="sm" />
        </div>
      </div>
    </button>
  );
}
