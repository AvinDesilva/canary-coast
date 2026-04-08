"use client";

import { useState, useEffect, useRef } from "react";
import { CANCER_TYPES } from "@/lib/constants";
import type { CancerTypeValue } from "@/lib/constants";
import { SAFETY_BANDS } from "@/lib/constants";

interface MobileOverlayControlsProps {
  overlays: {
    flood: boolean;
    cancer: boolean;
    listings: boolean;
    facilities: boolean;
    airQuality: boolean;
    historicalFloods: boolean;
  };
  onToggleOverlay: (
    layer:
      | "flood"
      | "cancer"
      | "listings"
      | "facilities"
      | "airQuality"
      | "historicalFloods"
  ) => void;
  cancerType: CancerTypeValue;
  onCancerTypeChange: (type: CancerTypeValue) => void;
}

export default function MobileOverlayControls({
  overlays,
  onToggleOverlay,
  cancerType,
  onCancerTypeChange,
}: MobileOverlayControlsProps) {
  const [showLayers, setShowLayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const layersRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (layersRef.current && !layersRef.current.contains(e.target as Node)) {
        setShowLayers(false);
      }
      if (legendRef.current && !legendRef.current.contains(e.target as Node)) {
        setShowLegend(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const OVERLAY_ITEMS: {
    key: keyof typeof overlays;
    label: string;
  }[] = [
    { key: "listings", label: "Listings" },
    { key: "flood", label: "Flood Zones" },
    { key: "historicalFloods", label: "Flood History" },
    { key: "facilities", label: "Facilities" },
    { key: "airQuality", label: "Air Quality" },
    { key: "cancer", label: "Cancer Risk" },
  ];

  return (
    <div className="md:hidden fixed right-4 z-40 flex flex-col gap-2 items-end" style={{ top: "calc(max(env(safe-area-inset-top, 0.75rem), 0.75rem) + 3.5rem)" }}>
      {/* Layers button */}
      <div ref={layersRef} className="flex flex-col items-end gap-2">
        <button
          onClick={() => {
            setShowLayers((v) => !v);
            setShowLegend(false);
          }}
          aria-label="Toggle map layers"
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
            showLayers
              ? "bg-fresh-sky border-fresh-sky text-twilight-indigo"
              : "bg-dusk-blue border-sapphire-sky text-alice-blue"
          }`}
        >
          {/* Layers / stacked-squares icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2L2 7l8 5 8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 12l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Layers dropdown */}
        {showLayers && (
          <div className="bg-dusk-blue border-2 border-sapphire-sky min-w-[180px] py-1">
            {OVERLAY_ITEMS.map(({ key, label }) => (
              <div key={key}>
                <button
                  onClick={() => onToggleOverlay(key)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-alice-blue hover:bg-sapphire-sky/20 transition-colors"
                >
                  {/* Checkmark indicator */}
                  <span
                    className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      overlays[key]
                        ? "border-fresh-sky bg-fresh-sky"
                        : "border-sapphire-sky"
                    }`}
                  >
                    {overlays[key] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                        <path d="M1 4l3 3 5-6" stroke="#273A71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {label}
                  </span>
                </button>

                {/* Cancer type sub-select (shown inline when cancer layer is active) */}
                {key === "cancer" && overlays.cancer && (
                  <div className="px-4 pb-2">
                    <select
                      value={cancerType}
                      onChange={(e) =>
                        onCancerTypeChange(e.target.value as CancerTypeValue)
                      }
                      className="w-full bg-twilight-indigo text-alice-blue border-2 border-sapphire-sky text-xs font-semibold uppercase tracking-wider px-2 py-1.5 focus:outline-none focus:border-fresh-sky"
                    >
                      {CANCER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend button */}
      <div ref={legendRef} className="flex flex-col items-end gap-2">
        <button
          onClick={() => {
            setShowLegend((v) => !v);
            setShowLayers(false);
          }}
          aria-label="Toggle safety score legend"
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
            showLegend
              ? "bg-fresh-sky border-fresh-sky text-twilight-indigo"
              : "bg-dusk-blue border-sapphire-sky text-alice-blue"
          }`}
        >
          {/* Key / legend icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1" y="3" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="1" y="11" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Legend popover */}
        {showLegend && (
          <div className="bg-dusk-blue border-2 border-sapphire-sky p-3 w-48">
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
            <div
              className="mt-2 pt-2 border-t border-sapphire-sky/50 text-alice-blue/40 space-y-1"
              style={{ fontSize: "9px" }}
            >
              <div>Cancer: HCPH/TX Cancer Registry | Flood: FEMA NFHL</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
