"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { CachedListing } from "@/types/listing";
import { MAPBOX_SCORE_INTERPOLATION } from "@/lib/constants";

const SOURCE_ID = "listings-source";
const LAYER_ID = "listings-layer";

interface ListingMarkersProps {
  map: mapboxgl.Map;
  listings: CachedListing[];
  onSelect: (listing: CachedListing) => void;
}

export default function ListingMarkers({
  map,
  listings,
  onSelect,
}: ListingMarkersProps) {
  useEffect(() => {
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: listings.map((l) => ({
        type: "Feature" as const,
        properties: {
          external_id: l.external_id,
          safety_score: l.safety_score ?? 50,
          price: l.price,
          address: l.address,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [l.longitude, l.latitude],
        },
      })),
    };

    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojson);
    } else {
      map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": MAPBOX_SCORE_INTERPOLATION as unknown as mapboxgl.Expression,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#D6DEE9",
        },
      });

      map.on("click", LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const externalId = feature.properties?.external_id;
        const listing = listings.find((l) => l.external_id === externalId);
        if (listing) onSelect(listing);
      });

      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        // Map already removed by parent cleanup
      }
    };
  }, [map, listings, onSelect]);

  return null;
}
