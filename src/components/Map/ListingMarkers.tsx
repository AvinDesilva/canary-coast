"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { CachedListing } from "@/types/listing";
import { MAPBOX_SCORE_INTERPOLATION } from "@/lib/constants";

const SOURCE_ID = "listings-source";
const LAYER_NORMAL = "listings-layer-normal";
const LAYER_FLAGGED = "listings-layer-flagged";

// Inlined SVG strings — single-color black fill, 32×32 viewBox, SDF-compatible
const PIN_NORMAL_SVG = `<svg fill="#000000" width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M15.961 0.75c-6.468 0.287-11.671 5.331-12.208 11.703l-0.003 0.047c0 4.828 10.104 16.941 11.256 18.307 0.23 0.272 0.571 0.443 0.952 0.443 0 0 0.001 0 0.001 0h0.002c0 0 0.001 0 0.001 0 0.38 0 0.721-0.171 0.949-0.44l0.001-0.002c1.161-1.365 11.337-13.478 11.337-18.309-0.641-6.4-5.83-11.403-12.256-11.749l-0.033-0.001zM15.964 28.047c-4.104-5.018-9.714-12.813-9.714-15.547 0.584-5.013 4.644-8.915 9.68-9.248l0.031-0.002c5.092 0.316 9.183 4.22 9.784 9.2l0.005 0.050c0 2.732-5.652 10.527-9.786 15.547z"/></svg>`;

const PIN_FLAGGED_SVG = `<svg fill="#000000" width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M15.961 0.75c-6.468 0.287-11.671 5.331-12.208 11.703l-0.003 0.047c0 4.828 10.104 16.941 11.256 18.307 0.23 0.272 0.571 0.443 0.952 0.443 0 0 0.001 0 0.001 0h0.002c0 0 0.001 0 0.001 0 0.38 0 0.721-0.171 0.949-0.44l0.001-0.002c1.161-1.365 11.337-13.478 11.337-18.309-0.641-6.4-5.83-11.403-12.256-11.749l-0.033-0.001zM15.964 28.047c-4.104-5.018-9.714-12.813-9.714-15.547 0.584-5.013 4.644-8.915 9.68-9.248l0.031-0.002c5.092 0.316 9.183 4.22 9.784 9.2l0.005 0.050c0 2.732-5.652 10.527-9.786 15.547zM16 5.75c-0.69 0-1.25 0.56-1.25 1.25v0 7.976c0 0.69 0.56 1.25 1.25 1.25s1.25-0.56 1.25-1.25v0-7.976c0-0.69-0.56-1.25-1.25-1.25v0zM15.12 18.58c-0.223 0.224-0.36 0.532-0.36 0.873 0 0.002 0 0.004 0 0.006v-0c-0 0.010-0 0.021-0 0.032 0 0.333 0.138 0.634 0.36 0.848l0 0c0.221 0.234 0.534 0.379 0.88 0.379s0.659-0.145 0.879-0.378l0.001-0.001c0.124-0.106 0.22-0.24 0.277-0.394l0.002-0.007c0.051-0.132 0.081-0.285 0.081-0.445 0-0.013-0-0.025-0.001-0.038l0 0.002c0-0.002 0-0.005 0-0.007 0-0.34-0.137-0.648-0.359-0.872l0 0c-0.23-0.214-0.54-0.346-0.88-0.346s-0.65 0.131-0.881 0.346l0.001-0.001z"/></svg>`;

const SDF_SIZE = 64;

function loadSdfImage(
  map: mapboxgl.Map,
  name: string,
  svgString: string,
  onLoad: () => void
) {
  if (map.hasImage(name)) {
    onLoad();
    return;
  }
  const img = new Image(SDF_SIZE, SDF_SIZE);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = SDF_SIZE;
    canvas.height = SDF_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) { onLoad(); return; }
    ctx.drawImage(img, 0, 0, SDF_SIZE, SDF_SIZE);
    const imageData = ctx.getImageData(0, 0, SDF_SIZE, SDF_SIZE);
    if (!map.hasImage(name)) map.addImage(name, imageData, { sdf: true });
    onLoad();
  };
  img.onerror = () => onLoad();
  img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
}

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
          price_flag: l.price_flag,
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
      return;
    }

    let loaded = 0;
    let aborted = false;
    const onImageReady = () => {
      if (++loaded < 2) return;
      if (aborted) return;

      map.addSource(SOURCE_ID, { type: "geojson", data: geojson });

      map.addLayer({
        id: LAYER_NORMAL,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["==", ["get", "price_flag"], "none"],
        layout: {
          "icon-image": "pin-normal",
          "icon-size": 0.35,
          "icon-allow-overlap": true,
        },
        paint: {
          "icon-color": MAPBOX_SCORE_INTERPOLATION as unknown as mapboxgl.Expression,
          "icon-opacity": 1,
        },
      });

      map.addLayer({
        id: LAYER_FLAGGED,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["!=", ["get", "price_flag"], "none"],
        layout: {
          "icon-image": "pin-flagged",
          "icon-size": 0.425,
          "icon-allow-overlap": true,
        },
        paint: {
          "icon-color": MAPBOX_SCORE_INTERPOLATION as unknown as mapboxgl.Expression,
          "icon-opacity": 1,
        },
      });

      const handleClick = (e: mapboxgl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const externalId = feature.properties?.external_id;
        const listing = listings.find((l) => l.external_id === externalId);
        if (listing) onSelect(listing);
      };

      map.on("click", LAYER_NORMAL, handleClick);
      map.on("click", LAYER_FLAGGED, handleClick);

      map.on("mouseenter", LAYER_NORMAL, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_NORMAL, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", LAYER_FLAGGED, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_FLAGGED, () => {
        map.getCanvas().style.cursor = "";
      });
    };

    loadSdfImage(map, "pin-normal", PIN_NORMAL_SVG, onImageReady);
    loadSdfImage(map, "pin-flagged", PIN_FLAGGED_SVG, onImageReady);

    return () => {
      aborted = true;
      try {
        if (map.getLayer(LAYER_FLAGGED)) map.removeLayer(LAYER_FLAGGED);
        if (map.getLayer(LAYER_NORMAL)) map.removeLayer(LAYER_NORMAL);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        // Images are intentionally kept — they are reused across re-renders
      } catch {
        // Map already removed by parent cleanup
      }
    };
  }, [map, listings, onSelect]);

  return null;
}
