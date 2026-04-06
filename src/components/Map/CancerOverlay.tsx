"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { MOCK_CANCER_GEOJSON } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";

const SOURCE_ID = "cancer-source";
const LAYER_ID = "cancer-layer";

function buildColorExpression(cancerType: CancerTypeValue) {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", `cancer_sir_${cancerType}`], ["get", "cancer_sir_overall"], 1.0],
    0.5, "#93c5fd",
    1.0, "#a78bfa",
    1.5, "#7c3aed",
  ];
}

interface CancerOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
  cancerType?: CancerTypeValue;
}

export default function CancerOverlay({ map, geojson, cancerType = "overall" }: CancerOverlayProps) {
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
            "fill-color": buildColorExpression(cancerType) as mapboxgl.Expression,
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
  }, [map, geojson]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update paint expression when cancer type changes (layer already exists)
  useEffect(() => {
    if (!map.getLayer(LAYER_ID)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty(LAYER_ID, "fill-color", buildColorExpression(cancerType) as any);
  }, [map, cancerType]);

  return null;
}
