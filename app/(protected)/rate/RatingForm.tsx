"use client";
import { PhotoCapture } from "@/components/PhotoCapture";
import { compressImage } from "@/lib/compression";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";
import { Place, RatingCriteria, isValidOptionalRating, getResponseErrorMessage, SuccessData } from "./page";
import { T } from "./theme";

// ── Tier helpers ─────────────────────────────────────────────────────────────

function tierColor(v: number) {
  if (v >= 4.5) return "#16a34a";
  if (v >= 4) return "#84cc16";
  if (v >= 3) return "#d4880e";
  if (v >= 2) return "#f97316";
  return "#ef4444";
}

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

function calcAvg(criteria: RatingCriteria) {
  const vals = [criteria.overall, criteria.taste, criteria.foam, criteria.creamy, criteria.temperature, criteria.presentation, criteria.valueForMoney].filter((v) => v > 0);
  return vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ── Star rows ─────────────────────────────────────────────────────────────────

function HeroStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const col = value > 0 ? tierColor(value) : T.border;
        return (
          <button key={i} type="button" onClick={() => onChange(i)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 40, lineHeight: 1,
            color: filled ? col : T.border,
            filter: filled ? `drop-shadow(0 2px 8px ${col}55)` : "none",
            transition: "color 0.15s, filter 0.15s",
          }}>★</button>
        );
      })}
    </div>
  );
}

function CriteriaStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const accent = "#d4880e";
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[1, 2, 3, 4, 5].map((k) => (
        <button key={k} type="button" onClick={() => onChange(k === value ? 0 : k)} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 19, lineHeight: 1,
          color: value && k <= value ? accent : T.border,
          filter: value && k <= value ? `drop-shadow(0 1px 4px ${accent}44)` : "none",
          transition: "color 0.1s",
        }}>★</button>
      ))}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PricePhotoRow({ price, onPriceChange, onPhotoCapture, onPhotoClear }: {
  price: string;
  onPriceChange: (v: string) => void;
  onPhotoCapture: (f: File) => void;
  onPhotoClear: () => void;
}) {
  return (
    <div style={{ margin: "10px 16px 0", display: "flex", gap: 10 }}>
      <div style={{
        flex: 1,
        background: T.surfaceSolid,
        border: `1px solid ${price ? "rgba(35,22,8,0.18)" : T.border}`,
        borderRadius: 13, padding: "12px 14px",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: 0.8,
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          textTransform: "uppercase", marginBottom: 5,
        }}>
          Prix pinte
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <input
            type="number" inputMode="decimal" min="0" step="0.01" placeholder="--"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: 26, fontWeight: 700, letterSpacing: -1,
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              color: price ? T.fg : T.border,
              width: "100%", minWidth: 0,
            }}
          />
          <span style={{ fontSize: 15, color: T.muted, fontWeight: 500 }}>€</span>
        </div>
      </div>

      {/* <div style={{
        width: 88, flexShrink: 0,
        background: T.surfaceSolid,
        border: `1.5px dashed ${T.border}`,
        borderRadius: 13, overflow: "hidden",
      }}>
        <PhotoCapture onPhotoCapture={onPhotoCapture} onClear={onPhotoClear} />
      </div> */}
    </div>
  );
}

// ── Rating form ───────────────────────────────────────────────────────────────

