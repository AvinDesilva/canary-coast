export type AqiBucket = "Good" | "Moderate" | "Unhealthy for Sensitive Groups" | "Unhealthy" | "Very Unhealthy" | "Hazardous";

export interface AirQualityReading {
  aqi: number;
  bucket: AqiBucket;
  description: string;
  pm25_corrected: number;
  pm25_raw: number;
  humidity: number;
  sensor_name: string;
  sensor_distance_mi: number;
  fetched_at: string;
}

export interface PurpleAirSensorsResponse {
  api_version: string;
  time_stamp: number;
  data_time_stamp: number;
  fields: string[];
  data: (string | number | null)[][];
}
