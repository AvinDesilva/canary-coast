import type { BoundingBox } from "@/types/geo";
import { HARRIS_COUNTY_BOUNDS } from "./constants";

// Snap bbox outward to a 0.05-degree grid (~3 miles) for better cache hit rates.
// Floors south/west, ceils north/east so the snapped bbox always contains the original.
const GRID_STEP = 0.05;

export function snapBbox(bbox: BoundingBox): BoundingBox {
  return {
    south: Math.floor(bbox.south / GRID_STEP) * GRID_STEP,
    north: Math.ceil(bbox.north / GRID_STEP) * GRID_STEP,
    west: Math.floor(bbox.west / GRID_STEP) * GRID_STEP,
    east: Math.ceil(bbox.east / GRID_STEP) * GRID_STEP,
  };
}

// Clamp bbox to Harris County boundaries to avoid out-of-range queries.
export function clampToCounty(bbox: BoundingBox): BoundingBox {
  return {
    south: Math.max(bbox.south, HARRIS_COUNTY_BOUNDS.sw.lat),
    north: Math.min(bbox.north, HARRIS_COUNTY_BOUNDS.ne.lat),
    west: Math.max(bbox.west, HARRIS_COUNTY_BOUNDS.sw.lng),
    east: Math.min(bbox.east, HARRIS_COUNTY_BOUNDS.ne.lng),
  };
}

// Returns true if outer fully contains inner.
export function bboxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  return (
    outer.north >= inner.north &&
    outer.south <= inner.south &&
    outer.east >= inner.east &&
    outer.west <= inner.west
  );
}

// Returns the union of two bboxes.
export function mergeBbox(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    north: Math.max(a.north, b.north),
    south: Math.min(a.south, b.south),
    east: Math.max(a.east, b.east),
    west: Math.min(a.west, b.west),
  };
}