export function RatingForm({ place, onSuccess }: { place: Place; onSuccess: (data: SuccessData) => void }) {
  const router = useRouter();

  const [criteria, setCriteria] = useState<RatingCriteria>({
    overall: 0, taste: 0, foam: 0, creamy: 0, temperature: 0, presentation: 0, valueForMoney: 0,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pintPrice, setPintPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avg = calcAvg(criteria);
  const canPublish = criteria.overall > 0;

  const setCriterion = (key: keyof RatingCriteria) => (value: number) =>
    setCriteria((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (criteria.overall === 0) { setError("La note globale est requise"); return; }
    if (!Number.isInteger(criteria.overall * 2)) { setError("La note doit être en demi-étoiles"); return; }

    const optionalCriteria = [criteria.taste, criteria.foam, criteria.creamy, criteria.temperature, criteria.presentation, criteria.valueForMoney];
    if (!optionalCriteria.every(isValidOptionalRating)) { setError("Les sous-critères doivent être vides ou entre 1 et 5"); return; }

    const parsedPrice = pintPrice.trim() === "" ? null : Number(pintPrice);
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) { setError("Prix invalide"); return; }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (photoFile) {
        const compressed = await compressImage(photoFile);
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("latitude", String(place.lat));
        fd.append("longitude", String(place.lon));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error(await getResponseErrorMessage(uploadRes, "Échec de l'upload"));
        const uploadData = await uploadRes.json();
        if (!uploadData?.url) throw new Error("URL manquante dans la réponse d'upload");
        imageUrl = uploadData.url;
      }

      const ratingRes = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating: criteria.overall,
          tasteRating: criteria.taste || null,
          foamRating: criteria.foam || null,
          creamyRating: criteria.creamy || null,
          temperatureRating: criteria.temperature || null,
          presentationRating: criteria.presentation || null,
          valueForMoneyRating: criteria.valueForMoney || null,
          barName: place.name,
          comment: null,
          pintPrice: parsedPrice,
          ratedAt: new Date().toISOString(),
          photoUrl: imageUrl,
          latitude: place.lat,
          longitude: place.lon,
          placeId: place.id,
        }),
      });

      if (!ratingRes.ok) throw new Error(await getResponseErrorMessage(ratingRes, "Échec de la soumission"));

      onSuccess({ pub: place.name, avg: avg > 0 ? parseFloat(avg.toFixed(1)) : criteria.overall, placeId: place.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const subCriteria: Array<[string, keyof RatingCriteria]> = [
    ["Goût", "taste"],
    ["Mousse", "foam"],
    ["Crémeux", "creamy"],
    ["Température", "temperature"],
    ["Présentation", "presentation"],
    ["Rapport qualité-prix", "valueForMoney"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 64px)", background: T.canvas }}>
      {/* Step header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.border}`,
        background: T.surface, backdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button type="button" onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${T.border}`, background: T.surfaceSolid,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: -0.4, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
            {place.name}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 1, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>
            {place.type}
          </div>
        </div>
        <div style={{
          flexShrink: 0, padding: "5px 10px", borderRadius: 8,
          background: T.canvas, border: `1px solid ${T.border}`,
          fontSize: 11, fontWeight: 600, color: T.muted,
          fontFamily: '"Geist Mono", ui-monospace, monospace',
        }}>
          2 / 2
        </div>
      </div>

      {/* Scrollable form body */}
      <form
        id="rate-form"
        onSubmit={handleSubmit}
        style={{ flex: 1, overflowY: "auto", paddingBottom: 16, background: T.canvas }}
      >
        {/* Score hero */}
        <div style={{
          padding: "28px 16px 18px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
          background: T.surfaceSolid, borderBottom: `1px solid ${T.border}`,
        }}>
          {/* Badge */}
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: avg > 0 ? tierGrad(avg) : "transparent",
            border: avg > 0 ? "none" : "2.5px dashed #c8c0b0",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: avg > 0 ? "0 10px 32px rgba(0,0,0,0.22)" : "none",
            transition: "all .25s",
          }}>
            <span style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 26, fontWeight: 700, letterSpacing: -1.5,
              color: avg > 0 ? "#fff" : "#c8c0b0",
            }}>
              {avg > 0 ? avg.toFixed(1) : "--"}
            </span>
          </div>

          <HeroStars value={criteria.overall} onChange={setCriterion("overall")} />

          <div style={{
            fontSize: 13, fontWeight: 500,
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            color: avg > 0 ? tierColor(avg) : T.muted,
            letterSpacing: 0.2,
          }}>
            {avg > 0 ? tierLabel(avg) : "Touche une étoile pour noter"}
          </div>
        </div>

        {/* Sub-criteria card */}
        <div style={{
          margin: "10px 16px 0",
          background: T.surfaceSolid, border: `1px solid ${T.border}`,
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 2px 10px rgba(61,36,9,0.05)",
        }}>
          <div style={{
            padding: "12px 15px 10px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: 0.8,
              fontFamily: '"Geist Mono", ui-monospace, monospace', textTransform: "uppercase",
            }}>Sous-critères</span>
            <span style={{ fontSize: 10.5, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>optionnel</span>
          </div>
          {subCriteria.map(([label, key], i) => (
            <div key={key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 15px",
              borderBottom: i < subCriteria.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <span style={{ fontSize: 13, color: T.fg, fontWeight: 500 }}>{label}</span>
              <CriteriaStars value={criteria[key]} onChange={setCriterion(key)} />
            </div>
          ))}
        </div>

        <PricePhotoRow
          price={pintPrice}
          onPriceChange={setPintPrice}
          onPhotoCapture={setPhotoFile}
          onPhotoClear={() => setPhotoFile(null)}
        />
        <div
          style={{ margin: "8px 16px 0", display: "flex", justifyContent: "flex-end" }}
        >
          <button type="button" onClick={() => setCriteria({ overall: criteria.overall, taste: 0, foam: 0, creamy: 0, temperature: 0, presentation: 0, valueForMoney: 0 })} style={{
            background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer",
          }}>
            Réinitialiser
          </button>
        </div>


        {error && (
          <div style={{
            margin: "10px 16px 0", padding: "12px 14px", borderRadius: 12,
            background: "rgba(194,59,57,0.08)", border: `1px solid ${T.danger}`,
            fontSize: 13, color: T.danger,
          }}>
            {error}
          </div>
        )}
      </form>

      {/* Sticky publish CTA */}
      <div style={{
        padding: "10px 16px 12px",
        background: T.surface, backdropFilter: "blur(16px)",
        borderTop: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <button
          type="submit"
          form="rate-form"
          disabled={!canPublish || loading}
          style={{
            width: "100%", height: 50, borderRadius: 13, border: "none",
            background: canPublish ? "#130b02" : T.border,
            color: canPublish ? "#fff7e6" : T.muted,
            fontFamily: '"Geist", sans-serif', fontSize: 15, fontWeight: 600,
            cursor: canPublish && !loading ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            boxShadow: canPublish ? "0 4px 20px rgba(15,23,42,0.22)" : "none",
            transition: "all .2s", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Publication…" : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              Publier mon avis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
