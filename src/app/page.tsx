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
import MobileOverlayControls from "@/components/Mobile/MobileOverlayControls";
import MobileListingsSheet from "@/components/Mobile/MobileListingsSheet";
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

  const { overlays, toggleOverlay, floodGeoJSON, cancerGeoJSON, facilitiesGeoJSON, airQualityGeoJSON, historicalFloodsGeoJSON, cancerType, setCancerType } = useMapOverlays();
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
      <div className="h-dvh flex flex-col overflow-hidden w-screen">
        <Header
          overlays={overlays}
          onToggleOverlay={toggleOverlay}
          onPropertyFound={handlePropertyFound}
          remainingRequests={remainingRequests}
          cancerType={cancerType}
          onCancerTypeChange={setCancerType}
        />
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop only: left listings panel */}
          <div className="hidden md:contents">
            <ListingPanel
              listings={listings}
              loading={loading}
              onSelectListing={handleSelectListing}
            />
          </div>
          <div className="flex-1 relative h-full min-h-0">
            <MapContainer
              listings={listings}
              loading={loading}
              overlays={overlays}
              floodGeoJSON={floodGeoJSON ?? undefined}
              cancerGeoJSON={cancerGeoJSON ?? undefined}
              facilitiesGeoJSON={facilitiesGeoJSON ?? undefined}
              airQualityGeoJSON={airQualityGeoJSON ?? undefined}
              historicalFloodsGeoJSON={historicalFloodsGeoJSON ?? undefined}
              cancerType={cancerType}
              onBoundsChange={handleBoundsChange}
              onSelectListing={handleSelectListing}
              onFlyToReady={handleFlyToReady}
            />
            <ScoreLegend />
            {/* Mobile: floating overlay controls (layers + legend buttons) */}
            <MobileOverlayControls
              overlays={overlays}
              onToggleOverlay={toggleOverlay}
              cancerType={cancerType}
              onCancerTypeChange={setCancerType}
            />
            {/* Mobile: bottom sheet listings */}
            <MobileListingsSheet
              listings={listings}
              loading={loading}
              onSelectListing={handleSelectListing}
            />
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
