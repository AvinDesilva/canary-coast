"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { MOCK_FLOOD_GEOJSON } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";

const SOURCE_ID = "flood-source";
const LAYER_ID = "flood-layer";

interface FloodOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function FloodOverlay({ map, geojson }: FloodOverlayProps) {
  useEffect(() => {
    const data = geojson || (DEMO_MODE ? MOCK_FLOOD_GEOJSON : null);
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
              "match",
              ["get", "risk_level"],
              "very_high",
              "#273A71",
              "high",
              "#3A70BA",
              "moderate",
              "#3BADF6",
              "#3A70BA",
            ],
            "fill-opacity": 0.18,
          },
        },
        // Insert below listing markers if they exist
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
