"use client";

import { useState } from "react";

const fieldStyle = {
  width: "100%", height: 52, borderRadius: 12,
  background: "#fffaf3",
  border: "1.5px solid #e4d4bb",
  padding: "0 16px",
  fontSize: 16, color: "#231608", fontWeight: 500,
  fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as const,
};

const labelStyle = { fontSize: 13, fontWeight: 500, color: "#7a6248", marginBottom: 6, letterSpacing: -0.1, display: "block" } as const;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.25h2.9c1.7-1.56 2.69-3.87 2.69-6.59z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.95 10.71A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.1c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3z"/>
  </svg>
);

interface RegisterFormProps {
  safeNext: string;
  registerAction: (formData: FormData) => Promise<void>;
}

export function RegisterForm({ safeNext, registerAction }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <>
      <form action={registerAction}>
        <input type="hidden" name="next" value={safeNext} />

        <label style={{ display: "block", marginBottom: 14 }}>
          <span style={labelStyle}>Nom complet</span>
          <input
            name="fullName"
            type="text"
            placeholder="Marie Lambert"
            required
            style={fieldStyle}
            onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
            onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 14 }}>
          <span style={labelStyle}>Email</span>
          <input
            name="email"
            type="email"
            placeholder="email@exemple.com"
            required
            style={fieldStyle}
            onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
            onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 6 }}>
          <span style={labelStyle}>Mot de passe</span>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères min."
              minLength={8}
              required
              style={{ ...fieldStyle, padding: "0 48px 0 16px" }}
              onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
              onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a6248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: "#7a6248" }}>
            8 caractères min., avec lettres et chiffres
          </div>
        </label>

        {/* Terms */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, marginTop: 14, fontSize: 13, color: "#7a6248", lineHeight: 1.45, cursor: "pointer" }}>
          <input
            type="checkbox"
            name="termsAccepted"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
            aria-label="Accepter les CGU et la politique de confidentialité"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              margin: -1,
              padding: 0,
              border: 0,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
              clipPath: "inset(50%)",
              whiteSpace: "nowrap",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              width: 20, height: 20, borderRadius: 6, marginTop: 1, flexShrink: 0,
              background: termsAccepted ? "#006b3c" : "transparent",
              border: `1.5px solid ${termsAccepted ? "#006b3c" : "#e4d4bb"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
            }}
          >
            {termsAccepted && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7"/>
              </svg>
            )}
          </div>
          <span>
            J&apos;accepte les{" "}
            <a href="/cgu" style={{ color: "#006b3c", fontWeight: 500 }}>CGU</a>
            {" "}et la{" "}
            <a href="/privacy" style={{ color: "#006b3c", fontWeight: 500 }}>politique de confidentialité</a>
          </span>
        </label>

        <button
          type="submit"
          disabled={!termsAccepted}
          style={{
            width: "100%", height: 52, borderRadius: 12,
            background: termsAccepted ? "#130b02" : "#8c7b68",
            color: "#fff7e6",
            border: "none",
            fontFamily: "inherit", fontSize: 16, fontWeight: 600,
            letterSpacing: -0.2,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            cursor: termsAccepted ? "pointer" : "not-allowed", marginBottom: 10,
            opacity: termsAccepted ? 1 : 0.75,
          }}
        >
          Créer mon compte
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 12px", color: "#7a6248", fontSize: 13 }}>
        <div style={{ flex: 1, height: 1, background: "#e4d4bb" }} />
        <span style={{ fontWeight: 500 }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "#e4d4bb" }} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          style={{
            flex: 1, height: 50, borderRadius: 12,
            background: "#fffaf3", color: "#231608",
            border: "1.5px solid #e4d4bb",
            fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer",
          }}
        >
          <GoogleIcon /> Google
        </button>
        <button
          type="button"
          style={{
            flex: 1, height: 50, borderRadius: 12,
            background: "#fffaf3", color: "#231608",
            border: "1.5px solid #e4d4bb",
            fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer",
          }}
        >
          <GithubIcon /> GitHub
        </button>
      </div>
    </>
  );
}
