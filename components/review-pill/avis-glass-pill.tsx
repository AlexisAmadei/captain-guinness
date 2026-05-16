"use client";

export default function AvisPill({ totalRatings, overallAverage, loading, setIsOpen }: {
  totalRatings: number;
  overallAverage: number | null;
  loading: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <button
      onClick={() => setIsOpen(true)}
      style={{
        height: 44,
        padding: "0 14px",
        borderRadius: 22,
        background: "rgba(255,255,255,0.76)",
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        border: "1px solid #e4d4bb",
        boxShadow: "0 4px 18px rgba(61,36,9,0.14)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 9,
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: "#231608" }}>Avis</span>
      {!loading && (
        <span
          style={{
            height: 20,
            padding: "0 7px",
            borderRadius: 10,
            background: "#130b02",
            color: "#fdecc5",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: '"Geist Mono",ui-monospace,monospace',
            display: "flex",
            alignItems: "center",
          }}
        >
          {totalRatings}
        </span>
      )}
      {overallAverage !== null && (
        <span style={{ fontSize: 12.5, color: "#c07800", fontWeight: 700 }}>
          ★ {overallAverage.toFixed(1)}
        </span>
      )}
    </button>
  )
}
