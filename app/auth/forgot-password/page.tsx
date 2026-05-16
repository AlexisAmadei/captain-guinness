import NextLink from "next/link";
import { sendPasswordReset } from "../login/actions";

export const metadata = {
  title: "Mot de passe oublié — Captain",
};

type Props = {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { email, sent, error } = await searchParams;

  return (
    <div style={{
      background: "rgba(255,255,255,0.76)",
      border: "1px solid #e4d4bb",
      borderRadius: 20,
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
      boxShadow: "0 12px 40px rgba(61,36,9,0.10)",
      padding: "28px 28px 28px",
    }}>
      {/* Back arrow */}
      <div style={{ marginBottom: 28 }}>
        <NextLink
          href="/auth/login"
          style={{ display: "inline-flex", alignItems: "center", color: "#231608", textDecoration: "none" }}
          aria-label="Retour"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
        </NextLink>
      </div>

      {sent ? (
        /* Check-inbox state */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            width: 88, height: 88, borderRadius: 24,
            background: "linear-gradient(135deg, rgba(0,107,60,0.20), rgba(0,107,60,0.07))",
            border: "1.5px solid rgba(0,107,60,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24, position: "relative",
            boxShadow: "0 12px 40px rgba(0,107,60,0.20)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#006b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <path d="m3 7 9 6 9-6"/>
            </svg>
            <div style={{
              position: "absolute", top: -6, right: -6,
              width: 22, height: 22, borderRadius: "50%",
              background: "#006b3c", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2.5px solid #f6f1e6",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7"/>
              </svg>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, margin: "0 0 8px", lineHeight: 1.15, color: "#231608" }}>
            Vérifie tes mails
          </h1>
          <p style={{ fontSize: 14, color: "#7a6248", margin: "0 0 6px", lineHeight: 1.45 }}>Lien envoyé à</p>
          <p style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 14, color: "#231608", margin: "0 0 32px",
            padding: "6px 14px", background: "#fffaf3",
            border: "1px solid #e4d4bb", borderRadius: 8,
          }}>
            {email ?? "ton adresse email"}
          </p>

          <NextLink
            href="/auth/login"
            style={{ fontSize: 14, color: "#006b3c", fontWeight: 600, textDecoration: "none" }}
          >
            ← Retour à la connexion
          </NextLink>
        </div>
      ) : (
        /* Request reset form */
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
                defaultValue={email ?? ""}
                autoFocus
                required
                style={{
                  width: "100%", height: 52, borderRadius: 12,
                  background: "#fffaf3",
                  border: "1.5px solid #006b3c",
                  boxShadow: "0 0 0 4px rgba(0,107,60,0.13)",
                  padding: "0 16px",
                  fontSize: 16, color: "#231608", fontWeight: 500,
                  fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.border = "1.5px solid #006b3c"; e.target.style.boxShadow = "0 0 0 4px rgba(0,107,60,0.13)"; }}
                onBlur={(e) => { e.target.style.border = "1.5px solid #e4d4bb"; e.target.style.boxShadow = "none"; }}
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
      )}
    </div>
  );
}
