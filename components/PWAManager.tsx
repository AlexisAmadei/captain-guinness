"use client";

import { useEffect, useState } from "react";

/**
 * Minimal `beforeinstallprompt` typing — not yet in lib.dom.d.ts.
 * Fired by Chromium browsers when the PWA is installable.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

export function PWAManager() {
  // --- service worker update flow ---
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // --- install prompt flow ---
  // Environment facts are read once via lazy initializers so the values are
  // available before paint without a synchronous setState in an effect.
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(detectIOS);
  const [isStandalone] = useState(detectStandalone);
  const [showInstall, setShowInstall] = useState(() => {
    // iOS has no beforeinstallprompt — show manual instructions on first visit.
    if (typeof window === "undefined") return false;
    if (detectStandalone()) return false;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "1") return false;
    return detectIOS();
  });

  // Register the service worker and wire up update detection.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    // When the active worker changes (after the user accepts an update),
    // reload once so the page runs the new code.
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        // A worker already waiting (e.g. installed on a previous visit).
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }

        // A new worker started installing — watch it reach "installed".
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
            }
          });
        });
      })
      .catch(() => {
        /* registration failure is non-fatal */
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  // Listen for the Chromium install prompt (iOS handled via lazy state above).
  useEffect(() => {
    if (isStandalone || isIOS) return;
    if (localStorage.getItem(INSTALL_DISMISSED_KEY) === "1") return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setShowInstall(false);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isStandalone, isIOS]);

  const applyUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setWaitingWorker(null);
    // controllerchange listener reloads the page once the new worker is active.
  };

  const triggerInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setShowInstall(false);
  };

  const dismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    setShowInstall(false);
  };

  return (
    <>
      {waitingWorker && (
        <UpdatePrompt onReload={applyUpdate} />
      )}
      {showInstall && !isStandalone && (
        <InstallPrompt
          isIOS={isIOS}
          canPrompt={!!installEvent}
          onInstall={triggerInstall}
          onDismiss={dismissInstall}
        />
      )}
    </>
  );
}

const cardBase: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1000000,
  width: "min(24rem, calc(100vw - 1.5rem))",
  background: "#fffaf3",
  borderRadius: 16,
  boxShadow: "0 24px 70px rgba(61,36,9,0.20)",
  border: "1px solid #e4d4bb",
  padding: "14px 16px",
  animation: "pwaPromptIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
};

const darkButton: React.CSSProperties = {
  height: 36,
  padding: "0 16px",
  borderRadius: 9,
  background: "#130b02",
  border: "none",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#fdecc5",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15,23,42,0.20)",
};

const ghostButton: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 9,
  background: "transparent",
  border: "1.5px solid #e4d4bb",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 500,
  color: "#231608",
  cursor: "pointer",
};

function UpdatePrompt({ onReload }: { onReload: () => void }) {
  return (
    <div
      role="alert"
      style={{
        ...cardBase,
        top: "calc(env(safe-area-inset-top) + 0.75rem)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#231608" }}>
          Nouvelle version disponible
        </div>
        <div style={{ fontSize: 12.5, color: "#7a6248", marginTop: 2 }}>
          Rechargez pour mettre à jour l&apos;application.
        </div>
      </div>
      <button onClick={onReload} style={darkButton}>
        Recharger
      </button>
    </div>
  );
}

function InstallPrompt({
  isIOS,
  canPrompt,
  onInstall,
  onDismiss,
}: {
  isIOS: boolean;
  canPrompt: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      style={{
        ...cardBase,
        bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "#231608" }}>
            Installer Captain Guinness
          </div>
          {isIOS ? (
            <div style={{ fontSize: 12.5, color: "#7a6248", marginTop: 4, lineHeight: 1.45 }}>
              Touchez{" "}
              <span aria-label="Partager" style={{ fontWeight: 700 }}>
                Partager&nbsp;⎋
              </span>{" "}
              puis «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;»{" "}
              <span aria-label="Ajouter">➕</span>.
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "#7a6248", marginTop: 4 }}>
              Ajoutez l&apos;app à votre écran d&apos;accueil pour un accès rapide.
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Fermer"
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 14,
            border: "1px solid #e4d4bb",
            background: "#fffaf3",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            color: "#7a6248",
          }}
        >
          ×
        </button>
      </div>

      {!isIOS && canPrompt && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onDismiss} style={{ ...ghostButton, flex: 1 }}>
            Plus tard
          </button>
          <button onClick={onInstall} style={{ ...darkButton, flex: 1 }}>
            Installer
          </button>
        </div>
      )}
    </div>
  );
}
