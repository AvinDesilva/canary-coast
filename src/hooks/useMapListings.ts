"use client";

import { useState, useEffect } from "react";
import type { BoundingBox } from "@/types/geo";
import type { CachedListing } from "@/types/listing";
import { useDebounce } from "./useDebounce";
import { DEMO_MODE } from "@/lib/constants";
import { MOCK_LISTINGS } from "@/lib/mock-data";

export function useMapListings(
  bounds: BoundingBox | null,
  onRemainingRequests?: (remaining: number) => void
) {
  const [listings, setListings] = useState<CachedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedBounds = useDebounce(bounds, 500);

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

    const controller = new AbortController();
    Promise.resolve().then(() => setLoading(true));

    fetch(
      `/api/listings?lat_min=${debouncedBounds.south}&lat_max=${debouncedBounds.north}&lng_min=${debouncedBounds.west}&lng_max=${debouncedBounds.east}`,
      { signal: controller.signal }
    )
      .then((res) => {
        const remaining = res.headers.get("X-Rentcast-Remaining");
        if (remaining !== null && onRemainingRequests) {
          onRemainingRequests(Number(remaining));
        }
        return res.json();
      })
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Listings fetch error:", err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedBounds, onRemainingRequests]);

  return { listings, loading };
}
