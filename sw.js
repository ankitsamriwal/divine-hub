/* Divine Hub service worker — offline-capable shell */
const CACHE = 'divine-hub-v38';
const CORE = [
  './',
  './index.html',
  './styles.css?v=38',
  './backnav.js?v=38',
  './app.js?v=38',
  './focus.js?v=38',
  './journeys.js?v=38',
  './sadhana.js?v=38',
  './plus.js?v=38',
  './sankalp.js?v=38',
  './quizzes.js?v=38',
  './almanac.js?v=38',
  './panchang.js?v=38',
  './sandhya.js?v=38',
  './ambience.js?v=38',
  './assets/bells.mp3',
  './assets/hanuman-aarti.mp3',
  './data.js?v=38',
  './data2.js?v=38',
  './data3.js?v=38',
  './data4.js?v=38',
  './festivals.js?v=38',
  './guides.js?v=38',
  './why.js?v=38',
  './japa.js?v=38',
  './sections.js?v=38',
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

/* panchang reminder push: worker sends a payload-less tick; fetch the fired tithi */
self.addEventListener('push', e => {
  const fallback = () => self.registration.showNotification('🌙 Panchang reminder', {
    body: "Open Divine Hub for today's tithi, rituals and mantra jaap.",
    icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: './' }
  });
  e.waitUntil(
    fetch('https://divine-guide.ankitsamriwal.workers.dev/dh-push-data', { headers: { 'x-push-key': '1OI7dIZ5gi9od8fMsp6xBeMo16iYSfS2' } })
      .then(r => r.json())
      .then(d => {
        const last = d && d.last;
        const title = last && last.tithi ? '🌙 ' + last.paksha + ' ' + last.tithi + ' today' : '🌙 Panchang reminder';
        const body = last && last.tithi
          ? "Your reminder: " + last.paksha + ' ' + last.tithi + " today. Open for the day's rituals and mantra jaap."
          : "Open Divine Hub for today's tithi, rituals and mantra jaap.";
        return self.registration.showNotification(title, {
          body: body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', data: { url: './' }
        });
      })
      .catch(fallback)
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.openWindow(url));
});
