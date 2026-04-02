"use client";

import type { ListingFilters } from "@/types/listing";

interface ListingFiltersProps {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

export default function ListingFiltersPanel({
  filters,
  onChange,
}: ListingFiltersProps) {
  return (
    <div className="p-4 border-b-2 border-sapphire-sky flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min $"
          value={filters.priceMin || ""}
          onChange={(e) =>
            onChange({ ...filters, priceMin: Number(e.target.value) || undefined })
          }
          className="w-full bg-twilight-indigo border-2 border-sapphire-sky text-alice-blue text-xs px-2 py-1.5 placeholder:text-alice-blue/30 focus:border-fresh-sky outline-none"
        />
        <input
          type="number"
          placeholder="Max $"
          value={filters.priceMax || ""}
          onChange={(e) =>
            onChange({ ...filters, priceMax: Number(e.target.value) || undefined })
          }
          className="w-full bg-twilight-indigo border-2 border-sapphire-sky text-alice-blue text-xs px-2 py-1.5 placeholder:text-alice-blue/30 focus:border-fresh-sky outline-none"
        />
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() =>
              onChange({
                ...filters,
                bedroomsMin: filters.bedroomsMin === n ? undefined : n,
              })
            }
            className={`px-2 py-1 text-xs font-semibold border-2 transition-all ${
              filters.bedroomsMin === n
                ? "bg-fresh-sky text-twilight-indigo border-fresh-sky"
                : "bg-transparent text-alice-blue border-sapphire-sky hover:border-fresh-sky"
            }`}
          >
            {n}+ bd
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 block mb-1">
          Min Safety Score: {filters.safetyScoreMin ?? 0}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.safetyScoreMin ?? 0}
          onChange={(e) =>
            onChange({ ...filters, safetyScoreMin: Number(e.target.value) })
          }
          className="w-full accent-emerald"
        />
      </div>
    </div>
  );
}
