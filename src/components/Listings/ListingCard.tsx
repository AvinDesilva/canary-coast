"use client";

import type { CachedListing } from "@/types/listing";
import SafetyBadge from "@/components/Safety/SafetyBadge";
import { isFlagged, getPriceFlagDisplay, formatPriceDelta } from "@/lib/price-flag";
import type { PriceFlag } from "@/types/listing";

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
    ? `$${listing.price.toLocaleString("en-US")}`
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
          {isFlagged(listing.price_flag) && (
            <PriceFlagBadge
              flag={listing.price_flag}
              price={listing.price}
              prevPrice={listing.prev_price}
            />
          )}
          <div className="text-xs text-alice-blue/70 truncate">
            {listing.address}
          </div>
          <div className="text-xs text-alice-blue/50 mt-1">
            {[
              listing.bedrooms && `${listing.bedrooms}bd`,
              listing.bathrooms && `${listing.bathrooms}ba`,
              listing.sqft && `${listing.sqft.toLocaleString("en-US")}sqft`,
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

function PriceFlagBadge({
  flag,
  price,
  prevPrice,
}: {
  flag: PriceFlag;
  price: number | null;
  prevPrice: number | null;
}) {
  const display = getPriceFlagDisplay(flag);
  if (!display) return null;
  const delta = formatPriceDelta(price, prevPrice);
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider mb-1"
      style={{ color: display.color, backgroundColor: display.bgColor }}
    >
      <span>{display.shortLabel}</span>
      {delta && <span className="opacity-80">{delta}</span>}
    </div>
  );
}
