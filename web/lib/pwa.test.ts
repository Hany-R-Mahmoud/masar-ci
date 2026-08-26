import { describe, expect, it } from "vitest";
import {
  buildAndroidBrowserIntent,
  buildHashTransportUrl,
  clearDevelopmentPwaState,
  getPwaSurface,
  hasRecentDismissal,
  isEmbeddedWebView,
  isTimestampRecent,
  PWA_STORAGE_KEYS,
  type PwaCleanupRuntime,
} from "@/lib/pwa";

describe("PWA runtime helpers", () => {
  it("expires dismissal timestamps and rejects future timestamps", () => {
    const now = 1_000_000;
    expect(isTimestampRecent(now - 1_000, 2_000, now)).toBe(true);
    expect(isTimestampRecent(now - 2_000, 2_000, now)).toBe(false);
    expect(isTimestampRecent(now + 1, 2_000, now)).toBe(false);
  });

  it("tolerates blocked storage", () => {
    const storage = { getItem() { throw new Error("blocked"); } } as unknown as Storage;
    expect(hasRecentDismissal(storage)).toBe(false);
  });

  it("detects embedded browsers without treating them as installable", () => {
    expect(isEmbeddedWebView("Mozilla/5.0 FBAV/480.0.0.0.56 Messenger")).toBe(true);
    expect(isEmbeddedWebView("Mozilla/5.0 Version/4.0 Chrome/120.0 Mobile Safari/537.36")).toBe(true);
    expect(getPwaSurface({ isIos: false, isAndroid: true, isStandalone: false, isEmbeddedWebView: true })).toBe("webview");
    expect(getPwaSurface({ isIos: false, isAndroid: true, isStandalone: false, isEmbeddedWebView: false })).toBe("android");
  });

  it("preserves the full URL in Android browser intents", () => {
    const intent = buildAndroidBrowserIntent("https://masarci.example/workstation?tab=one#canvas");
    expect(intent).toContain("package=com.android.chrome");
    expect(intent).toContain(encodeURIComponent("https://masarci.example/workstation?tab=one#canvas"));
  });

  it("transports hash routes through hosts that strip fragments", () => {
    const transported = new URL(buildHashTransportUrl("https://masarci.example/workstation#canvas"));
    expect(transported.hash).toBe("");
    expect(transported.searchParams.get("__pwa_hash")).toBe("canvas");
    expect(PWA_STORAGE_KEYS.dismissedAt).toBe("masarci:pwa-dismissed-at");
  });

  it("removes only MasarCI service workers and caches during development", async () => {
    // Given
    const removed: string[] = [];
    const runtime: PwaCleanupRuntime = {
      listRegistrations: async () => [
        {
          scriptUrl: "http://localhost:3000/sw.js",
          unregister: async () => {
            removed.push("worker");
            return true;
          },
        },
        {
          scriptUrl: "http://localhost:3000/other-sw.js",
          unregister: async () => {
            removed.push("other-worker");
            return true;
          },
        },
      ],
      listCaches: async () => ["masarci-shell-v2", "other-cache"],
      deleteCache: async (name) => {
        removed.push(name);
        return true;
      },
    };

    // When
    await clearDevelopmentPwaState(runtime);

    // Then
    expect(removed).toEqual(["worker", "masarci-shell-v2"]);
  });
});
