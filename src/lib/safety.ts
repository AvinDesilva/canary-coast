import type { SafetyScore, FloodRiskLevel, SafetyBand } from "@/types/safety";
import {
  FLOOD_SCORE_MAP,
  SAFETY_BANDS,
  HISTORICAL_FLOOD_CAP,
  FLOOD_FEMA_WEIGHT,
  FLOOD_HISTORICAL_WEIGHT,
} from "./constants";

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeSafetyScore(
  cancerSIR: number | null,
  floodRiskLevel: FloodRiskLevel | string | null,
  floodEventCount: number | null = null
): SafetyScore {
  const cancerScore =
    cancerSIR != null
      ? clamp(0, 100, 100 - ((cancerSIR - 0.5) / 1.5) * 100)
      : 50;

  const femaScore =
    floodRiskLevel && floodRiskLevel in FLOOD_SCORE_MAP
      ? FLOOD_SCORE_MAP[floodRiskLevel as FloodRiskLevel]
      : 50;

  // Historical score: 100 (0 events) → 0 (CAP+ events). Falls back to
  // the FEMA score when no historical data is available (pre-ingestion).
  const historicalScore =
    floodEventCount != null
      ? clamp(0, 100, 100 * (1 - floodEventCount / HISTORICAL_FLOOD_CAP))
      : femaScore;

  const floodScore = Math.round(
    femaScore * FLOOD_FEMA_WEIGHT + historicalScore * FLOOD_HISTORICAL_WEIGHT
  );

  return {
    cancer: Math.round(cancerScore),
    flood: floodScore,
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
