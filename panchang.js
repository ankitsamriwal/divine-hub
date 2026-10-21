/* Divine Hub — Panchang calendar: a wall-panchang month (page-turn navigation,
   swipe, month-year picker), the day sheet, tithi detail cards (rituals + mantra jaap), and push
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
  var busy = false;
  var selectedIso = null;
  var MONTH_CACHE = {};
  var PAGE_CACHE = {};
  var WK_DEV = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
  var DUR = 660;
  var EASE_UP = 'cubic-bezier(.45,.05,.4,1)';
  var EASE_DOWN = 'cubic-bezier(.3,.06,.2,1)';

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

  /* one month of rows; cached, since tithis and the festival list never change */
  function monthData(y, m) {
    var key = y + '-' + m;
    if (MONTH_CACHE[key]) return MONTH_CACHE[key];
    var dim = daysInMonth(y, m);
    var rows = [];
    for (var d = 1; d <= dim; d++) {
      var sr = sunriseOf(y, m, d);
      var t = tithiInfo(tithiAt(sr));
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
        festivals: festivalsOn(isoOf(y, m, d)),
        elong: elongationAt(sr)
      });
    }
    MONTH_CACHE[key] = rows;
    return rows;
  }
  function rowFor(iso) {
    var p = iso.split('-').map(Number);
    return monthData(p[0], p[1] - 1)[p[2] - 1] || null;
  }

  /* ---------- small helpers ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function vIdx(y, m) { return y * 12 + m; }
  function fromIdx(i) { return { y: Math.floor(i / 12), m: ((i % 12) + 12) % 12 }; }
  function inRange(y, m) {
    var i = vIdx(y, m);
    return i >= vIdx(MIN_VIEW.y, MIN_VIEW.m) && i <= vIdx(MAX_VIEW.y, MAX_VIEW.m);
  }
  function todayIso() { var t = new Date(); return isoOf(t.getFullYear(), t.getMonth(), t.getDate()); }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------- glyphs (drawn, never emoji) ---------- */
  /* moon drawn to the actual phase: elongation in degrees, lit limb on the
     right while waxing and on the left while waning */
  function moonSVG(elong, kind, size) {
    var e = norm360(elong), k = Math.cos(e * d2r), rx = (Math.abs(k) * 10).toFixed(2);
    var waxing = e < 180, gibbous = k < 0, lit;
    if (waxing) lit = 'M0,-10A10,10 0 0 1 0,10A' + rx + ',10 0 0 ' + (gibbous ? 1 : 0) + ' 0,-10Z';
    else lit = 'M0,-10A10,10 0 0 0 0,10A' + rx + ',10 0 0 ' + (gibbous ? 0 : 1) + ' 0,-10Z';
    var s = size || 11;
    var body = kind === 'purnima' ? '<circle r="10" class="wm-full"/>' :
      kind === 'amavasya' ? '<circle r="9.4" class="wm-new"/>' :
      '<circle r="10" class="wm-dark"/><path d="' + lit + '" class="wm-lit"/>';
    return '<svg class="wp-moon' + (kind ? ' wm-' + kind : '') + '" viewBox="-12 -12 24 24" width="' + s + '" height="' + s +
      '" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  var LEAF = '<svg class="wp-leaf-g" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true" focusable="false">' +
    '<path d="M1.6 10.4C1.6 5.2 4.8 1.6 10.6 1.4 10.6 7 7.2 10.4 1.6 10.4Z"/><path class="vein" d="M1.6 10.4 7.6 4.4"/></svg>';
  var DIYA = '<svg class="wp-diya" viewBox="0 0 16 14" width="11" height="10" aria-hidden="true" focusable="false">' +
    '<path class="fl" d="M8 .6C9.9 3.3 10 5 8 6.9 6 5 6.1 3.3 8 .6Z"/><path class="bw" d="M1.2 7.8H14.8C14 11.2 11.3 13 8 13S2 11.2 1.2 7.8Z"/></svg>';
  var CHEV_L = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>';
  var CARET = '<svg class="wp-caret" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false"><path d="M3 4.5 6 7.5 9 4.5"/></svg>';
  var BELL = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function shortFest(name) {
    return String(name).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\/.*$/, '').replace(/\s+/g, ' ').trim();
  }
  /* the cell names a festival before a named new or full moon */
  function pickFest(list) {
    if (!list.length) return null;
    for (var i = 0; i < list.length; i++) if (!/Amavasya|Poornima|Purnima/.test(list[i].name)) return list[i];
    return list[0];
  }
  function moonKind(t) { return t.name === 'Purnima' ? 'purnima' : t.name === 'Amavasya' ? 'amavasya' : ''; }

  /* ---------- page rendering ---------- */
  function cellHTML(r) {
    var t = r.tithi, kind = moonKind(t), ek = t.name === 'Ekadashi';
    var g = cardGuide(t), f = pickFest(r.festivals);
    var cls = 'wp-day' + (g && g.important ? ' is-vrat' : '') + (kind ? ' is-' + kind : '') +
      (ek ? ' is-ekadashi' : '') + (f ? ' is-fest' : '') + (r.weekday === 0 ? ' is-sun' : '');
    var label = fmtISO(r.iso) + ', ' + t.paksha + ' ' + t.name +
      (r.tithiLater ? ', then ' + r.tithiLater.paksha + ' ' + r.tithiLater.name : '') +
      (r.festivals.length ? ', ' + r.festivals.map(function (x) { return x.name; }).join(', ') : '');
    return '<button type="button" class="' + cls + '" data-iso="' + r.iso + '" aria-label="' + esc(label) + '">' +
      '<span class="wp-day-top"><span class="wp-num">' + r.d + '</span><span class="wp-glyphs">' +
        moonSVG(r.elong, kind) + (ek ? LEAF : '') + '</span></span>' +
      '<span class="wp-tithi"><span class="wp-tt" lang="hi">' + TITHI_DEV[t.name] + '</span>' +
        (r.tithiLater ? '<i class="wp-chg" aria-hidden="true"></i>' : '') + '</span>' +
      (f ? '<span class="wp-fl">' + DIYA + '<span class="wp-fn">' + esc(shortFest(f.name)) + '</span></span>' : '') +
      '</button>';
  }

  function pageHTML(y, m) {
    var key = y + '-' + m;
    if (PAGE_CACHE[key]) return PAGE_CACHE[key];
    var rows = monthData(y, m), first = new Date(y, m, 1).getDay(), cells = '', n = 0, i;
    for (i = 0; i < first; i++, n++) cells += '<span class="wp-day is-blank" aria-hidden="true"></span>';
    rows.forEach(function (r) { cells += cellHTML(r); n++; });
    var tail = n <= 35;
    for (; n < (tail ? 35 : 42); n++) cells += '<span class="wp-day is-blank" aria-hidden="true"></span>';
    /* a five-week month keeps the sixth row as a quiet ornamental band, so every page is the same height */
    if (tail) cells += '<span class="wp-day is-blank wp-tail" aria-hidden="true"><i></i><b lang="hi">॥ शुभम् ॥</b><i></i></span>';
    var pi = fromIdx(vIdx(y, m) - 1), ni = fromIdx(vIdx(y, m) + 1);
    var html = '<div class="wp-face">' +
      '<span class="wp-corner c-tl" aria-hidden="true"></span><span class="wp-corner c-tr" aria-hidden="true"></span>' +
      '<span class="wp-corner c-bl" aria-hidden="true"></span><span class="wp-corner c-br" aria-hidden="true"></span>' +
      '<header class="wp-head">' +
        '<button type="button" class="wp-arrow" data-act="prev" aria-label="Previous month, ' + MONTHS[pi.m] + ' ' + pi.y + '"' +
          (inRange(pi.y, pi.m) ? '' : ' disabled') + '>' + CHEV_L + '</button>' +
        '<button type="button" class="wp-title" data-act="pick" aria-haspopup="dialog" aria-expanded="false" aria-label="' +
          MONTHS[m] + ' ' + y + '. Choose month and year">' +
          '<span class="wp-kicker" lang="hi">पंचांग</span>' +
          '<span class="wp-month">' + MONTHS[m] + '</span>' +
          '<span class="wp-year">' + y + CARET + '</span></button>' +
        '<button type="button" class="wp-arrow" data-act="next" aria-label="Next month, ' + MONTHS[ni.m] + ' ' + ni.y + '"' +
          (inRange(ni.y, ni.m) ? '' : ' disabled') + '>' + CHEV_R + '</button>' +
      '</header>' +
      '<div class="wp-orn" aria-hidden="true"><span></span><b></b><span></span></div>' +
      '<div class="wp-wk" aria-hidden="true">' + WEEKDAYS.map(function (w, k) {
        return '<span' + (k === 0 ? ' class="is-sun"' : '') + '><b>' + w + '</b><i lang="hi">' + WK_DEV[k] + '</i></span>';
      }).join('') + '</div>' +
      '<div class="wp-grid">' + cells + '</div>' +
      '<span class="wp-gloss" aria-hidden="true"></span><span class="wp-shade" aria-hidden="true"></span>' +
      '</div><div class="wp-back" aria-hidden="true"><span class="wp-back-mark" lang="hi">ॐ</span></div>';
    PAGE_CACHE[key] = html;
    return html;
  }

  function decorate(leaf) {
    var t = todayIso();
    leaf.querySelectorAll('.wp-day[data-iso]').forEach(function (c) {
      var isT = c.dataset.iso === t;
      c.classList.toggle('is-today', isT);
      if (isT) c.setAttribute('aria-current', 'date'); else c.removeAttribute('aria-current');
      c.classList.toggle('is-selected', c.dataset.iso === selectedIso);
    });
  }

  function makeLeaf(y, m) {
    var el = document.createElement('div');
    el.className = 'wp-leaf';
    el.dataset.y = y;
    el.dataset.m = m;
    el.innerHTML = pageHTML(y, m);
    decorate(el);
    return el;
  }

  function stageEl() { return document.getElementById('pkStage'); }
  function liveLeaf() { var s = stageEl(); return s ? s.lastElementChild : null; }

  function announce(y, m) {
    var live = document.getElementById('pkLive');
    if (live) live.textContent = MONTHS[m] + ' ' + y;
  }

  function renderMonth(y, m) {
    var s = stageEl();
    if (!s) return;
    s.innerHTML = '';
    s.appendChild(makeLeaf(y, m));
    try { document.dispatchEvent(new CustomEvent('dh-month', { detail: { y: y, m: m } })); } catch (e) {}
  }

  /* warm the neighbours so the first flip has nothing to compute */
  function prefetch(y, m) {
    var run = function () {
      [-1, 1].forEach(function (d) { var v = fromIdx(vIdx(y, m) + d); if (inRange(v.y, v.m)) pageHTML(v.y, v.m); });
    };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 800 }); else setTimeout(run, 120);
  }

  /* ---------- page turn ---------- */
  /* a leaf rotates about its top edge (rotateX). 0deg = hanging flat;
     180deg = flipped up and over the binding. The face hides past 90deg,
     the blank back shows and fades as it passes over the top. */
  function backOpacity(a) { return a <= 112 ? 1 : Math.max(0, 1 - (a - 112) / 58); }
  function glossOpacity(a) { return Math.sin(Math.min(Math.max(a, 0), 90) * d2r); }
  function shadeOpacity(a) { return a >= 160 ? 0 : 0.62 * Math.pow(1 - a / 160, 1.4); }

  function partsOf(st) {
    return {
      back: st.top.querySelector('.wp-back'),
      gloss: st.top.querySelector('.wp-gloss'),
      shade: st.under ? st.under.querySelector('.wp-shade') : null
    };
  }
  function setAngle(st, a) {
    var p = partsOf(st);
    st.top.style.transform = 'rotateX(' + a.toFixed(2) + 'deg)';
    if (p.back) p.back.style.opacity = backOpacity(a);
    if (p.gloss) p.gloss.style.opacity = glossOpacity(a);
    if (p.shade) p.shade.style.opacity = shadeOpacity(a);
  }
  function turn(st, a0, a1, dur, easing, delay) {
    st.top.classList.add('is-turning');
    if (!st.top.animate) { setAngle(st, a1); st.top.classList.remove('is-turning'); return Promise.resolve(); }
    var p = partsOf(st), n = 10, fl = [], fb = [], fg = [], fs = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      fl.push({ transform: 'rotateX(' + a.toFixed(2) + 'deg)' });
      fb.push({ opacity: backOpacity(a) });
      fg.push({ opacity: glossOpacity(a) });
      fs.push({ opacity: shadeOpacity(a) });
    }
    var opt = { duration: dur, easing: easing, delay: delay || 0, fill: 'both' };
    var anims = [st.top.animate(fl, opt)];
    if (p.back) anims.push(p.back.animate(fb, opt));
    if (p.gloss) anims.push(p.gloss.animate(fg, opt));
    if (p.shade) anims.push(p.shade.animate(fs, opt));
    return Promise.all(anims.map(function (x) { return x.finished; })).then(function () {
      setAngle(st, a1);
      anims.forEach(function (x) { x.cancel(); });
      st.top.classList.remove('is-turning');
    });
  }

  function singleTurn(dir, y, m) {
    var s = stageEl(), cur = liveLeaf(), leaf = makeLeaf(y, m);
    leaf.dataset.dest = '1';
    if (dir > 0) {
      s.insertBefore(leaf, cur);
      return turn({ top: cur, under: leaf }, 0, 180, DUR, EASE_UP);
    }
    s.appendChild(leaf);
    var st = { top: leaf, under: cur };
    setAngle(st, 180);
    return turn(st, 180, 0, DUR, EASE_DOWN);
  }

  /* year jumps: a quick riffle of four pages */
  function riffle(from, to) {
    var s = stageEl(), cur = liveLeaf(), dir = to > from ? 1 : -1, ids = [], seen = {};
    for (var k = 1; k < 4; k++) {
      var i = Math.round(from + (to - from) * k / 4);
      if (i !== from && i !== to && !seen[i]) { seen[i] = 1; ids.push(i); }
    }
    var dest = fromIdx(to), target = makeLeaf(dest.y, dest.m), fillers, chain, dur = 360, gap = 120;
    target.dataset.dest = '1';
    fillers = ids.map(function (i) { var v = fromIdx(i); return makeLeaf(v.y, v.m); });
    if (dir > 0) {
      /* bottom to top: target, last filler ... first filler, current */
      s.insertBefore(target, cur);
      for (var a = fillers.length - 1; a >= 0; a--) s.insertBefore(fillers[a], cur);
      chain = [cur].concat(fillers);
      return Promise.all(chain.map(function (leaf, j) {
        var under = j + 1 < chain.length ? chain[j + 1] : target;
        return turn({ top: leaf, under: under }, 0, 180, dur, EASE_UP, j * gap);
      }));
    }
    /* backward: pages fall down onto the current one, the target last */
    chain = fillers.concat([target]);
    chain.forEach(function (leaf) { s.appendChild(leaf); setAngle({ top: leaf }, 180); });
    return Promise.all(chain.map(function (leaf, j) {
      var under = j === 0 ? cur : chain[j - 1];
      return turn({ top: leaf, under: under }, 180, 0, dur, EASE_DOWN, j * gap);
    }));
  }

  function crossfade(y, m) {
    var s = stageEl(), leaf = makeLeaf(y, m);
    leaf.dataset.dest = '1';
    s.appendChild(leaf);
    if (!leaf.animate) return Promise.resolve();
    return leaf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' }).finished;
  }

  function finalize(y, m, focusAct) {
    var s = stageEl(), keep = s.querySelector('.wp-leaf[data-dest]') || liveLeaf();
    Array.prototype.slice.call(s.children).forEach(function (c) { if (c !== keep) s.removeChild(c); });
    delete keep.dataset.dest;
    keep.style.transform = '';
    keep.querySelectorAll('.wp-back,.wp-gloss,.wp-shade').forEach(function (x) { x.style.opacity = ''; });
    view = { y: y, m: m };
    decorate(keep);
    announce(y, m);
    if (focusAct) {
      var f = keep.querySelector('[data-act="' + focusAct + '"]:not([disabled])') || keep.querySelector('[data-act="pick"]');
      if (f) f.focus({ preventScroll: true });
    }
    try { document.dispatchEvent(new CustomEvent('dh-month', { detail: { y: y, m: m } })); } catch (e) {}
    prefetch(y, m);
  }

  function goTo(y, m, how) {
    if (busy || !inRange(y, m)) return;
    var from = vIdx(view.y, view.m), to = vIdx(y, m);
    if (from === to) return;
    var s = stageEl();
    if (!s || !liveLeaf()) { view = { y: y, m: m }; renderMonth(y, m); return; }
    var ae = document.activeElement, focusAct = (ae && s.contains(ae) && ae.dataset && ae.dataset.act) || null;
    busy = true;
    var job = reducedMotion() ? crossfade(y, m) :
      how === 'riffle' ? riffle(from, to) : singleTurn(to > from ? 1 : -1, y, m);
    job.catch(function () {}).then(function () { finalize(y, m, focusAct); busy = false; });
  }

  function flip(dir) {
    var v = fromIdx(vIdx(view.y, view.m) + dir);
    goTo(v.y, v.m);
  }

  /* ---------- swipe: drag lifts the page, release completes or snaps back ---------- */
  function wireDrag(s) {
    var drag = null, suppressUntil = 0;
    s.addEventListener('pointerdown', function (e) {
      if (busy || e.button !== 0 || e.isPrimary === false || pickerOpen()) return;
      drag = { x0: e.clientX, y0: e.clientY, id: e.pointerId, active: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
    });
    s.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.active) {
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) {
          if (Math.abs(dy) > 14) drag = null;
          return;
        }
        var dir = dx < 0 ? 1 : -1, v = fromIdx(vIdx(view.y, view.m) + dir);
        if (!inRange(v.y, v.m) || busy) { drag = null; return; }
        drag.active = true;
        drag.dir = dir;
        drag.dest = v;
        busy = true;
        try { s.setPointerCapture(e.pointerId); } catch (x) {}
        if (!reducedMotion()) {
          var cur = liveLeaf(), leaf = makeLeaf(v.y, v.m);
          leaf.dataset.dest = '1';
          if (dir > 0) { s.insertBefore(leaf, cur); drag.st = { top: cur, under: leaf }; }
          else { s.appendChild(leaf); drag.st = { top: leaf, under: cur }; setAngle(drag.st, 180); }
          drag.st.top.classList.add('is-turning');
        }
      }
      var dt = Math.max(1, e.timeStamp - drag.lt);
      drag.v = 0.7 * drag.v + 0.3 * ((e.clientX - drag.lx) / dt);
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      var w = s.getBoundingClientRect().width || 320;
      var p = Math.max(0, Math.min(1, (-dx * drag.dir) / (w * 0.75)));
      drag.p = p;
      if (drag.st) setAngle(drag.st, drag.dir > 0 ? p * 150 : 180 - p * 180);
      e.preventDefault();
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.active) return;
      suppressUntil = Date.now() + 350;
      var fling = Math.abs(d.v) > 0.45 && (d.v < 0 ? 1 : -1) === d.dir;
      var commit = (d.p || 0) > 0.3 || fling;
      if (!d.st) { /* reduced motion */
        busy = false;
        if (commit) goTo(d.dest.y, d.dest.m);
        return;
      }
      var a = d.dir > 0 ? (d.p || 0) * 150 : 180 - (d.p || 0) * 180;
      var goal = commit ? (d.dir > 0 ? 180 : 0) : (d.dir > 0 ? 0 : 180);
      var dur = Math.max(180, Math.round(DUR * Math.abs(goal - a) / 180));
      turn(d.st, a, goal, dur, commit ? 'cubic-bezier(.2,.6,.25,1)' : 'cubic-bezier(.3,.7,.3,1)').then(function () {
        if (commit) { finalize(d.dest.y, d.dest.m, null); }
        else {
          var s2 = stageEl(), extra = s2.querySelector('.wp-leaf[data-dest]');
          if (extra) s2.removeChild(extra);
          var lv = liveLeaf();
          lv.style.transform = '';
          lv.querySelectorAll('.wp-back,.wp-gloss,.wp-shade').forEach(function (x) { x.style.opacity = ''; });
        }
        busy = false;
      });
    }
    s.addEventListener('pointerup', end);
    s.addEventListener('pointercancel', end);
    s.addEventListener('click', function (e) {
      if (Date.now() < suppressUntil) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  /* ---------- month-year picker ---------- */
  var picker = null, pickYear = 0;
  function pickerOpen() { return !!(picker && !picker.hidden); }
  function buildPicker() {
    if (picker) return picker;
    picker = document.createElement('div');
    picker.className = 'wp-picker';
    picker.id = 'pkPicker';
    picker.hidden = true;
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Choose month and year');
    picker.innerHTML = '<div class="wp-pk-year">' +
      '<button type="button" class="wp-pk-step" data-py="-1" aria-label="Previous year">' + CHEV_L + '</button>' +
      '<span class="wp-pk-y" id="pkPickYear" aria-live="polite"></span>' +
      '<button type="button" class="wp-pk-step" data-py="1" aria-label="Next year">' + CHEV_R + '</button></div>' +
      '<div class="wp-pk-months" id="pkPickMonths"></div>';
    var wall = document.getElementById('panchangSection');
    wall.appendChild(picker);
    picker.addEventListener('click', function (e) {
      var st = e.target.closest('[data-py]');
      if (st) { pickYear += +st.dataset.py; paintPicker(); return; }
      var mb = e.target.closest('[data-pm]');
      if (mb && !mb.disabled) {
        var y = pickYear, m = +mb.dataset.pm, sameYear = y === view.y;
        closePicker(false);
        goTo(y, m, sameYear ? null : 'riffle');
      }
    });
    picker.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closePicker(true); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (pickerOpen() && !picker.contains(e.target) && !e.target.closest('[data-act="pick"]')) closePicker(false);
    });
    return picker;
  }
  function paintPicker() {
    document.getElementById('pkPickYear').textContent = pickYear;
    picker.querySelector('[data-py="-1"]').disabled = pickYear <= MIN_VIEW.y;
    picker.querySelector('[data-py="1"]').disabled = pickYear >= MAX_VIEW.y;
    document.getElementById('pkPickMonths').innerHTML = MONTHS.map(function (name, m) {
      var on = pickYear === view.y && m === view.m;
      return '<button type="button" data-pm="' + m + '" class="' + (on ? 'is-on' : '') + '"' + (on ? ' aria-current="true"' : '') +
        (inRange(pickYear, m) ? '' : ' disabled') + ' aria-label="' + name + ' ' + pickYear + '">' + name.slice(0, 3) + '</button>';
    }).join('');
  }
  function openPicker() {
    if (busy) return;
    buildPicker();
    pickYear = view.y;
    paintPicker();
    picker.hidden = false;
    var t = liveLeaf() && liveLeaf().querySelector('[data-act="pick"]');
    if (t) t.setAttribute('aria-expanded', 'true');
    var f = picker.querySelector('.is-on') || picker.querySelector('[data-pm]:not([disabled])');
    if (f) f.focus({ preventScroll: true });
  }
  function closePicker(refocus) {
    if (!picker) return;
    picker.hidden = true;
    var t = liveLeaf() && liveLeaf().querySelector('[data-act="pick"]');
    if (t) { t.setAttribute('aria-expanded', 'false'); if (refocus) t.focus({ preventScroll: true }); }
  }

  /* ---------- reminders state in the day sheet ---------- */
  function paintBells() {
    var cb = document.getElementById('pkCardBell');
    if (!cb || !cb.dataset.iso) return;
    var on = reminderFor(cb.dataset.iso);
    cb.innerHTML = BELL + '<span>' + (on ? 'Reminder set' : 'Remind me') + '</span>';
    cb.classList.toggle('is-on', on);
    cb.setAttribute('aria-pressed', String(on));
    var badge = document.getElementById('pkCardRem');
    if (badge) badge.hidden = !on;
  }

  /* ---------- day sheet ---------- */
  function sadhanaFor(r, fests) {
    var D = window.DH_DEITY;
    if (!D) return null;
    for (var i = 0; i < fests.length; i++) {
      var fr = D.festivalRoom(fests[i]);
      if (fr && fr.aarti) return { room: fr, aartiId: D.festivalAarti(fests[i]) || fr.aarti, title: fests[i].dev + ' · ' + fests[i].name };
    }
    var g = cardGuide(r.primary);
    if (g) {
      var names = g.deity.split('·').map(function (s) { return s.trim().replace(/\s*\(.*$/, ''); });
      for (var j = 0; j < names.length; j++) {
        var rm = D.roomFor(names[j]);
        if (rm && rm.id !== 'others' && rm.aarti) {
          return { room: rm, aartiId: rm.aarti, title: (r.primary.paksha === 'Shukla' ? 'शुक्ल ' : 'कृष्ण ') + TITHI_DEV[r.primary.name] + ' · ' + r.primary.name };
        }
      }
    }
    var wd = D.WEEKDAY[r.weekday], room = wd && D.byId(wd.room);
    return room ? { room: room, aartiId: room.aarti, title: wd.dev + ' · ' + wd.en } : null;
  }

  var lastCellIso = null;
  function openCard(iso) {
    var p = iso.split('-').map(Number);
    var y = p[0], m = p[1] - 1, d = p[2];
    var r = rowFor(iso);
    var overlay = document.getElementById('pkCardOverlay');
    var card = document.getElementById('pkCard');
    if (!overlay || !card || !r) return;
    var t = r.tithi, kind = moonKind(t);
    var g = cardGuide(r.primary);
    var fests = r.festivals;
    var timeline = tithiTimeline(y, m, d);
    var M = window.dhMuhurat, city = M ? M.getCity() : null;
    var w = M ? M.daily(city, y, m, d) : null;
    var isToday = iso === todayIso();
    var plusOn = !!(window.dhPlus && window.dhPlus.isActive && window.dhPlus.isActive());
    /* same rule as the rest of the app: today, festival and vrat days are free; any other date is Plus */
    var timesFree = isToday || fests.length > 0 || r.important;
    var nak = window.dhAlmanac ? window.dhAlmanac.nakshatraOf(w ? w.sunrise : sunriseOf(y, m, d)) : null;
    var D = window.DH_DEITY, wdDev = D && D.WEEKDAY[r.weekday] ? D.WEEKDAY[r.weekday].dev + ' · ' : '';
    var sad = sadhanaFor(r, fests);
    var pk = function (x) { return x.paksha === 'Shukla' ? 'शुक्ल' : 'कृष्ण'; };

    var h = '<div class="wsh-grab" aria-hidden="true"></div>' +
      '<button type="button" class="wsh-close" id="pkCardClose" aria-label="Close">' + CLOSE + '</button>' +
      '<p class="wsh-date"><span lang="hi">' + esc(wdDev) + '</span>' +
        esc(new Date(y, m, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
      '<div class="wsh-hero">' + moonSVG(r.elong, kind, 46) +
        '<div class="wsh-hero-txt"><h2 class="wsh-tithi" id="pkCardTitle" lang="hi">' + pk(t) + ' ' + TITHI_DEV[t.name] + '</h2>' +
        '<p class="wsh-tithi-en">' + esc(t.paksha + ' ' + t.name) + ' at sunrise' + (cardGuide(t) ? ' · ' + esc(cardGuide(t).deity) : '') + '</p>' +
        '<p class="wsh-badges">' + (isToday ? '<span class="wsh-badge is-today">Today</span>' : '') +
          (t.name === 'Ekadashi' ? '<span class="wsh-badge">' + LEAF + ' Ekadashi vrat</span>' : '') +
          '<span class="wsh-badge is-rem" id="pkCardRem" hidden>' + BELL + ' Reminder set</span></p>' +
        '</div></div>';

    if (fests.length) {
      h += '<div class="wsh-fests">' + fests.map(function (f) {
        return '<button type="button" class="wsh-fest" data-fest="' + esc(f.name) + '">' + DIYA +
          '<span class="wsh-fest-txt"><b lang="hi">' + esc(f.dev) + '</b><small>' + esc(f.name) + '</small></span>' +
          '<span class="wsh-go" aria-hidden="true">›</span></button>';
      }).join('') + '</div>';
    }

    /* tithis through the civil day, with end times */
    h += '<h3 class="wsh-h">Tithi</h3><ol class="wsh-tl">';
    if (timeline.length) {
      var segs = [{ idx: timeline[0].from, from: null, to: timeline[0].at }];
      timeline.forEach(function (mk, k) { segs.push({ idx: mk.to, from: mk.at, to: timeline[k + 1] ? timeline[k + 1].at : null }); });
      segs.forEach(function (sg) {
        var ti = tithiInfo(sg.idx);
        var when = sg.from && sg.to ? fmtTime(sg.from) + ' – ' + fmtTime(sg.to) :
          sg.to ? 'until ' + fmtTime(sg.to) : 'from ' + fmtTime(sg.from);
        h += '<li><span class="wsh-tl-dev" lang="hi">' + pk(ti) + ' ' + TITHI_DEV[ti.name] + '</span>' +
          '<span class="wsh-tl-en">' + esc(ti.paksha + ' ' + ti.name) + '</span><span class="wsh-tl-t">' + when + '</span></li>';
      });
    } else {
      h += '<li><span class="wsh-tl-dev" lang="hi">' + pk(t) + ' ' + TITHI_DEV[t.name] + '</span>' +
        '<span class="wsh-tl-en">' + esc(t.paksha + ' ' + t.name) + '</span><span class="wsh-tl-t">all day</span></li>';
    }
    h += '</ol>';

    /* panchang of the day */
    var rows = [];
    if (nak) rows.push(['Nakshatra', esc(nak.name) + ' <small>approx., at sunrise</small>']);
    if (w && (timesFree || plusOn)) {
      rows.push(['Sunrise', M.fmt(w.sunrise, city)]);
      rows.push(['Sunset', M.fmt(w.sunset, city)]);
      rows.push(['Rahu kaal', M.range(w.rahu[0], w.rahu[1], city) + ' <small>avoid</small>']);
      rows.push(['Abhijit', M.range(w.abhijit[0], w.abhijit[1], city) + (w.weekday === 3 ? ' <small>avoided on Wednesday</small>' : '')]);
    }
    if (rows.length) {
      h += '<dl class="wsh-grid">' + rows.map(function (rw) { return '<div><dt>' + rw[0] + '</dt><dd>' + rw[1] + '</dd></div>'; }).join('') + '</dl>';
    }
    if (w && !timesFree && !plusOn) {
      h += '<button type="button" class="wsh-plus" id="pkCardPlus"><span>Sunrise, sunset and Rahu kaal for any date</span><b>Plus ›</b></button>';
    } else if (!w && M) {
      h += '<p class="wsh-note">Sun timings cannot be computed for ' + esc(city.name) + ' on this date.</p>';
    }
    if (w && (timesFree || plusOn)) h += '<p class="wsh-note">Sun times for ' + esc(city.name) + '. Change the city on Today.</p>';

    if (g && g.important) {
      h += '<div class="wsh-vrat"><h3 class="wsh-h">Vrat · ' + esc(r.primary.paksha + ' ' + r.primary.name) + '</h3><p>' + esc(g.fast) + '</p></div>';
    }

    /* actions */
    h += '<div class="wsh-actions">' +
      (fests.length ? '<button type="button" class="wsh-btn is-gold" id="pkCardFest">' + DIYA + '<span>Open festival</span></button>' : '') +
      '<button type="button" class="wsh-btn" id="pkCardBell" data-iso="' + iso + '"></button>' +
      (sad && window.dhSession ? '<button type="button" class="wsh-btn' + (fests.length ? '' : ' is-gold') + '" id="pkCardBegin"><span>Begin sadhana</span></button>' : '') +
      '</div>';

    if (g) {
      h += '<details class="wsh-more"><summary>Rituals, mantra jaap and fasting · <span lang="hi">' + esc(g.dev) + '</span></summary>' +
        '<p class="wsh-about">' + esc(g.about) + '</p>' +
        '<ul class="wsh-list">' + g.rituals.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<div class="wsh-jaap"><p class="wsh-jaap-dev" lang="hi">' + esc(g.jaap.dev) + '</p>' +
        '<p class="wsh-jaap-line">' + esc(g.jaap.mantra) + ' × ' + g.jaap.count + '</p>' +
        '<p class="wsh-jaap-note">' + esc(g.jaap.note) + '</p></div>' +
        '<p class="wsh-about"><b>Fasting.</b> ' + esc(g.fast) + '</p></details>';
    }
    h += '<p class="wsh-note">Tithi computed on your device by the sunrise rule; times are in this device’s time zone and can differ from Drik Panchang by a few hours.</p>';

    card.innerHTML = h;
    card.setAttribute('aria-labelledby', 'pkCardTitle');
    card.removeAttribute('aria-label');
    lastCellIso = iso;
    overlay.hidden = false;
    card.scrollTop = 0;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    paintBells();
    $('#pkCardClose', card).addEventListener('click', closeCard);
    card.querySelectorAll('.wsh-fest').forEach(function (b) {
      b.addEventListener('click', function () {
        closeCard();
        if (window.dhFestival) window.dhFestival.open(b.dataset.fest, iso);
      });
    });
    var fb = $('#pkCardFest', card);
    if (fb) fb.addEventListener('click', function () {
      var f = pickFest(fests);
      closeCard();
      if (window.dhFestival && f) window.dhFestival.open(f.name, iso);
    });
    $('#pkCardBell', card).addEventListener('click', function () { toggleReminder(iso, t.name, t.paksha, null); });
    var bb = $('#pkCardBegin', card);
    if (bb) bb.addEventListener('click', function () {
      closeCard();
      window.dhSession.start(sad.room.id, { aartiId: sad.aartiId, title: sad.title });
    });
    var pb = $('#pkCardPlus', card);
    if (pb) pb.addEventListener('click', function () { closeCard(); if (window.dhPlus && window.dhPlus.open) window.dhPlus.open(); });
    $('#pkCardClose', card).focus({ preventScroll: true });
  }

  function closeCard() {
    var overlay = document.getElementById('pkCardOverlay');
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    var lv = liveLeaf(), c = lv && lastCellIso ? lv.querySelector('.wp-day[data-iso="' + lastCellIso + '"]') : null;
    if (c) c.focus({ preventScroll: true });
  }

  function select(iso) {
    selectedIso = iso;
    var lv = liveLeaf();
    if (lv) decorate(lv);
  }

  /* ---------- calendar tab wiring (the panchang lives in the Calendar tab now) ---------- */
  function openPanchang() {
    var n = new Date();
    view = { y: n.getFullYear(), m: n.getMonth() };
    renderMonth(view.y, view.m);
    if (window.dhTab) window.dhTab('calendar');
  }
  function showMonth(y, m) {
    if (busy) return;
    view = { y: y, m: m };
    renderMonth(y, m);
    prefetch(y, m);
  }

  function init() {
    var s = stageEl();
    var wall = document.getElementById('panchangSection');
    if (s) {
      s.addEventListener('click', function (e) {
        if (busy) return;
        var act = e.target.closest('[data-act]');
        if (act && !act.disabled) {
          if (act.dataset.act === 'prev') flip(-1);
          else if (act.dataset.act === 'next') flip(1);
          else if (act.dataset.act === 'pick') { if (pickerOpen()) closePicker(true); else openPicker(); }
          return;
        }
        var c = e.target.closest('.wp-day[data-iso]');
        if (c) { select(c.dataset.iso); openCard(c.dataset.iso); }
      });
      wireDrag(s);
    }
    if (wall) {
      wall.addEventListener('keydown', function (e) {
        if (pickerOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); flip(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); flip(1); }
      });
    }
    var overlay = document.getElementById('pkCardOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCard(); });
      overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
    }
    document.addEventListener('dh-plus-change', function () {
      if (overlay && !overlay.hidden && lastCellIso) openCard(lastCellIso);
    });
    renderMonth(view.y, view.m);
    announce(view.y, view.m);
    prefetch(view.y, view.m);

    /* local fallback: surface a due reminder when the app is open */
    var todayISO = isoOf(now.getFullYear(), now.getMonth(), now.getDate());
    var due = loadReminders().filter(function (r) { return r.date === todayISO; });
    if (due.length) {
      var r = due[0];
      setTimeout(function () {
        toast('🌙 Today is ' + r.paksha + ' ' + r.tithi + ' — your reminder. Open the Calendar for today’s rituals.');
      }, 2500);
    }
  }

  window.dhPanchang = {
    tithiAt: tithiAt, tithiInfo: tithiInfo, monthData: monthData, elongationAt: elongationAt,
    tithiTimeline: tithiTimeline, open: openPanchang, showMonth: showMonth, cardGuide: cardGuide, _flip: flip, _view: function () { return view; },
    _goTo: goTo, _renderMonth: renderMonth, _openCard: openCard, _toggleReminder: toggleReminder,
    _loadReminders: loadReminders, _cardGuide: cardGuide
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
