import NextLink from "next/link";
import { register } from "./actions";
import { CaptainLogo } from "@/components/CaptainLogo";
import { RegisterForm } from "./RegisterForm";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { error, next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

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
      {/* Back arrow + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <NextLink
          href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
          style={{ display: "flex", alignItems: "center", color: "#231608", textDecoration: "none" }}
          aria-label="Retour"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
        </NextLink>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CaptainLogo size={32} accent="#006b3c" />
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.4, color: "#231608" }}>Captain Guinness</span>
        </div>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: "0 0 6px", lineHeight: 1.1, color: "#231608" }}>
        Créer un compte
      </h1>
      <p style={{ fontSize: 14, color: "#7a6248", margin: "0 0 24px", lineHeight: 1.45 }}>
        Note, géolocalise, partage tes meilleures pintes.
      </p>

      {error && (
        <div style={{
          background: "rgba(194,59,57,0.10)",
          border: "1px solid rgba(194,59,57,0.40)",
          borderRadius: 12, padding: "12px 14px", marginBottom: 18,
          display: "flex", gap: 10, alignItems: "flex-start",
          fontSize: 13, color: "#8a2a28", lineHeight: 1.4,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c23b39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong style={{ display: "block", marginBottom: 2 }}>Échec d&apos;inscription</strong>
            {error}
          </div>
        </div>
      )}

      <RegisterForm safeNext={safeNext} registerAction={register} />

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "#7a6248" }}>
        Déjà inscrit ?{" "}
        <NextLink
          href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
          style={{ color: "#006b3c", fontWeight: 600, textDecoration: "none" }}
        >
          Se connecter
        </NextLink>
      </div>
    </div>
  );
}
