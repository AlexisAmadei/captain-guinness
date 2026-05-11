"use client";

import NextLink from "next/link";
import { useState } from "react";

export function LoginCredentialsFields() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <label style={{ display: "block", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#7a6248", marginBottom: 6, letterSpacing: -0.1 }}>
          Email
        </div>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          style={{
            width: "100%", height: 52, borderRadius: 12,
            background: "#fffaf3",
            border: "1.5px solid #e4d4bb",
            padding: "0 16px",
            fontSize: 16, color: "#231608", fontWeight: 500,
            fontFamily: "inherit",
            outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
          onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#7a6248", letterSpacing: -0.1 }}>Mot de passe</span>
          <NextLink
            href={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            style={{ fontSize: 13, color: "#006b3c", fontWeight: 500, textDecoration: "none" }}
          >
            Mot de passe oublié ?
          </NextLink>
        </div>
        <div style={{ position: "relative" }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="8 caractères min."
            style={{
              width: "100%", height: 52, borderRadius: 12,
              background: "#fffaf3",
              border: "1.5px solid #e4d4bb",
              padding: "0 48px 0 16px",
              fontSize: 16, color: "#231608", fontWeight: 500,
              fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
            onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center",
            }}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a6248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a6248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </label>

      <div style={{ marginBottom: 22 }} />
    </>
  );
}
