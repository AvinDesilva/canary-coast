"use client";

import { useState, useCallback, useEffect } from "react";
import { DEMO_MODE } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";
import { MOCK_FLOOD_GEOJSON, MOCK_CANCER_GEOJSON, MOCK_FACILITIES_GEOJSON, MOCK_AIR_QUALITY_GEOJSON, MOCK_HISTORICAL_FLOODS_GEOJSON } from "@/lib/mock-data";

export interface OverlayState {
  flood: boolean;
  cancer: boolean;
  listings: boolean;
  facilities: boolean;
  airQuality: boolean;
  historicalFloods: boolean;
}

export function useMapOverlays() {
  const [overlays, setOverlays] = useState<OverlayState>({
    flood: false,
    cancer: true,
    listings: true,
    facilities: false,
    airQuality: false,
    historicalFloods: false,
  });

  const [floodGeoJSON, setFloodGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [cancerGeoJSON, setCancerGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [facilitiesGeoJSON, setFacilitiesGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [airQualityGeoJSON, setAirQualityGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [historicalFloodsGeoJSON, setHistoricalFloodsGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
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

  // Fetch facilities GeoJSON when toggled on
  useEffect(() => {
    if (!overlays.facilities || facilitiesGeoJSON) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() => setFacilitiesGeoJSON(MOCK_FACILITIES_GEOJSON));
      return;
    }

    fetch("/api/overlays/facilities")
      .then((r) => r.json())
      .then(setFacilitiesGeoJSON)
      .catch(console.error);
  }, [overlays.facilities, facilitiesGeoJSON]);

  // Fetch air quality GeoJSON when toggled on
  useEffect(() => {
    if (!overlays.airQuality || airQualityGeoJSON) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() => setAirQualityGeoJSON(MOCK_AIR_QUALITY_GEOJSON));
      return;
    }

    fetch("/api/overlays/air-quality")
      .then((r) => r.json())
      .then(setAirQualityGeoJSON)
      .catch(console.error);
  }, [overlays.airQuality, airQualityGeoJSON]);

  // Fetch historical floods GeoJSON when toggled on
  useEffect(() => {
    if (!overlays.historicalFloods || historicalFloodsGeoJSON) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() => setHistoricalFloodsGeoJSON(MOCK_HISTORICAL_FLOODS_GEOJSON));
      return;
    }

    fetch("/api/overlays/historical-floods")
      .then((r) => r.json())
      .then(setHistoricalFloodsGeoJSON)
      .catch(console.error);
  }, [overlays.historicalFloods, historicalFloodsGeoJSON]);

  const toggleOverlay = useCallback((layer: keyof OverlayState) => {
    setOverlays((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return { overlays, toggleOverlay, floodGeoJSON, cancerGeoJSON, facilitiesGeoJSON, airQualityGeoJSON, historicalFloodsGeoJSON, cancerType, setCancerType };
}
