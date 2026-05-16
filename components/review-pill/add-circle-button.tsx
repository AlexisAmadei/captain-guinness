import { useRouter } from 'next/navigation';
import React from 'react'

export default function AddCircleButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/rate")}
      aria-label="Ajouter un avis"
      style={{
        width: 44,
        height: 44,
        borderRadius: 28,
        background: "#130b02",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 24px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fdecc5"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
