"use client";

import { useState, useEffect, useRef } from "react";
import type { AirQualityReading } from "@/types/air-quality";
import { DEMO_MODE } from "@/lib/constants";
import { MOCK_AIR_QUALITY } from "@/lib/mock-data";

export function useAirQuality(lat: number | null, lng: number | null) {
  const [data, setData] = useState<AirQualityReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, AirQualityReading>());

  useEffect(() => {
    if (lat === null || lng === null) return;

    const key = `${lat},${lng}`;
    const cached = cache.current.get(key);
    if (cached) {
      setData(cached);
      return;
    }

    if (DEMO_MODE) {
      cache.current.set(key, MOCK_AIR_QUALITY);
      setData(MOCK_AIR_QUALITY);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/air-quality?lat=${lat}&lng=${lng}`)
      .then((res) => {
        if (!res.ok) throw new Error("No air quality data available");
        return res.json();
      })
      .then((reading: AirQualityReading) => {
        cache.current.set(key, reading);
        setData(reading);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { data, loading, error };
}
