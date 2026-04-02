"use client";

import { getScoreBand } from "@/lib/safety";

interface SafetyBadgeProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-10 h-10 text-sm",
  md: "w-16 h-16 text-xl",
  lg: "w-20 h-20 text-2xl",
};

export default function SafetyBadge({ score, size = "md" }: SafetyBadgeProps) {
  if (score === null) {
    return (
      <div
        className={`${sizes[size]} rounded-full bg-dusk-blue border-2 border-sapphire-sky flex items-center justify-center font-fraunces font-bold text-alice-blue/50`}
      >
        --
      </div>
    );
  }

  const band = getScoreBand(score);

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-fraunces font-bold border-2`}
      style={{
        backgroundColor: band.color,
        borderColor: band.color,
        color: score >= 40 ? "#273A71" : "#D6DEE9",
      }}
    >
      {score}
    </div>
  );
}
