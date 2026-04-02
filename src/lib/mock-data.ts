import type { CachedListing } from "@/types/listing";
import type { ZipCancerRecord } from "@/types/safety";

const now = new Date().toISOString();
const exp = new Date(Date.now() + 86400000 * 7).toISOString();

function listing(
  id: string,
  address: string,
  zipcode: string,
  lat: number,
  lng: number,
  price: number,
  beds: number,
  baths: number,
  sqft: number,
  lotSqft: number,
  yearBuilt: number,
  homeType: "SINGLE_FAMILY" | "CONDO" | "TOWNHOUSE" | "MULTI_FAMILY",
  listingType: string,
  dom: number,
  listedDate: string,
  geoid: string,
  sir: number,
  floodZone: string,
  floodRisk: "minimal" | "moderate" | "high" | "very_high",
  safetyScore: number
): CachedListing {
  return {
    id,
    external_id: `${address.replace(/\s+/g, "-")}-${zipcode}`,
    address,
    city: "Houston",
    state: "TX",
    zipcode,
    county: "Harris",
    latitude: lat,
    longitude: lng,
    price,
    bedrooms: beds,
    bathrooms: baths,
    sqft,
    lot_sqft: lotSqft,
    year_built: yearBuilt,
    home_type: homeType,
    listing_status: "FOR_SALE",
    listing_type: listingType,
    days_on_market: dom,
    listed_date: listedDate,
    mls_name: "HAR",
    listing_agent_name: null,
    listing_office_name: null,
    cancer_tract_geoid: geoid,
    cancer_sir: sir,
    flood_zone_code: floodZone,
    flood_risk_level: floodRisk,
    safety_score: safetyScore,
    fetched_at: now,
    expires_at: exp,
  };
}

