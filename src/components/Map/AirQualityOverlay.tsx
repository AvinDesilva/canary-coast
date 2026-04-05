"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import mapboxglLib from "mapbox-gl";
import { AQI_BUCKET_COLORS } from "@/lib/constants";

const SOURCE_ID = "air-quality-source";
const LAYER_ID = "air-quality-layer";

interface AirQualityOverlayProps {
  map: mapboxgl.Map;
  geojson?: GeoJSON.FeatureCollection;
}

export default function AirQualityOverlay({ map, geojson }: AirQualityOverlayProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!geojson) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: geojson });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": [
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
          "circle-stroke-width": 2,
          "circle-stroke-color": "#273A71",
          "circle-opacity": 0.9,
        },
      });
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

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
          <div style="color:#D6DEE9;font-size:12px;font-weight:700;margin-bottom:6px">${props.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
            <span style="color:${color};font-size:13px;font-weight:800;letter-spacing:0.05em">${bucket.toUpperCase()}</span>
            <span style="color:#D6DEE9;font-size:18px;font-weight:800;margin-left:auto">AQI ${props.aqi}</span>
          </div>
          <div style="color:#D6DEE9;font-size:10px;opacity:0.7;margin-bottom:8px">${props.description}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px">
            <div style="text-align:center;background:#1e2d5a;border-radius:4px;padding:4px 6px">
              <div style="color:#D6DEE9;font-size:9px;opacity:0.5;text-transform:uppercase;letter-spacing:0.05em">7-day avg</div>
              <div style="color:#D6DEE9;font-size:14px;font-weight:800">${props.aqi_weekly != null ? props.aqi_weekly : '<span style="opacity:0.4">N/A</span>'}</div>
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
          <div style="color:#D6DEE9;font-size:9px;opacity:0.4">PM2.5: ${props.pm25_corrected} µg/m³ (uncorrected sensor: ${props.pm25_raw} µg/m³) · RH: ${props.humidity}%</div>
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
        // Map already removed
      }
    };
  }, [map, geojson]);

  return null;
}
