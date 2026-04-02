"use client";

import { useState, useEffect, useRef } from "react";
import type { SafetyScore } from "@/types/safety";
import { computeSafetyScore } from "@/lib/safety";
import { DEMO_MODE } from "@/lib/constants";

export function useSafetyScore(lat: number | null, lng: number | null) {
  const [score, setScore] = useState<SafetyScore | null>(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, SafetyScore>());

  useEffect(() => {
    if (lat === null || lng === null) return;

    const key = `${lat},${lng}`;
    const cached = cache.current.get(key);
    if (cached) {
      setScore(cached);
      return;
    }

    if (DEMO_MODE) {
      const result = computeSafetyScore(null, null);
      cache.current.set(key, result);
      setScore(result);
      return;
    }

    setLoading(true);
    fetch(`/api/safety?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data: SafetyScore) => {
        cache.current.set(key, data);
        setScore(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lat, lng]);

  return { score, loading };
}
