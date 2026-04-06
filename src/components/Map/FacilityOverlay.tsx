"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import mapboxglLib from "mapbox-gl";

const SOURCE_ID = "facilities-source";
const LAYER_ID = "facilities-layer";

interface FacilityOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function FacilityOverlay({ map, geojson }: FacilityOverlayProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!geojson) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
      map.addLayer(
        {
          id: LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": 7,
            "circle-color": [
              "match",
              ["get", "category"],
              "carcinogenic", "#ef4444",
              "#f97316",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#D6DEE9",
          },
        },
        map.getLayer("listings-layer") ? "listings-layer" : undefined
      );
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

    const handleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      if (!props) return;

      const name = props.name as string;
      const category = props.category as string;
      const emissions = props.total_emissions as number | null;

      const emissionsLine =
        category === "carcinogenic" && emissions
          ? `<div style="color:#D6DEE9;font-size:11px;margin-top:4px">Emissions: ${Number(emissions).toLocaleString()} TON/yr</div>`
          : "";

      const categoryLabel =
        category === "carcinogenic"
          ? `<span style="color:#ef4444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">EPA-classified hazardous air pollutants (HAPs)</span>`
          : `<span style="color:#f97316;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Non-carcinogenic air pollutants</span>`;

      const html = `
        <div style="background:#273A71;border:2px solid #3A70BA;padding:10px 12px;font-family:sans-serif;min-width:180px">
          <div style="color:#D6DEE9;font-size:12px;font-weight:700;margin-bottom:4px">${name}</div>
          ${categoryLabel}
          ${emissionsLine}
          <div style="color:#D6DEE9;opacity:0.4;font-size:9px;margin-top:6px">Source: EPA Toxics Release Inventory (TRI)</div>
        </div>
      `;

      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new mapboxglLib.Popup({ closeButton: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ""; };

    map.on("click", LAYER_ID, handleClick);
    map.on("mouseenter", LAYER_ID, handleMouseEnter);
    map.on("mouseleave", LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", LAYER_ID, handleClick);
      map.off("mouseenter", LAYER_ID, handleMouseEnter);
      map.off("mouseleave", LAYER_ID, handleMouseLeave);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
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
