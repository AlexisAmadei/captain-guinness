import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type Scope = "all" | "mine";

type RatingRow = {
  id: string;
  user_id: string;
  rating: number;
  taste_rating: number | null;
  foam_rating: number | null;
  temperature_rating: number | null;
  presentation_rating: number | null;
  value_for_money_rating: number | null;
  bar_name: string | null;
  latitude: number;
  longitude: number;
  place_id: string | null;
  created_at: string | null;
};

type CategoryAverages = {
  taste: number | null;
  foam: number | null;
  temperature: number | null;
  presentation: number | null;
  valueForMoney: number | null;
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
  categoryAverages: CategoryAverages;
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
      .select("id,user_id,rating,taste_rating,foam_rating,temperature_rating,presentation_rating,value_for_money_rating,bar_name,latitude,longitude,place_id,created_at")
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

    type CategoryKey = 'taste' | 'foam' | 'temperature' | 'presentation' | 'valueForMoney';
    type GroupEntry = {
      id: string;
      placeId: string | null;
      barName: string | null;
      latitude: number;
      longitude: number;
      sum: number;
      count: number;
      lastRatedAt: string | null;
      catSum: Record<CategoryKey, number>;
      catCount: Record<CategoryKey, number>;
    };

    const CATEGORY_COLS: Array<[CategoryKey, keyof RatingRow]> = [
      ['taste', 'taste_rating'],
      ['foam', 'foam_rating'],
      ['temperature', 'temperature_rating'],
      ['presentation', 'presentation_rating'],
      ['valueForMoney', 'value_for_money_rating'],
    ];

    const grouped = new Map<string, GroupEntry>();

    for (const row of ratings) {
      const key = getGroupKey(row);
      const current = grouped.get(key);

      if (!current) {
        const catSum = {} as Record<CategoryKey, number>;
        const catCount = {} as Record<CategoryKey, number>;
        for (const [cat, col] of CATEGORY_COLS) {
          const v = row[col] as number | null;
          catSum[cat] = v ?? 0;
          catCount[cat] = v != null ? 1 : 0;
        }
        grouped.set(key, {
          id: key,
          placeId: row.place_id,
          barName: row.bar_name,
          latitude: row.latitude,
          longitude: row.longitude,
          sum: row.rating,
          count: 1,
          lastRatedAt: row.created_at,
          catSum,
          catCount,
        });
        continue;
      }

      const nextCount = current.count + 1;
      current.latitude = (current.latitude * current.count + row.latitude) / nextCount;
      current.longitude = (current.longitude * current.count + row.longitude) / nextCount;
      current.sum += row.rating;
      current.count = nextCount;

      for (const [cat, col] of CATEGORY_COLS) {
        const v = row[col] as number | null;
        if (v != null) {
          current.catSum[cat] += v;
          current.catCount[cat] += 1;
        }
      }

      if (!current.barName && row.bar_name) {
        current.barName = row.bar_name;
      }

      if (row.created_at && (!current.lastRatedAt || row.created_at > current.lastRatedAt)) {
        current.lastRatedAt = row.created_at;
      }
    }

    const points: MapPoint[] = Array.from(grouped.values()).map((point) => {
      const categoryAverages: CategoryAverages = {
        taste: point.catCount.taste > 0 ? Number((point.catSum.taste / point.catCount.taste).toFixed(2)) : null,
        foam: point.catCount.foam > 0 ? Number((point.catSum.foam / point.catCount.foam).toFixed(2)) : null,
        temperature: point.catCount.temperature > 0 ? Number((point.catSum.temperature / point.catCount.temperature).toFixed(2)) : null,
        presentation: point.catCount.presentation > 0 ? Number((point.catSum.presentation / point.catCount.presentation).toFixed(2)) : null,
        valueForMoney: point.catCount.valueForMoney > 0 ? Number((point.catSum.valueForMoney / point.catCount.valueForMoney).toFixed(2)) : null,
      };
      return {
        id: point.id,
        placeId: point.placeId,
        barName: point.barName,
        name: point.barName ?? (point.placeId ? `Lieu ${point.placeId}` : "Lieu sans identifiant"),
        latitude: point.latitude,
        longitude: point.longitude,
        averageRating: Number((point.sum / point.count).toFixed(2)),
        ratingCount: point.count,
        lastRatedAt: point.lastRatedAt,
        categoryAverages,
      };
    });

    return NextResponse.json({ points, scope, isAuthenticated: Boolean(user) });
  } catch (error) {
    console.error("Map ratings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
