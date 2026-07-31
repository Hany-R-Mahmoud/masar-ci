"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  buildAndroidBrowserIntent,
  buildHashTransportUrl,
  getPwaEnvironment,
  getPwaSurface,
  getSafeStorage,
  hasRecentDismissal,
  hasRecentInstalledHint,
  isStandaloneDisplayMode,
  recordDismissal,
  recordInstalledHint,
  restoreHashFromTransport,
  type PwaEnvironment,
  type PwaSurface,
} from "@/lib/pwa";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaContextValue = {
  environment: PwaEnvironment;
  surface: PwaSurface;
  isPromotionVisible: boolean;
  isHelpVisible: boolean;
  shouldOfferInstall: boolean;
  canPromptInstall: boolean;
  dismissPromotion: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  install: () => Promise<void>;
  openInBrowser: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa(): PwaContextValue {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider");
  return context;
}

export default function PwaProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [environment, setEnvironment] = useState<PwaEnvironment>(() => getPwaEnvironment());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPromotionVisible, setPromotionVisible] = useState(false);
  const [isHelpVisible, setHelpVisible] = useState(false);
  const [installedHint, setInstalledHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const surface = getPwaSurface(environment);
  const shouldOfferInstall = hydrated && surface !== "standalone" && !installedHint;

  useEffect(() => {
    restoreHashFromTransport();
    const storage = getSafeStorage();
    const refreshEnvironment = () => setEnvironment(getPwaEnvironment());
    refreshEnvironment();
    setInstalledHint(hasRecentInstalledHint(storage));
    setHydrated(true);

    const maybePromote = window.setTimeout(() => {
      if (!isStandaloneDisplayMode() && !hasRecentInstalledHint(storage) && !hasRecentDismissal(storage)) {
        setPromotionVisible(true);
      }
    }, 900);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      recordInstalledHint(storage);
      setDeferredPrompt(null);
      setPromotionVisible(false);
      setHelpVisible(false);
      setInstalledHint(true);
      refreshEnvironment();
    };
    const onPageShow = () => refreshEnvironment();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("visibilitychange", refreshEnvironment);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js", { scope: "/" });
      }, { once: true });
    }

    return () => {
      window.clearTimeout(maybePromote);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("visibilitychange", refreshEnvironment);
    };
  }, []);

  const dismissPromotion = () => {
    recordDismissal(getSafeStorage());
    setPromotionVisible(false);
  };

  const openHelp = () => {
    setPromotionVisible(false);
    setHelpVisible(true);
  };

  const closeHelp = () => setHelpVisible(false);

  const install = async () => {
    if (!deferredPrompt) {
      openHelp();
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "dismissed") openHelp();
  };

  const openInBrowser = () => {
    if (typeof window === "undefined") return;
    const url = buildHashTransportUrl(window.location.href);
    if (environment.isAndroid) {
      window.location.href = buildAndroidBrowserIntent(url);
      window.setTimeout(() => {
        if (document.visibilityState === "visible") openHelp();
      }, 900);
      return;
    }
    openHelp();
  };

  const value = useMemo<PwaContextValue>(() => ({
    environment,
    surface,
    isPromotionVisible,
    isHelpVisible,
    shouldOfferInstall,
    canPromptInstall: deferredPrompt !== null,
    dismissPromotion,
    openHelp,
    closeHelp,
    install,
    openInBrowser,
  }), [deferredPrompt, environment, installedHint, isHelpVisible, isPromotionVisible, shouldOfferInstall, surface]);

  return (
    <PwaContext.Provider value={value}>
      {children}
      {shouldOfferInstall && (isPromotionVisible || isHelpVisible) ? <PwaInstallPrompt /> : null}
    </PwaContext.Provider>
  );
}
