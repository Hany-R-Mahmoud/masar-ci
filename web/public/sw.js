const CACHE_PREFIX = "masarci-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const IS_LOCAL = LOCAL_HOSTS.has(self.location.hostname);
const APP_SHELL = [
  "/",
  "/workstation",
  "/workstation/actions",
  "/workstation/docker",
  "/workstation/kubernetes",
  "/workstation/terraform",
  "/manifest.webmanifest",
  "/icons/masar-ci-192.png",
  "/icons/masar-ci-512.png",
  "/masar-ci.png",
];

function shouldBypass(url, request) {
  if (url.origin !== self.location.origin || request.method !== "GET") return true;
  return url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/oauth/") ||
    url.pathname.startsWith("/downloads/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname === "/sw.js" ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("__nextDefaultLocale");
}

function isDocumentRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

self.addEventListener("install", (event) => {
  if (IS_LOCAL) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && (IS_LOCAL || key !== CACHE_NAME))
        .map((key) => caches.delete(key))))
      .then(() => IS_LOCAL ? self.registration.unregister() : self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_LOCAL) return;
  const request = event.request;
  const url = new URL(request.url);
  if (shouldBypass(url, request)) return;

  if (isDocumentRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && APP_SHELL.includes(url.pathname)) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/"))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })));
  }
});
