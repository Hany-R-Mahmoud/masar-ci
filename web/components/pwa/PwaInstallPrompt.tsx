"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/pwa";
import { usePwa } from "@/components/pwa/PwaProvider";

export function PwaInstallPrompt() {
  const { environment, surface, isPromotionVisible, isHelpVisible, dismissPromotion, openHelp, closeHelp, install, openInBrowser } = usePwa();
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const isWebView = surface === "webview";

  useEffect(() => {
    if (!isHelpVisible) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeHelp();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [closeHelp, isHelpVisible]);

  const copyUrl = async () => {
    const didCopy = await copyText(currentUrl);
    setCopied(didCopy);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (isHelpVisible) {
    return (
      <div className="pwa-install-overlay" role="presentation">
        <div className="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" tabIndex={-1} ref={dialogRef}>
          <button type="button" className="pwa-install-close" onClick={closeHelp} aria-label="Close install instructions">×</button>
          <p className="pwa-install-eyebrow">MasarCI / install</p>
          <h2 id="pwa-install-title">Keep MasarCI close.</h2>
          {isWebView ? (
            <>
              <p>This messenger browser cannot install the app directly. Open this page in Chrome or Safari first.</p>
              <button type="button" className="pwa-install-primary" onClick={openInBrowser}>{environment.isAndroid ? "Open in Chrome" : "Open browser"}</button>
              <p className="pwa-install-note">If your host blocks that handoff, copy the link and paste it into your browser.</p>
            </>
          ) : environment.isIos ? (
            <>
              <p>In Safari, tap Share, choose <strong>Add to Home Screen</strong>, then confirm Add.</p>
              <p className="pwa-install-note">The install prompt is controlled by iOS; this is the supported path for iPhone and iPad.</p>
            </>
          ) : (
            <>
              <p>Use your browser menu and choose <strong>Install MasarCI</strong> or <strong>Add to Home screen</strong>.</p>
              <button type="button" className="pwa-install-primary" onClick={() => void install()}>Try browser install</button>
            </>
          )}
          <label className="pwa-install-link-label" htmlFor="pwa-install-url">Page link</label>
          <div className="pwa-install-link-row">
            <input id="pwa-install-url" value={currentUrl} readOnly onFocus={(event) => event.currentTarget.select()} aria-label="Page link" />
            <button type="button" className="pwa-install-copy" onClick={() => void copyUrl}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <button type="button" className="pwa-install-secondary" onClick={closeHelp}>Close</button>
        </div>
      </div>
    );
  }

  if (!isPromotionVisible) return null;
  return (
    <aside className="pwa-install-promotion" role="status" aria-live="polite">
      <div>
        <p className="pwa-install-eyebrow">MasarCI / ready when you are</p>
        <strong>Keep the workflow builder one tap away.</strong>
      </div>
      <div className="pwa-install-promotion-actions">
        <button type="button" className="pwa-install-primary" onClick={() => void (isWebView ? openHelp() : install())}>{isWebView ? "How to install" : "Install"}</button>
        <button type="button" className="pwa-install-secondary" onClick={openHelp}>How to install</button>
        <button type="button" className="pwa-install-dismiss" onClick={dismissPromotion}>Later</button>
      </div>
    </aside>
  );
}
