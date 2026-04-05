"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { BoundingBox } from "@/types/geo";
import type { CachedListing } from "@/types/listing";
import Header from "@/components/UI/Header";
import ErrorBoundary from "@/components/UI/ErrorBoundary";
import ListingPanel from "@/components/Listings/ListingPanel";
import ListingDetail from "@/components/Listings/ListingDetail";
import ScoreLegend from "@/components/Safety/ScoreLegend";
import { useMapListings } from "@/hooks/useMapListings";
import { useMapOverlays } from "@/hooks/useMapOverlays";

const MapContainer = dynamic(
  () => import("@/components/Map/MapContainer"),
  { ssr: false }
);

export default function Home() {
  const [bounds, setBounds] = useState<BoundingBox | null>(null);
  const [zoom, setZoom] = useState<number>(10);
  const [selectedListing, setSelectedListing] = useState<CachedListing | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | undefined>(undefined);
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null);

  const { overlays, toggleOverlay, floodGeoJSON, cancerGeoJSON, facilitiesGeoJSON, airQualityGeoJSON, cancerType, setCancerType } = useMapOverlays();
  const { listings, loading } = useMapListings(bounds, zoom, setRemainingRequests);

  const handleBoundsChange = useCallback((newBounds: BoundingBox, newZoom: number) => {
    setBounds(newBounds);
    setZoom(newZoom);
  }, []);

  const handleSelectListing = useCallback((listing: CachedListing) => {
    setSelectedListing(listing);
  }, []);

  const handleFlyToReady = useCallback(
    (flyTo: (lat: number, lng: number, zoom?: number) => void) => {
      flyToRef.current = flyTo;
    },
    []
  );

  const handlePropertyFound = useCallback((property: CachedListing) => {
    setSelectedListing(property);
    if (flyToRef.current) {
      flyToRef.current(property.latitude, property.longitude, 15);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
        <Header
          overlays={overlays}
          onToggleOverlay={toggleOverlay}
          onPropertyFound={handlePropertyFound}
          remainingRequests={remainingRequests}
          cancerType={cancerType}
          onCancerTypeChange={setCancerType}
        />
        <div className="flex-1 flex overflow-hidden">
          <ListingPanel
            listings={listings}
            loading={loading}
            onSelectListing={handleSelectListing}
          />
          <div className="flex-1 relative">
            <MapContainer
              listings={listings}
              overlays={overlays}
              floodGeoJSON={floodGeoJSON ?? undefined}
              cancerGeoJSON={cancerGeoJSON ?? undefined}
              facilitiesGeoJSON={facilitiesGeoJSON ?? undefined}
            airQualityGeoJSON={airQualityGeoJSON ?? undefined}
              cancerType={cancerType}
              onBoundsChange={handleBoundsChange}
              onSelectListing={handleSelectListing}
              onFlyToReady={handleFlyToReady}
            />
            <ScoreLegend />
          </div>
        </div>
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
