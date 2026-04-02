"use client";

import { useState, useEffect } from "react";
import type { ZipCancerRecord } from "@/types/safety";
import { DEMO_MODE } from "@/lib/constants";
import { MOCK_ZIP_CANCER_DATA } from "@/lib/mock-data";

export function useCancerTrend(zipCode: string | null) {
  const [data, setData] = useState<ZipCancerRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zipCode) return;

    if (DEMO_MODE) {
      Promise.resolve().then(() =>
        setData(MOCK_ZIP_CANCER_DATA.filter((d) => d.zip_code === zipCode))
      );
      return;
    }

    Promise.resolve().then(() => setLoading(true));
    fetch(`/api/cancer/${zipCode}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [zipCode]);

  return { data, loading };
}
