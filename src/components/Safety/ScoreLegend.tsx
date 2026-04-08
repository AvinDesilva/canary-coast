"use client";

import { SAFETY_BANDS } from "@/lib/constants";

export default function ScoreLegend() {
  return (
    <div className="hidden md:block absolute bottom-4 left-4 z-10 bg-dusk-blue border-2 border-sapphire-sky p-3 w-48">
      <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/80 mb-2">
        Safety Score
      </div>
      <div className="flex flex-col gap-1">
        {SAFETY_BANDS.map((band) => (
          <div key={band.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 flex-shrink-0"
              style={{ backgroundColor: band.color }}
            />
            <span className="text-xs text-alice-blue">
              {band.min}–{band.max} {band.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-sapphire-sky/50 text-alice-blue/40 space-y-1" style={{ fontSize: "9px" }}>
        <div>Cancer: HCPH/TX Cancer Registry | Flood: FEMA NFHL</div>
        <div className="leading-tight">
          Cancer overlay shows Standardized Incidence Ratio (SIR) per census tract vs. Texas average. Reflects environmental exposure patterns — not neighborhood quality.
        </div>
      </div>
    </div>
  );
}
