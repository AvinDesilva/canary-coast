"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BoundingBox } from "@/types/geo";
import type { CachedListing } from "@/types/listing";
import { useDebounce } from "./useDebounce";
import { DEMO_MODE } from "@/lib/constants";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import { snapBbox, bboxContains, mergeBbox } from "@/lib/bbox-utils";

// Minimum zoom level before fetching listings. Below this, a single Rentcast
// radius query can't meaningfully cover the viewport area.
const MIN_FETCH_ZOOM = 11;

// Maximum accumulated listings before the oldest batch is evicted.
const MAX_LISTINGS = 2000;

// Coverage resets after this many ms of inactivity to allow data refresh.
const COVERAGE_RESET_MS = 30 * 60 * 1000;

export function useMapListings(
  bounds: BoundingBox | null,
  zoom: number,
  onRemainingRequests?: (remaining: number) => void
) {
  const [listings, setListings] = useState<CachedListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Accumulated listings keyed by external_id for dedup
  const listingMapRef = useRef<Map<string, CachedListing>>(new Map());
  // The union of all previously fetched (snapped) bboxes
  const coveredBboxRef = useRef<BoundingBox | null>(null);
  // Timer to reset coverage after inactivity
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedBounds = useDebounce(bounds, 800);

  const resetCoverage = useCallback(() => {
    listingMapRef.current = new Map();
    coveredBboxRef.current = null;
  }, []);

  useEffect(() => {
    if (!debouncedBounds) return;

    if (DEMO_MODE) {
      const filtered = MOCK_LISTINGS.filter(
        (l) =>
          l.latitude >= debouncedBounds.south &&
          l.latitude <= debouncedBounds.north &&
          l.longitude >= debouncedBounds.west &&
          l.longitude <= debouncedBounds.east
      );
      Promise.resolve().then(() => setListings(filtered));
      return;
    }

    // Gate: don't fetch when zoomed out too far
    if (zoom < MIN_FETCH_ZOOM) return;

    const snapped = snapBbox(debouncedBounds);

    // Client-side containment check — skip HTTP round-trip if covered
    if (coveredBboxRef.current && bboxContains(coveredBboxRef.current, snapped)) {
      return;
    }

    const controller = new AbortController();
    Promise.resolve().then(() => setLoading(true));

    fetch(
      `/api/listings?lat_min=${snapped.south}&lat_max=${snapped.north}&lng_min=${snapped.west}&lng_max=${snapped.east}`,
      { signal: controller.signal }
    )
      .then((res) => {
        const remaining = res.headers.get("X-Rentcast-Remaining");
        if (remaining !== null && onRemainingRequests) {
          onRemainingRequests(Number(remaining));
        }
        return res.json();
      })
      .then((data: CachedListing[]) => {
        if (!Array.isArray(data)) return;

        // Merge into accumulated listing map
        for (const listing of data) {
          listingMapRef.current.set(listing.external_id, listing);
        }

        // Evict oldest entries if over cap
        if (listingMapRef.current.size > MAX_LISTINGS) {
          const keys = Array.from(listingMapRef.current.keys());
          for (let i = 0; i < keys.length - MAX_LISTINGS; i++) {
            listingMapRef.current.delete(keys[i]);
          }
        }

        // Expand covered bbox to include the snapped region
        coveredBboxRef.current = coveredBboxRef.current
          ? mergeBbox(coveredBboxRef.current, snapped)
          : snapped;

        setListings(Array.from(listingMapRef.current.values()));

        // Reset coverage after inactivity
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(resetCoverage, COVERAGE_RESET_MS);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Listings fetch error:", err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedBounds, zoom, onRemainingRequests, resetCoverage]);

  // Clean up reset timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return { listings, loading };
}
