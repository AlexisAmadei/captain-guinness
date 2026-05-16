"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { updateDisplayName, updateEmail, updatePassword } from "@/app/(protected)/profile/actions";
import { initialProfileActionState } from "@/app/(protected)/profile/types";

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

const ACCENT  = "#d4880e";
const BTN_BG  = "#130b02";
const BTN_FG  = "#fff7e6";
const GREEN   = "#006b3c";
const GREEN_D = "#004024";

// ── App bar ────────────────────────────────────────────────────────────────
function AppBar({ title }: { title: string }) {
  const router = useRouter();
  return (
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={T.fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <span style={{ flex: 1, fontWeight: 700, fontSize: 17, letterSpacing: -0.5, color: T.fg }}>{title}</span>
    </div>
  );
}

// ── Form field ─────────────────────────────────────────────────────────────
function Field({
  label, name, type = "text", value, defaultValue, placeholder,
  focused = false, readOnly = false, error = false, hint, trailing,
  onChange,
}: {
  label?: string; name?: string; type?: string; value?: string; defaultValue?: string;
  placeholder?: string; focused?: boolean; readOnly?: boolean; error?: boolean;
  hint?: string; trailing?: React.ReactNode; onChange?: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 500, color: T.muted, marginBottom: 6, letterSpacing: -0.1 }}>
          {label}
        </div>
      )}
      <div style={{
        height: 52, borderRadius: 12,
        background: readOnly ? T.canvas : T.surfaceSolid,
        border: `1.5px solid ${error ? T.danger : focused ? ACCENT : T.border}`,
        display: "flex", alignItems: "center", padding: "0 16px",
        fontWeight: 500,
        boxShadow: focused ? `0 0 0 4px ${ACCENT}22` : "none",
        transition: "all .2s",
        gap: 10,
      }}>
        {readOnly ? (
          <span style={{ flex: 1, fontSize: 16, color: T.muted }}>{value || placeholder}</span>
        ) : (
          <input
            name={name}
            type={type}
            defaultValue={defaultValue}
            value={value}
            placeholder={placeholder}
            autoFocus={focused}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              fontSize: 16, fontWeight: 500, color: T.fg,
              fontFamily: "inherit", caretColor: ACCENT,
            }}
          />
        )}
        {trailing}
      </div>
      {hint && (
        <div style={{ fontSize: 12, marginTop: 6, color: error ? T.danger : T.muted, lineHeight: 1.45 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ── Primary button ─────────────────────────────────────────────────────────
function PrimaryBtn({
  children, disabled = false,
  type = "submit" as "submit" | "button",
  onClick,
}: {
  children: React.ReactNode; disabled?: boolean;
  type?: "submit" | "button"; onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%", height: 52, borderRadius: 12,
        background: disabled ? T.border : BTN_BG,
        color: BTN_FG, border: "none",
        fontFamily: "inherit", fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: disabled ? "none" : "0 8px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >{children}</button>
  );
}

// ── Info note ──────────────────────────────────────────────────────────────
function Note({ children, color = ACCENT }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      display: "flex", gap: 9, alignItems: "flex-start",
      padding: "10px 12px", borderRadius: 10,
      background: `${color}10`, border: `1px solid ${color}28`,
      marginBottom: 16,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ fontSize: 12.5, color, lineHeight: 1.5, fontWeight: 500 }}>{children}</span>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: T.border, margin: "4px 0 18px" }}/>;
}

// ── Current value chip ─────────────────────────────────────────────────────
function CurrentChip({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "7px 12px", borderRadius: 10,
      background: T.surfaceSolid, border: `1px solid ${T.border}`,
      marginBottom: 22, alignSelf: "flex-start",
    }}>
      <span style={{ fontSize: 13, color: T.muted, fontFamily: '"Geist Mono",monospace' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: T.fg, fontFamily: mono ? '"Geist Mono",monospace' : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

// ── Eye toggle icon ────────────────────────────────────────────────────────
function Eye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {visible ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </>
        )}
      </svg>
    </button>
  );
}

