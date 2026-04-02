"use client";

import AddressSearch from "./AddressSearch";
import type { CachedListing } from "@/types/listing";

interface HeaderProps {
  overlays: { flood: boolean; cancer: boolean; listings: boolean };
  onToggleOverlay: (layer: "flood" | "cancer" | "listings") => void;
  onPropertyFound: (property: CachedListing) => void;
  remainingRequests?: number;
}

export default function Header({
  overlays,
  onToggleOverlay,
  onPropertyFound,
  remainingRequests,
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
      <nav className="flex gap-4 flex-shrink-0">
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
          active={overlays.cancer}
          onClick={() => onToggleOverlay("cancer")}
        >
          Cancer Risk
        </ToggleButton>
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
