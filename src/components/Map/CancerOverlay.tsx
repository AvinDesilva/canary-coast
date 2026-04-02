"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { MOCK_CANCER_GEOJSON } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";

const SOURCE_ID = "cancer-source";
const LAYER_ID = "cancer-layer";

interface CancerOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function CancerOverlay({ map, geojson }: CancerOverlayProps) {
  useEffect(() => {
    const data = geojson || (DEMO_MODE ? MOCK_CANCER_GEOJSON : null);
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
              ["get", "cancer_sir"],
              0.5,
              "#22c55e",
              1.0,
              "#eab308",
              1.5,
              "#ef4444",
            ],
            "fill-opacity": 0.2,
          },
        },
        map.getLayer("flood-layer") ? "flood-layer" : undefined
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