// ── Password strength bar ──────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const level = !password ? 0
    : password.length < 6 ? 0
    : password.length < 8 ? 1
    : /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password) ? 3
    : 2;
  const colors = ["#ef4444", "#f97316", "#d4880e", "#16a34a"];
  const labels = ["Trop court", "Faible", "Correct", "Solide"];
  return (
    <div style={{ marginTop: -6, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= level ? colors[level] : T.border,
            transition: "background .3s",
          }}/>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: colors[level], fontWeight: 600, fontFamily: '"Geist Mono",monospace' }}>
        {labels[level]}
      </div>
    </div>
  );
}

// ── Inline error ───────────────────────────────────────────────────────────
function ErrorMsg({ message }: { message: string }) {
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: `${T.danger}10`, border: `1px solid ${T.danger}28`,
      marginBottom: 14, fontSize: 13, color: T.danger, fontWeight: 500,
    }}>{message}</div>
  );
}

// ── Cancel link ────────────────────────────────────────────────────────────
function CancelLink({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ textAlign: "center", marginTop: 14, fontSize: 13.5, color: T.muted, fontWeight: 500, cursor: "pointer" }}
    >Annuler</div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Screen R · Modifier le pseudo
// ══════════════════════════════════════════════════════════════════════════
function EditUsername({ currentHandle, onCancel }: { currentHandle: string; onCancel: () => void }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [state, formAction, pending] = useActionState(updateDisplayName, initialProfileActionState);

  const isValid = /^[a-z0-9_]{3,24}$/i.test(handle);

  useEffect(() => {
    if (state.status === "success") router.push("/settings");
  }, [state.status, router]);

  return (
    <>
      <AppBar title="Modifier le pseudo"/>
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" }}>
        <CurrentChip label="Actuel :" value={`@${currentHandle}`} mono/>

        <form action={formAction}>
          {/* hidden field sends cleaned handle as fullName */}
          <input type="hidden" name="fullName" value={handle}/>
          <Field
            label="Nouveau pseudo"
            placeholder="nouveau_pseudo"
            focused
            onChange={setHandle}
            hint="3–24 caractères · lettres, chiffres, _ uniquement"
          />

          {handle.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: -6, marginBottom: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isValid ? "#16a34a" : T.danger }}/>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: isValid ? "#16a34a" : T.danger,
                fontFamily: '"Geist Mono",monospace',
              }}>
                {isValid ? `@${handle} est disponible` : "Format invalide"}
              </span>
            </div>
          )}

          {state.status === "error" && state.message && <ErrorMsg message={state.message}/>}

          <PrimaryBtn disabled={pending || !isValid}>Enregistrer</PrimaryBtn>
        </form>
        <CancelLink onClick={onCancel}/>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Screen S · Modifier le nom d'affichage
