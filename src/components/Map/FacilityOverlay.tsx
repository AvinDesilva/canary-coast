"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import mapboxglLib from "mapbox-gl";

const SOURCE_ID = "facilities-source";
const LAYER_ID = "facilities-layer";
const IMAGE_ID = "facility-icon";
const ICON_SIZE = 24;
const FACTORY_SVG = `<svg fill="#ffffff" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22,2V5H18V2ZM18,7h4V22H2V10L8,7v3l6-3v3h4ZM8,17H5v2H8Zm0-4H5v2H8Zm6,4H10v2h4Zm0-4H10v2h4Zm5,4H16v2h3Zm0-4H16v2h3Z"/></svg>`;

function drawFallbackPin(map: mapboxgl.Map, id: string) {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext("2d")!;
  const cx = ICON_SIZE / 2;
  const cy = ICON_SIZE * 0.38;
  const r = ICON_SIZE * 0.32;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy + r * 0.5);
  ctx.lineTo(cx, ICON_SIZE - 2);
  ctx.lineTo(cx + r * 0.6, cy + r * 0.5);
  ctx.fill();
  if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE), { sdf: true });
}

function loadSvgIcon(map: mapboxgl.Map, id: string, svgString: string, onDone: () => void) {
  if (map.hasImage(id)) { onDone(); return; }
  const img = new Image(ICON_SIZE, ICON_SIZE);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) { drawFallbackPin(map, id); onDone(); return; }
    ctx.drawImage(img, 0, 0);
    if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE), { sdf: true });
    onDone();
  };
  img.onerror = () => { drawFallbackPin(map, id); onDone(); };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
}

interface FacilityOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function FacilityOverlay({ map, geojson }: FacilityOverlayProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!geojson) return;

    let mounted = true;

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

    const setupLayer = () => {
      if (!mounted) return;

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
        map.addLayer(
          {
            id: LAYER_ID,
            type: "symbol",
            source: SOURCE_ID,
            layout: {
              "icon-image": IMAGE_ID,
              "icon-size": 1,
              "icon-allow-overlap": true,
            },
            paint: {
              "icon-color": [
                "match",
                ["get", "category"],
                "carcinogenic", "#ef4444",
                "#f97316",
              ],
              "icon-halo-color": "#273A71",
              "icon-halo-width": 1,
            },
          },
          map.getLayer("listings-layer") ? "listings-layer" : undefined
        );
      } else {
        (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
      }

      map.on("click", LAYER_ID, handleClick);
      map.on("mouseenter", LAYER_ID, handleMouseEnter);
      map.on("mouseleave", LAYER_ID, handleMouseLeave);
    };

    loadSvgIcon(map, IMAGE_ID, FACTORY_SVG, () => { if (mounted) setupLayer(); });

    return () => {
      mounted = false;
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
