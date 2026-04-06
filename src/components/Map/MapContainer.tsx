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
import type { CancerTypeValue } from "@/lib/constants";
import ListingMarkers from "./ListingMarkers";
import FloodOverlay from "./FloodOverlay";
import CancerOverlay from "./CancerOverlay";
import FacilityOverlay from "./FacilityOverlay";
import AirQualityOverlay from "./AirQualityOverlay";

interface MapContainerProps {
  listings: CachedListing[];
  loading?: boolean;
  overlays: { flood: boolean; cancer: boolean; listings: boolean; facilities: boolean; airQuality: boolean };
  floodGeoJSON?: GeoJSON.FeatureCollection;
  cancerGeoJSON?: GeoJSON.FeatureCollection;
  facilitiesGeoJSON?: GeoJSON.FeatureCollection;
  airQualityGeoJSON?: GeoJSON.FeatureCollection;
  cancerType?: CancerTypeValue;
  onBoundsChange: (bounds: BoundingBox, zoom: number) => void;
  onSelectListing: (listing: CachedListing) => void;
  onFlyToReady?: (flyTo: (lat: number, lng: number, zoom?: number) => void) => void;
}

export default function MapContainer({
  listings,
  loading,
  overlays,
  floodGeoJSON,
  cancerGeoJSON,
  facilitiesGeoJSON,
  airQualityGeoJSON,
  cancerType,
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
    const z = map.current.getZoom();
    if (!b) return;
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    }, z);
  }, [onBoundsChange]);

  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [HARRIS_COUNTY_CENTER.lng, HARRIS_COUNTY_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      maxBounds: [
        [HARRIS_COUNTY_BOUNDS.sw.lng, HARRIS_COUNTY_BOUNDS.sw.lat],
        [HARRIS_COUNTY_BOUNDS.ne.lng, HARRIS_COUNTY_BOUNDS.ne.lat],
      ],
    });

    m.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    m.on("load", () => {
      setMapInstance(m);
      const loadBounds = m.getBounds();
      if (!loadBounds) return;
      onBoundsChange({
        north: loadBounds.getNorth(),
        south: loadBounds.getSouth(),
        east: loadBounds.getEast(),
        west: loadBounds.getWest(),
      }, m.getZoom());
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

  // Mapbox GL v3 uses window.resize (not ResizeObserver) for trackResize.
  // Debounce so map.resize() fires once after CSS transitions settle, not on
  // every animation frame (which clears the WebGL buffer and causes flickering).
  useEffect(() => {
    if (!mapInstance || !mapContainer.current) return;
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        mapInstance.resize();
      }, 50);
    });
    observer.observe(mapContainer.current);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [mapInstance]);

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
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-twilight-indigo/90 border border-sapphire-sky rounded-full px-4 py-1.5 flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 border-2 border-fresh-sky border-t-transparent rounded-full animate-spin" />
          <span className="text-alice-blue/80 text-xs font-fraunces tracking-wide">Loading listings…</span>
        </div>
      )}
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
          {overlays.cancer && <CancerOverlay map={mapInstance} geojson={cancerGeoJSON} cancerType={cancerType} />}
          {overlays.facilities && <FacilityOverlay map={mapInstance} geojson={facilitiesGeoJSON} />}
          {overlays.airQuality && <AirQualityOverlay map={mapInstance} geojson={airQualityGeoJSON} />}
        </>
      )}
    </div>
  );
}
