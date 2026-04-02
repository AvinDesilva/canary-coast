"use client";

import { useState } from "react";
import type { CachedListing } from "@/types/listing";

interface AddressSearchProps {
  onPropertyFound: (property: CachedListing) => void;
  remainingRequests?: number;
}

export default function AddressSearch({
  onPropertyFound,
  remainingRequests,
}: AddressSearchProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLow = remainingRequests !== undefined && remainingRequests <= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/property?address=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Property not found");
        return;
      }
      const property: CachedListing = await res.json();
      onPropertyFound(property);
      setAddress("");
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
      <div className="flex-1 relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Search any address..."
          className="w-full px-3 py-1.5 text-xs bg-dusk-blue border-2 border-sapphire-sky text-alice-blue placeholder-alice-blue/30 focus:outline-none focus:border-fresh-sky transition-colors"
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 whitespace-nowrap z-10">
            {error}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !address.trim()}
        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-2 border-fresh-sky bg-fresh-sky text-twilight-indigo disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? "..." : "Search"}
      </button>
      {isLow && (
        <span className="text-xs text-yellow-400/70" title="Rentcast API calls remaining this month">
          {remainingRequests} left
        </span>
      )}
    </form>
  );
}
