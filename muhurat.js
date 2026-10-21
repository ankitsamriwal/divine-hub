/* Divine Hub — city-correct sunrise/sunset and daily muhurat windows.
   REAL: sunrise/sunset from the NOAA solar-position equations (typically within
   1-2 minutes of almanac values below the polar circles), shown in the city's own
   time zone via Intl. Tithi uses the existing on-device lunar model in panchang.js
   (dhPanchang.tithiAt), so tithi boundaries carry its "few hours" caveat.
   Windows use standard textbook definitions, stated in the UI next to each value:
     Brahma muhurta = 2 night-muhurtas before sunrise (night / 15 each)
     Abhijit        = 8th of 15 day-muhurtas
     Rahu kaal      = 1/8 of daylight, slot by weekday
     Pradosh kaal   = sunset + 3 night-muhurtas (night / 5)
   NOT computed: lagna (e.g. Vrishabha sthir lagna for Lakshmi puja), choghadiya,
   nakshatra/yoga/karana. The UI says "see your local panchang" for those. */

(function () {
  'use strict';

  var LS_CITY = 'divinehub_city_v1';
  var CITIES = [
    { id: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
    { id: 'abudhabi', name: 'Abu Dhabi', lat: 24.4539, lon: 54.3773, tz: 'Asia/Dubai' },
    { id: 'london', name: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    { id: 'newjersey', name: 'New Jersey (Edison)', lat: 40.5187, lon: -74.4121, tz: 'America/New_York' },
    { id: 'toronto', name: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
    { id: 'singapore', name: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
    { id: 'delhi', name: 'New Delhi', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
    { id: 'mumbai', name: 'Mumbai', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
    { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    { id: 'chennai', name: 'Chennai', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
    { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    { id: 'hyderabad', name: 'Hyderabad', lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata' },
    { id: 'ahmedabad', name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata' },
    { id: 'pune', name: 'Pune', lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata' }
  ];
  var TZ_DEFAULT = {
    'Asia/Dubai': 'dubai', 'Europe/London': 'london', 'America/New_York': 'newjersey',
    'America/Toronto': 'toronto', 'Asia/Singapore': 'singapore', 'Asia/Kolkata': 'delhi', 'Asia/Calcutta': 'delhi'
  };
  var MIN = 60000;
  var r2d = 180 / Math.PI, d2r = Math.PI / 180;

  function deviceTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function cityById(id) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i].id === id) return CITIES[i]; return null; }
  function getCity() {
    var id = null;
    try { id = localStorage.getItem(LS_CITY); } catch (e) {}
    return cityById(id) || cityById(TZ_DEFAULT[deviceTz()]) || cityById('delhi');
  }
  function setCity(id) { if (cityById(id)) { try { localStorage.setItem(LS_CITY, id); } catch (e) {} } }

  /* ---------- NOAA sunrise / sunset ---------- */
  /* returns {rise, set} as Date instants for the civil date y-m-d (m 0-based) at the city */
  function sunEvents(city, y, m, d) {
    var base = Date.UTC(y, m, d); // 0h UTC of that calendar date
    function at(minutesGuess, rising) {
      var jd = (base + minutesGuess * MIN) / 86400000 + 2440587.5;
      var T = (jd - 2451545) / 36525;
      var L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
      var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
      var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
      var C = Math.sin(M * d2r) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
        Math.sin(2 * M * d2r) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * d2r) * 0.000289;
      var om = 125.04 - 1934.136 * T;
      var lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * d2r);
      var eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
      var eps = eps0 + 0.00256 * Math.cos(om * d2r);
      var decl = Math.asin(Math.sin(eps * d2r) * Math.sin(lam * d2r));
      var yv = Math.pow(Math.tan(eps * d2r / 2), 2);
      var eot = 4 * r2d * (yv * Math.sin(2 * L0 * d2r) - 2 * e * Math.sin(M * d2r) +
        4 * e * yv * Math.sin(M * d2r) * Math.cos(2 * L0 * d2r) -
        0.5 * yv * yv * Math.sin(4 * L0 * d2r) - 1.25 * e * e * Math.sin(2 * M * d2r));
      var cosH = Math.cos(90.833 * d2r) / (Math.cos(city.lat * d2r) * Math.cos(decl)) - Math.tan(city.lat * d2r) * Math.tan(decl);
      if (cosH > 1 || cosH < -1) return null; // polar day/night: not supported
      var H = Math.acos(cosH) * r2d;
      var noon = 720 - 4 * city.lon - eot;
      return rising ? noon - 4 * H : noon + 4 * H;
    }
    var noonGuess = 720 - 4 * city.lon;
    var r1 = at(noonGuess - 360, true), s1 = at(noonGuess + 360, false);
    if (r1 === null || s1 === null) return null;
    var r2 = at(r1, true), s2 = at(s1, false); // one refinement pass at the event time
    return { rise: new Date(base + r2 * MIN), set: new Date(base + s2 * MIN) };
  }

  /* ---------- formatting in the city's zone ---------- */
  function fmt(date, city) {
    try {
      return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: city.tz }).format(date).replace(/\s?([ap])m/i, function (_, a) { return ' ' + a.toUpperCase() + 'M'; });
    } catch (e) { return date.toISOString().slice(11, 16) + ' UTC'; }
  }
  function fmtDay(date, city) {
    try { return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: city.tz }).format(date); }
    catch (e) { return date.toISOString().slice(0, 10); }
  }
  /* calendar y/m/d "today" in the city's zone */
  function cityToday(city) {
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: city.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-');
      return { y: +p[0], m: +p[1] - 1, d: +p[2] };
    } catch (e) { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() }; }
  }
  function range(a, b, city) { return fmt(a, city) + ' – ' + fmt(b, city); }

  /* ---------- daily windows ---------- */
  var RAHU_SLOT = [8, 2, 7, 5, 6, 4, 3]; // Sun..Sat, 1-based eighth of daylight
  function daily(city, y, m, d) {
    var today = sunEvents(city, y, m, d);
    var prev = sunEvents(city, y, m, d - 1);
    var next = sunEvents(city, y, m, d + 1);
    if (!today || !prev || !next) return null;
    var dayLen = today.set - today.rise;
    var nightBefore = today.rise - prev.set;
    var nightAfter = next.rise - today.set;
    var dm = dayLen / 15, nmB = nightBefore / 15, nmA = nightAfter / 15, d8 = dayLen / 8;
    var wd = new Date(Date.UTC(y, m, d)).getUTCDay();
    var k = RAHU_SLOT[wd];
    var out = {
      city: city, y: y, m: m, d: d, weekday: wd,
      sunrise: today.rise, sunset: today.set,
      brahma: [new Date(today.rise - 2 * nmB), new Date(today.rise - nmB)],
      abhijit: [new Date(+today.rise + 7 * dm), new Date(+today.rise + 8 * dm)],
      rahu: [new Date(+today.rise + (k - 1) * d8), new Date(+today.rise + k * d8)],
      pradosh: [today.set, new Date(+today.set + 3 * nmA)],
      tithi: null
    };
    if (window.dhPanchang && window.dhPanchang.tithiAt) {
      out.tithi = window.dhPanchang.tithiInfo(window.dhPanchang.tithiAt(today.rise));
    }
    return out;
  }

  /* first instant in [from, to] where tithiAt changes to/from idx, to ~1 minute */
  function tithiEdge(from, to, idx, entering) {
    var P = window.dhPanchang;
    if (!P) return null;
    var step = 3600000, t = +from;
    var prevIn = P.tithiAt(new Date(t)) === idx;
    for (t += step; t <= +to; t += step) {
      var isIn = P.tithiAt(new Date(t)) === idx;
      if (isIn !== prevIn && isIn === entering) {
        var lo = t - step, hi = t;
        for (var i = 0; i < 16; i++) {
          var mid = (lo + hi) / 2;
          if ((P.tithiAt(new Date(mid)) === idx) === entering) hi = mid; else lo = mid;
        }
        return new Date(Math.round(hi / MIN) * MIN);
      }
      prevIn = isIn;
    }
    return null;
  }

  /* Diwali 2026 (Sunday 8 November): Lakshmi puja falls in Pradosh kaal while
     Kartik Amavasya prevails. We compute Pradosh for the city and check Amavasya
     (tithi index 29) at both ends. Lagna is NOT computed. */
  var DIWALI = { y: 2026, m: 10, d: 8 };
  function diwali(city) {
    var w = daily(city, DIWALI.y, DIWALI.m, DIWALI.d);
    if (!w || !window.dhPanchang) return null;
    var P = window.dhPanchang, AMA = 29;
    var from = new Date(Date.UTC(2026, 10, 6)), to = new Date(Date.UTC(2026, 10, 11));
    var starts = tithiEdge(from, to, AMA, true);
    var ends = starts ? tithiEdge(starts, to, AMA, false) : null;
    var a = P.tithiAt(w.pradosh[0]) === AMA, b = P.tithiAt(w.pradosh[1]) === AMA;
    var win = null;
    if (a || b) {
      var s = a ? w.pradosh[0] : starts, e = b ? w.pradosh[1] : ends;
      if (s && e && e > s) win = [s, e];
    }
    return { w: w, amaStart: starts, amaEnd: ends, window: win, fullOverlap: a && b };
  }

  /* ---------- festival calendar (.ics) ---------- */
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function festivalIcs(city) {
    if (typeof FESTIVALS === 'undefined') return '';
    var stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Divine Hub//Festivals//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Divine Hub festivals (' + icsEscape(city.name) + ')'];
    FESTIVALS.forEach(function (f, i) {
      [f.d2026, f.d2027].forEach(function (iso, j) {
        if (!iso) return;
        var p = iso.split('-').map(Number);
        var w = daily(city, p[0], p[1] - 1, p[2]);
        var end = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1)).toISOString().slice(0, 10).replace(/-/g, '');
        var desc = f.note + (w ? '\n\n' + city.name + ': sunrise ' + fmt(w.sunrise, city) + ', sunset ' + fmt(w.sunset, city) + ', Pradosh ' + range(w.pradosh[0], w.pradosh[1], city) + '.' : '') +
          '\nDates follow the Indian panchang; observance outside India can differ by a day. Confirm with your local temple or panchang.';
        lines.push('BEGIN:VEVENT', 'UID:dh-fest-' + i + '-' + j + '-' + city.id + '@roadtodivinity', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + iso.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + end,
          'SUMMARY:' + icsEscape('🪔 ' + f.name), 'DESCRIPTION:' + icsEscape(desc),
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(f.name + ' tomorrow'), 'TRIGGER:-PT6H', 'END:VALARM',
          'END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
  function downloadIcs(city) {
    var blob = new Blob([festivalIcs(city)], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'divine-hub-festivals-' + city.id + '.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* upcoming festival in the next `days` days (by the city's calendar date) */
  function festivalSoon(city, days) {
    if (typeof FESTIVALS === 'undefined') return null;
    var t = cityToday(city), t0 = Date.UTC(t.y, t.m, t.d), best = null;
    FESTIVALS.forEach(function (f) {
      [f.d2026, f.d2027].forEach(function (iso) {
        var p = iso.split('-').map(Number), dd = (Date.UTC(p[0], p[1] - 1, p[2]) - t0) / 86400000;
        if (dd >= 0 && dd <= days && (!best || dd < best.inDays)) best = { f: f, iso: iso, inDays: dd };
      });
    });
    return best;
  }

  window.dhMuhurat = {
    CITIES: CITIES, getCity: getCity, setCity: setCity, cityById: cityById, cityToday: cityToday,
    sunEvents: sunEvents, daily: daily, diwali: diwali, fmt: fmt, fmtDay: fmtDay, range: range,
    festivalIcs: festivalIcs, downloadIcs: downloadIcs, festivalSoon: festivalSoon, DIWALI: DIWALI
  };
})();
