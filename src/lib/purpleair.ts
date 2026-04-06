import type { AirQualityReading, PurpleAirSensorsResponse } from "@/types/air-quality";
import { AQI_BREAKPOINTS, AQI_BUCKETS } from "./constants";
import { fetchWithRetry } from "./fetch-utils";

const API_KEY = process.env.PURPLEAIR_API_KEY;
const BASE_URL = "https://api.purpleair.com/v1";

function getHeaders() {
  if (!API_KEY) throw new Error("PURPLEAIR_API_KEY is not configured");
  return { "X-API-Key": API_KEY };
}

function buildBbox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
  return {
    nwlat: lat + latDelta,
    nwlng: lng - lngDelta,
    selat: lat - latDelta,
    selng: lng + lngDelta,
  };
}

interface ParsedSensor {
  sensor_index: number;
  pm25_cf1: number;
  pm25_1week: number | null;
  humidity: number;
  name: string;
  latitude: number;
  longitude: number;
}

function parseSensors(response: PurpleAirSensorsResponse): ParsedSensor[] {
  const idx = Object.fromEntries(response.fields.map((f, i) => [f, i]));
  return response.data
    .filter((row) => row[idx["pm2.5_cf_1"]] != null)
    .map((row) => ({
      sensor_index: Number(row[idx["sensor_index"]]),
      pm25_cf1: Number(row[idx["pm2.5_cf_1"]]),
      pm25_1week: row[idx["pm2.5_1week"]] != null ? Number(row[idx["pm2.5_1week"]]) : null,
      humidity: Number(row[idx["humidity"]] ?? 50),
      name: String(row[idx["name"]] ?? "Unknown Sensor"),
      latitude: Number(row[idx["latitude"]]),
      longitude: Number(row[idx["longitude"]]),
    }));
}

async function fetchNearestSensors(
  lat: number,
  lng: number,
  radiusMiles: number
): Promise<ParsedSensor[]> {
  const bbox = buildBbox(lat, lng, radiusMiles);
  const params = new URLSearchParams({
    fields: "sensor_index,pm2.5_cf_1,humidity,name,latitude,longitude",
    location_type: "0",
    nwlat: bbox.nwlat.toString(),
    nwlng: bbox.nwlng.toString(),
    selat: bbox.selat.toString(),
    selng: bbox.selng.toString(),
  });

  const res = await fetchWithRetry(`${BASE_URL}/sensors?${params}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`PurpleAir API error: ${res.status} ${res.statusText}`);
  }

  const data: PurpleAirSensorsResponse = await res.json();
  return parseSensors(data);
}

export function applyEPACorrection(pm25cf1: number, humidity: number): number {
  let corrected: number;
  if (pm25cf1 <= 343) {
    corrected = 0.524 * pm25cf1 - 0.0862 * humidity + 5.75;
  } else {
    corrected = 0.46 * pm25cf1 + 3.93e-4 * pm25cf1 ** 2 + 2.97;
  }
  return Math.max(0, corrected);
}

export function computeAQI(pm25: number): number {
  const bp = AQI_BREAKPOINTS.find(
    (b) => pm25 >= b.pmLo && pm25 <= b.pmHi
  ) ?? AQI_BREAKPOINTS[AQI_BREAKPOINTS.length - 1];

  return Math.round(
    ((bp.aqiHi - bp.aqiLo) / (bp.pmHi - bp.pmLo)) * (pm25 - bp.pmLo) + bp.aqiLo
  );
}

export function getAqiBucket(aqi: number) {
  return (
    AQI_BUCKETS.find((b) => aqi >= b.min && aqi <= b.max) ??
    AQI_BUCKETS[AQI_BUCKETS.length - 1]
  );
}

function haversineDistanceMi(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getSensorsForBbox(
  nwlat: number, nwlng: number,
  selat: number, selng: number
): Promise<GeoJSON.FeatureCollection> {
  const params = new URLSearchParams({
    fields: "sensor_index,pm2.5_cf_1,pm2.5_1week,humidity,name,latitude,longitude",
    location_type: "0",
    nwlat: nwlat.toString(),
    nwlng: nwlng.toString(),
    selat: selat.toString(),
    selng: selng.toString(),
  });

  const res = await fetchWithRetry(`${BASE_URL}/sensors?${params}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`PurpleAir API error: ${res.status} ${res.statusText}`);
  }

  const data: PurpleAirSensorsResponse = await res.json();
  const sensors = parseSensors(data);

  const features: GeoJSON.Feature[] = sensors.flatMap((s) => {
    const pm25_corrected = applyEPACorrection(s.pm25_cf1, s.humidity);
    const aqi = computeAQI(pm25_corrected);
    if (aqi === 0) return [];
    const { label: bucket, description } = getAqiBucket(aqi);
    const aqi_weekly = s.pm25_1week != null
      ? (() => { const v = computeAQI(applyEPACorrection(s.pm25_1week, s.humidity)); return v > 0 ? v : null; })()
      : null;
    return [{
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
      properties: {
        sensor_index: s.sensor_index,
        name: s.name,
        aqi,
        aqi_weekly,
        bucket,
        description,
        pm25_corrected: Math.round(pm25_corrected * 10) / 10,
        pm25_raw: Math.round(s.pm25_cf1 * 10) / 10,
        humidity: Math.round(s.humidity),
      },
    }];
  });

  return { type: "FeatureCollection", features };
}

