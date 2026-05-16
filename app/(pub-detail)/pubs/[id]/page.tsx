"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
// Unused Chakra imports removed — page uses inline styles with hardcoded light palette
import { LuArrowLeft, LuPenLine, LuPlus, LuChevronDown } from "react-icons/lu";

// ── Types ────────────────────────────────────────────────────────────────────

type CategoryAverages = {
  taste: number | null;
  foam: number | null;
  temperature: number | null;
  presentation: number | null;
  valueForMoney: number | null;
};

type RatingItem = {
  id: string;
  rating: number;
  tasteRating: number | null;
  foamRating: number | null;
  temperatureRating: number | null;
  presentationRating: number | null;
  valueForMoneyRating: number | null;
  notes: string | null;
  photoUrl: string | null;
  pintPrice: number | null;
  createdAt: string | null;
  reviewerName: string | null;
  userId: string;
};

type PlaceDetail = {
  placeId: string;
  name: string;
  averageRating: number;
  ratingCount: number;
  latitude: number;
  longitude: number;
  categoryAverages: CategoryAverages;
  ratings: RatingItem[];
};

// ── Light-mode palette (matches ReviewPill / BarCard hardcoded values) ────────

const T = {
  canvas: "#f6f1e6",
  surface: "rgba(255,255,255,0.76)",
  surfaceSolid: "#fffaf3",
  border: "#e4d4bb",
  fg: "#231608",
  muted: "#7a6248",
  subtle: "#9c7d5c",
};

// ── Tier helpers ─────────────────────────────────────────────────────────────

function tierColor(avg: number) {
  if (avg >= 4.5) return "#16a34a";
  if (avg >= 4.0) return "#84cc16";
  if (avg >= 3.0) return "#facc15";
  if (avg >= 2.0) return "#f97316";
  return "#ef4444";
}

function tierGrad(avg: number) {
  if (avg >= 4.0) return "linear-gradient(135deg,#16a34a,#0f766e)";
  if (avg >= 3.0) return "linear-gradient(135deg,#a16207,#c2410c)";
  if (avg >= 2.0) return "linear-gradient(135deg,#c2410c,#dc2626)";
  return "linear-gradient(135deg,#dc2626,#db2777)";
}

