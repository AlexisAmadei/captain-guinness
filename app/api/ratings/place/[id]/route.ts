import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
  notes: string | null;
  photo_url: string | null;
  pint_price: number | null;
  created_at: string | null;
  latitude: number;
  longitude: number;
  place_id: string | null;
};

type CatKey = "taste" | "foam" | "temperature" | "presentation" | "valueForMoney";

const CATS: Array<[CatKey, keyof RatingRow]> = [
  ["taste", "taste_rating"],
  ["foam", "foam_rating"],
  ["temperature", "temperature_rating"],
  ["presentation", "presentation_rating"],
  ["valueForMoney", "value_for_money_rating"],
];

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/ratings/place/[id]">) {
  const { id } = await ctx.params;

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
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("ratings")
    .select(
      "id,user_id,rating,taste_rating,foam_rating,temperature_rating,presentation_rating,value_for_money_rating,bar_name,notes,photo_url,pint_price,created_at,latitude,longitude,place_id",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (id.startsWith("coord:")) {
    const parts = id.split(":");
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: "Invalid coordinate key" }, { status: 400 });
    }
    const delta = 0.001;
    query = query
      .gte("latitude", lat - delta)
      .lte("latitude", lat + delta)
      .gte("longitude", lng - delta)
      .lte("longitude", lng + delta)
      .is("place_id", null);
  } else {
    query = query.eq("place_id", id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Place ratings API error:", error);
    return NextResponse.json({ error: "Failed to load ratings" }, { status: 500 });
  }

  const rows = (data ?? []) as RatingRow[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalRating = rows.reduce((s, r) => s + r.rating, 0);

  const catSum = {} as Record<CatKey, number>;
  const catCount = {} as Record<CatKey, number>;
  for (const [cat] of CATS) {
    catSum[cat] = 0;
    catCount[cat] = 0;
  }
  for (const row of rows) {
    for (const [cat, col] of CATS) {
      const v = row[col] as number | null;
      if (v != null) {
        catSum[cat] += v;
        catCount[cat]++;
      }
    }
  }

  const categoryAverages = Object.fromEntries(
    CATS.map(([cat]) => [
      cat,
      catCount[cat] > 0 ? Number((catSum[cat] / catCount[cat]).toFixed(2)) : null,
    ]),
  ) as Record<CatKey, number | null>;

  const totalLat = rows.reduce((s, r) => s + r.latitude, 0);
  const totalLng = rows.reduce((s, r) => s + r.longitude, 0);
  const name = rows.find((r) => r.bar_name)?.bar_name ?? "Lieu sans nom";

  // Fetch reviewer display names (requires the public profile read policy)
  const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", uniqueUserIds);

  if (profileError) {
    console.error("Profiles fetch error:", profileError);
  }

  const profileMap = new Map<string, string | null>(
    (profileData ?? []).map((p: { id: string; full_name: string | null }) => [
      p.id,
      p.full_name?.trim() || null,
    ]),
  );

  return NextResponse.json({
    placeId: id,
    name,
    averageRating: Number((totalRating / rows.length).toFixed(2)),
    ratingCount: rows.length,
    latitude: totalLat / rows.length,
    longitude: totalLng / rows.length,
    categoryAverages,
    ratings: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      tasteRating: r.taste_rating,
      foamRating: r.foam_rating,
      temperatureRating: r.temperature_rating,
      presentationRating: r.presentation_rating,
      valueForMoneyRating: r.value_for_money_rating,
      notes: r.notes,
      photoUrl: r.photo_url,
      pintPrice: r.pint_price,
      createdAt: r.created_at,
      reviewerName: profileMap.get(r.user_id) ?? null,
      userId: r.user_id,
    })),
  });
}
