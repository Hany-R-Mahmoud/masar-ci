export const PWA_STORAGE_KEYS = {
  dismissedAt: "masarci:pwa-dismissed-at",
  installedAt: "masarci:pwa-installed-at",
} as const;

export const PWA_TIMING = {
  dismissalCooldownMs: 7 * 24 * 60 * 60 * 1000,
  installedHintTtlMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export type PwaSurface = "ios" | "android" | "standalone" | "webview" | "browser";

export type PwaEnvironment = {
  isIos: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  isEmbeddedWebView: boolean;
};

function getNavigator(): Navigator | null {
  return typeof navigator === "undefined" ? null : navigator;
}

export function getSafeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const appleStandalone = (getNavigator() as Navigator & { standalone?: boolean } | null)?.standalone === true;
  return window.matchMedia?.("(display-mode: standalone)").matches === true || appleStandalone;
}

export function isEmbeddedWebView(userAgent = getNavigator()?.userAgent ?? ""): boolean {
  const ua = userAgent.toLowerCase();
  if (/fbav|fban|instagram|messenger|line\/|linkedinapp|micromessenger|twitter|pinterest|snapchat|tiktok/.test(ua)) return true;
  return /;\s*wv\)|\bwv\b/.test(ua) || /version\/\d[\d.]* chrome\/\d/.test(ua);
}

export function getPwaEnvironment(): PwaEnvironment {
  const ua = getNavigator()?.userAgent ?? "";
  return {
    isIos: /iphone|ipad|ipod/.test(ua.toLowerCase()),
    isAndroid: /android/.test(ua.toLowerCase()),
    isStandalone: isStandaloneDisplayMode(),
    isEmbeddedWebView: isEmbeddedWebView(ua),
  };
}

export function getPwaSurface(environment: PwaEnvironment): PwaSurface {
  if (environment.isStandalone) return "standalone";
  if (environment.isEmbeddedWebView) return "webview";
  if (environment.isIos) return "ios";
  if (environment.isAndroid) return "android";
  return "browser";
}

function readTimestamp(key: string, storage: Storage | null): number | null {
  if (!storage) return null;
  try {
    const value = Number(storage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeTimestamp(key: string, storage: Storage | null): void {
  if (!storage) return;
  try {
    storage.setItem(key, String(Date.now()));
  } catch {
    // Private browsing and blocked storage are valid browser states.
  }
}

export function isTimestampRecent(
  timestamp: number | null,
  maxAgeMs: number,
  now = Date.now(),
): boolean {
  return timestamp !== null && timestamp <= now && now - timestamp < maxAgeMs;
}

export function hasRecentDismissal(storage: Storage | null, now = Date.now()): boolean {
  return isTimestampRecent(readTimestamp(PWA_STORAGE_KEYS.dismissedAt, storage), PWA_TIMING.dismissalCooldownMs, now);
}

export function hasRecentInstalledHint(storage: Storage | null, now = Date.now()): boolean {
  return isTimestampRecent(readTimestamp(PWA_STORAGE_KEYS.installedAt, storage), PWA_TIMING.installedHintTtlMs, now);
}

export function recordDismissal(storage: Storage | null): void {
  writeTimestamp(PWA_STORAGE_KEYS.dismissedAt, storage);
}

export function recordInstalledHint(storage: Storage | null): void {
  writeTimestamp(PWA_STORAGE_KEYS.installedAt, storage);
}

export function buildAndroidBrowserIntent(url: string): string {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(":", "");
  const target = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  return `intent://${target}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(parsed.toString())};end`;
}

export function buildHashTransportUrl(url: string): string {
  const parsed = new URL(url);
  if (!parsed.hash) return parsed.toString();
  const hash = parsed.hash.slice(1);
  parsed.hash = "";
  parsed.searchParams.set("__pwa_hash", hash);
  return parsed.toString();
}

export function restoreHashFromTransport(): void {
  if (typeof window === "undefined") return;
  const parsed = new URL(window.location.href);
  const transportedHash = parsed.searchParams.get("__pwa_hash");
  if (!transportedHash) return;
  parsed.searchParams.delete("__pwa_hash");
  parsed.hash = transportedHash;
  window.history.replaceState(null, "", parsed.toString());
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the selection-based fallback.
  }

  try {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  } catch {
    return false;
  }
}