export const MOCK_LISTINGS: CachedListing[] = [
  // ── Montrose / Midtown ─────────────────────────────────────────────────────
  listing("1", "4102 Montrose Blvd", "77006", 29.7355, -95.3908, 485000, 3, 2.5, 2100, 4500, 2018, "SINGLE_FAMILY", "Standard", 14, "2026-03-18T00:00:00Z", "48201311100", 0.72, "X", "minimal", 89),
  listing("2", "1815 Westheimer Rd", "77098", 29.7421, -95.4035, 325000, 2, 2, 1450, 2800, 2015, "CONDO", "Standard", 28, "2026-03-04T00:00:00Z", "48201311200", 0.85, "X", "minimal", 84),
  listing("3", "405 Harold St", "77006", 29.7382, -95.3851, 589000, 3, 3.5, 2450, 3100, 2022, "TOWNHOUSE", "Standard", 6, "2026-03-26T00:00:00Z", "48201311100", 0.72, "X", "minimal", 89),
  listing("4", "510 Lovett Blvd", "77006", 29.7410, -95.3880, 710000, 4, 4, 3200, 4800, 2020, "SINGLE_FAMILY", "Standard", 3, "2026-03-29T00:00:00Z", "48201311100", 0.70, "X", "minimal", 91),

  // ── Heights ────────────────────────────────────────────────────────────────
  listing("5", "1200 Heights Blvd", "77008", 29.7902, -95.3965, 575000, 4, 3.5, 3200, 5500, 2019, "SINGLE_FAMILY", "Standard", 11, "2026-03-21T00:00:00Z", "48201311900", 0.68, "X", "minimal", 91),
  listing("6", "714 E 11th St", "77008", 29.7875, -95.3891, 498000, 3, 2.5, 2200, 4200, 2017, "SINGLE_FAMILY", "Standard", 22, "2026-03-10T00:00:00Z", "48201311900", 0.68, "X", "minimal", 91),
  listing("7", "1520 Harvard St", "77008", 29.7920, -95.3981, 620000, 4, 3, 2800, 5000, 2021, "SINGLE_FAMILY", "Standard", 8, "2026-03-24T00:00:00Z", "48201311900", 0.65, "X", "minimal", 93),
  listing("8", "312 W 18th St", "77008", 29.7951, -95.4022, 385000, 3, 2, 1750, 4600, 2004, "SINGLE_FAMILY", "Standard", 35, "2026-02-25T00:00:00Z", "48201311900", 0.68, "X", "minimal", 91),

  // ── River Oaks / Upper Kirby ───────────────────────────────────────────────
  listing("9", "3400 W Dallas St", "77019", 29.7585, -95.3938, 520000, 2, 2.5, 1900, 2200, 2020, "CONDO", "Standard", 21, "2026-03-11T00:00:00Z", "48201310400", 0.78, "X", "moderate", 65),
  listing("10", "5200 Brownway St", "77056", 29.7389, -95.4621, 650000, 3, 3, 2800, 3200, 2021, "TOWNHOUSE", "New Construction", 7, "2026-03-25T00:00:00Z", "48201321500", 0.65, "X", "minimal", 93),
  listing("11", "2100 Westcreek Ln", "77027", 29.7501, -95.4318, 895000, 4, 4, 3800, 6200, 2016, "SINGLE_FAMILY", "Standard", 18, "2026-03-14T00:00:00Z", "48201310500", 0.62, "X", "minimal", 94),
  listing("12", "3820 Briar Rose Ln", "77027", 29.7478, -95.4275, 1150000, 5, 5, 4500, 7800, 2019, "SINGLE_FAMILY", "Standard", 4, "2026-03-28T00:00:00Z", "48201310500", 0.60, "X", "minimal", 96),

  // ── Medical Center / Greenway Plaza ───────────────────────────────────────
  listing("13", "2215 Bellefontaine St", "77030", 29.7058, -95.4023, 395000, 3, 2, 1850, 5100, 1960, "SINGLE_FAMILY", "Standard", 19, "2026-03-13T00:00:00Z", "48201330200", 0.91, "X", "minimal", 78),
  listing("14", "7500 Cambridge St", "77054", 29.6985, -95.4151, 285000, 2, 2, 1350, 3800, 1998, "CONDO", "Standard", 41, "2026-02-19T00:00:00Z", "48201330300", 0.95, "X", "moderate", 62),
  listing("15", "1850 Old Main St", "77030", 29.7102, -95.3995, 450000, 3, 2.5, 2050, 4400, 2014, "TOWNHOUSE", "Standard", 12, "2026-03-20T00:00:00Z", "48201330200", 0.91, "X", "minimal", 78),

  // ── Energy Corridor / Memorial ─────────────────────────────────────────────
  listing("16", "15800 Memorial Dr", "77079", 29.7721, -95.6153, 425000, 4, 2.5, 2650, 9200, 1992, "SINGLE_FAMILY", "Standard", 5, "2026-03-27T00:00:00Z", "48201520200", 0.55, "X", "minimal", 97),
  listing("17", "14520 Perthshire Rd", "77079", 29.7695, -95.6041, 389000, 4, 2, 2400, 8500, 1988, "SINGLE_FAMILY", "Standard", 16, "2026-03-16T00:00:00Z", "48201520200", 0.55, "X", "minimal", 97),
  listing("18", "12850 Briar Forest Dr", "77077", 29.7612, -95.5885, 340000, 3, 2, 2000, 7200, 1985, "SINGLE_FAMILY", "Standard", 29, "2026-03-03T00:00:00Z", "48201520100", 0.58, "X", "minimal", 95),
  listing("19", "11200 Westheimer Rd", "77042", 29.7528, -95.5618, 265000, 2, 2, 1180, 2100, 2008, "CONDO", "Standard", 38, "2026-02-22T00:00:00Z", "48201430200", 0.82, "X", "moderate", 63),

  // ── Katy / West Houston ────────────────────────────────────────────────────
  listing("20", "22100 Westheimer Pkwy", "77450", 29.7408, -95.7582, 380000, 4, 3, 2550, 6800, 2010, "SINGLE_FAMILY", "Standard", 24, "2026-03-08T00:00:00Z", "48201620100", 0.51, "X", "minimal", 98),
  listing("21", "1250 Pin Oak Rd", "77494", 29.7318, -95.8021, 425000, 4, 3.5, 2850, 7500, 2015, "SINGLE_FAMILY", "Standard", 10, "2026-03-22T00:00:00Z", "48201620200", 0.49, "X", "minimal", 99),

  // ── Meyerland (flood-prone) ────────────────────────────────────────────────
  listing("22", "9710 Meyerland Ct", "77096", 29.6835, -95.4382, 289000, 4, 2, 2400, 8200, 1972, "SINGLE_FAMILY", "Standard", 45, "2026-02-15T00:00:00Z", "48201342200", 1.35, "AE", "high", 24),
  listing("23", "5502 Jackwood St", "77096", 29.6861, -95.4445, 245000, 3, 2, 1950, 7800, 1969, "SINGLE_FAMILY", "Standard", 72, "2026-01-20T00:00:00Z", "48201342200", 1.35, "AE", "high", 24),
  listing("24", "9202 Braesheather Dr", "77071", 29.6792, -95.4512, 195000, 3, 1, 1600, 7400, 1965, "SINGLE_FAMILY", "Standard", 88, "2026-01-04T00:00:00Z", "48201342300", 1.42, "AE", "high", 18),
  listing("25", "4910 Bellaire Blvd", "77401", 29.7051, -95.4578, 319000, 3, 2, 1800, 6200, 1978, "SINGLE_FAMILY", "Standard", 52, "2026-02-08T00:00:00Z", "48201342100", 1.28, "AE", "high", 28),

  // ── Greenspoint / North Houston (high cancer SIR) ─────────────────────────
  listing("26", "12400 N Freeway", "77060", 29.8742, -95.3950, 185000, 3, 1.5, 1200, 5800, 1985, "SINGLE_FAMILY", "Standard", 62, "2026-01-30T00:00:00Z", "48201252100", 1.65, "AE", "high", 12),
  listing("27", "535 W Greens Rd", "77067", 29.8905, -95.4218, 159000, 3, 2, 1450, 6200, 1982, "SINGLE_FAMILY", "Standard", 78, "2026-01-14T00:00:00Z", "48201252200", 1.71, "AE", "high", 9),
  listing("28", "11800 Aldine Westfield Rd", "77093", 29.9012, -95.3681, 142000, 4, 2, 1650, 7100, 1978, "SINGLE_FAMILY", "Standard", 95, "2025-12-28T00:00:00Z", "48201252300", 1.58, "X", "moderate", 31),
  listing("29", "8200 Antoine Dr", "77088", 29.8641, -95.4502, 178000, 3, 1.5, 1380, 5900, 1980, "SINGLE_FAMILY", "Standard", 55, "2026-02-05T00:00:00Z", "48201251800", 1.48, "X", "moderate", 35),

  // ── Spring Branch ──────────────────────────────────────────────────────────
  listing("30", "8702 Kempwood Dr", "77080", 29.8161, -95.5248, 215000, 3, 2, 1680, 6400, 1978, "SINGLE_FAMILY", "Standard", 33, "2026-02-27T00:00:00Z", "48201230100", 1.12, "X", "moderate", 51),
  listing("31", "9400 Long Point Rd", "77055", 29.8095, -95.4935, 248000, 3, 2, 1750, 5800, 1975, "SINGLE_FAMILY", "Standard", 27, "2026-03-05T00:00:00Z", "48201230200", 1.08, "X", "moderate", 54),
  listing("32", "1620 Silber Rd", "77055", 29.7998, -95.4881, 198000, 2, 1, 1100, 5200, 1968, "SINGLE_FAMILY", "Standard", 47, "2026-02-13T00:00:00Z", "48201230200", 1.08, "X", "moderate", 54),

  // ── Gulfton / Sharpstown ───────────────────────────────────────────────────
  listing("33", "6300 Ranchester Dr", "77036", 29.7015, -95.5125, 175000, 2, 1, 950, 3200, 1970, "CONDO", "Standard", 58, "2026-02-03T00:00:00Z", "48201340500", 1.48, "AE", "high", 15),
  listing("34", "7102 Clarewood Dr", "77036", 29.6975, -95.5012, 162000, 2, 1, 1050, 3800, 1972, "SINGLE_FAMILY", "Standard", 68, "2026-01-24T00:00:00Z", "48201340500", 1.48, "AE", "high", 15),
  listing("35", "5900 Corporate Dr", "77036", 29.6938, -95.5198, 145000, 1, 1, 720, 1800, 1985, "CONDO", "Standard", 82, "2026-01-10T00:00:00Z", "48201340600", 1.52, "AE", "high", 11),

  // ── Pearland / South Houston ───────────────────────────────────────────────
  listing("36", "4500 Griggs Rd", "77021", 29.7118, -95.3435, 210000, 3, 1, 1100, 6800, 1955, "SINGLE_FAMILY", "Standard", 40, "2026-02-21T00:00:00Z", "48201330800", 1.28, "X", "moderate", 38),
  listing("37", "8800 S Main St", "77025", 29.6742, -95.4018, 265000, 3, 2, 1650, 5900, 1965, "SINGLE_FAMILY", "Standard", 36, "2026-02-25T00:00:00Z", "48201340100", 1.15, "X", "minimal", 58),
  listing("38", "9215 Almeda Rd", "77054", 29.6685, -95.4102, 189000, 3, 1.5, 1420, 6100, 1972, "SINGLE_FAMILY", "Standard", 61, "2026-01-31T00:00:00Z", "48201340200", 1.22, "X", "moderate", 44),

  // ── Kingwood / Northeast ───────────────────────────────────────────────────
  listing("39", "4500 Hamblen Rd", "77339", 29.9981, -95.1965, 320000, 4, 2.5, 2350, 8100, 2005, "SINGLE_FAMILY", "Standard", 15, "2026-03-17T00:00:00Z", "48201570100", 0.61, "X", "minimal", 94),
  listing("40", "22800 Timber Cove Dr", "77339", 29.9912, -95.1821, 285000, 3, 2, 1980, 7500, 2001, "SINGLE_FAMILY", "Standard", 26, "2026-03-06T00:00:00Z", "48201570100", 0.61, "X", "minimal", 94),

  // ── Humble / IAH area ─────────────────────────────────────────────────────
  listing("41", "19500 W Lake Houston Pkwy", "77346", 29.9658, -95.2142, 298000, 4, 2.5, 2200, 7200, 2008, "SINGLE_FAMILY", "Standard", 20, "2026-03-12T00:00:00Z", "48201570200", 0.64, "X", "minimal", 93),

  // ── Pasadena / Baytown (industrial/high risk) ──────────────────────────────
  listing("42", "1400 Burke Rd", "77506", 29.6892, -95.2018, 148000, 3, 1, 1250, 6500, 1962, "SINGLE_FAMILY", "Standard", 74, "2026-01-18T00:00:00Z", "48201461100", 1.72, "X", "moderate", 22),
  listing("43", "4800 Fairmont Pkwy", "77504", 29.6718, -95.1751, 162000, 3, 2, 1380, 6200, 1975, "SINGLE_FAMILY", "Standard", 55, "2026-02-05T00:00:00Z", "48201461200", 1.68, "AE", "high", 8),
  listing("44", "2200 Red Bluff Rd", "77506", 29.6951, -95.1882, 135000, 2, 1, 1050, 5800, 1958, "SINGLE_FAMILY", "Standard", 91, "2026-01-01T00:00:00Z", "48201461100", 1.72, "AE", "high", 8),

  // ── Clear Lake / Nassau Bay ────────────────────────────────────────────────
  listing("45", "1502 Space Center Blvd", "77058", 29.5568, -95.0978, 385000, 4, 3, 2600, 8200, 2003, "SINGLE_FAMILY", "Standard", 9, "2026-03-23T00:00:00Z", "48201590100", 0.72, "X", "minimal", 88),
  listing("46", "818 El Lago Blvd", "77058", 29.5621, -95.0895, 425000, 4, 3.5, 2850, 9100, 2007, "SINGLE_FAMILY", "Standard", 13, "2026-03-19T00:00:00Z", "48201590100", 0.72, "X", "minimal", 88),
  listing("47", "2100 Marina Bay Dr", "77058", 29.5518, -95.0812, 495000, 3, 3, 2200, 4500, 2018, "TOWNHOUSE", "Standard", 18, "2026-03-14T00:00:00Z", "48201590200", 0.68, "X", "minimal", 91),

  // ── Stafford / Missouri City ───────────────────────────────────────────────
  listing("48", "12800 Murphy Rd", "77477", 29.6248, -95.5512, 275000, 4, 2, 2050, 7800, 1995, "SINGLE_FAMILY", "Standard", 32, "2026-02-28T00:00:00Z", "48201540100", 0.88, "X", "minimal", 81),
  listing("49", "5500 Sienna Pkwy", "77459", 29.5812, -95.5348, 415000, 4, 3.5, 2900, 8500, 2015, "SINGLE_FAMILY", "Standard", 7, "2026-03-25T00:00:00Z", "48201540200", 0.75, "X", "minimal", 87),
  listing("50", "3800 Cartwright Rd", "77459", 29.5921, -95.5418, 358000, 4, 3, 2450, 8000, 2012, "SINGLE_FAMILY", "Standard", 23, "2026-03-09T00:00:00Z", "48201540200", 0.75, "X", "minimal", 87),
];

