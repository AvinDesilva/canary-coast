"use client";

import { useAirQuality } from "@/hooks/useAirQuality";
import { AQI_BUCKET_COLORS } from "@/lib/constants";
import Tooltip from "@/components/UI/Tooltip";

interface AirQualityCardProps {
  lat: number;
  lng: number;
}

export default function AirQualityCard({ lat, lng }: AirQualityCardProps) {
  const { data, loading, error } = useAirQuality(lat, lng);

  return (
    <div className="border-2 border-sapphire-sky p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/60 mb-3">
        Air Quality
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-6 w-24 bg-dusk-blue animate-pulse" />
          <div className="h-4 w-48 bg-dusk-blue animate-pulse" />
          <div className="h-3 w-32 bg-dusk-blue animate-pulse" />
        </div>
      )}

      {!loading && (error || !data) && (
        <div className="text-alice-blue/40 text-xs py-2">
          Air quality data unavailable for this location.
        </div>
      )}

      {!loading && data && (
        <>
          {/* Status row */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: AQI_BUCKET_COLORS[data.bucket] }}
            />
            <span
              className="font-fraunces text-xl font-bold"
              style={{ color: AQI_BUCKET_COLORS[data.bucket] }}
            >
              {data.bucket.toUpperCase()}
            </span>
            <Tooltip
              content={`PM2.5: ${data.pm25_corrected} µg/m³ (uncorrected sensor: ${data.pm25_raw} µg/m³) · Humidity: ${data.humidity}%`}
            >
              <span className="text-alice-blue/40 text-xs cursor-default select-none border border-alice-blue/20 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none">
                i
              </span>
            </Tooltip>
          </div>

          {/* AQI number */}
          <div
            className="font-fraunces text-4xl font-bold leading-none mb-2"
            style={{ color: AQI_BUCKET_COLORS[data.bucket] }}
          >
            {data.aqi}
            <span className="text-xs font-sans font-normal text-alice-blue/40 ml-1">AQI</span>
          </div>

          {/* Description */}
          <div className="text-xs text-alice-blue/70 mb-3 leading-relaxed">
            {data.description}
          </div>

          {/* Attribution */}
          <div className="text-alice-blue/30 space-y-0.5" style={{ fontSize: "9px" }}>
            <div>Sensor: {data.sensor_name} — {data.sensor_distance_mi} mi away</div>
            <div>Real-time data via PurpleAir. Adjusted using EPA-standard correction algorithms.</div>
          </div>
        </>
      )}
    </div>
  );
}
