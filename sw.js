const CACHE_NAME = "controle-vendas-pwa-v5";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Intencionalmente não interceptamos fetch().
// A página, os scripts e as chamadas ao Supabase devem usar a rede normal.
// Isso evita que um erro do Service Worker deixe o aplicativo preso em
// "Conectando..." ou substitua a página por um arquivo de cache inadequado.
