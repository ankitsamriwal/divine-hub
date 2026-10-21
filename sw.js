/* Divine Hub service worker — offline-capable shell */
const CACHE = 'divine-hub-v53';
const CORE = [
  './',
  './index.html',
  './styles.css?v=53',
  './config.js?v=48',
  './data.js?v=46',
  './data2.js?v=46',
  './data3.js?v=46',
  './data4.js?v=46',
  './data5.js?v=46',
  './data6.js?v=46',
  './data7.js?v=46',
  './data8.js?v=46',
  './festivals.js?v=46',
  './guides.js?v=46',
  './why.js?v=46',
  './audio.js?v=49',
  './aura.js?v=51',
  './app.js?v=51',
  './focus.js?v=46',
  './journeys.js?v=50',
  './sadhana.js?v=50',
  './plus.js?v=48',
  './sankalp.js?v=50',
  './quizzes.js?v=46',
  './almanac.js?v=50',
  './sandhya.js?v=50',
  './japa.js?v=50',
  './panchang.js?v=51',
  './muhurat.js?v=47',
  './diwali.js?v=50',
  './sections.js?v=50',
  './ambience.js?v=46',
  './deities.js?v=50',
  './session.js?v=51',
  './calendar.js?v=50',
  './library.js?v=50',
  './today.js?v=50',
  './shell.js?v=52',
  './backnav.js?v=50',
  './privacy.html',
  './assets/bells.mp3',
  './assets/hanuman-aarti.mp3',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap'
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
  if (url.hostname === 'divine-guide.ankitsamriwal.workers.dev') return; // guide + Plus API: always live
  if (/\.(apk|zip)$/i.test(url.pathname)) return; // never cache downloads

  // navigations: network first, fall back to cached shell when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // static assets: cache first, then network (and cache the result).
  // cdnjs (three.js for the deity aura, aura.js) is not cached: network only; offline the aura falls back to its static SVG.
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
