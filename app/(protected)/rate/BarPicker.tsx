"use client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Place, SearchSuggestion, RetrievedFeature, haversineMeters } from "./page";
import { T } from "./theme";

function formatDist(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

type BarRowProps = { place: Place; alreadyRated: boolean; highlighted?: boolean; onClick: () => void };

function BarRow({ place, alreadyRated, highlighted = false, onClick }: BarRowProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        background: highlighted ? "rgba(212,136,14,0.06)" : "transparent",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        border: "none",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: alreadyRated ? "rgba(0,107,60,0.10)" : "rgba(19,11,2,0.08)",
          border: `1.5px solid ${alreadyRated ? "rgba(0,107,60,0.28)" : T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 13, letterSpacing: -0.5,
          color: alreadyRated ? "#006b3c" : T.muted,
          fontFamily: '"Geist", sans-serif',
        }}
      >
        {getInitials(place.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {place.name}
          </span>
          {alreadyRated && (
            <span style={{
              fontSize: 9.5, fontWeight: 600, flexShrink: 0,
              color: "#006b3c", background: "rgba(0,107,60,0.10)",
              border: "1px solid rgba(0,107,60,0.24)",
              padding: "1px 6px", borderRadius: 5,
              fontFamily: '"Geist Mono", ui-monospace, monospace',
            }}>
              déjà noté
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {place.type}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        {place.distance !== undefined && (
          <span style={{ fontSize: 11, color: T.subtle, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>
            {formatDist(place.distance)}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.border} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

export function BarPicker({ onSelect }: { onSelect: (place: Place) => void }) {
  const router = useRouter();
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [ratedPlaceIds, setRatedPlaceIds] = useState<Set<string>>(new Set());
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [retrieving, setRetrieving] = useState<string | null>(null);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geoLat = typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null;
  const geoLon = typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

  useEffect(() => {
    fetch("/api/ratings?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>(
          ((d.reviews ?? []) as { placeId?: string | null }[])
            .map((r) => r.placeId)
            .filter((id): id is string => typeof id === "string"),
        );
        setRatedPlaceIds(ids);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!geoLat || !geoLon || !token) return;
    setLoadingNearby(true);
    const url = new URL("https://api.mapbox.com/search/searchbox/v1/category/bar,pub,nightlife");
    url.searchParams.set("proximity", `${geoLon},${geoLat}`);
    url.searchParams.set("limit", "10");
    url.searchParams.set("language", "fr");
    url.searchParams.set("access_token", token);
    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        const features: RetrievedFeature[] = Array.isArray(data.features) ? data.features : [];
        setNearbyPlaces(
          features
            .filter((f) => f.properties.coordinates)
            .map((f) => {
              const { latitude: lat, longitude: lon } = f.properties.coordinates;
              return {
                id: `mapbox:${f.properties.mapbox_id}`,
                name: f.properties.name,
                type: f.properties.poi_category?.[0] ?? "bar",
                lat, lon,
                distance: haversineMeters(geoLat, geoLon, lat, lon),
              };
            })
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingNearby(false));
  }, [geoLat, geoLon, token]);

  const runSuggest = useCallback(async (q: string) => {
    if (!token || q.trim().length < 2) { setSuggestions([]); return; }
    setLoadingSearch(true);
    try {
      const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
      url.searchParams.set("q", q);
      url.searchParams.set("types", "poi");
      url.searchParams.set("poi_category", "bar,pub,nightlife,restaurant,cafe");
      url.searchParams.set("limit", "8");
      url.searchParams.set("language", "fr");
      url.searchParams.set("session_token", sessionTokenRef.current);
      if (geoLat && geoLon) url.searchParams.set("proximity", `${geoLon},${geoLat}`);
      url.searchParams.set("access_token", token);
      const res = await fetch(url.toString());
      setSuggestions(res.ok ? (await res.json()).suggestions ?? [] : []);
    } finally {
      setLoadingSearch(false);
    }
  }, [token, geoLat, geoLon]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); setLoadingSearch(false); return; }
    searchDebounceRef.current = setTimeout(() => runSuggest(query), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [query, runSuggest]);

  const handleSuggestionSelect = async (s: SearchSuggestion) => {
    if (!token) return;
    setRetrieving(s.mapbox_id);
    setRetrieveError(null);
    try {
      const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${s.mapbox_id}`);
      url.searchParams.set("session_token", sessionTokenRef.current);
      url.searchParams.set("access_token", token);
      const res = await fetch(url.toString());
      if (!res.ok) { setRetrieveError("Impossible de charger ce bar. Réessaie."); return; }
      const data = await res.json();
      const feat: RetrievedFeature | undefined = data.features?.[0];
      if (!feat?.properties.coordinates) { setRetrieveError("Pas de localisation pour ce bar."); return; }
      const { latitude: lat, longitude: lon } = feat.properties.coordinates;
      sessionTokenRef.current = crypto.randomUUID();
      onSelect({
        id: `mapbox:${feat.properties.mapbox_id}`,
        name: feat.properties.name,
        type: feat.properties.poi_category?.[0] ?? "bar",
        lat, lon,
        distance: geoLat && geoLon ? haversineMeters(geoLat, geoLon, lat, lon) : undefined,
      });
    } finally {
      setRetrieving(null);
    }
  };

  const showSearch = query.trim().length >= 2;

  const sectionLabel = showSearch
    ? "Résultats de recherche"
    : geoLoading ? "Localisation en cours…"
    : geoLat    ? "À proximité · géoloc active"
    : geoError  ? "Localisation indisponible"
    :              "Active la localisation pour voir les bars";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 64px)", background: T.canvas }}>
      {/* Step header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        backdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            border: `1px solid ${T.border}`, background: T.surfaceSolid,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 15.5, letterSpacing: -0.4, color: T.fg, lineHeight: 1.2 }}>
          Quel bar ?
        </div>
        <div style={{
          padding: "5px 10px", borderRadius: 8,
          background: T.canvas, border: `1px solid ${T.border}`,
          fontSize: 11, fontWeight: 600, color: T.muted,
          fontFamily: '"Geist Mono", ui-monospace, monospace',
        }}>
          1 / 2
        </div>
      </div>

      {/* Search field */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0, background: T.canvas }}>
        <div style={{
          height: 44, borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          background: T.surfaceSolid,
          display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un bar…"
            autoFocus
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 14, color: T.fg, fontFamily: '"Geist", sans-serif',
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              width: 20, height: 20, borderRadius: 10,
              background: T.border, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: T.muted, cursor: "pointer",
            }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div style={{
        padding: "14px 16px 6px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, background: T.canvas,
      }}>
        <span style={{
          fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: 0.8,
          fontFamily: '"Geist Mono", ui-monospace, monospace', textTransform: "uppercase",
        }}>
          {sectionLabel}
        </span>
        {(showSearch ? loadingSearch : loadingNearby) && (
          <span style={{ fontSize: 11, color: T.muted }}>…</span>
        )}
      </div>

      {retrieveError && (
        <div style={{ padding: "8px 16px", color: T.danger, fontSize: 13, flexShrink: 0 }}>
          {retrieveError}
        </div>
      )}

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", background: T.canvas }}>
        {!loadingSearch && showSearch && suggestions.length === 0 && query.trim().length >= 2 && (
          <p style={{ padding: "16px", fontSize: 13, color: T.muted }}>
            Aucun résultat pour &ldquo;{query}&rdquo;.
          </p>
        )}
        {!loadingNearby && !showSearch && nearbyPlaces.length === 0 && geoLat && (
          <p style={{ padding: "16px", fontSize: 13, color: T.muted }}>Aucun bar trouvé à proximité.</p>
        )}

        {showSearch && suggestions.map((s) => (
          <BarRow
            key={s.mapbox_id}
            place={{ id: `mapbox:${s.mapbox_id}`, name: s.name, type: s.place_formatted ?? "", lat: 0, lon: 0 }}
            alreadyRated={ratedPlaceIds.has(`mapbox:${s.mapbox_id}`)}
            onClick={() => { if (!retrieving) handleSuggestionSelect(s); }}
          />
        ))}

        {!showSearch && nearbyPlaces.map((place, i) => (
          <BarRow
            key={place.id}
            place={place}
            alreadyRated={ratedPlaceIds.has(place.id)}
            highlighted={i === 0}
            onClick={() => onSelect(place)}
          />
        ))}

        {!showSearch && !geoLoading && geoError && (
          <p style={{ padding: "16px", fontSize: 13, color: T.muted }}>{geoError}</p>
        )}
      </div>
    </div>
  );
}
