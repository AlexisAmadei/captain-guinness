import NextLink from "next/link";
import { updatePassword } from "./actions";
import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams;

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

      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: "0 0 10px", lineHeight: 1.15, color: "#231608" }}>
        Nouveau mot de passe
      </h1>
      <p style={{ fontSize: 14, color: "#7a6248", margin: "0 0 28px", lineHeight: 1.45 }}>
        8 caractères min., avec lettres et chiffres.
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

      <ResetPasswordForm updatePasswordAction={updatePassword} />
    </div>
  );
}