export const MOCK_FLOOD_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // Meyerland / Brays Bayou corridor
    {
      type: "Feature",
      properties: { fld_zone: "AE", risk_level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.46, 29.67], [-95.42, 29.67], [-95.42, 29.70], [-95.46, 29.70], [-95.46, 29.67]]],
      },
    },
    // Greenspoint / Halls Bayou
    {
      type: "Feature",
      properties: { fld_zone: "AE", risk_level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.42, 29.86], [-95.38, 29.86], [-95.38, 29.89], [-95.42, 29.89], [-95.42, 29.86]]],
      },
    },
    // Gulfton
    {
      type: "Feature",
      properties: { fld_zone: "AE", risk_level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.53, 29.69], [-95.50, 29.69], [-95.50, 29.71], [-95.53, 29.71], [-95.53, 29.69]]],
      },
    },
    // Pasadena / Baytown
    {
      type: "Feature",
      properties: { fld_zone: "AE", risk_level: "high" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.20, 29.66], [-95.17, 29.66], [-95.17, 29.70], [-95.20, 29.70], [-95.20, 29.66]]],
      },
    },
    // Moderate — Greenway Plaza buffer
    {
      type: "Feature",
      properties: { fld_zone: "X", risk_level: "moderate" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.41, 29.74], [-95.38, 29.74], [-95.38, 29.77], [-95.41, 29.77], [-95.41, 29.74]]],
      },
    },
    // Moderate — Spring Branch
    {
      type: "Feature",
      properties: { fld_zone: "X", risk_level: "moderate" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.54, 29.80], [-95.49, 29.80], [-95.49, 29.83], [-95.54, 29.83], [-95.54, 29.80]]],
      },
    },
  ],
};

