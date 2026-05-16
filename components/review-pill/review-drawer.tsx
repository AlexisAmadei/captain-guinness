import { Drawer } from "vaul";
import { ReviewPoint, Scope } from "./ReviewPill";
import { VisuallyHidden } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FOCUS_MAP_POINT_EVENT, FocusMapPointDetail } from "@/lib/map/events";

export default function ReviewDrawer({
  isOpen,
  setIsOpen,
  reviews,
  loading,
  error,
  scope,
  setScope,
  subCount,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  reviews: ReviewPoint[];
  loading: boolean;
  error: string | null;
  scope: Scope;
  setScope: (scope: Scope) => void;
  subCount: string;
}) {
  const router = useRouter();

  function tierGrad(avg: number): string {
    if (avg >= 4.0) return "linear-gradient(135deg,#16a34a,#0f766e)";
    if (avg >= 3.0) return "linear-gradient(135deg,#a16207,#c2410c)";
    if (avg >= 2.0) return "linear-gradient(135deg,#c2410c,#dc2626)";
    return "linear-gradient(135deg,#dc2626,#db2777)";
  }

  function formatCount(count: number) {
    return count === 1 ? "1 avis" : `${count} avis`;
  }

  function formatLastRatedAt(value: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(parsed);
  }

  function StarRow({ value }: { value: number }) {
    const full = Math.floor(value);
    const half = value - full >= 0.25 && value - full < 0.75;
    return (
      <span style={{ display: "inline-flex", gap: 1.5, fontSize: 10 }}>
        {Array.from({ length: 5 }, (_, i) => {
          const pos = i + 1;
          const filled = pos <= full || (pos === full + 1 && half);
          return (
            <span key={i} style={{ color: filled ? "#d4880e" : "#c8c0b0", lineHeight: 1 }}>
              ★
            </span>
          );
        })}
      </span>
    );
  }

  function ScoreBadge({ avg, size = 36 }: { avg: number; size?: number }) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.33,
          background: tierGrad(avg),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Geist Mono",ui-monospace,monospace',
          fontSize: size * 0.32,
          fontWeight: 700,
          letterSpacing: -0.3,
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        {avg.toFixed(1)}
      </div>
    );
  }

  const focusPointOnMap = (review: ReviewPoint) => {
    const detail: FocusMapPointDetail = {
      id: review.id,
      name: review.name,
      latitude: review.latitude,
      longitude: review.longitude,
      averageRating: review.averageRating,
      ratingCount: review.ratingCount,
      categoryAverages: review.categoryAverages,
    };
    window.dispatchEvent(new CustomEvent(FOCUS_MAP_POINT_EVENT, { detail }));
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.30)",
            zIndex: 40,
          }}
        />
        <Drawer.Content
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fffaf3",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            boxShadow: "0 -16px 50px rgba(15,23,42,0.22)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "85dvh",
            outline: "none",
          }}
        >
          <VisuallyHidden>
            <Drawer.Title>Liste des avis</Drawer.Title>
          </VisuallyHidden>
          {/* Handle */}
          <div
            style={{
              paddingTop: 12,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Drawer.Handle
              style={{
                width: 40,
                height: 5,
                borderRadius: 3,
                background: "#c9a87a",
                opacity: 0.65,
                cursor: "grab",
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              padding: "10px 20px 0",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: -0.5,
                  color: "#231608",
                }}
              >
                Avis
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#7a6248",
                  marginTop: 2,
                  fontFamily: '"Geist Mono",ui-monospace,monospace',
                }}
              >
                {subCount}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                border: "1px solid #e4d4bb",
                background: "#fffaf3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                lineHeight: 1,
                color: "#7a6248",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {/* Scope toggle */}
          <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                padding: 3,
                background: "#f6f1e6",
                border: "1px solid #e4d4bb",
                borderRadius: 999,
              }}
            >
              {(["mine", "all"] as Scope[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setScope(v)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    textAlign: "center",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: v === scope ? 600 : 400,
                    background: v === scope ? "#130b02" : "transparent",
                    color: v === scope ? "#fff7e6" : "#7a6248",
                    boxShadow:
                      v === scope ? "0 2px 8px rgba(15,23,42,0.18)" : "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "background 200ms, color 200ms",
                  }}
                >
                  {v === "mine" ? "Mes notes" : "Toutes les notes"}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
            {loading ? (
              <div
                style={{
                  padding: "24px 0",
                  color: "#7a6248",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Chargement…
              </div>
            ) : error ? (
              <div style={{ padding: "16px 0", color: "#c23b39", fontSize: 13 }}>
                {error}
              </div>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  color: "#7a6248",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {scope === "mine"
                  ? "Tu n'as pas encore noté de pubs."
                  : "Aucun avis pour le moment."}
              </div>
            ) : (
              reviews.map((review, index) => {
                const date = formatLastRatedAt(review.lastRatedAt);
                return (
                  <div
                    key={review.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 0",
                      borderBottom:
                        index < reviews.length - 1
                          ? "1px solid #e4d4bb"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        textAlign: "right",
                        fontFamily: '"Geist Mono",ui-monospace,monospace',
                        fontSize: 11,
                        color: "#7a6248",
                        flexShrink: 0,
                      }}
                    >
                      #{index + 1}
                    </span>

                    <ScoreBadge avg={review.averageRating} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#231608",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {review.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 3,
                        }}
                      >
                        <StarRow value={review.averageRating} />
                        <span
                          style={{
                            fontSize: 11,
                            color: "#7a6248",
                            fontFamily: '"Geist Mono",ui-monospace,monospace',
                          }}
                        >
                          {formatCount(review.ratingCount)}
                          {date ? ` · ${date}` : ""}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {/* Locate on map */}
                      <button
                        onClick={() => {
                          focusPointOnMap(review);
                          setIsOpen(false);
                        }}
                        aria-label="Localiser sur la carte"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: "1px solid #e4d4bb",
                          background: "#fffaf3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#7a6248"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                      </button>
                      {/* See all reviews */}
                      <button
                        onClick={() =>
                          router.push(
                            `/pubs/${encodeURIComponent(review.placeId ?? review.id)}?name=${encodeURIComponent(review.name)}`,
                          )
                        }
                        aria-label="Voir les avis"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: "1px solid #e4d4bb",
                          background: "#fffaf3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#7a6248"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div
            style={{
              padding:
                "12px 20px calc(env(safe-area-inset-bottom, 0px) + 12px)",
              borderTop: "1px solid #e4d4bb",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/rate");
              }}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                background: "#130b02",
                border: "none",
                fontFamily: "inherit",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff7e6",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(15,23,42,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fdecc5"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajouter un avis
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}