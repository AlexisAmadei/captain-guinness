"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, Button } from "@chakra-ui/react";
import { LuTrash2 } from "react-icons/lu";

// ── Palette ────────────────────────────────────────────────────────────────
const T = {
  canvas:      "#f6f1e6",
  surface:     "rgba(255,255,255,0.76)",
  surfaceSolid:"#fffaf3",
  border:      "#e4d4bb",
  fg:          "#231608",
  muted:       "#7a6248",
  subtle:      "#9c7d5c",
  danger:      "#c23b39",
} as const;

// ── Tier helpers ──────────────────────────────────────────────────────────
function tierLetter(v: number) {
  if (v >= 4.5) return "S";
  if (v >= 4.0) return "A";
  if (v >= 3.0) return "B";
  if (v >= 2.0) return "C";
  return "D";
}

function tierColor(v: number) {
  if (v >= 4.5) return "#16a34a";
  if (v >= 4.0) return "#84cc16";
  if (v >= 3.0) return "#d4880e";
  if (v >= 2.0) return "#f97316";
  return "#ef4444";
}

function tierGrad(v: number) {
  if (v >= 4) return "linear-gradient(135deg,#16a34a,#0f766e)";
  if (v >= 3) return "linear-gradient(135deg,#a16207,#c2410c)";
  return "linear-gradient(135deg,#dc2626,#db2777)";
}

// ── Text helpers ───────────────────────────────────────────────────────────
function toInitials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function toHandle(name: string | null) {
  if (!name) return "captain_user";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
  const first = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const lastInitial = parts[parts.length - 1][0]?.toLowerCase() ?? "";
  return `${first}_${lastInitial}`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
}

// ── Types ─────────────────────────────────────────────────────────────────
type Review = {
  id: string;
  rating: number;
  placeId: string | null;
  barName: string | null;
  ratedAt: string | null;
};

type Stats = {
  totalRatings: number;
  avgRating: number | null;
  distinctPlaces: number;
  bestRating: number | null;
};

