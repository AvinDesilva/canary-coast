export type FloodRiskLevel =
  | "minimal"
  | "undetermined"
  | "moderate"
  | "high"
  | "very_high";

export type SafetyBandLabel =
  | "Low Risk"
  | "Low-Moderate Risk"
  | "Fair"
  | "Caution"
  | "High Risk";

export interface SafetyScore {
  total: number;
  cancer: number;
  flood: number;
}

export interface SafetyBand {
  label: SafetyBandLabel;
  color: string;
  min: number;
  max: number;
}

export interface SafetyAtPoint {
  cancer_tract_geoid: string | null;
  cancer_sir: number | null;
  cancer_prevalence: number | null;
  flood_zone: string | null;
  flood_risk: FloodRiskLevel | null;
  flood_event_count: number | null;
}

export interface HistoricalFloodInfo {
  event_count: number;
  total_structures: number;
  harvey: number;
  imelda: number;
  tax_day: number;
  memorial_day: number;
  allison: number;
}

export interface ZipCancerRecord {
  zip_code: string;
  cancer_type: string;
  year_start: number;
  year_end: number;
  sir: number | null;
  observed_cases: number | null;
  expected_cases: number | null;
  confidence_low: number | null;
  confidence_high: number | null;
}
