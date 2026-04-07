"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { MOCK_HISTORICAL_FLOODS_GEOJSON } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";

const SOURCE_ID = "historical-floods-source";
const LAYER_ID = "historical-floods-layer";

interface HistoricalFloodOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function HistoricalFloodOverlay({
  map,
  geojson,
}: HistoricalFloodOverlayProps) {
  useEffect(() => {
    const data = geojson || (DEMO_MODE ? MOCK_HISTORICAL_FLOODS_GEOJSON : null);
    if (!data) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer(
        {
          id: LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "flood_event_count"],
              0, "transparent",
              1, "#3BADF6",
              4, "#3358A3",
              8, "#273A71",
              15, "#1a1f4e",
            ],
            "fill-opacity": [
              "interpolate",
              ["linear"],
              ["get", "flood_event_count"],
              0, 0,
              1, 0.25,
              15, 0.55,
            ],
          },
        },
        map.getLayer("listings-layer") ? "listings-layer" : undefined
      );
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        // Map already removed by parent cleanup
      }
    };
  }, [map, geojson]);

  return null;
}
