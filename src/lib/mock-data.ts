import type { CachedListing } from "@/types/listing";
import type { ZipCancerRecord } from "@/types/safety";
import type { AirQualityReading } from "@/types/air-quality";

import listingsData from "@/__fixtures__/mock-listings.json";
import floodGeoData from "@/__fixtures__/mock-flood-geojson.json";
import cancerGeoData from "@/__fixtures__/mock-cancer-geojson.json";
import facilitiesGeoData from "@/__fixtures__/mock-facilities-geojson.json";
import airQualityGeoData from "@/__fixtures__/mock-air-quality-geojson.json";
import airQualityData from "@/__fixtures__/mock-air-quality.json";
import zipCancerData from "@/__fixtures__/mock-zip-cancer-data.json";

export const MOCK_LISTINGS = listingsData as unknown as CachedListing[];
export const MOCK_FLOOD_GEOJSON = floodGeoData as unknown as GeoJSON.FeatureCollection;
export const MOCK_CANCER_GEOJSON = cancerGeoData as unknown as GeoJSON.FeatureCollection;
export const MOCK_FACILITIES_GEOJSON = facilitiesGeoData as unknown as GeoJSON.FeatureCollection;
export const MOCK_AIR_QUALITY_GEOJSON = airQualityGeoData as unknown as GeoJSON.FeatureCollection;
export const MOCK_AIR_QUALITY = airQualityData as unknown as AirQualityReading;
export const MOCK_ZIP_CANCER_DATA = zipCancerData as unknown as ZipCancerRecord[];