// ══════════════════════════════════════════════════════════════════════════
// Screen O · Profile — /settings/profile
// ══════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ totalRatings: 0, avgRating: null, distinctPlaces: 0, bestRating: null });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth/login"); return; }

        const [profileRes, ratingsRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).single(),
          supabase.from("ratings")
            .select("id, rating, place_id, bar_name, rated_at")
            .eq("user_id", user.id)
            .order("rated_at", { ascending: false }),
        ]);

        setFullName(profileRes.data?.full_name || user.email || null);

        const rows = ratingsRes.data ?? [];
        const total = rows.length;
        const avg = total ? rows.reduce((s, r) => s + Number(r.rating), 0) / total : null;
        const best = total ? Math.max(...rows.map((r) => Number(r.rating))) : null;
        const places = new Set(rows.map((r) => r.place_id).filter(Boolean)).size;

        setStats({ totalRatings: total, avgRating: avg, distinctPlaces: places, bestRating: best });
        setReviews(rows.map((r) => ({
          id: r.id,
          rating: Number(r.rating),
          placeId: r.place_id ?? null,
          barName: r.bar_name ?? null,
          ratedAt: r.rated_at ?? null,
        })));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );
      const { error } = await supabase.from("ratings").delete().eq("id", id);
      if (!error) {
        setReviews((prev) => {
          const next = prev.filter((r) => r.id !== id);
          const total = next.length;
          const avg = total ? next.reduce((s, r) => s + r.rating, 0) / total : null;
          const best = total ? Math.max(...next.map((r) => r.rating)) : null;
          const places = new Set(next.map((r) => r.placeId).filter(Boolean)).size;
          setStats({ totalRatings: total, avgRating: avg, distinctPlaces: places, bestRating: best });
          return next;
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const statItems = [
    { value: loading ? "–" : String(stats.totalRatings),                                                    label: "Avis",      color: T.fg },
    { value: loading ? "–" : String(stats.distinctPlaces),                                                  label: "Bars",      color: T.fg },
    { value: loading ? "–" : (stats.avgRating !== null ? stats.avgRating.toFixed(1) : "–"),                label: "Note moy.", color: "#d4880e" },
    { value: loading ? "–" : (stats.bestRating !== null ? tierLetter(stats.bestRating) : "–"),             label: "Meilleur",  color: stats.bestRating !== null ? tierColor(stats.bestRating) : T.muted },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: T.canvas, fontFamily: '"Geist", -apple-system, system-ui, sans-serif', color: T.fg }}>

      {/* ── App bar ── */}
      <div style={{
        position: "sticky", top: 0, height: 60, zIndex: 20,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        background: T.surface,
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${T.border}`, background: T.surfaceSolid,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(61,36,9,0.07)", cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <span style={{ flex: 1, fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>Profil</span>

        <Link href="/settings" style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${T.border}`, background: T.surfaceSolid,
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </Link>
      </div>

      {/* ── Avatar block ── */}
      <div style={{
        padding: "24px 20px 20px",
        display: "flex", flexDirection: "column", alignItems: "center",
        borderBottom: `1px solid ${T.border}`,
        background: T.surfaceSolid,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: "linear-gradient(135deg,#130b02,#1e1104)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 0 3px ${T.canvas}, 0 0 0 5px #16a34a55, 0 8px 28px rgba(0,0,0,0.20)`,
          marginBottom: 14,
        }}>
          <span style={{
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 28, fontWeight: 800, color: "#fdecc5", letterSpacing: -1,
          }}>{toInitials(fullName)}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.6, color: T.fg, marginBottom: 4, lineHeight: 1 }}>
          {loading ? "…" : (fullName || "Utilisateur")}
        </div>
        <div style={{ fontSize: 13, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>
          @{toHandle(fullName)}
        </div>
      </div>

      {/* ── Stats 2×2 grid ── */}
      <div style={{ margin: "14px 16px 0" }}>
        <div style={{
          background: T.surfaceSolid, border: `1px solid ${T.border}`,
          borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1fr",
          overflow: "hidden", boxShadow: "0 2px 10px rgba(61,36,9,0.05)",
        }}>
          {statItems.map((s, i) => {
            const isRight  = i % 2 === 1;
            const isBottom = i >= 2;
            return (
              <div key={i} style={{
                padding: "16px 18px",
                borderRight:  !isRight  ? `1px solid ${T.border}` : "none",
                borderBottom: !isBottom ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{
                  fontSize: 26, fontWeight: 800, letterSpacing: -1,
                  color: s.color, lineHeight: 1, marginBottom: 5,
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                }}>{s.value}</div>
                <div style={{
                  fontSize: 11, fontWeight: 500, color: T.muted, letterSpacing: 0.3,
                  textTransform: "uppercase", fontFamily: '"Geist Mono", ui-monospace, monospace',
                }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reviews list ── */}
      {!loading && reviews.length > 0 && (
        <>
          <div style={{
            padding: "16px 20px 6px",
            fontSize: 10.5, fontWeight: 600, letterSpacing: 0.8,
            fontFamily: '"Geist Mono", ui-monospace, monospace', textTransform: "uppercase",
            color: T.muted,
          }}>Mes avis · {reviews.length}</div>

          <div style={{
            margin: "0 16px",
            background: T.surfaceSolid, border: `1px solid ${T.border}`,
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 2px 10px rgba(61,36,9,0.05)",
          }}>
            {reviews.map((r, i) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 15px",
                borderBottom: i < reviews.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: tierGrad(r.rating), color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 12, fontWeight: 700, letterSpacing: -0.3,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
                }}>{r.rating.toFixed(1)}</div>

                <div
                  style={{ flex: 1, minWidth: 0, cursor: r.placeId ? "pointer" : "default" }}
                  onClick={() => r.placeId && router.push(`/pubs/${encodeURIComponent(r.placeId)}`)}
                >
                  <div style={{
                    fontSize: 13.5, fontWeight: 600, color: T.fg,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2,
                  }}>{r.barName ?? "Bar inconnu"}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>
                    {formatDate(r.ratedAt)}
                  </div>
                </div>

                <button
                  onClick={() => setPendingDeleteId(r.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                  <LuTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!loading && reviews.length === 0 && (
        <div style={{
          margin: "24px 16px", padding: "32px 24px", textAlign: "center",
          background: T.surfaceSolid, border: `1px solid ${T.border}`, borderRadius: 16,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍺</div>
          <div style={{ fontSize: 14, color: T.muted }}>Aucun avis pour le moment.</div>
        </div>
      )}

      <div style={{ height: 40 }} />

      {/* ── Delete review dialog ── */}
      <Dialog.Root
        open={pendingDeleteId !== null}
        onOpenChange={({ open }) => { if (!open) setPendingDeleteId(null); }}
        size="xs"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" mx={4}>
            <Dialog.Header px="5" pt="5" pb="2">
              <Dialog.Title fontSize="md">Supprimer cet avis ?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="5" pb="2">
              <p style={{ fontSize: 14, color: T.muted }}>Cette action est irréversible.</p>
            </Dialog.Body>
            <Dialog.Footer px="5" py="4" gap="2">
              <Button variant="outline" size="sm" borderRadius="full" onClick={() => setPendingDeleteId(null)}>
                Annuler
              </Button>
              <Button
                colorPalette="red" size="sm" borderRadius="full"
                loading={deletingId !== null}
                onClick={async () => {
                  if (!pendingDeleteId) return;
                  await handleDelete(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
              >
                Supprimer
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
