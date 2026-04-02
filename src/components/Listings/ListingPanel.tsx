"use client";

import { useState, useMemo } from "react";
import type { CachedListing, ListingFilters } from "@/types/listing";
import ListingCard from "./ListingCard";
import ListingFiltersPanel from "./ListingFilters";
import { LoadingSkeleton } from "@/components/UI/LoadingOverlay";

interface ListingPanelProps {
  listings: CachedListing[];
  loading: boolean;
  onSelectListing: (listing: CachedListing) => void;
}

export default function ListingPanel({
  listings,
  loading,
  onSelectListing,
}: ListingPanelProps) {
  const [filters, setFilters] = useState<ListingFilters>({});

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.priceMin && l.price && l.price < filters.priceMin)
        return false;
      if (filters.priceMax && l.price && l.price > filters.priceMax)
        return false;
      if (filters.bedroomsMin && l.bedrooms && l.bedrooms < filters.bedroomsMin)
        return false;
      if (
        filters.safetyScoreMin &&
        l.safety_score !== null &&
        l.safety_score < filters.safetyScoreMin
      )
        return false;
      return true;
    });
  }, [listings, filters]);

  return (
    <div className="w-[380px] flex-shrink-0 bg-twilight-indigo border-l-2 border-sapphire-sky flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b-2 border-sapphire-sky">
        <h2 className="font-fraunces text-lg font-bold text-alice-blue">
          {filtered.length} Listings
        </h2>
      </div>

      <ListingFiltersPanel filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <div className="font-fraunces text-xl font-bold text-alice-blue/40 mb-2">
              No listings found
            </div>
            <div className="text-xs text-alice-blue/30">
              Try adjusting your filters or panning the map
            </div>
          </div>
        ) : (
          filtered.map((listing, i) => (
            <ListingCard
              key={listing.external_id}
              listing={listing}
              index={i}
              onClick={() => onSelectListing(listing)}
            />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t-2 border-sapphire-sky text-alice-blue/30" style={{ fontSize: "8px" }}>
        Listings: Rentcast (MLS data). Safety scores are informational only.
      </div>
    </div>
  );
}
