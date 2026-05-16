"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type CategoryAverages } from "@/lib/map/events";
import AddCircleButton from "./add-circle-button";
import AvisPill from "./avis-glass-pill";
import ReviewDrawer from "./review-drawer";

export type ReviewPoint = {
  id: string;
  placeId: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt: string | null;
  categoryAverages: CategoryAverages;
};

export type ReviewsMapResponse = {
  points?: ReviewPoint[];
  error?: string;
};

export type Scope = "all" | "mine";

async function loadReviews(scope: Scope, signal: AbortSignal): Promise<ReviewPoint[]> {
  const response = await fetch(`/api/ratings/map?scope=${scope}`, { signal });
  const payload: ReviewsMapResponse = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Impossible de charger les avis");
  return (payload.points ?? []).slice().sort((a, b) => {
    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
    if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
    return a.name.localeCompare(b.name);
  });
}

export function ReviewPill() {
  const router = useRouter();
  const [allReviews, setAllReviews] = useState<ReviewPoint[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("all");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      loadReviews("all", controller.signal),
      loadReviews("mine", controller.signal),
    ])
      .then(([all, mine]) => {
        if (controller.signal.aborted) return;
        setAllReviews(all);
        setMyReviews(mine);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const reviews = scope === "mine" ? myReviews : allReviews;

  const totalRatings = useMemo(
    () => allReviews.reduce((sum, r) => sum + r.ratingCount, 0),
    [allReviews],
  );

  const overallAverage = useMemo(() => {
    if (allReviews.length === 0) return null;
    const weighted = allReviews.reduce((sum, r) => sum + r.averageRating * r.ratingCount, 0);
    return weighted / totalRatings;
  }, [allReviews, totalRatings]);

  const myTotalRatings = useMemo(
    () => myReviews.reduce((sum, r) => sum + r.ratingCount, 0),
    [myReviews],
  );

  const subCount =
    scope === "mine"
      ? `${myReviews.length} lieu${myReviews.length !== 1 ? "x" : ""} · ${myTotalRatings} notes`
      : `${allReviews.length} lieu${allReviews.length !== 1 ? "x" : ""} · ${totalRatings} notes`;

  return (
    <>
      { }
      <div
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
          left: 16,
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          zIndex: 30,
          transform: entered ? "translateY(0)" : "translateY(24px)",
          opacity: entered ? 1 : 0,
          transition: "transform 400ms cubic-bezier(0.16,1,0.3,1), opacity 260ms ease",
        }}
      >
        <AddCircleButton />

        {/* Avis glass pill */}
        <AvisPill
          totalRatings={totalRatings}
          overallAverage={overallAverage}
          loading={loading}
          setIsOpen={setIsOpen}
        />
      </div>

      {/* ── Vaul bottom sheet ───────────────────────────────────────────── */}
      <ReviewDrawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        reviews={reviews}
        loading={loading}
        error={error}
        scope={scope}
        setScope={setScope}
        subCount={subCount}
      />
    </>
  );
}
