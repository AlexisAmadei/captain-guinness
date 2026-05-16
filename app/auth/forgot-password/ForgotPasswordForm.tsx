"use client";

import { useState } from "react";
import NextLink from "next/link";
import { sendPasswordReset } from "../login/actions";

function inputStyle(focused: boolean) {
  return {
    width: "100%", height: 52, borderRadius: 12,
    background: "#fffaf3",
    border: focused ? "1.5px solid #006b3c" : "1.5px solid #e4d4bb",
    boxShadow: focused ? "0 0 0 4px rgba(0,107,60,0.13)" : "none",
    padding: "0 16px",
    fontSize: 16, color: "#231608", fontWeight: 500,
    fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const,
  };
}

interface Props {
  defaultEmail?: string;
  error?: string;
}

export function ForgotPasswordForm({ defaultEmail, error }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: "0 0 10px", lineHeight: 1.1, color: "#231608" }}>
        Réinitialiser
      </h1>
      <p style={{ fontSize: 15, color: "#7a6248", margin: "0 0 28px", lineHeight: 1.45 }}>
        Saisis ton email — on t&apos;envoie un lien pour créer un nouveau mot de passe.
      </p>

      {error && (
        <div style={{
          background: "rgba(194,59,57,0.10)",
          border: "1px solid rgba(194,59,57,0.40)",
          borderRadius: 12, padding: "12px 14px", marginBottom: 18,
          fontSize: 13, color: "#8a2a28", lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <form action={sendPasswordReset}>
        <label style={{ display: "block", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#7a6248", marginBottom: 6, letterSpacing: -0.1 }}>Email</div>
          <input
            name="email"
            type="email"
            placeholder="email@exemple.com"
            defaultValue={defaultEmail ?? ""}
            autoFocus
            required
            style={inputStyle(focused)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </label>

        <button
          type="submit"
          style={{
            width: "100%", height: 52, borderRadius: 12,
            background: "#130b02",
            color: "#fff7e6",
            border: "none",
            fontFamily: "inherit", fontSize: 16, fontWeight: 600,
            letterSpacing: -0.2,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            cursor: "pointer", marginBottom: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff7e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
          </svg>
          Envoyer le lien
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14 }}>
        <NextLink href="/auth/login" style={{ color: "#006b3c", fontWeight: 600, textDecoration: "none" }}>
          ← Retour à la connexion
        </NextLink>
      </div>
    </>
  );
}
