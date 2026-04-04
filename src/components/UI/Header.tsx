"use client";

import AddressSearch from "./AddressSearch";
import type { CachedListing } from "@/types/listing";
import { CANCER_TYPES } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";

interface HeaderProps {
  overlays: { flood: boolean; cancer: boolean; listings: boolean; facilities: boolean };
  onToggleOverlay: (layer: "flood" | "cancer" | "listings" | "facilities") => void;
  onPropertyFound: (property: CachedListing) => void;
  remainingRequests?: number;
  cancerType: CancerTypeValue;
  onCancerTypeChange: (type: CancerTypeValue) => void;
}

export default function Header({
  overlays,
  onToggleOverlay,
  onPropertyFound,
  remainingRequests,
  cancerType,
  onCancerTypeChange,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-twilight-indigo border-b-2 border-sapphire-sky z-50 relative">
      <h1 className="font-fraunces text-xl font-bold text-alice-blue tracking-tight flex-shrink-0">
        Canary Coast
      </h1>
      <AddressSearch
        onPropertyFound={onPropertyFound}
        remainingRequests={remainingRequests}
      />
      <nav className="flex gap-4 flex-shrink-0 items-center">
        <ToggleButton
          active={overlays.listings}
          onClick={() => onToggleOverlay("listings")}
        >
          Listings
        </ToggleButton>
        <ToggleButton
          active={overlays.flood}
          onClick={() => onToggleOverlay("flood")}
        >
          Flood Zones
        </ToggleButton>
        <ToggleButton
          active={overlays.facilities}
          onClick={() => onToggleOverlay("facilities")}
        >
          Facilities
        </ToggleButton>
        <div className="flex items-center gap-2">
          <ToggleButton
            active={overlays.cancer}
            onClick={() => onToggleOverlay("cancer")}
          >
            Cancer Risk
          </ToggleButton>
          {overlays.cancer && (
            <select
              value={cancerType}
              onChange={(e) => onCancerTypeChange(e.target.value as CancerTypeValue)}
              className="bg-dusk-blue text-alice-blue border-2 border-sapphire-sky text-xs font-semibold uppercase tracking-wider px-2 py-1.5 focus:outline-none focus:border-fresh-sky"
            >
              {CANCER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </nav>
    </header>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-2 transition-all duration-200 ${
        active
          ? "bg-fresh-sky text-twilight-indigo border-fresh-sky"
          : "bg-transparent text-alice-blue border-sapphire-sky hover:border-fresh-sky hover:text-fresh-sky"
      }`}
    >
      {children}
    </button>
  );
}
