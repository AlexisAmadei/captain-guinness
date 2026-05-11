"use client";

import { useState } from "react";

const HINTS = [
  { label: "8+ caractères", test: (pw: string) => pw.length >= 8 },
  { label: "Une lettre & un chiffre", test: (pw: string) => /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw) },
  { label: "Un symbole (recommandé)", test: (pw: string) => /[^a-zA-Z0-9]/.test(pw) },
];

function getStrength(pw: string): number {
  if (pw.length === 0) return -1;
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score = 2;
  if (score === 2 && /[^a-zA-Z0-9]/.test(pw)) score = 3;
  return score;
}

const STRENGTH_LABELS = ["Trop court", "Faible", "Correct", "Solide"];
const STRENGTH_COLORS = ["#c23b39", "#facc15", "#facc15", "#006b3c"];

const fieldStyle = {
  width: "100%", height: 52, borderRadius: 12,
  background: "#fffaf3",
  border: "1.5px solid #e4d4bb",
  padding: "0 48px 0 16px",
  fontSize: 16, color: "#231608", fontWeight: 500,
  fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as const,
};

interface ResetPasswordFormProps {
  updatePasswordAction: (formData: FormData) => Promise<void>;
}

export function ResetPasswordForm({ updatePasswordAction }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const strength = getStrength(password);

  return (
    <form action={updatePasswordAction}>
      {/* New password */}
      <label style={{ display: "block", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#7a6248", marginBottom: 6, letterSpacing: -0.1 }}>
          Nouveau mot de passe
        </div>
        <div style={{ position: "relative" }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères min."
            minLength={8}
            required
            style={{ ...fieldStyle, border: "1.5px solid #006b3c", boxShadow: "0 0 0 4px rgba(0,107,60,0.13)" }}
            onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
            onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a6248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </label>

      {/* Strength bar */}
      {password.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                flex: 1, height: 5, borderRadius: 3,
                background: strength >= 0 && i <= strength ? STRENGTH_COLORS[strength] : "#e4d4bb",
                transition: "background .2s",
              }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: strength >= 0 ? STRENGTH_COLORS[strength] : "#7a6248", fontWeight: 600, marginBottom: 14 }}>
            {strength >= 0 ? STRENGTH_LABELS[strength] : ""}
          </div>
        </>
      )}

      {/* Confirm password */}
      <label style={{ display: "block", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#7a6248", marginBottom: 6, letterSpacing: -0.1 }}>
          Confirmer le mot de passe
        </div>
        <div style={{ position: "relative" }}>
          <input
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Répète le mot de passe"
            minLength={8}
            required
            style={fieldStyle}
            onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
            onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
          />
          <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a6248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </label>

      {/* Hints checklist */}
      <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 24px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
        {HINTS.map(({ label, test }) => {
          const ok = password.length > 0 && test(password);
          return (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, color: ok ? "#006b3c" : "#7a6248" }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: ok ? "#006b3c" : "transparent",
                border: `1.5px solid ${ok ? "#006b3c" : "#e4d4bb"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all .15s",
              }}>
                {ok && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7"/>
                  </svg>
                )}
              </div>
              {label}
            </li>
          );
        })}
      </ul>

      <button
        type="submit"
        style={{
          width: "100%", height: 52, borderRadius: 12,
          background: "#130b02",
          color: "#fff7e6",
          border: "none",
          fontFamily: "inherit", fontSize: 16, fontWeight: 600,
          letterSpacing: -0.2,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          cursor: "pointer",
        }}
      >
        Confirmer
      </button>
    </form>
  );
}