export const MOCK_CANCER_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // Montrose — low SIR
    {
      type: "Feature",
      properties: { geoid: "48201311100", cancer_sir_overall: 0.72, cancer_sir_brain: 0.68, cancer_sir_lung: 0.65, cancer_sir_breast: 0.78, cancer_sir_prostate: 0.71, cancer_sir_colon: 0.74 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.41, 29.72], [-95.38, 29.72], [-95.38, 29.75], [-95.41, 29.75], [-95.41, 29.72]]],
      },
    },
    // Meyerland — elevated SIR
    {
      type: "Feature",
      properties: { geoid: "48201342200", cancer_sir_overall: 1.35, cancer_sir_brain: 1.15, cancer_sir_lung: 1.52, cancer_sir_breast: 1.18, cancer_sir_prostate: 1.42, cancer_sir_colon: 1.31 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.46, 29.67], [-95.42, 29.67], [-95.42, 29.70], [-95.46, 29.70], [-95.46, 29.67]]],
      },
    },
    // Greenspoint — high SIR
    {
      type: "Feature",
      properties: { geoid: "48201252100", cancer_sir_overall: 1.65, cancer_sir_brain: 1.45, cancer_sir_lung: 1.88, cancer_sir_breast: 1.45, cancer_sir_prostate: 1.72, cancer_sir_colon: 1.58 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.42, 29.86], [-95.38, 29.86], [-95.38, 29.89], [-95.42, 29.89], [-95.42, 29.86]]],
      },
    },
    // River Oaks / Galleria — low SIR
    {
      type: "Feature",
      properties: { geoid: "48201321500", cancer_sir_overall: 0.65, cancer_sir_brain: 0.72, cancer_sir_lung: 0.58, cancer_sir_breast: 0.69, cancer_sir_prostate: 0.61, cancer_sir_colon: 0.70 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.48, 29.72], [-95.45, 29.72], [-95.45, 29.75], [-95.48, 29.75], [-95.48, 29.72]]],
      },
    },
    // Pasadena — high SIR
    {
      type: "Feature",
      properties: { geoid: "48201461100", cancer_sir_overall: 1.72, cancer_sir_brain: 1.38, cancer_sir_lung: 2.01, cancer_sir_breast: 1.55, cancer_sir_prostate: 1.68, cancer_sir_colon: 1.82 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.21, 29.65], [-95.17, 29.65], [-95.17, 29.70], [-95.21, 29.70], [-95.21, 29.65]]],
      },
    },
    // Energy Corridor / Memorial — very low SIR
    {
      type: "Feature",
      properties: { geoid: "48201520200", cancer_sir_overall: 0.55, cancer_sir_brain: 0.62, cancer_sir_lung: 0.48, cancer_sir_breast: 0.59, cancer_sir_prostate: 0.53, cancer_sir_colon: 0.57 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.65, 29.76], [-95.58, 29.76], [-95.58, 29.79], [-95.65, 29.79], [-95.65, 29.76]]],
      },
    },
    // Gulfton — high SIR
    {
      type: "Feature",
      properties: { geoid: "48201340500", cancer_sir_overall: 1.48, cancer_sir_brain: 1.22, cancer_sir_lung: 1.65, cancer_sir_breast: 1.38, cancer_sir_prostate: 1.55, cancer_sir_colon: 1.44 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.53, 29.69], [-95.50, 29.69], [-95.50, 29.71], [-95.53, 29.71], [-95.53, 29.69]]],
      },
    },
    // Spring Branch — moderate SIR
    {
      type: "Feature",
      properties: { geoid: "48201230100", cancer_sir_overall: 1.12, cancer_sir_brain: 0.98, cancer_sir_lung: 1.25, cancer_sir_breast: 1.08, cancer_sir_prostate: 1.18, cancer_sir_colon: 1.05 },
      geometry: {
        type: "Polygon",
        coordinates: [[[-95.54, 29.80], [-95.49, 29.80], [-95.49, 29.83], [-95.54, 29.83], [-95.54, 29.80]]],
      },
    },
  ],
};

