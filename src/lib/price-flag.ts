import type { PriceFlag } from "@/types/listing";

export interface PriceFlagDisplay {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
}

const FLAG_DISPLAY: Record<Exclude<PriceFlag, "none">, PriceFlagDisplay> = {
  medium: {
    label: "Price Drop",
    shortLabel: "Drop",
    color: "#fbbf24",
    bgColor: "rgba(120,53,15,0.8)",
  },
  high: {
    label: "Significant Drop",
    shortLabel: "Price ↓",
    color: "#f97316",
    bgColor: "rgba(124,45,18,0.8)",
  },
  critical: {
    label: "Motivated Seller",
    shortLabel: "🔴 Seller Motivated",
    color: "#ef4444",
    bgColor: "rgba(69,10,10,0.8)",
  },
};

export function getPriceFlagDisplay(flag: PriceFlag): PriceFlagDisplay | null {
  if (flag === "none") return null;
  return FLAG_DISPLAY[flag];
}

export function formatPriceDelta(
  price: number | null,
  prevPrice: number | null
): string | null {
  if (price == null || prevPrice == null) return null;
  const delta = price - prevPrice;
  const pct = ((prevPrice - price) / prevPrice) * 100;
  const deltaStr = `$${Math.abs(delta).toLocaleString("en-US")}`;
  return `${delta < 0 ? "-" : "+"}${deltaStr} (${pct.toFixed(1)}%)`;
}

export const isFlagged = (flag: PriceFlag): boolean => flag !== "none";
