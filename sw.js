const CACHE = "coc-twi-hymnal-v3";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

for (let i = 1; i <= 80; i++) {
  FILES.push("./hymn" + String(i).padStart(3, "0") + ".txt");
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    await cache.addAll([
      "./",
      "./index.html",
      "./manifest.json"
    ]);

    await Promise.all(
      FILES.slice(3).map(async file => {
        try {
          const response = await fetch(file);

          if (response.ok) {
            await cache.put(file, response);
          }
        } catch (error) {
          // Continue if an individual hymn file is unavailable.
        }
      })
    );
  })());

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("coc-twi-hymnal-") &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        if (
          response.ok &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const copy = response.clone();

          caches.open(CACHE).then(cache =>
            cache.put(event.request, copy)
          );
        }

        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
