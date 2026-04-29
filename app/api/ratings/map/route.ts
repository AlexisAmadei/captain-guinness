import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Scope = "all" | "mine";

type RatingRow = {
  id: string;
  user_id: string;
  rating: number;
  bar_name: string | null;
  latitude: number;
  longitude: number;
  place_id: string | null;
  created_at: string | null;
};

type MapPoint = {
  id: string;
  placeId: string | null;
  barName: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
};

function getScope(value: string | null): Scope {
  if (value === "mine") return "mine";
  return "all";
}

function getGroupKey(row: RatingRow) {
  if (row.place_id) {
    return row.place_id.startsWith("mapbox:") ? row.place_id : `place:${row.place_id}`;
  }

  return `coord:${row.latitude.toFixed(4)}:${row.longitude.toFixed(4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const scope = getScope(new URL(request.url).searchParams.get("scope"));

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (scope === "mine" && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("ratings")
      .select("id,user_id,rating,bar_name,latitude,longitude,place_id,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (scope === "mine" && user) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load map ratings:", error);
      return NextResponse.json({ error: "Failed to load ratings" }, { status: 500 });
    }

    const ratings = (data ?? []) as RatingRow[];
    const grouped = new Map<
      string,
      {
        id: string;
        placeId: string | null;
        barName: string | null;
        latitude: number;
        longitude: number;
        sum: number;
        count: number;
        lastRatedAt: string | null;
      }
    >();

    for (const row of ratings) {
      const key = getGroupKey(row);
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          id: key,
          placeId: row.place_id,
          barName: row.bar_name,
          latitude: row.latitude,
          longitude: row.longitude,
          sum: row.rating,
          count: 1,
          lastRatedAt: row.created_at,
        });
        continue;
      }

      const nextCount = current.count + 1;
      current.latitude = (current.latitude * current.count + row.latitude) / nextCount;
      current.longitude = (current.longitude * current.count + row.longitude) / nextCount;
      current.sum += row.rating;
      current.count = nextCount;

      if (!current.barName && row.bar_name) {
        current.barName = row.bar_name;
      }

      if (row.created_at && (!current.lastRatedAt || row.created_at > current.lastRatedAt)) {
        current.lastRatedAt = row.created_at;
      }
    }

    const points: MapPoint[] = Array.from(grouped.values()).map((point) => ({
      id: point.id,
      placeId: point.placeId,
      barName: point.barName,
      name: point.barName ?? (point.placeId ? `Lieu ${point.placeId}` : "Lieu sans identifiant"),
      latitude: point.latitude,
      longitude: point.longitude,
      averageRating: Number((point.sum / point.count).toFixed(2)),
      ratingCount: point.count,
      lastRatedAt: point.lastRatedAt,
    }));

    return NextResponse.json({ points, scope, isAuthenticated: Boolean(user) });
  } catch (error) {
    console.error("Map ratings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
