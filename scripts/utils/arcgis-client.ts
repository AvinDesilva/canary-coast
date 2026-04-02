export interface ArcGISQueryOptions {
  serviceUrl: string;
  layerId: number;
  where?: string;
  outFields?: string;
  pageSize?: number;
  outSR?: number;
}

export async function queryArcGIS(
  options: ArcGISQueryOptions
): Promise<GeoJSON.FeatureCollection> {
  const {
    serviceUrl,
    layerId,
    where = "1=1",
    outFields = "*",
    pageSize = 2000,
    outSR,
  } = options;

  const allFeatures: GeoJSON.Feature[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      where,
      outFields,
      f: "geojson",
      resultRecordCount: String(pageSize),
      resultOffset: String(offset),
      returnGeometry: "true",
      ...(outSR ? { outSR: String(outSR) } : {}),
    });

    const url = `${serviceUrl}/${layerId}/query?${params}`;
    console.log(`Fetching: ${url} (offset=${offset})`);

    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`ArcGIS page failed (${res.status}) at offset=${offset} — stopping pagination with ${allFeatures.length} features so far`);
      hasMore = false;
      break;
    }

    const data = await res.json();

    if (data.features && data.features.length > 0) {
      allFeatures.push(...data.features);
      offset += data.features.length;

      // Check if there are more records
      if (
        data.exceededTransferLimit ||
        data.features.length === pageSize
      ) {
        hasMore = true;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Total features fetched: ${allFeatures.length}`);

  return {
    type: "FeatureCollection",
    features: allFeatures,
  };
}
