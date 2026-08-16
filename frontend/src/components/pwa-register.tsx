"use client";

import { DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const DISMISSED_AT_KEY = "nirantar-pwa-install-dismissed-at";
const DISMISSAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
    return dismissedAt > 0 && Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // Installation still works when storage is unavailable.
  }
}

export function PwaRegister() {
  const { isLoaded, isSignedIn } = useAuth();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const eligible = !isStandalone() && !wasRecentlyDismissed();
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const initializationFrame = window.requestAnimationFrame(() => {
      setDismissed(!eligible);
      setShowIosInstructions(eligible && ios);
    });

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      if (!wasRecentlyDismissed()) setDismissed(false);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowIosInstructions(false);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(initializationFrame);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => undefined);
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  const dismiss = () => {
    rememberDismissal();
    setDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) {
      dismiss();
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      rememberDismissal();
    }
    setDismissed(true);
  };

  const visible =
    isLoaded &&
    isSignedIn &&
    !dismissed &&
    (installPrompt !== null || showIosInstructions);

  if (!visible) return null;

  return (
    <aside className="pwa-install-prompt" aria-labelledby="pwa-install-title">
      <button
        type="button"
        className="pwa-install-close"
        aria-label="Dismiss install suggestion"
        onClick={dismiss}
      >
        <XIcon size={20} aria-hidden="true" />
      </button>
      <div className="pwa-install-icon" aria-hidden="true">
        <DownloadSimpleIcon size={24} weight="bold" />
      </div>
      <div className="pwa-install-copy">
        <h2 id="pwa-install-title">Add Nirantar to your home screen</h2>
        <p>
          {showIosInstructions
            ? "In Safari, tap Share, then Add to Home Screen."
            : "Open your fitness log in one tap, with its own app window."}
        </p>
      </div>
      <button type="button" className="button-primary" onClick={install}>
        {showIosInstructions ? "Got it" : "Install Nirantar"}
      </button>
    </aside>
  );
}
