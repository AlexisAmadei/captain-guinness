import { NextRequest, NextResponse } from "next/server";

type MapboxFeature = {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  feature_type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    name: string;
    mapbox_id: string;
    feature_type: string;
    full_address?: string;
    place_formatted?: string;
    poi_category?: string[];
    poi_category_ids?: string[];
    coordinates?: {
      longitude: number;
      latitude: number;
    };
  };
};

type MapboxSearchResponse = {
  features: MapboxFeature[];
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseInt(searchParams.get("radius") || "500");

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 });
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Mapbox token not configured" }, { status: 500 });
    }

    const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/bar,pub,restaurant,cafe,night_club");
    url.searchParams.set("proximity", `${longitude},${latitude}`);
    url.searchParams.set("limit", "25");
    url.searchParams.set("language", "fr");
    url.searchParams.set("access_token", token);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data: MapboxSearchResponse = await response.json();

    const radiusMeters = radius;

    const places = (data.features ?? [])
      .map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const distance = calculateDistance(latitude, longitude, lat, lon);
        return {
          id: `mapbox:${feature.properties.mapbox_id}`,
          name: feature.properties.name,
          type: feature.properties.poi_category?.[0] ?? feature.properties.feature_type,
          lat,
          lon,
          distance,
        };
      })
      .filter((place) => place.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 25);

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json({ error: "Failed to fetch nearby places" }, { status: 500 });
  }
}
