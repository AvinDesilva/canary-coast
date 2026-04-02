"use client";

import { getScoreColor } from "@/lib/safety";

interface SafetyBreakdownProps {
  cancerScore: number;
  floodScore: number;
}

export default function SafetyBreakdown({
  cancerScore,
  floodScore,
}: SafetyBreakdownProps) {
  return (
    <div className="flex flex-col gap-3">
      <ScoreBar label="Cancer Risk" score={cancerScore} weight={40} />
      <ScoreBar label="Flood Risk" score={floodScore} weight={60} />
    </div>
  );
}

function ScoreBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const color = getScoreColor(score);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-alice-blue/80">
          {label}
          <span className="text-alice-blue/40 ml-1">({weight}%)</span>
        </span>
        <span className="font-fraunces font-bold text-sm" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 bg-twilight-indigo border-2 border-sapphire-sky">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
