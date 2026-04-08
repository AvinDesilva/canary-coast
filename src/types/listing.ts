export type ListingStatus = "FOR_SALE" | "PENDING" | "SOLD" | "UNLISTED";
export type HomeType = "SINGLE_FAMILY" | "CONDO" | "TOWNHOUSE" | "MULTI_FAMILY";
export type PriceFlag = "none" | "medium" | "high" | "critical";

export interface CachedListing {
  id: string;
  external_id: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  county: string | null;
  latitude: number;
  longitude: number;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_sqft: number | null;
  year_built: number | null;
  home_type: HomeType | null;
  listing_status: ListingStatus;
  listing_type: string | null;
  days_on_market: number | null;
  listed_date: string | null;
  mls_name: string | null;
  listing_agent_name: string | null;
  listing_office_name: string | null;
  cancer_tract_geoid: string | null;
  cancer_sir: number | null;
  flood_zone_code: string | null;
  flood_risk_level: string | null;
  safety_score: number | null;
  fetched_at: string;
  expires_at: string;
  prev_price: number | null;
  price_changed_at: string | null;
  price_drop_count: number;
  first_drop_at: string | null;
  cumulative_drop_pct: number;
  price_flag: PriceFlag;
}

export interface ListingFilters {
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  homeType?: HomeType[];
  safetyScoreMin?: number;
  sortBy?: "price_asc" | "price_desc" | "safety_desc" | "newest";
}
