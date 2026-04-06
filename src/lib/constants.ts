import type { SafetyBand, FloodRiskLevel } from "@/types/safety";
import type { AqiBucket } from "@/types/air-quality";

export const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const HARRIS_COUNTY_CENTER = { lng: -95.3698, lat: 29.7604 };
export const HARRIS_COUNTY_BOUNDS = {
  sw: { lng: -95.95, lat: 29.45 },
  ne: { lng: -94.9, lat: 30.15 },
};
export const DEFAULT_ZOOM = 10;

export const LISTING_CACHE_TTL_HOURS = Number(
  process.env.LISTING_CACHE_TTL_HOURS || 168
);

export const FLOOD_SCORE_MAP: Record<FloodRiskLevel, number> = {
  minimal: 100,
  undetermined: 70,
  moderate: 40,
  high: 15,
  very_high: 0,
};

export const SAFETY_BANDS: SafetyBand[] = [
  { label: "Low Risk", color: "#22c55e", min: 80, max: 100 },
  { label: "Low-Moderate Risk", color: "#84cc16", min: 60, max: 79 },
  { label: "Fair", color: "#eab308", min: 40, max: 59 },
  { label: "Caution", color: "#f97316", min: 20, max: 39 },
  { label: "High Risk", color: "#ef4444", min: 0, max: 19 },
];

export const CANCER_TYPES = [
  { value: "overall",  label: "All Cancers" },
  { value: "brain",    label: "Brain" },
  { value: "lung",     label: "Lung" },
  { value: "breast",   label: "Breast" },
  { value: "prostate", label: "Prostate" },
  { value: "colon",    label: "Colon" },
] as const;

export type CancerTypeValue = typeof CANCER_TYPES[number]["value"];

export const AQI_BUCKET_COLORS: Record<AqiBucket, string> = {
  "Good":                           "#22c55e",
  "Moderate":                       "#eab308",
  "Unhealthy for Sensitive Groups": "#f97316",
  "Unhealthy":                      "#ef4444",
  "Very Unhealthy":                 "#7c3aed",
  "Hazardous":                      "#7f1d1d",
};

export const AQI_BUCKETS: { label: AqiBucket; min: number; max: number; description: string }[] = [
  { label: "Good",                           min: 0,   max: 50,  description: "AQI 0–50 (EPA: Good). PM2.5 below 9 µg/m³. Satisfactory air quality for all groups." },
  { label: "Moderate",                       min: 51,  max: 100, description: "AQI 51–100 (EPA: Moderate). PM2.5 9–35 µg/m³. Acceptable; sensitive individuals may reduce prolonged outdoor exertion." },
  { label: "Unhealthy for Sensitive Groups", min: 101, max: 150, description: "AQI 101–150 (EPA: Unhealthy for Sensitive Groups). PM2.5 35–55 µg/m³. People with respiratory or heart conditions should limit outdoor activity." },
  { label: "Unhealthy",                      min: 151, max: 200, description: "AQI 151–200 (EPA: Unhealthy). PM2.5 55–125 µg/m³. Everyone may experience health effects; sensitive groups at greater risk." },
  { label: "Very Unhealthy",                 min: 201, max: 300, description: "AQI 201–300 (EPA: Very Unhealthy). PM2.5 125–225 µg/m³. Health alert — everyone should avoid prolonged outdoor exertion." },
  { label: "Hazardous",                      min: 301, max: 500, description: "AQI 301+ (EPA: Hazardous). PM2.5 above 225 µg/m³. Emergency health conditions; entire population affected." },
];

export const AQI_BREAKPOINTS = [
  { pmLo: 0,     pmHi: 9.0,   aqiLo: 0,   aqiHi: 50  },
  { pmLo: 9.1,   pmHi: 35.4,  aqiLo: 51,  aqiHi: 100 },
  { pmLo: 35.5,  pmHi: 55.4,  aqiLo: 101, aqiHi: 150 },
  { pmLo: 55.5,  pmHi: 125.4, aqiLo: 151, aqiHi: 200 },
  { pmLo: 125.5, pmHi: 225.4, aqiLo: 201, aqiHi: 300 },
  { pmLo: 225.5, pmHi: 325.4, aqiLo: 301, aqiHi: 500 },
] as const;

export const PURPLEAIR_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const MAPBOX_SCORE_INTERPOLATION = [
  "interpolate",
  ["linear"],
  ["get", "safety_score"],
  0,
  "#ef4444",
  25,
  "#f97316",
  50,
  "#eab308",
  75,
  "#84cc16",
  100,
  "#22c55e",
] as const;
