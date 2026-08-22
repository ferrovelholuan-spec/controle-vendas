const CACHE_NAME = "ferro-velho-pwa-v3";

const FILES_TO_CACHE = [
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Sempre busca a aplicação atualizada na rede. Isso evita que o Android
  // continue usando uma versão antiga do Controle de Vendas.
  if (request.mode === "navigate" || request.url.endsWith("/index.html")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match("./manifest.json"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});