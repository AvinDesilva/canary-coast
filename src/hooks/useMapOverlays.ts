"use client";

import { useState, useCallback, useEffect } from "react";
import { DEMO_MODE } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";
import { MOCK_FLOOD_GEOJSON, MOCK_CANCER_GEOJSON } from "@/lib/mock-data";

export interface OverlayState {
  flood: boolean;
  cancer: boolean;
  listings: boolean;
}

export function useMapOverlays() {
  const [overlays, setOverlays] = useState<OverlayState>({
    flood: false,
    cancer: false,
    listings: true,
  });

  const [floodGeoJSON, setFloodGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [cancerGeoJSON, setCancerGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [cancerType, setCancerType] = useState<CancerTypeValue>("overall");

  // Fetch flood GeoJSON when toggled on
  useEffect(() => {
    if (!overlays.flood || floodGeoJSON) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() => setFloodGeoJSON(MOCK_FLOOD_GEOJSON));
      return;
    }

    fetch("/api/overlays/flood")
      .then((r) => r.json())
      .then(setFloodGeoJSON)
      .catch(console.error);
  }, [overlays.flood, floodGeoJSON]);

  // Fetch cancer GeoJSON when toggled on
  useEffect(() => {
    if (!overlays.cancer || cancerGeoJSON) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() => setCancerGeoJSON(MOCK_CANCER_GEOJSON));
      return;
    }

    fetch("/api/overlays/cancer")
      .then((r) => r.json())
      .then(setCancerGeoJSON)
      .catch(console.error);
  }, [overlays.cancer, cancerGeoJSON]);

  const toggleOverlay = useCallback((layer: keyof OverlayState) => {
    setOverlays((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return { overlays, toggleOverlay, floodGeoJSON, cancerGeoJSON, cancerType, setCancerType };
}