// averageMinutes: 1440 (daily) for 1-month avg, 10080 (weekly) for 1-year avg
// windowSeconds: how far back to request data
export async function getSensorHistoryAvgAqi(
  sensorIndex: number,
  averageMinutes: number,
  windowSeconds: number
): Promise<number | null> {
  const endTs = Math.floor(Date.now() / 1000);
  const startTs = endTs - windowSeconds;
  const params = new URLSearchParams({
    start_timestamp: startTs.toString(),
    end_timestamp: endTs.toString(),
    average: averageMinutes.toString(),
    fields: "pm2.5_cf_1,humidity",
  });

  const res = await fetchWithRetry(
    `${BASE_URL}/sensors/${sensorIndex}/history?${params}`,
    { headers: getHeaders() }
  );

  if (!res.ok) {
    console.error(`PurpleAir history error: ${res.status} for sensor ${sensorIndex} avg=${averageMinutes}`);
    return null;
  }

  const data: { fields: string[]; data: (number | null)[][] } = await res.json();
  const idx = Object.fromEntries(data.fields.map((f, i) => [f, i]));
  const readings = data.data
    .filter((row) => row[idx["pm2.5_cf_1"]] != null)
    .map((row) => ({
      pm25cf1: Number(row[idx["pm2.5_cf_1"]]),
      humidity: Number(row[idx["humidity"]] ?? 50),
    }));

  console.log(`PurpleAir history: sensor ${sensorIndex} avg=${averageMinutes} rows=${readings.length}`);

  if (readings.length === 0) return null;

  const avgCorrected =
    readings.reduce((sum, r) => sum + applyEPACorrection(r.pm25cf1, r.humidity), 0) / readings.length;
  const aqi = computeAQI(avgCorrected);
  return aqi > 0 ? aqi : null;
}

export async function getAirQuality(
  lat: number,
  lng: number
): Promise<AirQualityReading | null> {
  let sensors = (await fetchNearestSensors(lat, lng, 1)).filter(
    (s) => computeAQI(applyEPACorrection(s.pm25_cf1, s.humidity)) > 0
  );

  if (sensors.length === 0) {
    sensors = (await fetchNearestSensors(lat, lng, 5)).filter(
      (s) => computeAQI(applyEPACorrection(s.pm25_cf1, s.humidity)) > 0
    );
  }

  if (sensors.length === 0) return null;

  const nearest = sensors.reduce((best, s) => {
    const d = haversineDistanceMi(lat, lng, s.latitude, s.longitude);
    const bestD = haversineDistanceMi(lat, lng, best.latitude, best.longitude);
    return d < bestD ? s : best;
  });

  const pm25_corrected = applyEPACorrection(nearest.pm25_cf1, nearest.humidity);
  const aqi = computeAQI(pm25_corrected);
  const { label: bucket, description } = getAqiBucket(aqi);

  return {
    aqi,
    bucket,
    description,
    pm25_corrected: Math.round(pm25_corrected * 10) / 10,
    pm25_raw: Math.round(nearest.pm25_cf1 * 10) / 10,
    humidity: Math.round(nearest.humidity),
    sensor_name: nearest.name,
    sensor_distance_mi:
      Math.round(haversineDistanceMi(lat, lng, nearest.latitude, nearest.longitude) * 10) / 10,
    fetched_at: new Date().toISOString(),
  };
}