export const MOCK_ZIP_CANCER_DATA: ZipCancerRecord[] = [
  { zip_code: "77006", cancer_type: "all", year_start: 2013, year_end: 2021, sir: 0.72, observed_cases: 145, expected_cases: 201, confidence_low: 0.61, confidence_high: 0.85 },
  { zip_code: "77006", cancer_type: "lung", year_start: 2013, year_end: 2021, sir: 0.68, observed_cases: 22, expected_cases: 32, confidence_low: 0.43, confidence_high: 1.03 },
  { zip_code: "77006", cancer_type: "breast", year_start: 2013, year_end: 2021, sir: 0.81, observed_cases: 38, expected_cases: 47, confidence_low: 0.57, confidence_high: 1.11 },
  { zip_code: "77006", cancer_type: "prostate", year_start: 2013, year_end: 2021, sir: 0.65, observed_cases: 28, expected_cases: 43, confidence_low: 0.43, confidence_high: 0.94 },
  { zip_code: "77006", cancer_type: "colon", year_start: 2013, year_end: 2021, sir: 0.79, observed_cases: 15, expected_cases: 19, confidence_low: 0.44, confidence_high: 1.30 },
  { zip_code: "77006", cancer_type: "brain", year_start: 2013, year_end: 2021, sir: 0.88, observed_cases: 8, expected_cases: 9, confidence_low: 0.38, confidence_high: 1.73 },
  { zip_code: "77096", cancer_type: "all", year_start: 2013, year_end: 2021, sir: 1.35, observed_cases: 312, expected_cases: 231, confidence_low: 1.20, confidence_high: 1.51 },
  { zip_code: "77096", cancer_type: "lung", year_start: 2013, year_end: 2021, sir: 1.52, observed_cases: 58, expected_cases: 38, confidence_low: 1.15, confidence_high: 1.96 },
  { zip_code: "77096", cancer_type: "breast", year_start: 2013, year_end: 2021, sir: 1.18, observed_cases: 65, expected_cases: 55, confidence_low: 0.91, confidence_high: 1.50 },
  { zip_code: "77096", cancer_type: "prostate", year_start: 2013, year_end: 2021, sir: 1.42, observed_cases: 72, expected_cases: 51, confidence_low: 1.11, confidence_high: 1.79 },
  { zip_code: "77096", cancer_type: "colon", year_start: 2013, year_end: 2021, sir: 1.31, observed_cases: 29, expected_cases: 22, confidence_low: 0.88, confidence_high: 1.88 },
  { zip_code: "77096", cancer_type: "brain", year_start: 2013, year_end: 2021, sir: 1.15, observed_cases: 12, expected_cases: 10, confidence_low: 0.59, confidence_high: 2.01 },
  { zip_code: "77060", cancer_type: "all", year_start: 2013, year_end: 2021, sir: 1.65, observed_cases: 420, expected_cases: 255, confidence_low: 1.50, confidence_high: 1.82 },
  { zip_code: "77060", cancer_type: "lung", year_start: 2013, year_end: 2021, sir: 1.88, observed_cases: 85, expected_cases: 45, confidence_low: 1.50, confidence_high: 2.33 },
  { zip_code: "77060", cancer_type: "breast", year_start: 2013, year_end: 2021, sir: 1.45, observed_cases: 78, expected_cases: 54, confidence_low: 1.15, confidence_high: 1.81 },
  { zip_code: "77060", cancer_type: "prostate", year_start: 2013, year_end: 2021, sir: 1.72, observed_cases: 92, expected_cases: 53, confidence_low: 1.39, confidence_high: 2.11 },
];
