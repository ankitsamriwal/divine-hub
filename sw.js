/* Divine Hub service worker — offline-capable shell */
const CACHE = 'divine-hub-v27';
const CORE = [
  './',
  './index.html',
  './styles.css?v=26',
  './backnav.js?v=26',
  './app.js?v=26',
  './focus.js?v=26',
  './journeys.js?v=26',
  './sadhana.js?v=26',
  './quizzes.js?v=26',
  './almanac.js?v=26',
  './sandhya.js?v=26',
  './ambience.js?v=26',
  './assets/bells.mp3',
  './data.js?v=26',
  './data2.js?v=26',
  './data3.js?v=26',
  './festivals.js?v=26',
  './guides.js?v=26',
  './why.js?v=26',
  './japa.js?v=26',
  './sections.js?v=26',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'divine-guide.ankitsamriwal.workers.dev') return; // guide API: always live

  // navigations: network first, fall back to cached shell when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // static assets: cache first, then network (and cache the result)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
