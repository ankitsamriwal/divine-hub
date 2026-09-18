/* Divine Hub — Panchang calendar: running-month tithi calendar with page-flip
   month navigation, tithi detail cards (rituals + mantra jaap), and push
   reminders through the divine-guide worker's web-push routes.
   Tithis are computed on-device (Meeus-style lunar/solar positions, good to a
   few minutes of arc). The sunrise rule is used: the tithi prevailing at local
   sunrise names the day. Boundaries can wobble against Drik Panchang by a few
   hours; the UI says so. */

(function () {
  'use strict';

  var LS_REMINDERS = 'dh_panchang_reminders_v1';
  var WORKER = 'https://divine-guide.ankitsamriwal.workers.dev';
  var PUSH_KEY = '1OI7dIZ5gi9od8fMsp6xBeMo16iYSfS2';
  var VAPID_PUB = 'BCa0v0XHzyuBbO3chPPsiDu7htwIIi8K3H_1sFt7v5iiWKAChxVxAZ25UYuawwQadfsZNSUucWLr0ciqxEIwDHE';

  var TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
    'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi',
    'Chaturdashi', 'Purnima'];
  var TITHI_NAMES_K = TITHI_NAMES.slice(0, 14).concat(['Amavasya']);
  var TITHI_DEV = {
    Pratipada: 'प्रतिपदा', Dwitiya: 'द्वितीया', Tritiya: 'तृतीया', Chaturthi: 'चतुर्थी',
    Panchami: 'पंचमी', Shashthi: 'षष्ठी', Saptami: 'सप्तमी', Ashtami: 'अष्टमी',
    Navami: 'नवमी', Dashami: 'दशमी', Ekadashi: 'एकादशी', Dwadashi: 'द्वादशी',
    Trayodashi: 'त्रयोदशी', Chaturdashi: 'चतुर्दशी', Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या'
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* ---------- astronomy ---------- */
  var d2r = Math.PI / 180;
  function sinD(x) { return Math.sin(x * d2r); }
  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function nDays(date) { return (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000; }

  function sunLong(n) {
    var L0 = 280.460 + 0.9856474 * n;
    var g = 357.528 + 0.9856003 * n;
    return norm360(L0 + 1.915 * sinD(g) + 0.020 * sinD(2 * g));
  }

  /* Meeus low-precision moon, extended with the next principal terms */
  function moonLong(n) {
    var L = 218.316 + 13.176396 * n;
    var M = 134.963 + 13.064993 * n;
    var D = 297.850 + 12.190749 * n;
    var F = 93.272 + 13.229350 * n;
    var g = 357.528 + 0.9856003 * n;   // sun mean anomaly
    var A = 119.75 + 0.131 * n;        // venus perturbation term
    return norm360(L + 6.289 * sinD(M) + 1.274 * sinD(2 * D - M) + 0.658 * sinD(2 * D)
      + 0.214 * sinD(2 * M) - 0.186 * sinD(g) - 0.114 * sinD(2 * F)
      + 0.059 * sinD(2 * D - 2 * M) + 0.057 * sinD(2 * D - g - M)
      + 0.053 * sinD(2 * D + M) + 0.046 * sinD(2 * D - g) + 0.041 * sinD(M - g)
      - 0.035 * sinD(D) - 0.031 * sinD(M + g) + 0.030 * sinD(A)
      - 0.015 * sinD(2 * F - 2 * D) + 0.011 * sinD(M - 4 * D));
  }

  /* elongation moon-sun at a Date; tithi index 0-29 */
  function elongationAt(date) { return norm360(moonLong(nDays(date)) - sunLong(nDays(date))); }
  function tithiAt(date) { return Math.floor(elongationAt(date) / 12); }

  /* local sunrise approximation: 6:00 AM local time */
  function sunriseOf(y, m, d) { return new Date(y, m, d, 6, 0, 0, 0); }

  function tithiInfo(idx) {
    var waxing = idx < 15;
    return {
      index: idx,
      name: waxing ? TITHI_NAMES[idx] : TITHI_NAMES_K[idx - 15],
      paksha: waxing ? 'Shukla' : 'Krishna'
    };
  }

  /* tithi transitions touching a civil day (for the detail card timeline) */
  function tithiTimeline(y, m, d) {
    var start = new Date(y, m, d, 0, 0, 0, 0);
    var end = new Date(y, m, d + 1, 0, 0, 0, 0);
    var marks = [];
    var stepMs = 6 * 3600000;
    var prev = tithiAt(start);
    var prevT = start.getTime();
    for (var t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
      var cur = tithiAt(new Date(t));
      if (cur !== prev) {
        /* binary search the boundary to ~1 minute */
        var lo = prevT, hi = t, want = prev;
        for (var i = 0; i < 18; i++) {
          var mid = (lo + hi) / 2;
          if (tithiAt(new Date(mid)) === want) lo = mid; else hi = mid;
        }
        marks.push({ at: new Date(Math.round(hi / 60000) * 60000), from: prev, to: cur });
        prev = cur;
      }
      prevT = t;
    }
    return marks;
  }

  /* ---------- tithi content: rituals, mantra jaap, guidance ---------- */
  function C(o) { return o; }
  var TITHI_GUIDE = {
    'Purnima': C({
      deity: 'Vishnu · Chandra', glyph: '●', important: true,
      dev: 'पूर्णिमा',
      about: 'The full moon — the brightest and most sattvic night of the month. Satyanarayan puja is traditionally performed on Purnima, and the moon is worshipped after moonrise.',
      rituals: [
        'Bathe before sunrise and wear clean, light-coloured clothes.',
        'Satyanarayan katha and puja in the evening with family; offer panchamrit and panjiri prasad.',
        'After moonrise, offer arghya (water) to Chandra from a copper vessel, facing the moon.',
        'Light a ghee diya in the puja place and near tulsi.',
        'Charity on Purnima — food, clothes or dakshina — is considered especially fruitful.'
      ],
      jaap: { mantra: 'Om Som Somaya Namah', dev: 'ॐ सोम सोमाय नमः', count: 108, note: 'Chandra mantra after moonrise; add one mala of Om Namo Narayanaya in the morning.' },
      fast: 'Many keep a Purnima vrat till moonrise — fruits and milk through the day, then prasad after the katha.'
    }),
    'Amavasya': C({
      deity: 'Pitrs · Shiva · Hanuman', glyph: '○', important: true,
      dev: 'अमावस्या',
      about: 'The new moon — a quiet, inward day dedicated to the ancestors (pitrs) and to Shiva and Hanuman. Auspicious beginnings are traditionally avoided; prayer, tarpan and charity are emphasised.',
      rituals: [
        'Offer tarpan or simple water-and-sesame remembrance to ancestors in the morning, facing south.',
        'Light a til-oil diya under a peepal tree or in the south corner of the home in the evening.',
        'Recite the Hanuman Chalisa — Amavasya is traditionally guarded by Hanuman worship.',
        'Shiva abhishek or simple water offering on a Shivling in the evening.',
        'Donate food, blankets or til (sesame) — daan on Amavasya is said to reach the pitrs.',
        'Keep the day calm: avoid starting new ventures, journeys or purchases.'
      ],
      jaap: { mantra: 'Om Namah Shivaya', dev: 'ॐ नमः शिवाय', count: 108, note: 'One mala in the evening; add 11 recitations of the Mahamrityunjaya mantra for the family\u2019s wellbeing.' },
      fast: 'Some keep an Amavasya vrat for pitru shanti — a single sattvic meal after the evening diya.'
    }),
    'Ekadashi': C({
      deity: 'Vishnu', glyph: '☾', important: true,
      dev: 'एकादशी',
      about: 'The eleventh tithi, twice a month — the day of Vishnu and the most widely kept fast in the Hindu calendar. Grains and rice are avoided; the fast is broken on Dwadashi morning (parana).',
      rituals: [
        'Fast through the day — no rice, wheat or lentils; fruits, milk, sabudana and kuttu are taken by those eating once.',
        'Vishnu puja in the morning: tulsi leaves on the deity, yellow flowers, a ghee diya.',
        'Read or listen to the Ekadashi vrat katha for the specific Ekadashi.',
        'Stay up in bhajan or japa as long as comfortable — vigil (jagran) is part of the vrata.',
        'Break the fast on Dwadashi morning within parana time, after offering food to Vishnu.'
      ],
      jaap: { mantra: 'Om Namo Bhagavate Vasudevaya', dev: 'ॐ नमो भगवते वासुदेवाय', count: 108, note: 'Three malas through the day is the traditional rhythm; even one mala with attention is accepted.' },
      fast: 'Full nirjala for the able; phalahar (fruits and milk) for most. Water-only is for the experienced.'
    }),
    'Pradosh': C({
      deity: 'Shiva', glyph: '☄', important: true, matchTithi: 'Trayodashi',
      dev: 'प्रदोष · त्रयोदशी',
      about: 'Trayodashi evening — the Pradosh kaal, roughly 1.5 hours around sunset, is Shiva\u2019s own window. Pradosh vrat is kept for Shiva\u2019s grace and the removal of obstacles.',
      rituals: [
        'Fast lightly through the day if keeping Pradosh vrat.',
        'At sunset (Pradosh kaal), bathe and visit a Shiva temple or worship at home.',
        'Abhishek with water, milk and bel-patra; offer dhatura and ak flowers if available.',
        'Light a diya before Shiva and sit facing north or east for japa.',
        'Read the Pradosh vrat katha or chapters of the Shiva Purana.'
      ],
      jaap: { mantra: 'Om Namah Shivaya', dev: 'ॐ नमः शिवाय', count: 108, note: 'Best done in the Pradosh kaal itself; 108 counts as the sun sets.' },
      fast: 'Day-long light fast, broken after the evening puja.'
    }),
    'Sankashti Chaturthi': C({
      deity: 'Ganesh', glyph: '☽', important: true, matchTithi: 'Chaturthi', matchPaksha: 'Krishna',
      dev: 'संकष्टी चतुर्थी',
      about: 'Krishna-paksha Chaturthi — Sankashti, the monthly day of Ganesh as the remover of difficulties (sankat). The fast is broken only after sighting the moon.',
      rituals: [
        'Fast through the day; the vrata is complete only after moonrise.',
        'Evening Ganesh puja: durva grass, red flowers, and modak or a sweet offering.',
        'Recite the Sankashti vrat katha and the Ganesh Atharvashirsha if time allows.',
        'After moonrise, offer arghya to the moon, then take darshan and break the fast.',
        'If the moon is hidden by clouds, darshan of a picture of the moon with a sincere prayer is accepted by tradition.'
      ],
      jaap: { mantra: 'Om Gam Ganapataye Namah', dev: 'ॐ गं गणपतये नमः', count: 108, note: '108 before the evening puja; 21 more at moonrise before breaking the fast.' },
      fast: 'Strict fast till moonrise — this is the heart of Sankashti.'
    }),
    'Chaturthi': C({
      deity: 'Ganesh', glyph: '☽', important: true, matchTithi: 'Chaturthi', matchPaksha: 'Shukla',
      dev: 'विनायक चतुर्थी',
      about: 'Shukla-paksha Chaturthi — Vinayaka Chaturthi, Ganesh\u2019s bright-fortnight day. A simple puja and modak offering keep Ganesh first among the gods in the home.',
      rituals: [
        'Morning Ganesh puja with durva, red flowers and a sweet offering.',
        'Sankalp for wisdom and obstacle-free work before beginning the day\u2019s main task.',
        'Avoid looking at the moon on Chaturthi night per the Syamantaka legend — a traditional caution, lightly held.'
      ],
      jaap: { mantra: 'Om Gam Ganapataye Namah', dev: 'ॐ गं गणपतये नमः', count: 108, note: 'One mala in the morning.' },
      fast: 'No strict fast; many eat only after the puja.'
    }),
    'Ashtami': C({
      deity: 'Durga · Kaal Bhairav', glyph: '☽', important: true, matchTithi: 'Ashtami',
      dev: 'अष्टमी',
      about: 'The eighth tithi belongs to the Goddess and to Kaal Bhairav. Krishna Ashtami (Kalashtami) is Bhairav\u2019s own day; during Navratri, Ashtami (Durga Ashtami) is the vrata\u2019s peak.',
      rituals: [
        'Durga or Bhairav worship in the morning; red flowers and a mustard-oil diya for Bhairav.',
        'Recite the Durga Saptashloki or a chapter of the Chandi path.',
        'Feed dogs on Kalashtami — Bhairav\u2019s vahana — as a traditional offering.',
        'Kanya bhoj on Navratri Ashtami if it falls in a Navratri.'
      ],
      jaap: { mantra: 'Om Dum Durgayei Namah', dev: 'ॐ दुं दुर्गायै नमः', count: 108, note: 'One mala; on Kalashtami add 11 rounds of Om Kaal Bhairavaya Namah.' },
      fast: 'Half-day or full vrat per family tradition.'
    }),
    'Chaturdashi': C({
      deity: 'Shiva', glyph: '☽', important: true, matchTithi: 'Chaturdashi', matchPaksha: 'Krishna',
      dev: 'चतुर्दशी',
      about: 'Krishna Chaturdashi is the monthly Shivratri — the night before the new moon, given to Shiva. Maha Shivratri is the great yearly form of this same night.',
      rituals: [
        'Evening Shiva abhishek with water, milk and bel-patra.',
        'Light a diya that is left burning through the night if the home tradition keeps one.',
        'Night worship in any of the four prahars, as convenient; sleep after the puja, not before.'
      ],
      jaap: { mantra: 'Om Namah Shivaya', dev: 'ॐ नमः शिवाय', count: 108, note: 'One mala in the evening; the Mahamrityunjaya 11 times for health.' },
      fast: 'Masik Shivratri vrat — fruits through the day, broken after the night puja or next morning.'
    }),
    'Pratipada': C({
      deity: 'Agni · the month ahead', glyph: '☽', important: false, matchTithi: 'Pratipada',
      dev: 'प्रतिपदा',
      about: 'The first tithi of each paksha — a day of beginnings. Shukla Pratipada after Amavasya opens several regional new years.',
      rituals: ['Light the morning diya with a small sankalp for the fortnight.', 'Begin new learning, japa routines or resolutions on Shukla Pratipada.'],
      jaap: { mantra: 'Gayatri mantra', dev: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यम्', count: 21, note: 'Begin the fortnight with Gayatri at sunrise.' },
      fast: 'No customary fast.'
    }),
    'Dwitiya': C({
      deity: 'Chandra · Yamuna', glyph: '☽', important: false, matchTithi: 'Dwitiya',
      dev: 'द्वितीया',
      about: 'The second tithi. Kartik Shukla Dwitiya is Bhai Dooj, the day of brothers and sisters.',
      rituals: ['A simple diya and family prayer in the evening.', 'Honour siblings; share a meal where possible.'],
      jaap: { mantra: 'Om Chandraya Namah', dev: 'ॐ चन्द्राय नमः', count: 27, note: 'Chandra graha mantra for a settled mind.' },
      fast: 'No customary fast.'
    }),
    'Tritiya': C({
      deity: 'Gauri · Lakshmi', glyph: '☽', important: false, matchTithi: 'Tritiya',
      dev: 'तृतीया',
      about: 'The third tithi. Akshaya Tritiya (Vaishakh Shukla Tritiya) is the year\u2019s most auspicious day for beginnings and charity — anything started on it is said to grow.',
      rituals: ['Charity of water, food or umbrellas in summer months.', 'A small Gauri or Lakshmi puja at home.'],
      jaap: { mantra: 'Om Shreem Mahalakshmiyei Namah', dev: 'ॐ श्रीं महालक्ष्म्यै नमः', count: 108, note: 'One mala for prosperity.' },
      fast: 'No customary fast.'
    }),
    'Panchami': C({
      deity: 'Saraswati · Nag devta', glyph: '☽', important: false, matchTithi: 'Panchami',
      dev: 'पंचमी',
      about: 'The fifth tithi — Saraswati\u2019s day (Vasant Panchami) and the serpent deities\u2019 day (Nag Panchami). A good day for learning, music and beginning study.',
      rituals: ['Place books or an instrument before the deity for a moment of worship.', 'Offer milk or kheer in Nag Panchami season.'],
      jaap: { mantra: 'Om Aim Saraswatyai Namah', dev: 'ॐ ऐं सरस्वत्यै नमः', count: 108, note: 'For students and practitioners of any art.' },
      fast: 'No customary fast.'
    }),
    'Shashthi': C({
      deity: 'Skanda (Kartikeya)', glyph: '☽', important: false, matchTithi: 'Shashthi',
      dev: 'षष्ठी',
      about: 'The sixth tithi belongs to Skanda, the commander of the devas. Skanda Shashthi after Diwali is its great form in the Tamil tradition.',
      rituals: ['Kartikeya or Subramanya worship with a vel or peacock feather kept at the altar.', 'Simple kheer offering.'],
      jaap: { mantra: 'Om Saravanabhavaya Namah', dev: 'ॐ सरवणभवाय नमः', count: 108, note: 'Skanda\u2019s six-syllable mantra.' },
      fast: 'Optional Skanda vrat for devotees.'
    }),
    'Saptami': C({
      deity: 'Surya', glyph: '☽', important: false, matchTithi: 'Saptami',
      dev: 'सप्तमी',
      about: 'The seventh tithi is the Sun\u2019s own — Rath Saptami (Magha Shukla Saptami) celebrates Surya\u2019s chariot turning north. Sunday-morning sun worship is a natural fit.',
      rituals: ['Offer arghya to the rising sun from a copper vessel.', 'A few rounds of Surya namaskar if the body allows.'],
      jaap: { mantra: 'Om Suryaya Namah', dev: 'ॐ सूर्याय नमः', count: 27, note: 'With the sun salutations, one name per posture.' },
      fast: 'No customary fast.'
    }),
    'Navami': C({
      deity: 'Durga · Ram', glyph: '☽', important: true, matchTithi: 'Navami',
      dev: 'नवमी',
      about: 'The ninth tithi — Maha Navami in Navratri and Ram Navami in Chaitra. On its own, a strong day for Devi worship and completion of anjali offerings.',
      rituals: ['Devi puja with red flowers and a ghee diya.', 'Read the Ram Raksha Stotra for protection.'],
      jaap: { mantra: 'Om Dum Durgayei Namah', dev: 'ॐ दुं दुर्गायै नमः', count: 108, note: 'One mala; add the Ram Raksha for protection.' },
      fast: 'Vrat per family tradition.'
    }),
    'Dashami': C({
      deity: 'Vishnu · Dharma', glyph: '☽', important: false, matchTithi: 'Dashami',
      dev: 'दशमी',
      about: 'The tenth tithi — Vijayadashami (Dussehra) is its most famous form. A day tied to victory, completion and righteous action.',
      rituals: ['Worship tools, instruments and books (ayudha puja) on Vijayadashami.', 'Evening diya with a short gratitude prayer.'],
      jaap: { mantra: 'Om Namo Narayanaya', dev: 'ॐ नमो नारायणाय', count: 108, note: 'The ashtakshara mantra, one mala.' },
      fast: 'No customary fast.'
    }),
    'Dwadashi': C({
      deity: 'Vishnu · Tulsi', glyph: '☽', important: false, matchTithi: 'Dwadashi',
      dev: 'द्वादशी',
      about: 'The twelfth tithi — the parana day after Ekadashi and the day of Tulsi Vivah in Kartik. Fast-breaking and thanksgiving belong to Dwadashi morning.',
      rituals: ['Break any Ekadashi fast in the morning parana window after Vishnu puja.', 'Water tulsi and circumambulate three times.'],
      jaap: { mantra: 'Om Namo Bhagavate Vasudevaya', dev: 'ॐ नमो भगवते वासुदेवाय', count: 54, note: 'The closing half-mala after parana.' },
      fast: 'The Ekadashi fast ends here, within parana time.'
    })
  };

  function cardGuide(t) {
    /* resolve the right guide object for a tithi+paksha pair */
    if (t.name === 'Chaturthi') {
      return t.paksha === 'Krishna' ? TITHI_GUIDE['Sankashti Chaturthi'] : TITHI_GUIDE['Chaturthi'];
    }
    if (t.name === 'Trayodashi') return TITHI_GUIDE['Pradosh'];
    return TITHI_GUIDE[t.name] || null;
  }

  /* festivals overlay from the verified FESTIVALS dataset */
  function festivalsOn(dateISO) {
    if (typeof FESTIVALS === 'undefined') return [];
    return FESTIVALS.filter(function (f) { return f.d2026 === dateISO || f.d2027 === dateISO; });
  }

  /* ---------- reminders ---------- */
  function loadReminders() {
    try { return JSON.parse(localStorage.getItem(LS_REMINDERS)) || []; } catch (e) { return []; }
  }
  function saveReminders(r) { localStorage.setItem(LS_REMINDERS, JSON.stringify(r)); }
  function reminderFor(dateISO) {
    return loadReminders().some(function (r) { return r.date === dateISO; });
  }

  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function postJSON(path, body) {
    return fetch(WORKER + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-push-key': PUSH_KEY },
      body: JSON.stringify(body)
    });
  }

  function syncRemindersToServer() {
    return getPushSubscription().then(function (sub) {
      if (!sub) return { ok: false, reason: 'no_subscription' };
      return postJSON('/dh-subscribe', {
        subscription: sub.toJSON(),
        reminders: loadReminders(),
        tz: 'Asia/Dubai'
      }).then(function (r) { return { ok: r.ok, status: r.status }; });
    });
  }

  function getPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return Promise.resolve(null);
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        if (sub) return sub;
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUB)
        }).catch(function () { return null; });
      });
    }).catch(function () { return null; });
  }

  function toggleReminder(dateISO, tithi, paksha, btn) {
    var reminders = loadReminders();
    var idx = reminders.findIndex(function (r) { return r.date === dateISO; });
    if (idx >= 0) {
      reminders.splice(idx, 1);
      saveReminders(reminders);
      paintBells();
      syncRemindersToServer();
      toast('Reminder removed for ' + fmtISO(dateISO));
      return;
    }
    var proceed = function () {
      reminders.push({ date: dateISO, tithi: tithi, paksha: paksha });
      saveReminders(reminders);
      paintBells();
      syncRemindersToServer().then(function (res) {
        if (res && res.ok) {
          toast('🔔 Reminder set — push notification on ' + fmtISO(dateISO) + ' morning.');
        } else {
          toast('🔔 Reminder saved on this device. For a true push notification, allow notifications and keep the app installed.');
        }
      });
    };
    if (!('Notification' in window)) { proceed(); return; }
    if (Notification.permission === 'granted') { proceed(); return; }
    if (Notification.permission === 'denied') {
      toast('Notifications are blocked in this browser. Enable them for this site to get push reminders.');
      proceed();
      return;
    }
    Notification.requestPermission().then(function () { proceed(); });
  }

  function toast(msg) {
    var t = document.getElementById('pkToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pkToast';
      t.className = 'pk-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }

  /* ---------- calendar state ---------- */
  var now = new Date();
  var view = { y: now.getFullYear(), m: now.getMonth() };
  var MIN_VIEW = { y: 2025, m: 0 };
  var MAX_VIEW = { y: 2028, m: 11 };
  var flipBusy = false;

  function isoOf(y, m, d) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function fmtISO(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function fmtTime(d) {
    var h = d.getHours(), mm = String(d.getMinutes()).padStart(2, '0');
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + mm + ' ' + ap;
  }

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

  function sunsetOf(y, m, d) { return new Date(y, m, d, 18, 0, 0, 0); }

  function monthData(y, m) {
    var dim = daysInMonth(y, m);
    var rows = [];
    for (var d = 1; d <= dim; d++) {
      var t = tithiInfo(tithiAt(sunriseOf(y, m, d)));
      var t2 = tithiInfo(tithiAt(sunsetOf(y, m, d)));
      var g1 = cardGuide(t);
      var g2 = t2.index !== t.index ? cardGuide(t2) : null;
      /* the day's primary tithi: the important one if either is, else sunrise */
      var primary = (g2 && g2.important && !(g1 && g1.important)) ? t2 : t;
      var g = cardGuide(primary);
      rows.push({
        d: d,
        iso: isoOf(y, m, d),
        weekday: new Date(y, m, d).getDay(),
        tithi: t,
        tithiLater: (t2.index !== t.index) ? t2 : null,
        primary: primary,
        guide: g,
        important: !!((g1 && g1.important) || (g2 && g2.important)),
        festivals: festivalsOn(isoOf(y, m, d))
      });
    }
    return rows;
  }

  /* ---------- rendering ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var TITHI_CELL = {
    Pratipada: 'Prat.', Dwitiya: 'Dwit.', Tritiya: 'Trit.', Chaturthi: 'Chatur.',
    Panchami: 'Panch.', Shashthi: 'Shash.', Saptami: 'Sapt.', Ashtami: 'Asht.',
    Navami: 'Nav.', Dashami: 'Dash.', Ekadashi: 'Ekad.', Dwadashi: 'Dwad.',
    Trayodashi: 'Trayo.', Chaturdashi: 'Chaturd.', Purnima: 'Purnima', Amavasya: 'Amavasya'
  };
  function cellTithi(t) { return (t.paksha === 'Shukla' ? 'S. ' : 'K. ') + (TITHI_CELL[t.name] || t.name); }
  function cellFestival(name) {
    return String(name).replace(/Chaturthi/g, 'Chatur.').replace(/Janmashtami/g, 'Janmasht.');
  }

  function cellHTML(r) {
    var today = new Date();
    var isToday = r.iso === isoOf(today.getFullYear(), today.getMonth(), today.getDate());
    var cls = 'pk-cell' + (r.important ? ' pk-imp' : '') + (isToday ? ' pk-today' : '') +
      (r.festivals.length ? ' pk-fest' : '') + ' pk-paksha-' + (r.primary.paksha === 'Shukla' ? 'light' : 'dark');
    var short = cellTithi(r.tithi);
    if (r.tithiLater) {
      var later = TITHI_CELL[r.tithiLater.name] || r.tithiLater.name;
      short += ' \u25B8 ' + (r.tithiLater.paksha === r.tithi.paksha ? '' :
        (r.tithiLater.paksha === 'Shukla' ? 'S. ' : 'K. ')) + later;
    }
    var bell = reminderFor(r.iso) ? '🔔' : '🔕';
    return '<button class="' + cls + '" data-iso="' + r.iso + '" aria-label="' +
      esc(fmtISO(r.iso) + ' ' + r.tithi.paksha + ' ' + r.tithi.name) + '">' +
      '<span class="pk-date">' + r.d + '</span>' +
      '<span class="pk-tithi">' + esc(short) + '</span>' +
      (r.festivals.length ? '<span class="pk-festname">' + esc(cellFestival(r.festivals[0].name)) + '</span>' : '') +
      (r.festivals.length ? '<span class="pk-festdot" title="' + esc(r.festivals.map(function (f) { return f.name; }).join(', ')) + '">🪔</span>' : '') +
      (r.important ? '<span class="pk-bell" data-iso="' + r.iso + '" role="button" aria-label="Reminder for ' + esc(fmtISO(r.iso)) + '">' + bell + '</span>' : '') +
      '</button>';
  }

  function gridHTML(y, m) {
    var rows = monthData(y, m);
    var firstWeekday = new Date(y, m, 1).getDay();
    var html = '<div class="pk-weekdays">' + WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>';
    html += '<div class="pk-grid">';
    for (var i = 0; i < firstWeekday; i++) html += '<span class="pk-cell pk-empty"></span>';
    rows.forEach(function (r) { html += cellHTML(r); });
    html += '</div>';
    return html;
  }

  function renderMonth(y, m) {
    var page = document.getElementById('pkPage');
    if (!page) return;
    page.innerHTML = gridHTML(y, m);
    var label = document.getElementById('pkMonthLabel');
    if (label) label.textContent = MONTHS[m] + ' ' + y;
    var prev = document.getElementById('pkPrev');
    var next = document.getElementById('pkNext');
    if (prev) prev.disabled = (y === MIN_VIEW.y && m === MIN_VIEW.m);
    if (next) next.disabled = (y === MAX_VIEW.y && m === MAX_VIEW.m);
    bindCells();
  }

  function flip(dir) {
    if (flipBusy) return;
    var ny = view.y, nm = view.m + dir;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    if (ny < MIN_VIEW.y || (ny === MIN_VIEW.y && nm < MIN_VIEW.m)) return;
    if (ny > MAX_VIEW.y || (ny === MAX_VIEW.y && nm > MAX_VIEW.m)) return;
    var page = document.getElementById('pkPage');
    if (!page) { view = { y: ny, m: nm }; renderMonth(ny, nm); return; }
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { view = { y: ny, m: nm }; renderMonth(ny, nm); return; }
    flipBusy = true;
    var outCls = dir > 0 ? 'pk-flip-out-next' : 'pk-flip-out-prev';
    var inCls = dir > 0 ? 'pk-flip-in-next' : 'pk-flip-in-prev';
    page.classList.add(outCls);
    setTimeout(function () {
      view = { y: ny, m: nm };
      renderMonth(ny, nm);
      page.classList.remove(outCls);
      page.classList.add(inCls);
      setTimeout(function () {
        page.classList.remove(inCls);
        flipBusy = false;
      }, 230);
    }, 230);
  }

  function paintBells() {
    var rem = loadReminders();
    document.querySelectorAll('#pkPage .pk-bell').forEach(function (b) {
      var on = rem.some(function (r) { return r.date === b.dataset.iso; });
      b.textContent = on ? '🔔' : '🔕';
    });
    var cb = document.getElementById('pkCardBell');
    if (cb && cb.dataset.iso) {
      var on2 = rem.some(function (r) { return r.date === cb.dataset.iso; });
      cb.textContent = on2 ? '🔔 Reminder on' : '🔕 Set reminder';
      cb.classList.toggle('on', on2);
    }
  }

  function bindCells() {
    document.querySelectorAll('#pkPage .pk-cell[data-iso]').forEach(function (c) {
      c.addEventListener('click', function (e) {
        if (e.target.classList && e.target.classList.contains('pk-bell')) return;
        openCard(c.dataset.iso);
      });
    });
    document.querySelectorAll('#pkPage .pk-bell').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var iso = b.dataset.iso;
        var p = iso.split('-');
        var t = tithiInfo(tithiAt(sunriseOf(+p[0], +p[1] - 1, +p[2])));
        toggleReminder(iso, t.name, t.paksha, b);
      });
    });
  }

  /* ---------- detail card ---------- */
  function openCard(iso) {
    var p = iso.split('-').map(Number);
    var y = p[0], m = p[1] - 1, d = p[2];
    var sr = sunriseOf(y, m, d);
    var t0 = tithiInfo(tithiAt(sr));
    var t2 = tithiInfo(tithiAt(sunsetOf(y, m, d)));
    var g0 = cardGuide(t0);
    var g2 = t2.index !== t0.index ? cardGuide(t2) : null;
    var t = (g2 && g2.important && !(g0 && g0.important)) ? t2 : t0;
    var g = cardGuide(t) || g0 || g2;
    var timeline = tithiTimeline(y, m, d);
    var fests = festivalsOn(iso);
    var overlay = document.getElementById('pkCardOverlay');
    var card = document.getElementById('pkCard');
    if (!overlay || !card) return;

    var tName = t.paksha + ' ' + t.name;
    var html = '';
    html += '<button class="pk-card-close" id="pkCardClose" aria-label="Close">✕</button>';
    html += '<div class="pk-card-date">' + esc(new Date(y, m, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</div>';
    html += '<div class="pk-card-tithi">' + (g ? g.glyph + ' ' : '') + esc(tName) + ' <span class="pk-card-dev">' + esc((t.paksha === 'Shukla' ? 'शुक्ल ' : 'कृष्ण ') + (TITHI_DEV[t.name] || '')) + '</span></div>';
    html += '<div class="pk-card-deity">' + esc(g ? g.deity : '—') + '</div>';
    if (fests.length) {
      html += '<div class="pk-card-fest">🪔 ' + fests.map(function (f) { return esc(f.name) + ' <span class="pk-card-fest-dev">' + esc(f.dev) + '</span>'; }).join(' · ') + '</div>';
    }
    html += '<p class="pk-card-about">' + esc(g ? g.about : 'A day of the ' + t.paksha + ' paksha.') + '</p>';

    if (timeline.length) {
      html += '<div class="pk-card-timeline">';
      timeline.forEach(function (mk) {
        html += '<span>' + esc(tithiInfo(mk.from).name) + ' → ' + esc(tithiInfo(mk.to).name) + ' at ' + fmtTime(mk.at) + '</span>';
      });
      html += '</div>';
    } else {
      html += '<div class="pk-card-timeline"><span>' + esc(t.name) + ' runs through the whole day.</span></div>';
    }

    if (g) {
      html += '<h4 class="pk-card-h">Rituals for the day</h4><ul class="pk-card-list">' +
        g.rituals.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>';
      html += '<h4 class="pk-card-h">Mantra jaap</h4>' +
        '<div class="pk-card-jaap"><div class="pk-jaap-dev">' + esc(g.jaap.dev) + '</div>' +
        '<div class="pk-jaap-line">' + esc(g.jaap.mantra) + ' × ' + g.jaap.count + '</div>' +
        '<div class="pk-jaap-note">' + esc(g.jaap.note) + '</div></div>';
      html += '<h4 class="pk-card-h">Fasting</h4><p class="pk-card-fast">' + esc(g.fast) + '</p>';
    }

    html += '<button class="pk-card-bell" id="pkCardBell" data-iso="' + iso + '"></button>';
    html += '<div class="pk-card-note">Tithi computed on your device by the sunrise rule; boundaries can differ from Drik Panchang by a few hours.</div>';

    card.innerHTML = html;
    overlay.hidden = false;
    card.scrollTop = 0;
    paintBells();
    document.getElementById('pkCardClose').addEventListener('click', closeCard);
    document.getElementById('pkCardBell').addEventListener('click', function () {
      toggleReminder(iso, t.name, t.paksha, null);
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCard(); }, { once: true });
  }

  function closeCard() {
    var overlay = document.getElementById('pkCardOverlay');
    if (overlay) overlay.hidden = true;
  }

  /* ---------- sheet wiring ---------- */
  function openPanchang() {
    var menu = document.getElementById('fabMenu');
    if (menu) menu.hidden = true;
    var sheet = document.getElementById('panchangSection');
    if (!sheet) return;
    if (sheet.hidden) {
      /* reset to running month each fresh open */
      var n = new Date();
      view = { y: n.getFullYear(), m: n.getMonth() };
      renderMonth(view.y, view.m);
    }
    window.dhOpenSheet('panchangSection');
  }

  function init() {
    var btn = document.getElementById('fabPanchang');
    if (btn) btn.addEventListener('click', openPanchang);
    var prev = document.getElementById('pkPrev');
    var next = document.getElementById('pkNext');
    if (prev) prev.addEventListener('click', function () { flip(-1); });
    if (next) next.addEventListener('click', function () { flip(1); });
    var close = document.getElementById('panchangClose');
    if (close) close.addEventListener('click', function () {
      closeCard();
      window.dhCloseSheet('panchangSection');
    });
    renderMonth(view.y, view.m);

    /* local fallback: surface a due reminder when the app is open */
    var todayISO = isoOf(now.getFullYear(), now.getMonth(), now.getDate());
    var due = loadReminders().filter(function (r) { return r.date === todayISO; });
    if (due.length) {
      var r = due[0];
      setTimeout(function () {
        toast('🌙 Today is ' + r.paksha + ' ' + r.tithi + ' — your reminder. Open the Panchang for today\u2019s rituals.');
      }, 2500);
    }
  }

  window.dhPanchang = {
    tithiAt: tithiAt, tithiInfo: tithiInfo, monthData: monthData,
    tithiTimeline: tithiTimeline, open: openPanchang, _flip: flip, _view: function () { return view; },
    _renderMonth: renderMonth, _openCard: openCard, _toggleReminder: toggleReminder,
    _loadReminders: loadReminders, _cardGuide: cardGuide
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
