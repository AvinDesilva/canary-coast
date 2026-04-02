import type { BoundingBox } from "@/types/geo";
import type { HomeType, ListingFilters } from "@/types/listing";

const API_KEY = process.env.RENTCAST_API_KEY;
const BASE_URL = "https://api.rentcast.io/v1";

function getHeaders() {
  if (!API_KEY) throw new Error("RENTCAST_API_KEY is not configured");
  return {
    "X-Api-Key": API_KEY,
    Accept: "application/json",
  };
}

export interface RentcastListing {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude: number;
  longitude: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  price?: number;
  status?: string;
  listingType?: string;
  listedDate?: string;
  removedDate?: string;
  daysOnMarket?: number;
  mlsName?: string;
  mlsNumber?: string;
  listingAgent?: { name?: string; phone?: string; email?: string };
  listingOffice?: { name?: string; phone?: string; email?: string };
  hoa?: { fee?: number };
}

export interface RentcastProperty {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  latitude: number;
  longitude: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  taxAssessments?: Record<string, { value: number; land: number; improvements: number }>;
  ownerOccupied?: boolean;
}

// Expand a bounding box by a factor on each side for prefetching surrounding area.
// factor=0.4 means 20% expansion per side (40% total per axis).
export function expandBbox(bbox: BoundingBox, factor = 0.4): BoundingBox {
  const latPad = (bbox.north - bbox.south) * factor / 2;
  const lngPad = (bbox.east - bbox.west) * factor / 2;
  return {
    north: bbox.north + latPad,
    south: bbox.south - latPad,
    east: bbox.east + lngPad,
    west: bbox.west - lngPad,
  };
}

// Convert a bounding box to a center lat/lng + radius (miles) using Haversine.
// The radius circumscribes the rectangle so the full bbox is covered.
function bboxToRadius(bbox: BoundingBox): {
  latitude: number;
  longitude: number;
  radius: number;
} {
  const lat = (bbox.north + bbox.south) / 2;
  const lng = (bbox.east + bbox.west) / 2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bbox.north - lat);
  const dLng = toRad(bbox.east - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(bbox.north)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radiusMiles = Math.ceil(3958.8 * c);

  return { latitude: lat, longitude: lng, radius: Math.min(radiusMiles, 100) };
}

const RENTCAST_PROPERTY_TYPE: Record<HomeType, string> = {
  SINGLE_FAMILY: "Single Family",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  MULTI_FAMILY: "Multi Family",
};

const HOME_TYPE_FROM_RENTCAST: Record<string, HomeType> = {
  "Single Family": "SINGLE_FAMILY",
  Condo: "CONDO",
  Townhouse: "TOWNHOUSE",
  "Multi Family": "MULTI_FAMILY",
};

export function normalizePropertyType(rentcastType?: string): HomeType | null {
  if (!rentcastType) return null;
  return HOME_TYPE_FROM_RENTCAST[rentcastType] ?? null;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      // Brief pause before retry — gives stale connections time to close
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  throw new Error("fetchWithRetry: unreachable");
}

export async function searchListings(
  bbox: BoundingBox,
  filters?: ListingFilters
): Promise<RentcastListing[]> {
  const { latitude, longitude, radius } = bboxToRadius(bbox);

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
    status: "Active",
    limit: "500",
  });

  if (filters?.homeType?.length) {
    const types = filters.homeType
      .map((t) => RENTCAST_PROPERTY_TYPE[t])
      .filter(Boolean);
    if (types.length) params.set("propertyType", types.join(","));
  }

  const res = await fetchWithRetry(`${BASE_URL}/listings/sale?${params}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Rentcast API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getListingById(id: string): Promise<RentcastListing> {
  const res = await fetchWithRetry(
    `${BASE_URL}/listings/sale/${encodeURIComponent(id)}`,
    { headers: getHeaders() }
  );

  if (!res.ok) {
    throw new Error(`Rentcast API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function lookupProperty(address: string): Promise<RentcastProperty> {
  const params = new URLSearchParams({ address });
  const res = await fetchWithRetry(`${BASE_URL}/properties?${params}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Rentcast API error: ${res.status} ${res.statusText}`);
  }

  // /v1/properties returns an array; we take the first match
  const data = await res.json();
  const property = Array.isArray(data) ? data[0] : data;
  if (!property) throw new Error("Property not found");
  return property;
}
