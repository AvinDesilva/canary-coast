"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import mapboxglLib from "mapbox-gl";
import { AQI_BUCKET_COLORS } from "@/lib/constants";

const SOURCE_ID = "air-quality-source";
const LAYER_ID = "air-quality-layer";
const IMAGE_ID = "sensor-icon";
const ICON_SIZE = 24;
const SENSOR_SVG = `<svg fill="#ffffff" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.83 1.83001L16.24 3.24001C15.6854 3.8 15.0249 4.24401 14.2969 4.54617C13.569 4.84834 12.7882 5.00261 12 5.00001C11.2118 5.00261 10.4311 4.84834 9.70311 4.54617C8.97517 4.24401 8.31464 3.8 7.76001 3.24001L9.18001 1.82001C9.92671 2.57118 10.9409 2.99554 12 3.00001C12.5255 3.00042 13.0458 2.89731 13.5314 2.69655C14.017 2.4958 14.4583 2.20134 14.83 1.83001Z"/><path d="M17.65 4.65001L19.07 6.07001C17.1951 7.9455 14.6519 8.99944 12 9.00001C9.34804 8.99944 6.80492 7.9455 4.92999 6.07001L6.34999 4.65001C7.0895 5.39597 7.96967 5.98778 8.93951 6.39117C9.90936 6.79455 10.9496 7.0015 12 7.00001C13.0504 7.0015 14.0906 6.79455 15.0605 6.39117C16.0303 5.98778 16.9105 5.39597 17.65 4.65001Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18 11H14C14 11.5304 13.7893 12.0391 13.4142 12.4142C13.0391 12.7893 12.5304 13 12 13C11.4696 13 10.9609 12.7893 10.5858 12.4142C10.2107 12.0391 10 11.5304 10 11H6C5.46957 11 4.96086 11.2107 4.58579 11.5858C4.21071 11.9609 4 12.4696 4 13V22H20V13C20 12.4696 19.7893 11.9609 19.4142 11.5858C19.0391 11.2107 18.5304 11 18 11ZM6 18V15H18V18H6Z"/><path d="M13 11C13 11.5523 12.5523 12 12 12C11.4477 12 11 11.5523 11 11C11 10.4477 11.4477 10 12 10C12.5523 10 13 10.4477 13 11Z"/></svg>`;

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

interface AirQualityOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function AirQualityOverlay({ map, geojson }: AirQualityOverlayProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!geojson) return;

    let mounted = true;

    const buildPopupHtml = (
      props: Record<string, unknown>,
      color: string,
      bucket: string,
      aqi_monthly: number | null | "loading",
      aqi_yearly: number | null | "loading"
    ) => {
      const avg = (v: number | null | "loading") =>
        v === "loading"
          ? '<span style="opacity:0.4">—</span>'
          : v != null
          ? String(v)
          : '<span style="opacity:0.4">N/A</span>';

      return `
        <div style="background:#273A71;border:2px solid #3A70BA;padding:10px 12px;font-family:sans-serif;min-width:200px">
          <div style="color:#D6DEE9;font-size:12px;font-weight:700;margin-bottom:6px">${escapeHtml(props.name)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
            <span style="color:${color};font-size:13px;font-weight:800;letter-spacing:0.05em">${bucket.toUpperCase()}</span>
            <span style="color:#D6DEE9;font-size:18px;font-weight:800;margin-left:auto">AQI ${escapeHtml(props.aqi)}</span>
          </div>
          <div style="color:#D6DEE9;font-size:10px;opacity:0.7;margin-bottom:8px">${escapeHtml(props.description)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px">
            <div style="text-align:center;background:#1e2d5a;border-radius:4px;padding:4px 6px">
              <div style="color:#D6DEE9;font-size:9px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">7-day avg</div>
              <div style="color:#D6DEE9;font-size:14px;font-weight:800">${props.aqi_weekly != null ? escapeHtml(props.aqi_weekly) : '<span style="opacity:0.4">N/A</span>'}</div>
            </div>
            <div style="text-align:center;background:#1e2d5a;border-radius:4px;padding:4px 6px">
              <div style="color:#D6DEE9;font-size:9px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">1-mo avg</div>
              <div style="color:#D6DEE9;font-size:14px;font-weight:800">${avg(aqi_monthly)}</div>
            </div>
            <div style="text-align:center;background:#1e2d5a;border-radius:4px;padding:4px 6px">
              <div style="color:#D6DEE9;font-size:9px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">1-yr avg</div>
              <div style="color:#D6DEE9;font-size:14px;font-weight:800">${avg(aqi_yearly)}</div>
            </div>
          </div>
          <div style="color:#D6DEE9;font-size:9px;opacity:0.4">PM2.5: ${escapeHtml(props.pm25_corrected)} µg/m³ (uncorrected sensor: ${escapeHtml(props.pm25_raw)} µg/m³) · RH: ${escapeHtml(props.humidity)}%</div>
        </div>
      `;
    };

    const handleClick = async (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties as Record<string, unknown>;
      if (!props) return;

      const bucket: string = String(props.bucket);
      const color = AQI_BUCKET_COLORS[bucket as keyof typeof AQI_BUCKET_COLORS] ?? "#D6DEE9";

      if (popupRef.current) popupRef.current.remove();
      const popup = new mapboxglLib.Popup({ closeButton: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHtml(props, color, bucket, "loading", "loading"))
        .addTo(map);
      popupRef.current = popup;

      if (props.sensor_index != null) {
        try {
          const res = await fetch(`/api/air-quality/sensor/${props.sensor_index}`);
          const { aqi_monthly, aqi_yearly } = await res.json() as { aqi_monthly: number | null; aqi_yearly: number | null };
          if (popupRef.current === popup) {
            popup.setHTML(buildPopupHtml(props, color, bucket, aqi_monthly, aqi_yearly));
          }
        } catch {
          if (popupRef.current === popup) {
            popup.setHTML(buildPopupHtml(props, color, bucket, null, null));
          }
        }
      } else {
        popup.setHTML(buildPopupHtml(props, color, bucket, null, null));
      }
    };

    const handleMouseEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ""; };

    const setupLayer = () => {
      if (!mounted) return;

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
        map.addLayer({
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
              ["get", "bucket"],
              "Good",                           AQI_BUCKET_COLORS["Good"],
              "Moderate",                       AQI_BUCKET_COLORS["Moderate"],
              "Unhealthy for Sensitive Groups", AQI_BUCKET_COLORS["Unhealthy for Sensitive Groups"],
              "Unhealthy",                      AQI_BUCKET_COLORS["Unhealthy"],
              "Very Unhealthy",                 AQI_BUCKET_COLORS["Very Unhealthy"],
              "Hazardous",                      AQI_BUCKET_COLORS["Hazardous"],
              "#D6DEE9",
            ],
            "icon-halo-color": "#273A71",
            "icon-halo-width": 1,
            "icon-opacity": 0.9,
          },
        });
      } else {
        (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
      }

      map.on("click", LAYER_ID, handleClick);
      map.on("mouseenter", LAYER_ID, handleMouseEnter);
      map.on("mouseleave", LAYER_ID, handleMouseLeave);
    };

    loadSvgIcon(map, IMAGE_ID, SENSOR_SVG, () => { if (mounted) setupLayer(); });

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
        // Map already removed
      }
    };
  }, [map, geojson]);

  return null;
}
