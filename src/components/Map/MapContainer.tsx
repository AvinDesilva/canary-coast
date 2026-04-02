"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  HARRIS_COUNTY_CENTER,
  HARRIS_COUNTY_BOUNDS,
  DEFAULT_ZOOM,
} from "@/lib/constants";
import type { BoundingBox } from "@/types/geo";
import type { CachedListing } from "@/types/listing";
import ListingMarkers from "./ListingMarkers";
import FloodOverlay from "./FloodOverlay";
import CancerOverlay from "./CancerOverlay";

interface MapContainerProps {
  listings: CachedListing[];
  overlays: { flood: boolean; cancer: boolean; listings: boolean };
  floodGeoJSON?: GeoJSON.FeatureCollection;
  cancerGeoJSON?: GeoJSON.FeatureCollection;
  onBoundsChange: (bounds: BoundingBox) => void;
  onSelectListing: (listing: CachedListing) => void;
  onFlyToReady?: (flyTo: (lat: number, lng: number, zoom?: number) => void) => void;
}

export default function MapContainer({
  listings,
  overlays,
  floodGeoJSON,
  cancerGeoJSON,
  onBoundsChange,
  onSelectListing,
  onFlyToReady,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMoveEnd = useCallback(() => {
    if (!map.current) return;
    const b = map.current.getBounds();
    if (!b) return;
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, [onBoundsChange]);

  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [HARRIS_COUNTY_CENTER.lng, HARRIS_COUNTY_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      maxBounds: [
        [HARRIS_COUNTY_BOUNDS.sw.lng, HARRIS_COUNTY_BOUNDS.sw.lat],
        [HARRIS_COUNTY_BOUNDS.ne.lng, HARRIS_COUNTY_BOUNDS.ne.lat],
      ],
    });

    m.addControl(new mapboxgl.NavigationControl(), "top-left");

    m.on("load", () => {
      setMapInstance(m);
      const loadBounds = m.getBounds();
      if (!loadBounds) return;
      onBoundsChange({
        north: loadBounds.getNorth(),
        south: loadBounds.getSouth(),
        east: loadBounds.getEast(),
        west: loadBounds.getWest(),
      });
      // Expose flyTo to parent
      if (onFlyToReady) {
        onFlyToReady((lat, lng, zoom = 15) => {
          m.flyTo({ center: [lng, lat], zoom });
        });
      }
    });

    m.on("moveend", handleMoveEnd);

    map.current = m;

    return () => {
      m.remove();
      map.current = null;
      setMapInstance(null);
    };
  }, [token, handleMoveEnd, onBoundsChange, onFlyToReady]);

  if (!token) {
    return (
      <div className="flex-1 bg-dusk-blue border-2 border-sapphire-sky flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="font-fraunces text-2xl font-bold text-alice-blue mb-2">
            Map Unavailable
          </h2>
          <p className="text-alice-blue/60 text-sm">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative border-2 border-twilight-indigo">
      <div ref={mapContainer} className="absolute inset-0" />
      {mapInstance && (
        <>
          {overlays.listings && (
            <ListingMarkers
              map={mapInstance}
              listings={listings}
              onSelect={onSelectListing}
            />
          )}
          {overlays.flood && <FloodOverlay map={mapInstance} geojson={floodGeoJSON} />}
          {overlays.cancer && <CancerOverlay map={mapInstance} geojson={cancerGeoJSON} />}
        </>
      )}
    </div>
  );
}
