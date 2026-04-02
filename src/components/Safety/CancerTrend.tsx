"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import type { ZipCancerRecord } from "@/types/safety";

interface CancerTrendProps {
  data: ZipCancerRecord[];
  zipCode: string;
}

export default function CancerTrend({ data, zipCode }: CancerTrendProps) {
  if (!data.length) {
    return (
      <div className="text-alice-blue/40 text-xs text-center py-4">
        No cancer data available for {zipCode}
      </div>
    );
  }

  // Filter to this zip, exclude "all" type for the comparison chart
  const zipData = data
    .filter((d) => d.zip_code === zipCode && d.cancer_type !== "all")
    .map((d) => ({
      name: d.cancer_type.charAt(0).toUpperCase() + d.cancer_type.slice(1),
      sir: d.sir ?? 0,
    }))
    .sort((a, b) => b.sir - a.sir);

  if (!zipData.length) return null;

  const getBarColor = (sir: number) => {
    if (sir < 0.8) return "#22c55e";
    if (sir <= 1.2) return "#eab308";
    return "#ef4444";
  };

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-alice-blue/80 mb-2">
        Cancer Type SIR — {zipCode}
      </div>
      <div className="text-alice-blue/40" style={{ fontSize: "9px" }}>
        Standardized Incidence Ratio vs Texas average (1.0 = average)
      </div>
      <ResponsiveContainer width="100%" height={zipData.length * 32 + 20}>
        <BarChart data={zipData} layout="vertical" margin={{ left: 60, right: 10, top: 10, bottom: 0 }}>
          <XAxis type="number" domain={[0, "auto"]} tick={{ fill: "#D6DEE9", fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#D6DEE9", fontSize: 10 }}
            width={55}
          />
          <ReferenceLine x={1.0} stroke="#D6DEE9" strokeDasharray="3 3" label={{ value: "TX Avg", fill: "#D6DEE9", fontSize: 9, position: "top" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#3358A3",
              border: "2px solid #3A70BA",
              color: "#D6DEE9",
              fontSize: 12,
            }}
          />
          <Bar dataKey="sir" radius={0}>
            {zipData.map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry.sir)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
