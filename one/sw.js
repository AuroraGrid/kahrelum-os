const CACHE = 'kahrelum-one-shell-v1';
const SHELL = ['/one/', '/one/index.html', '/one/styles.css', '/one/app.js', '/one/manifest.webmanifest', '/one/icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && url.pathname.startsWith('/one/')) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
