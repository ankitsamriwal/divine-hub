/* Divine Hub — Personal Almanac: family tithis, birth nakshatra days.
   Low-precision lunar/solar positions (Meeus-style, good to ~half a degree).
   Tithi boundaries can wobble by a day; labelled approximate. */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_almanac_v1';

  const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];
  const TITHIS = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
    'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima'
  ];
  const TITHIS_K = TITHIS.slice(0, 14).concat(['Amavasya']);

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  const d2r = Math.PI / 180;
  function sinD(x) { return Math.sin(x * d2r); }
  function norm(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  // days since J2000.0 (2000-01-01 12:00 UTC)
  function nDays(date) { return (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000; }

  function sunLong(n) {
    const L0 = 280.460 + 0.9856474 * n;
    const g = 357.528 + 0.9856003 * n;
    return norm(L0 + 1.915 * sinD(g) + 0.020 * sinD(2 * g));
  }

  function moonLong(n) {
    const L = 218.316 + 13.176396 * n;
    const M = 134.963 + 13.064993 * n;
    const D = 297.850 + 12.190749 * n;
    const F = 93.272 + 13.229350 * n;
    const g = 357.528 + 0.9856003 * n;
    return norm(L + 6.289 * sinD(M) + 1.274 * sinD(2 * D - M) + 0.658 * sinD(2 * D)
      + 0.214 * sinD(2 * M) - 0.186 * sinD(g) - 0.114 * sinD(2 * F));
  }

  function ayanamsa(date) {
    return 24.20 + ((date.getUTCFullYear() - 2026) * 0.014);
  }

  function siderealMoon(date) {
    const n = nDays(date);
    return norm(moonLong(n) - ayanamsa(date));
  }

  function nakshatraOf(date) {
    const sid = siderealMoon(date);
    const i = Math.floor(sid / (360 / 27));
    return { index: i, name: NAKSHATRAS[i] };
  }

  function tithiOf(date) {
    const n = nDays(date);
    const diff = norm(moonLong(n) - sunLong(n));
    const t = Math.floor(diff / 12); // 0-29
    const waxing = t < 15;
    const name = waxing ? TITHIS[t] : TITHIS_K[t - 15];
    return { index: t, name: name, paksha: waxing ? 'Shukla' : 'Krishna' };
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function daysUntil(d) {
    return Math.round((d.getTime() - Date.now()) / 86400000);
  }

  function nextNakshatraDay(nakIndex, from) {
    for (let i = 1; i <= 31; i++) {
      const d = new Date(from.getTime() + i * 86400000);
      if (nakshatraOf(d).index === nakIndex) return d;
    }
    return null;
  }

  function nextTithiDay(tithiIndex, from) {
    for (let i = 1; i <= 31; i++) {
      const d = new Date(from.getTime() + i * 86400000);
      if (tithiOf(d).index === tithiIndex) return d;
    }
    return null;
  }

  /* ---------- section ---------- */
  function render() {
    const anchor = document.getElementById('puzzleSection') || document.getElementById('journeysSection');
    if (!anchor) { setTimeout(render, 400); return; }
    let sec = document.getElementById('almanacSection');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'almanacSection';
      sec.className = 'almanac-section';
      anchor.insertAdjacentElement('afterend', sec);
    }
    const s = load();
    const members = s.members || [];
    const now = new Date();
    const noon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
    const todayT = tithiOf(noon);
    const todayN = nakshatraOf(noon);

    sec.innerHTML =
      '<div class="al-card">' +
      '<div class="al-head"><span class="al-label">Your Almanac</span>' +
      '<span class="al-today">' + todayT.name + ' · ' + todayT.paksha + ' paksha · Moon in ' + todayN.name + '</span></div>' +
      '<div class="al-members">' + members.map((m, mi) => {
        const dob = new Date(m.dob + 'T12:00:00Z');
        const nak = nakshatraOf(dob);
        const tit = tithiOf(dob);
        const nextN = nextNakshatraDay(nak.index, noon);
        const nextT = nextTithiDay(tit.index, noon);
        return '<div class="al-member">' +
          '<div class="al-m-top"><span class="al-m-name">' + m.name + '</span>' +
          '<button class="al-m-del" data-i="' + mi + '" aria-label="Remove">✕</button></div>' +
          '<div class="al-m-line">Born under <b>' + nak.name + '</b> nakshatra · ' + tit.name + ' tithi</div>' +
          (nextN ? '<div class="al-m-line al-gold">Nakshatra day: ' + fmtDate(nextN) + ' (in ' + daysUntil(nextN) + ' days)</div>' : '') +
          (nextT ? '<div class="al-m-line al-gold">Birth tithi: ' + fmtDate(nextT) + ' (in ' + daysUntil(nextT) + ' days)</div>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<form class="al-form" id="alForm">' +
      '<input id="alName" type="text" placeholder="Name (Papa, Dadi…)" maxlength="24" required>' +
      '<input id="alDob" type="date" required>' +
      '<button type="submit">Add</button></form>' +
      '<div class="al-note">Family tithis and nakshatra days, computed on your device. Approximate to the day.</div>' +
      '</div>';

    sec.querySelector('#alForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('alName').value.trim();
      const dob = document.getElementById('alDob').value;
      if (!name || !dob) return;
      const st = load();
      st.members = st.members || [];
      st.members.push({ name: name, dob: dob });
      save(st);
      render();
    });
    sec.querySelectorAll('.al-m-del').forEach(b =>
      b.addEventListener('click', () => {
        const st = load();
        st.members.splice(parseInt(b.dataset.i, 10), 1);
        save(st);
        render();
      }));
  }

  window.dhAlmanac = { nakshatraOf: nakshatraOf, tithiOf: tithiOf, render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
