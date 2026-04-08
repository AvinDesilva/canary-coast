"use client";

import AddressSearch from "./AddressSearch";
import type { CachedListing } from "@/types/listing";
import { CANCER_TYPES } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";

interface HeaderProps {
  overlays: { flood: boolean; cancer: boolean; listings: boolean; facilities: boolean; airQuality: boolean; historicalFloods: boolean };
  onToggleOverlay: (layer: "flood" | "cancer" | "listings" | "facilities" | "airQuality" | "historicalFloods") => void;
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
    <header className="flex items-center gap-3 px-3 md:gap-4 md:px-6 pt-safe pb-3 md:py-3 bg-twilight-indigo border-b-2 border-sapphire-sky z-50 relative overflow-hidden">
      <h1 className="font-fraunces text-lg md:text-xl font-bold text-alice-blue tracking-tight flex-shrink-0">
        Canary Coast
      </h1>
      <div className="flex-1 min-w-0">
        <AddressSearch
          onPropertyFound={onPropertyFound}
          remainingRequests={remainingRequests}
        />
      </div>
      <nav className="hidden md:flex gap-4 flex-shrink-0 items-center">
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
          active={overlays.historicalFloods}
          onClick={() => onToggleOverlay("historicalFloods")}
        >
          Flood History
        </ToggleButton>
        <ToggleButton
          active={overlays.facilities}
          onClick={() => onToggleOverlay("facilities")}
        >
          Facilities
        </ToggleButton>
        <ToggleButton
          active={overlays.airQuality}
          onClick={() => onToggleOverlay("airQuality")}
        >
          Air Quality
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
