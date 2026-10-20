const CACHE_NAME = "coc-twi-hymnal-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

const HYMN_FILES = Array.from(
  { length: 80 },
  (_, i) => "./hymn" + String(i + 1).padStart(3, "0") + ".txt"
);

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Save the main app files.
      await cache.addAll(APP_FILES);

      // Save the hymns that are available.
      await Promise.all(
        HYMN_FILES.map(async file => {
          try {
            const response = await fetch(file);

            if (response.ok) {
              await cache.put(file, response);
            }
          } catch (error) {
            // Continue if a hymn cannot be downloaded.
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("coc-twi-hymnal-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);

      if (cached) return cached;

      try {
        const response = await fetch(event.request);

        if (
          response.ok &&
          new URL(event.request.url).origin ===
            self.location.origin
        ) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        if (event.request.mode === "navigate") {
          const home = await caches.match("./index.html");

          if (home) return home;
        }

        return new Response(
          "This file is not available offline yet. Connect to the internet and open the hymnal again.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