function tierLabel(avg: number) {
  if (avg >= 4.5) return "Tier S";
  if (avg >= 4.0) return "Tier A";
  if (avg >= 3.0) return "Tier B";
  if (avg >= 2.0) return "Tier C";
  return "Tier D";
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function formatRelative(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "il y a 1j";
  if (diffDays < 30) return `il y a ${diffDays}j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

function ScoreBadge({ avg, size = 58 }: { avg: number; size?: number }) {
  const radius = Math.round(size * 0.3);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tierGrad(avg),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontSize: size * 0.31,
        fontWeight: 700,
        letterSpacing: -0.5,
        flexShrink: 0,
        boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
      }}
    >
      {avg.toFixed(1)}
    </div>
  );
}

function Stars({ value, size = 12, accent }: { value: number; size?: number; accent: string }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  return (
    <span style={{ display: "inline-flex", gap: 1.5, fontSize: size }}>
      {Array.from({ length: 5 }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= full || (pos === full + 1 && half);
        return (
          <span key={i} style={{ color: filled ? accent : "#c8c0b0", lineHeight: 1 }}>
            ★
          </span>
        );
      })}
    </span>
  );
}

function PubAppBar({ name }: { name: string }) {
  const router = useRouter();
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 60,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        background: T.surface,
        backdropFilter: `blur(22px) saturate(150%)`,
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <button
        onClick={() => router.back()}
        aria-label="Retour"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          border: `1px solid ${T.border}`,
          background: T.surfaceSolid,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(61,36,9,0.07)",
          cursor: "pointer",
          color: T.fg,
        }}
      >
        <LuArrowLeft size={18} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: -0.4,
            color: T.fg,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {name || "Pub"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: T.muted,
            marginTop: 1,
            fontFamily: MONO,
          }}
        >
          Pub irlandais
        </div>
      </div>

      <div
        style={{
          width: 36,
          height: 36,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3.5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: T.muted,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function HeroCard({
  place,
  accent,
}: {
  place: PlaceDetail;
  accent: string;
}) {
  const lastDate = place.ratings[0]?.createdAt
    ? formatRelative(place.ratings[0].createdAt)
    : null;

  return (
    <div
      style={{
        margin: "14px 16px 0",
        background: T.surfaceSolid,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: "16px 16px 14px",
        boxShadow: "0 4px 24px rgba(61,36,9,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <ScoreBadge avg={place.averageRating} size={58} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: -0.6,
              color: T.fg,
              lineHeight: 1.15,
              marginBottom: 3,
            }}
          >
            {place.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Stars value={place.averageRating} size={13} accent={accent} />
            <span
              style={{
                fontSize: 11.5,
                color: T.muted,
                fontFamily: MONO,
              }}
            >
              {place.ratingCount} {place.ratingCount === 1 ? "avis" : "avis"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 11,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: tierColor(place.averageRating),
              boxShadow: `0 0 0 3px ${tierColor(place.averageRating)}28`,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: T.muted,
              fontFamily: MONO,
            }}
          >
            {lastDate ? `Dernière note · ${lastDate}` : "Aucune note récente"}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: tierColor(place.averageRating),
            fontFamily: MONO,
            background: `${tierColor(place.averageRating)}14`,
            border: `1px solid ${tierColor(place.averageRating)}30`,
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {tierLabel(place.averageRating)}
        </div>
      </div>
    </div>
  );
}

function CriteriaCard({
  categoryAverages,
  accent,
}: {
  categoryAverages: CategoryAverages;
  accent: string;
}) {
  const criteria: Array<[string, number]> = [
    ["Goût", categoryAverages.taste ?? 0],
    ["Mousse", categoryAverages.foam ?? 0],
    ["Température", categoryAverages.temperature ?? 0],
    ["Présentation", categoryAverages.presentation ?? 0],
    ["Rapport qualité-prix", categoryAverages.valueForMoney ?? 0],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;

  if (criteria.length === 0) return null;

  return (
    <div
      style={{
        margin: "10px 16px 0",
        background: T.surfaceSolid,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: "13px 15px",
        boxShadow: "0 2px 10px rgba(61,36,9,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: T.muted,
          letterSpacing: 0.8,
          fontFamily: MONO,
          marginBottom: 11,
          textTransform: "uppercase",
        }}
      >
        Notation détaillée
      </div>
      {criteria.map(([label, score], i) => (
        <div key={label} style={{ marginBottom: i < criteria.length - 1 ? 9 : 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                color: T.fg,
                fontWeight: 500,
              }}
            >
              {label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Stars value={score} size={9.5} accent={accent} />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: T.fg,
                  fontFamily: MONO,
                  minWidth: 26,
                  textAlign: "right",
                }}
              >
                {score.toFixed(1)}
              </span>
            </div>
          </div>
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: T.border,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                width: `${(score / 5) * 100}%`,
                background: tierColor(score),
                transition: "width 600ms ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewRow({
  review,
  isOwn,
  accent,
}: {
  review: RatingItem;
  isOwn: boolean;
  accent: string;
}) {
  const ownGreen = "#006b3c";
  const chips: Array<[string, number]> = [
    ["Goût", review.tasteRating ?? 0],
    ["Mousse", review.foamRating ?? 0],
    ["Temp.", review.temperatureRating ?? 0],
    ["Prés.", review.presentationRating ?? 0],
    ["Q/P", review.valueForMoneyRating ?? 0],
  ].filter(([, v]) => (v as number) > 0) as Array<[string, number]>;

  const initials = getInitials(review.reviewerName);
  const date = formatDate(review.createdAt);

  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            flexShrink: 0,
            background: isOwn ? `${ownGreen}1e` : T.border,
            border: isOwn
              ? `1.5px solid ${ownGreen}55`
              : `1.5px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: -0.3,
            color: isOwn ? ownGreen : T.muted,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 5,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.fg,
                }}
              >
                {review.reviewerName ?? "Anonyme"}
              </span>
              {isOwn && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: ownGreen,
                    background: `${ownGreen}18`,
                    border: `1px solid ${ownGreen}30`,
                    padding: "1px 6px",
                    borderRadius: 5,
                    fontFamily: MONO,
                  }}
                >
                  moi
                </span>
              )}
            </div>
            {date && (
              <span
                style={{
                  fontSize: 11,
                  color: T.muted,
                  fontFamily: MONO,
                }}
              >
                {date}
              </span>
            )}
          </div>

          {/* Score row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: chips.length > 0 ? 7 : 0,
            }}
          >
            <ScoreBadge avg={review.rating} size={26} />
            <Stars value={review.rating} size={10} accent={accent} />
            {review.pintPrice !== null && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: T.muted,
                  fontFamily: MONO,
                  background: "#ede0ca",
                  padding: "2px 7px",
                  borderRadius: 5,
                }}
              >
                {review.pintPrice.toFixed(2)} €
              </span>
            )}
          </div>

          {/* Criteria chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {chips.map(([label, score]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10.5,
                    fontFamily: MONO,
                    color: T.subtle,
                    background: T.canvas,
                    border: `1px solid ${T.border}`,
                    padding: "2px 7px",
                    borderRadius: 5,
                  }}
                >
                  {label}
                  <span style={{ color: accent, fontWeight: 700 }}>{score}★</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {review.notes && (
            <p
              style={{
                marginTop: 7,
                fontSize: 13,
                color: T.fg,
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              &ldquo;{review.notes}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyHeroCard({ name }: { name: string }) {
  return (
    <div
      style={{
        margin: "14px 16px 0",
        background: T.surfaceSolid,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: "16px 16px 14px",
        boxShadow: "0 4px 24px rgba(61,36,9,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 17,
            flexShrink: 0,
            border: `2px dashed ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 16,
              color: T.border,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            --
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: -0.6,
              color: T.fg,
              lineHeight: 1.15,
              marginBottom: 3,
            }}
          >
            {name}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 11,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke={T.muted}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
        <span
          style={{
            fontSize: 11,
            color: T.muted,
            fontFamily: MONO,
          }}
        >
          Aucune Guinness notée ici
        </span>
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <>
      <div
        style={{
          margin: "16px 16px 0",
          background: T.surfaceSolid,
          border: `1px dashed ${T.border}`,
          borderRadius: 18,
          padding: "36px 24px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            marginBottom: 18,
            background: "rgba(19,11,2,0.06)",
            border: `1.5px dashed ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <path
              d="M18 20 L46 20 L42 54 Q32 58 22 54 Z"
              fill="#130b02"
              opacity="0.12"
            />
            <path
              d="M18 20 Q22 14 26 16 Q29 11 32 15 Q35 11 38 16 Q42 14 46 20 Q42 24 32 24 Q22 24 18 20 Z"
              fill="#f4c05a"
              opacity="0.35"
            />
            <rect x="28" y="30" width="8" height="1.5" rx="0.75" fill="#7a6248" opacity="0.3" />
            <rect x="26" y="36" width="12" height="1.5" rx="0.75" fill="#7a6248" opacity="0.3" />
            <rect x="28" y="42" width="8" height="1.5" rx="0.75" fill="#7a6248" opacity="0.3" />
          </svg>
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: -0.5,
            color: T.fg,
            marginBottom: 8,
          }}
        >
          Première Guinness ici&nbsp;?
        </div>
        <div
          style={{
            fontSize: 13,
            color: T.muted,
            lineHeight: 1.55,
            maxWidth: 250,
          }}
        >
          Sois le premier à noter la Guinness de ce pub et aide la communauté Captain.
        </div>
      </div>

      <div
        style={{
          padding: "18px 16px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span
          style={{
            fontSize: 10.5,
            color: T.muted,
            fontFamily: MONO,
            textAlign: "center",
          }}
        >
          Notation détaillée disponible après la 1ʳᵉ note
        </span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
    </>
  );
}

function CtaFooter({ mode }: { mode: "add" | "edit" }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const bg = isEdit ? "#006b3c" : "#130b02";
  const fg = isEdit ? "#fff" : "#fff7e6";
  const label = isEdit ? "Modifier mon avis" : "Ajouter mon avis";

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
        background: T.surface,
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        borderTop: `1px solid ${T.border}`,
      }}
    >
      <button
        onClick={() => router.push("/rate")}
        style={{
          width: "100%",
          height: 50,
          borderRadius: 13,
          background: bg,
          border: "none",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: fg,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 20px rgba(15,23,42,0.22)",
        }}
      >
        {isEdit ? <LuPenLine size={16} /> : <LuPlus size={16} />}
        {label}
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: "14px 16px 0" }}>
      {[80, 60, 100, 70].map((w, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 80 : 16,
            width: `${w}%`,
            borderRadius: 8,
            background: T.border,
            marginBottom: 12,
            opacity: 0.5,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ── Inner page (uses hooks, must be inside Suspense) ─────────────────────────

function PubPageInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(String(params.id));
  const nameFromQuery = searchParams.get("name") ?? "";

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setIsEmpty(false);
        const res = await fetch(`/api/ratings/place/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        if (res.status === 404) {
          setIsEmpty(true);
          return;
        }
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de charger les avis");
        setPlace(payload as PlaceDetail);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  const accent = "#d4880e";

  const ownRating = place?.ratings.find((r) => r.userId === currentUserId) ?? null;
  const hasOwnRating = ownRating !== null;

  const sortedRatings = place
    ? hasOwnRating
      ? [ownRating!, ...place.ratings.filter((r) => r.userId !== currentUserId)]
      : place.ratings
    : [];

  const displayName = place?.name ?? nameFromQuery ?? "Pub";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: T.canvas,
        color: T.fg,
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <PubAppBar name={displayName} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p style={{ color: "#c23b39", fontSize: 14 }}>{error}</p>
            <button
              onClick={() => router.back()}
              style={{
                marginTop: 12,
                fontSize: 13,
                color: T.muted,
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retour
            </button>
          </div>
        ) : isEmpty ? (
          <>
            <EmptyHeroCard name={displayName} />
            <EmptyStateCard />
          </>
        ) : place ? (
          <>
            <HeroCard place={place} accent={accent} />
            <CriteriaCard categoryAverages={place.categoryAverages} accent={accent} />

            {/* Reviews section */}
            <div style={{ padding: "14px 16px 0" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15.5,
                    letterSpacing: -0.3,
                    color: T.fg,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  Avis
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11.5,
                      color: T.muted,
                      fontWeight: 400,
                    }}
                  >
                    · {place.ratingCount}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 11.5,
                    color: T.muted,
                    fontFamily: MONO,
                  }}
                >
                  Récents
                  <LuChevronDown size={12} />
                </div>
              </div>

              {sortedRatings.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  isOwn={r.userId === currentUserId}
                  accent={accent}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <CtaFooter mode={hasOwnRating ? "edit" : "add"} />
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function PubPage() {
  return (
    <Suspense>
      <PubPageInner />
    </Suspense>
  );
}
