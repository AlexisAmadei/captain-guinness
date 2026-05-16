"use client";
import { useRouter } from "next/navigation";
import { T } from "./theme";

function tierGrad(v: number) {
  if (v >= 4) return "linear-gradient(135deg,#16a34a,#0f766e)";
  if (v >= 3) return "linear-gradient(135deg,#a16207,#c2410c)";
  if (v >= 2) return "linear-gradient(135deg,#c2410c,#dc2626)";
  return "linear-gradient(135deg,#dc2626,#db2777)";
}

function tierLabel(v: number) {
  if (v >= 4.5) return "Excellent · Tier S";
  if (v >= 4) return "Bien · Tier A";
  if (v >= 3) return "Correct · Tier B";
  if (v >= 2) return "Passable · Tier C";
  return "Décevant · Tier D";
}

export function SuccessScreen({ pub, avg, placeId }: { pub: string; avg: number; placeId: string }) {
  const router = useRouter();

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100dvh - 64px)", padding: "0 32px",
      background: T.canvas,
    }}>
      {/* Checkmark ring */}
      <div style={{
        width: 96, height: 96, borderRadius: 28, marginBottom: 28,
        background: "rgba(0,107,60,0.10)", border: "1.5px solid rgba(0,107,60,0.32)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 12px 40px rgba(0,107,60,0.16)",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#006b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: -1, color: T.fg, textAlign: "center", lineHeight: 1.15, marginBottom: 8 }}>
        Avis publié !
      </div>
      <div style={{ fontSize: 13.5, color: T.muted, textAlign: "center", lineHeight: 1.55, marginBottom: 28, maxWidth: 270 }}>
        Ta Guinness chez <span style={{ fontWeight: 600, color: T.fg }}>{pub}</span> a bien été notée.
      </div>

      {/* Score chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: T.surfaceSolid, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "14px 20px", marginBottom: 36,
        boxShadow: "0 4px 18px rgba(61,36,9,0.08)",
        width: "100%", maxWidth: 320,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 15,
          background: tierGrad(avg), color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 17, fontWeight: 700, letterSpacing: -0.5, flexShrink: 0,
          boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
        }}>
          {avg.toFixed(1)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.fg, marginBottom: 3 }}>
            {tierLabel(avg)}
          </div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            note globale · {pub}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        <button
          onClick={() => router.push(`/pubs/${encodeURIComponent(placeId)}`)}
          style={{
            height: 50, borderRadius: 13, border: "none",
            background: "#130b02", color: "#fff7e6",
            fontFamily: '"Geist", sans-serif', fontSize: 15, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 20px rgba(15,23,42,0.2)",
          }}
        >
          Voir le pub
        </button>
        <button
          onClick={() => router.push("/")}
          style={{
            height: 50, borderRadius: 13,
            border: `1.5px solid ${T.border}`,
            background: T.surfaceSolid, color: T.fg,
            fontFamily: '"Geist", sans-serif', fontSize: 15, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Retour à la carte
        </button>
      </div>
    </div>
  );
}
