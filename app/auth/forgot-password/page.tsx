import NextLink from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

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
        <ForgotPasswordForm defaultEmail={email} error={error} />
      )}
    </div>
  );
}
