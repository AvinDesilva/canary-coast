import type { SafetyScore, FloodRiskLevel, SafetyBand } from "@/types/safety";
import { FLOOD_SCORE_MAP, SAFETY_BANDS } from "./constants";

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeSafetyScore(
  cancerSIR: number | null,
  floodRiskLevel: FloodRiskLevel | string | null
): SafetyScore {
  const cancerScore =
    cancerSIR != null
      ? clamp(0, 100, 100 - ((cancerSIR - 0.5) / 1.5) * 100)
      : 50;

  const floodScore =
    floodRiskLevel && floodRiskLevel in FLOOD_SCORE_MAP
      ? FLOOD_SCORE_MAP[floodRiskLevel as FloodRiskLevel]
      : 50;

  return {
    cancer: Math.round(cancerScore),
    flood: Math.round(floodScore),
    total: Math.round(cancerScore * 0.4 + floodScore * 0.6),
  };
}

export function getScoreBand(score: number): SafetyBand {
  return (
    SAFETY_BANDS.find((b) => score >= b.min && score <= b.max) ??
    SAFETY_BANDS[SAFETY_BANDS.length - 1]
  );
}

export function getScoreColor(score: number): string {
  return getScoreBand(score).color;
}
