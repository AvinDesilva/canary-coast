"use client";

import { useState, useMemo } from "react";
import type { CachedListing, ListingFilters } from "@/types/listing";
import ListingCard from "@/components/Listings/ListingCard";
import ListingFiltersPanel from "@/components/Listings/ListingFilters";
import { LoadingSkeleton } from "@/components/UI/LoadingOverlay";

interface MobileListingsSheetProps {
  listings: CachedListing[];
  loading: boolean;
  onSelectListing: (listing: CachedListing) => void;
}

export default function MobileListingsSheet({
  listings,
  loading,
  onSelectListing,
}: MobileListingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>({});

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (filters.priceMin && l.price && l.price < filters.priceMin) return false;
      if (filters.priceMax && l.price && l.price > filters.priceMax) return false;
      if (filters.bedroomsMin && l.bedrooms && l.bedrooms < filters.bedroomsMin) return false;
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
    <div className="md:hidden">
      {/* Lists pill button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 bg-dusk-blue border-2 border-sapphire-sky text-alice-blue text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-95"
        aria-label="Open listings"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 2v10M2 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Lists
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 inset-x-0 z-50 flex flex-col bg-twilight-indigo border-t-2 border-sapphire-sky transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "62vh" }}
        aria-modal="true"
        role="dialog"
        aria-label="Listings"
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-sapphire-sky flex-shrink-0">
          <h2 className="font-fraunces text-lg font-bold text-alice-blue">
            {filtered.length} Listings
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close listings"
            className="text-alice-blue/60 hover:text-fresh-sky transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0">
          <ListingFiltersPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Listing cards */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-safe">
          {loading ? (
            <LoadingSkeleton count={3} />
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
                onClick={() => {
                  onSelectListing(listing);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>

        <div
          className="px-4 py-2 border-t-2 border-sapphire-sky text-alice-blue/30 flex-shrink-0"
          style={{ fontSize: "8px" }}
        >
          Listings: Rentcast (MLS data). Safety scores are informational only.
        </div>
      </div>
    </div>
  );
}
