import NextLink from "next/link";
import { login, loginWithGithub, loginWithGoogle } from "./actions";
import { LoginCredentialsFields } from "./LoginCredentialsFields";
import { CaptainLogo } from "@/components/CaptainLogo";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div style={{
      background: "rgba(255,255,255,0.76)",
      border: "1px solid #e4d4bb",
      borderRadius: 20,
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
      boxShadow: "0 12px 40px rgba(61,36,9,0.10)",
      padding: "32px 28px 28px",
    }}>
      {/* Logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <CaptainLogo size={42} accent="#006b3c" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: -0.5, color: "#231608", lineHeight: 1 }}>Captain Guinness.</div>
          <div style={{ fontSize: 12, color: "#7a6248", marginTop: 3, letterSpacing: -0.1 }}>Note ta Guinness.</div>
        </div>
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, margin: "0 0 6px", lineHeight: 1.05, color: "#231608" }}>
        Re-bonjour
      </h1>
      <p style={{ fontSize: 15, color: "#7a6248", margin: "0 0 28px", lineHeight: 1.4 }}>
        Content de te revoir. Connecte-toi pour continuer.
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
            <strong style={{ display: "block", marginBottom: 2 }}>Échec de connexion</strong>
            {error}
          </div>
        </div>
      )}

      {message && (
        <div style={{
          background: "rgba(0,107,60,0.08)",
          border: "1px solid rgba(0,107,60,0.30)",
          borderRadius: 12, padding: "12px 14px", marginBottom: 18,
          fontSize: 13, color: "#004024", lineHeight: 1.4,
        }}>
          {message}
        </div>
      )}

      <form action={login}>
        <input type="hidden" name="next" value={safeNext} />
        <LoginCredentialsFields />
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
            cursor: "pointer", marginBottom: 10,
          }}
        >
          Se connecter
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 14px", color: "#7a6248", fontSize: 13 }}>
        <div style={{ flex: 1, height: 1, background: "#e4d4bb" }} />
        <span style={{ fontWeight: 500 }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "#e4d4bb" }} />
      </div>

      <form action={loginWithGoogle}>
        <input type="hidden" name="next" value={safeNext} />
        <button
          type="submit"
          style={{
            width: "100%", height: 50, borderRadius: 12,
            background: "#fffaf3", color: "#231608",
            border: "1.5px solid #e4d4bb",
            fontFamily: "inherit", fontSize: 15, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: "pointer", marginBottom: 10,
          }}
        >
          <GoogleIcon /> Continuer avec Google
        </button>
      </form>

      <form action={loginWithGithub}>
        <input type="hidden" name="next" value={safeNext} />
        <button
          type="submit"
          style={{
            width: "100%", height: 50, borderRadius: 12,
            background: "#fffaf3", color: "#231608",
            border: "1.5px solid #e4d4bb",
            fontFamily: "inherit", fontSize: 15, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: "pointer", marginBottom: 0,
          }}
        >
          <GithubIcon /> Continuer avec GitHub
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#7a6248" }}>
        Pas de compte ?{" "}
        <NextLink
          href={`/auth/register?next=${encodeURIComponent(safeNext)}`}
          style={{ color: "#006b3c", fontWeight: 600, textDecoration: "none" }}
        >
          Créer un compte
        </NextLink>
      </div>
    </div>
  );
}