// ══════════════════════════════════════════════════════════════════════════
function EditName({ currentName, onCancel }: { currentName: string; onCancel: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateDisplayName, initialProfileActionState);

  useEffect(() => {
    if (state.status === "success") router.push("/settings/profile");
  }, [state.status, router]);

  return (
    <>
      <AppBar title="Modifier le nom"/>
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" }}>
        <CurrentChip label="Actuel :" value={currentName || "—"}/>

        <form action={formAction}>
          <Field
            name="fullName"
            label="Nouveau nom"
            defaultValue={currentName}
            focused
            hint="Affiché sur tes avis et la carte communautaire"
          />
          <Note>Ce nom est public — visible par tous les utilisateurs de la carte.</Note>

          {state.status === "error" && state.message && <ErrorMsg message={state.message}/>}

          <PrimaryBtn disabled={pending}>Enregistrer</PrimaryBtn>
        </form>
        <CancelLink onClick={onCancel}/>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Screens T · U · Modifier l'email
// ══════════════════════════════════════════════════════════════════════════
function EditEmail({ currentEmail, onCancel }: { currentEmail: string; onCancel: () => void }) {
  const [sent, setSent] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [state, formAction, pending] = useActionState(updateEmail, initialProfileActionState);

  useEffect(() => {
    if (state.status === "success") {
      setSent(true);
      setCooldown(45);
    }
  }, [state.status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Screen U ───────────────────────────────────────────────────────────
  if (sent) {
    return (
      <>
        <AppBar title="Modifier l'email"/>
        <div style={{
          padding: "32px 28px", minHeight: "calc(100dvh - 60px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, marginBottom: 24,
            background: `linear-gradient(135deg,${GREEN},${GREEN_D})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 36px rgba(0,107,60,0.28)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.7, color: T.fg, marginBottom: 10, textAlign: "center" }}>
            Vérifie tes mails
          </div>
          <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, textAlign: "center", marginBottom: 8 }}>
            Un lien de confirmation a été envoyé à
          </div>
          <div style={{
            fontSize: 14.5, fontWeight: 700, color: T.fg,
            fontFamily: '"Geist Mono",monospace',
            padding: "6px 14px", borderRadius: 8,
            background: T.surfaceSolid, border: `1px solid ${T.border}`,
            marginBottom: 28,
          }}>{newEmail}</div>

          <div style={{ fontSize: 12.5, color: T.muted, textAlign: "center", lineHeight: 1.6, marginBottom: 32 }}>
            Clique sur le lien dans le mail pour confirmer.
            <br/>Ton email actuel reste actif entre-temps.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted }}>
            <span>Pas reçu ?</span>
            {cooldown > 0 ? (
              <>
                <span style={{ fontWeight: 700, color: T.subtle }}>Renvoyer</span>
                <span style={{ fontSize: 11.5, color: T.subtle, fontFamily: '"Geist Mono",monospace' }}>
                  (dans {cooldown}s)
                </span>
              </>
            ) : (
              <span
                style={{
                  fontWeight: 700, color: ACCENT,
                  borderBottom: `1px solid ${ACCENT}55`, paddingBottom: 1, cursor: "pointer",
                }}
                onClick={() => { setSent(false); }}
              >Renvoyer</span>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Screen T ───────────────────────────────────────────────────────────
  return (
    <>
      <AppBar title="Modifier l'email"/>
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" }}>
        <Field label="Email actuel" value={currentEmail} readOnly/>
        <Divider/>

        <form action={formAction}>
          <Field
            name="email"
            type="email"
            label="Nouvel email"
            placeholder="nouveau@exemple.com"
            focused
            onChange={setNewEmail}
            hint="Un lien de confirmation sera envoyé à cette adresse"
          />
          <Note>Ton email actuel reste actif jusqu'à la confirmation du nouveau.</Note>

          {state.status === "error" && state.message && <ErrorMsg message={state.message}/>}

          <PrimaryBtn disabled={pending}>Envoyer le lien de confirmation</PrimaryBtn>
        </form>
        <CancelLink onClick={onCancel}/>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Screens V · W · Changer le mot de passe
// ══════════════════════════════════════════════════════════════════════════
function EditPassword({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [changed, setChanged] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [state, formAction, pending] = useActionState(updatePassword, initialProfileActionState);

  useEffect(() => {
    if (state.status === "success") setChanged(true);
  }, [state.status]);

  const match = confirmPw.length > 0 && newPw === confirmPw;
  const canSubmit = !pending && oldPw.length > 0 && newPw.length >= 8 && match;

  // ── Screen W ───────────────────────────────────────────────────────────
  if (changed) {
    return (
      <>
        <AppBar title="Changer le mot de passe"/>
        <div style={{
          padding: "32px 28px", minHeight: "calc(100dvh - 60px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, marginBottom: 24,
            background: "linear-gradient(135deg,#130b02,#2c1a07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 36px rgba(19,11,2,0.35)",
            position: "relative",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="#fdecc5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <div style={{
              position: "absolute", bottom: -6, right: -6,
              width: 22, height: 22, borderRadius: "50%",
              background: "#16a34a", border: `2.5px solid ${T.canvas}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.7, color: T.fg, marginBottom: 10, textAlign: "center" }}>
            Mot de passe mis à jour
          </div>
          <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, textAlign: "center", marginBottom: 32 }}>
            Ton mot de passe a été modifié avec succès.
            <br/>Tu restes connecté sur cet appareil.
          </div>

          <div style={{
            width: "100%", padding: "12px 14px", borderRadius: 12,
            background: T.surfaceSolid, border: `1px solid ${T.border}`,
            display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 28,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Les autres sessions actives ont été déconnectées pour ta sécurité.
            </span>
          </div>

          <PrimaryBtn type="button" onClick={() => router.push("/settings")}>
            Retour aux paramètres
          </PrimaryBtn>
        </div>
      </>
    );
  }

  // ── Screen V ───────────────────────────────────────────────────────────
  return (
    <>
      <AppBar title="Changer le mot de passe"/>
      <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column" }}>
        <form action={formAction}>
          <Field
            name="oldPassword"
            type={showOld ? "text" : "password"}
            label="Mot de passe actuel"
            value={oldPw}
            onChange={setOldPw}
            trailing={<Eye visible={showOld} onToggle={() => setShowOld(s => !s)}/>}
          />
          <Divider/>

          <Field
            name="newPassword"
            type={showNew ? "text" : "password"}
            label="Nouveau mot de passe"
            value={newPw}
            onChange={setNewPw}
            focused
            trailing={<Eye visible={showNew} onToggle={() => setShowNew(s => !s)}/>}
          />
          {newPw.length > 0 && <StrengthBar password={newPw}/>}

          <Field
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            label="Confirmer le nouveau"
            value={confirmPw}
            onChange={setConfirmPw}
            trailing={<Eye visible={showConfirm} onToggle={() => setShowConfirm(s => !s)}/>}
          />

          {confirmPw.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: -6, marginBottom: 20 }}>
              {match ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.danger }}/>
              )}
              <span style={{
                fontSize: 12, fontWeight: 600, fontFamily: '"Geist Mono",monospace',
                color: match ? "#16a34a" : T.danger,
              }}>
                {match ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
              </span>
            </div>
          )}

          {state.status === "error" && state.message && <ErrorMsg message={state.message}/>}

          <PrimaryBtn disabled={!canSubmit}>Mettre à jour</PrimaryBtn>
        </form>
        <CancelLink onClick={onCancel}/>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Data loader + screen dispatcher
// ══════════════════════════════════════════════════════════════════════════
function toHandle(name: string | null) {
  if (!name) return "captain_user";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
  const first = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const lastInitial = parts[parts.length - 1][0]?.toLowerCase() ?? "";
  return `${first}_${lastInitial}`;
}

export default function EditPage({ field }: { field: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setFullName(profile?.full_name ?? null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", background: T.canvas,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '"Geist",-apple-system,system-ui,sans-serif',
      }}>
        <span style={{ fontSize: 24, color: T.muted }}>…</span>
      </div>
    );
  }

  const goBack = () => router.back();

  return (
    <div style={{
      minHeight: "100dvh", background: T.canvas,
      fontFamily: '"Geist",-apple-system,system-ui,sans-serif',
      color: T.fg,
    }}>
      {field === "username" && (
        <EditUsername currentHandle={toHandle(fullName)} onCancel={goBack}/>
      )}
      {field === "name" && (
        <EditName currentName={fullName ?? ""} onCancel={goBack}/>
      )}
      {(field === "email" || !["username", "name", "password"].includes(field)) && (
        <EditEmail currentEmail={email ?? ""} onCancel={goBack}/>
      )}
      {field === "password" && (
        <EditPassword onCancel={goBack}/>
      )}
    </div>
  );
}
