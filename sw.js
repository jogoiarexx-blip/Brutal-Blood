const VERSION = '0.26.0';
const CACHE = `brutal-blood-${VERSION}`;
const CORE = [
  './', './index.html', './css/style.css', './js/app.js',
  './favicon.svg', './manifest.webmanifest', './icons/icon-180.png',
  './assets/ui/menu-bg.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    // Revalidate code on every visit so a GitHub Pages deploy cannot be masked
    // by the browser HTTP cache or by an older service-worker response.
    const fresh = await fetch(new Request(request, { cache: 'no-cache' }));
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return (await cache.match(request)) || (request.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await refresh) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isCode = request.mode === 'navigate' ||
    url.pathname.endsWith('.html') || url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') || url.pathname.endsWith('.webmanifest');

  event.respondWith(isCode ? networkFirst(request) : staleWhileRevalidate(request));
});
