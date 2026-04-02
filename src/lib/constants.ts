import type { SafetyBand, FloodRiskLevel } from "@/types/safety";

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
  { label: "Excellent", color: "#22c55e", min: 80, max: 100 },
  { label: "Good", color: "#84cc16", min: 60, max: 79 },
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
