"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/auth/login/actions";
import { Dialog, Button } from "@chakra-ui/react";
import { deleteAccount } from "./actions";

// ── Palette ────────────────────────────────────────────────────────────────
const T = {
  canvas:      "#f6f1e6",
  surface:     "rgba(255,255,255,0.76)",
  surfaceSolid:"#fffaf3",
  border:      "#e4d4bb",
  fg:          "#231608",
  muted:       "#7a6248",
  subtle:      "#9c7d5c",
  danger:      "#c23b39",
} as const;

// ── Section label ─────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "16px 20px 6px",
      fontSize: 10.5, fontWeight: 600, letterSpacing: 0.8,
      fontFamily: '"Geist Mono", ui-monospace, monospace', textTransform: "uppercase" as const,
      color: T.muted,
    }}>{children}</div>
  );
}

// ── Settings card ─────────────────────────────────────────────────────────
function SCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      margin: "0 16px",
      background: T.surfaceSolid, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 10px rgba(61,36,9,0.05)",
    }}>{children}</div>
  );
}

// ── Settings row ──────────────────────────────────────────────────────────
function SRow({
  iconPath, label, value, valueColor, last = false, danger = false,
  badge, onClick,
}: {
  iconPath: string; label: string; value?: string; valueColor?: string;
  last?: boolean; danger?: boolean; badge?: React.ReactNode; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", padding: "13px 15px", gap: 12,
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: danger ? `${T.danger}18` : T.canvas,
        border: `1px solid ${danger ? `${T.danger}30` : T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={danger ? T.danger : T.muted}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: danger ? 600 : 500,
          color: danger ? T.danger : T.fg,
        }}>{label}</div>
        {badge && <div style={{ marginTop: 4 }}>{badge}</div>}
      </div>

      {value && !badge && (
        <span style={{
          fontSize: 12.5, color: valueColor ?? T.muted,
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
          maxWidth: 140,
        }}>{value}</span>
      )}

      {!badge && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={danger ? `${T.danger}80` : T.border}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      )}
    </div>
  );
}

// ── External link row ─────────────────────────────────────────────────────
function ExtRow({
  iconPath, label, value, color, href, last = false,
}: {
  iconPath: string; label: string; value: string; color: string; href: string; last?: boolean;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", padding: "13px 15px", gap: 12,
        borderBottom: last ? "none" : `1px solid ${T.border}`,
        cursor: "pointer",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath}/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: T.fg }}>{label}</div>
          <div style={{
            fontSize: 11.5, color: T.muted, marginTop: 2,
            fontFamily: '"Geist Mono", ui-monospace, monospace',
          }}>{value}</div>
        </div>

        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={T.subtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>
    </a>
  );
}

// ── OAuth provider badge ──────────────────────────────────────────────────
function OAuthBadge({ provider }: { provider: string }) {
  const cfg: Record<string, { label: string; color: string; iconPath: string }> = {
    github: {
      label: "GitHub",
      color: "#24292f",
      iconPath: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
    },
    google: {
      label: "Google",
      color: "#4285f4",
      iconPath: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    },
  };
  const c = cfg[provider] ?? cfg.github;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 10px", borderRadius: 8,
      background: `${c.color}12`, border: `1px solid ${c.color}30`,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={c.iconPath}/>
      </svg>
      <span style={{
        fontSize: 11.5, fontWeight: 600, color: c.color,
        fontFamily: '"Geist Mono", ui-monospace, monospace',
      }}>Connecté via {c.label}</span>
    </div>
  );
}

function toHandle(name: string | null) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
  const first = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const lastInitial = parts[parts.length - 1][0]?.toLowerCase() ?? "";
  return `${first}_${lastInitial}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("email");
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth/login"); return; }
        setEmail(user.email ?? null);
        setProvider((user.app_metadata?.provider as string | undefined) ?? "email");
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
        setFullName(profile?.full_name ?? null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  const isOAuth = provider !== "email";
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteAccount();
      if (result?.error) setDeleteError(result.error);
    } catch {
      setDeleteError("Une erreur est survenue.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: T.canvas, fontFamily: '"Geist", -apple-system, system-ui, sans-serif', color: T.fg }}>

      {/* ── App bar ── */}
      <div style={{
        position: "sticky", top: 0, height: 60, zIndex: 20,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        background: T.surface,
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${T.border}`, background: T.surfaceSolid,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(61,36,9,0.07)", cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>Paramètres</span>
      </div>

      {/* ── Mon compte ── */}
      <SLabel>Mon compte</SLabel>
      <SCard>
        <SRow
          iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          label="Nom d'utilisateur"
          value={loading ? "…" : (toHandle(fullName) ? `@${toHandle(fullName)}` : undefined)}
          onClick={() => router.push("/settings/profile/edit?field=username")}
        />
        <SRow
          iconPath="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
          label="Email"
          value={loading ? "…" : (email ?? undefined)}
          onClick={!isOAuth ? () => router.push("/settings/profile/edit?field=email") : undefined}
        />
        {isOAuth ? (
          <SRow
            iconPath="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
            label="Connexion"
            badge={<OAuthBadge provider={provider} />}
            last
          />
        ) : (
          <SRow
            iconPath="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"
            label="Mot de passe"
            value="••••••••"
            onClick={() => router.push("/settings/profile/edit?field=password")}
            last
          />
        )}
      </SCard>

      {isOAuth && (
        <div style={{ margin: "8px 20px 0", display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#006b3c", opacity: 0.7 }} />
          <span style={{ fontSize: 11, color: T.muted, fontFamily: '"Geist Mono", ui-monospace, monospace' }}>
            Authentification gérée par <strong>{providerName}</strong> — mot de passe non applicable
          </span>
        </div>
      )}

      {/* ── Contribuer ── */}
      <SLabel>Contribuer</SLabel>
      <SCard>
        <ExtRow 
          iconPath="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
          label="GitHub"
          value="github.com/captain-guinness"
          color="#24292f"
          href="https://github.com/AlexisAmadei/captain-guinness"
        />
        {/* <ExtRow
          iconPath="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"
          label="Twitter / X"
          value="@captainpint"
          color="#1d9bf0"
          href="https://twitter.com/captainpint"
        /> */}
        <ExtRow
          iconPath="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
          label="Contact"
          value="hello@captain-guinness.fr"
          color="#d4880e"
          href="mailto:hello@captain-guinness.fr"
          last
        />
      </SCard>

      {/* ── Zone dangereuse ── */}
      <SLabel>Zone dangereuse</SLabel>
      <SCard>
        <SRow
          iconPath="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
          label="Supprimer mon compte"
          danger
          last
          onClick={() => setShowDeleteDialog(true)}
        />
      </SCard>

      {/* ── Déconnexion ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <button
          onClick={async () => { await logout(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "13px 15px",
            background: T.surfaceSolid, border: `1px solid ${T.border}`,
            borderRadius: 14, cursor: "pointer",
            fontFamily: '"Geist", inherit',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: T.canvas, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>Déconnexion</span>
        </button>
      </div>

      <div style={{ height: 40 }} />

      {/* ── Delete account dialog ── */}
      <Dialog.Root
        open={showDeleteDialog}
        onOpenChange={({ open }) => { if (!open) { setShowDeleteDialog(false); setDeleteError(null); } }}
        size="xs"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" mx={4}>
            <Dialog.Header px="5" pt="5" pb="2">
              <Dialog.Title fontSize="md">Supprimer mon compte ?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body px="5" pb="2">
              <p style={{ fontSize: 14, color: T.muted, marginBottom: deleteError ? 8 : 0 }}>
                Toutes vos données (avis, profil) seront définitivement supprimées. Cette action est irréversible.
              </p>
              {deleteError && (
                <p style={{ fontSize: 13, color: T.danger }}>{deleteError}</p>
              )}
            </Dialog.Body>
            <Dialog.Footer px="5" py="4" gap="2">
              <Button variant="outline" size="sm" borderRadius="full" onClick={() => { setShowDeleteDialog(false); setDeleteError(null); }}>
                Annuler
              </Button>
              <Button
                colorPalette="red" size="sm" borderRadius="full"
                loading={deleting}
                onClick={handleDeleteAccount}
              >
                Supprimer
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}
