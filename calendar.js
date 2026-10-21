/* Divine Hub — Calendar tab: filter chips + month list under the panchang grid,
   and the festival detail sheet (city muhurat, puja guide, aarti, find a temple).
   Times come from muhurat.js (NOAA sun + on-device tithi); nothing is invented:
   a value that cannot be computed is left out. */
(function () {
  'use strict';

  var M = window.dhMuhurat, P = window.dhPanchang, D = window.DH_DEITY;
  if (!M || !P || !D) return;

  var LS_CHIPS = 'divinehub_cal_chips_v1';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var TITHI_DEV = { Ekadashi: 'एकादशी', Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या' };
  var chips = loadChips();
  var month = (P._view && P._view()) || { y: new Date().getFullYear(), m: new Date().getMonth() };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function loadChips() { try { var a = JSON.parse(localStorage.getItem(LS_CHIPS)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveChips() { try { localStorage.setItem(LS_CHIPS, JSON.stringify(chips)); } catch (e) {} }
  function plus() { return !!(window.dhPlus && window.dhPlus.isActive()); }
  function parse(iso) { var p = iso.split('-').map(Number); return { y: p[0], m: p[1] - 1, d: p[2] }; }
  function longDate(iso) { var p = parse(iso); return new Date(p.y, p.m, p.d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  function daysTo(iso) {
    var t = M.cityToday(M.getCity()), p = parse(iso);
    return Math.round((Date.UTC(p.y, p.m, p.d) - Date.UTC(t.y, t.m, t.d)) / 86400000);
  }
  function whenText(n) { return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 1 ? 'in ' + n + ' days' : (-n) + ' day' + (n === -1 ? '' : 's') + ' ago'; }

  /* city muhurat rows for a date; omits anything not computable */
  function timesHtml(iso, compact) {
    var city = M.getCity(), p = parse(iso);
    var w = M.daily(city, p.y, p.m, p.d);
    if (!w) return compact ? '' : '<p class="fd-note">Sun timings cannot be computed for ' + esc(city.name) + ' on this date. See your local panchang.</p>';
    if (compact) {
      return '<span class="cl-times">Sunrise ' + M.fmt(w.sunrise, city) + ' · Sunset ' + M.fmt(w.sunset, city) +
        ' · Abhijit ' + M.range(w.abhijit[0], w.abhijit[1], city) + ' · Rahu kaal ' + M.range(w.rahu[0], w.rahu[1], city) + '</span>';
    }
    return '<dl class="dw-times fd-times">' +
      (w.tithi ? '<div><dt>Tithi at sunrise</dt><dd>' + esc(w.tithi.paksha + ' ' + w.tithi.name) + '</dd></div>' : '') +
      '<div><dt>Sunrise · Sunset</dt><dd>' + M.fmt(w.sunrise, city) + ' · ' + M.fmt(w.sunset, city) + '</dd></div>' +
      '<div><dt>Abhijit muhurat</dt><dd>' + M.range(w.abhijit[0], w.abhijit[1], city) + (w.weekday === 3 ? ' <small>(traditionally avoided on Wednesday)</small>' : '') + '</dd></div>' +
      '<div><dt>Rahu kaal (avoid)</dt><dd>' + M.range(w.rahu[0], w.rahu[1], city) + '</dd></div>' +
      '<div><dt>Pradosh kaal</dt><dd>' + M.range(w.pradosh[0], w.pradosh[1], city) + '</dd></div></dl>';
  }

  /* ---------- month list ---------- */
  function rowsFor(y, m) {
    var data = P.monthData(y, m), out = [];
    data.forEach(function (r) {
      r.festivals.forEach(function (f) { out.push({ kind: 'festival', iso: r.iso, d: r.d, f: f }); });
      if (r.important && r.guide) {
        var t = r.primary;
        out.push({ kind: 'vrat', ekadashi: t.name === 'Ekadashi', iso: r.iso, d: r.d, t: t, g: r.guide });
      }
    });
    return out;
  }
  function wanted(row) {
    var cats = chips.filter(function (c) { return c !== 'muhurat'; });
    if (!cats.length) return true;
    if (row.kind === 'festival') return cats.indexOf('festival') !== -1;
    if (cats.indexOf('vrat') !== -1) return true;
    return row.ekadashi && cats.indexOf('ekadashi') !== -1;
  }

  function renderList() {
    var host = document.getElementById('calList');
    if (!host) return;
    var showTimes = chips.indexOf('muhurat') !== -1;
    var rows = rowsFor(month.y, month.m).filter(wanted);
    var todayIso = (function () { var t = M.cityToday(M.getCity()); return D.isoOf(t.y, t.m, t.d); })();
    var h = '<h3 class="cl-head">' + MONTHS[month.m] + ' ' + month.y + (showTimes ? ' · ' + esc(M.getCity().name) : '') + '</h3>';
    if (!rows.length) {
      h += '<p class="cl-empty">Nothing in this filter for ' + MONTHS[month.m] + '. Try another chip, or the next month.</p>';
    } else {
      h += '<ul class="cl-items">' + rows.map(function (r) {
        var past = r.iso < todayIso, isToday = r.iso === todayIso;
        var main = r.kind === 'festival'
          ? '<span class="cl-dev">' + esc(r.f.dev) + '</span><span class="cl-name">' + esc(r.f.name) + '</span>'
          : '<span class="cl-dev">' + esc((r.t.paksha === 'Shukla' ? 'शुक्ल ' : 'कृष्ण ') + (r.g.dev || TITHI_DEV[r.t.name] || '')) + '</span><span class="cl-name">' + esc(r.t.paksha + ' ' + r.t.name) + ' · ' + esc(r.g.deity) + '</span>';
        return '<li><button type="button" class="cl-item cl-' + r.kind + (past ? ' cl-past' : '') + (isToday ? ' cl-today' : '') + '" data-kind="' + r.kind + '" data-iso="' + r.iso + '"' +
          (r.kind === 'festival' ? ' data-fest="' + esc(r.f.name) + '"' : '') + '>' +
          '<span class="cl-date"><b>' + r.d + '</b><small>' + new Date(month.y, month.m, r.d).toLocaleDateString('en-GB', { weekday: 'short' }) + '</small></span>' +
          '<span class="cl-main">' + main + (isToday ? '<span class="cl-tag">today</span>' : '') + (showTimes ? timesHtml(r.iso, true) : '') + '</span>' +
          '<span class="cl-go" aria-hidden="true">›</span></button></li>';
      }).join('') + '</ul>';
    }
    if (showTimes) {
      h += '<p class="fd-note">Times for ' + esc(M.getCity().name) + ', computed on your device; they vary by city and panchang tradition. Change the city on Today.</p>';
      if (plus()) h += '<button type="button" class="btn-ghost cl-muhurat" id="clMuhurat">Daily muhurat for any date ›</button>';
    }
    host.innerHTML = h;
    host.querySelectorAll('.cl-item').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.kind === 'festival') openFestival(b.dataset.fest, b.dataset.iso);
        else P._openCard(b.dataset.iso);
      });
    });
    var mu = host.querySelector('#clMuhurat');
    if (mu) mu.addEventListener('click', function () { if (window.dhMuhuratUI) window.dhMuhuratUI.open(); });
  }

  function wireChips() {
    var wrap = document.getElementById('calChips');
    if (!wrap) return;
    wrap.querySelectorAll('.cal-chip').forEach(function (b) {
      var on = chips.indexOf(b.dataset.f) !== -1;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', function () {
        var f = b.dataset.f, i = chips.indexOf(f);
        if (i === -1) chips.push(f); else chips.splice(i, 1);
        b.classList.toggle('on', i === -1);
        b.setAttribute('aria-pressed', String(i === -1));
        saveChips();
        renderList();
      });
    });
  }

  function renderDiwaliCard() {
    var host = document.getElementById('calDiwali');
    if (!host || !window.dhMuhuratUI) return;
    if (!(window.dhMuhuratUI.bannerLive && window.dhMuhuratUI.bannerLive())) { host.innerHTML = ''; return; }
    host.innerHTML = '<button type="button" class="t-card cal-diwali" id="calDiwaliBtn"><span class="cal-diwali-ic" aria-hidden="true">🪔</span>' +
      '<span><b class="cal-diwali-dev">दीपावली · Diwali guide</b><small>Sun 8 Nov 2026 · Lakshmi puja steps, aarti and the Pradosh time for your city</small></span><span class="cl-go" aria-hidden="true">›</span></button>';
    host.querySelector('#calDiwaliBtn').addEventListener('click', function () { window.dhMuhuratUI.openDiwali({ noPlus: true }); });
  }

  /* ---------- festival detail sheet ---------- */
  var fsEl = null;
  function festSheet() {
    if (fsEl) return fsEl;
    fsEl = document.createElement('section');
    fsEl.id = 'festSheet';
    fsEl.className = 'dh-sheet info-section fest-sheet';
    fsEl.hidden = true;
    fsEl.setAttribute('role', 'dialog');
    fsEl.setAttribute('aria-label', 'Festival');
    fsEl.innerHTML = '<button class="dh-sheet-close" id="festSheetClose" aria-label="Close festival">✕</button><div id="festSheetBody" class="fd-body"></div>';
    document.body.appendChild(fsEl);
    fsEl.querySelector('#festSheetClose').addEventListener('click', function () { window.dhCloseSheet('festSheet'); });
    return fsEl;
  }

  function nextIso(f) {
    var t = M.cityToday(M.getCity()), today = D.isoOf(t.y, t.m, t.d);
    if (f.d2026 >= today) return f.d2026;
    return f.d2027;
  }

  function openFestival(name, iso) {
    var f = D.festivalByName(name);
    if (!f) return;
    iso = (iso === f.d2026 || iso === f.d2027) ? iso : nextIso(f);
    var el = festSheet(), body = el.querySelector('#festSheetBody');
    function paint() {
      var city = M.getCity();
      var room = D.festivalRoom(f);
      var aid = D.festivalAarti(f), aarti = aid ? D.prayer(aid) : null;
      var guide = D.festivalGuide(f);
      var n = daysTo(iso);
      var sessionRoom = room.aarti ? room : null;
      var h = '<div class="pk-ornament" aria-hidden="true"><span>✦</span><b>🪔</b><span>✦</span></div>' +
        '<h2 class="fd-dev">' + esc(f.dev) + '</h2>' +
        '<p class="fd-name">' + esc(f.name) + '</p>' +
        '<p class="fd-when">' + longDate(iso) + ' · ' + whenText(n) + '</p>' +
        '<p class="fd-about">' + esc(f.note) + '</p>' +
        '<div class="dw-card fd-card"><div class="fd-city"><label class="sk-label" for="fdCity">Muhurat for</label>' +
        '<select id="fdCity" class="dw-select">' + M.CITIES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === city.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
        timesHtml(iso, false) +
        '<p class="dw-disclaimer">Computed on your device for the selected city; timings vary by city and by panchang tradition, and festival observance outside India can differ by a day. Lagna-based muhurat is not computed here: for the exact puja time, see your local panchang or family pandit.</p></div>' +
        '<div class="fd-actions">' +
          (sessionRoom ? '<button type="button" class="btn-gold" id="fdBegin">Begin sadhana · ' + esc(room.dev) + '</button>' : '') +
          (aarti ? '<button type="button" class="btn-ghost" id="fdAarti">आरती · ' + esc(aarti.title) + '</button>' : '') +
          '<button type="button" class="btn-ghost" id="fdTemple">🛕 Find a temple</button>' +
          (f.name.indexOf('Diwali') === 0 ? '<button type="button" class="btn-ghost" id="fdDiwali">🪔 Full Diwali guide</button>' : '') +
        '</div>';
      if (guide) {
        h += '<h3 class="info-h3">पूजा विधि · ' + esc(guide.title) + '</h3><p class="info-sub">' + esc(guide.when) + '</p>' +
          '<ol class="step-list">' + guide.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
          '<details class="why-item"><summary>Samagri (' + guide.samagri.length + ' items)</summary><ul class="samagri-list">' +
          guide.samagri.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></details>';
      }
      h += '<p class="fd-note">2026: ' + longDate(f.d2026) + ' · 2027: ' + longDate(f.d2027) + '</p>';
      body.innerHTML = h;
      body.querySelector('#fdCity').addEventListener('change', function (e) {
        M.setCity(e.target.value);
        try { document.dispatchEvent(new CustomEvent('dh-city')); } catch (x) {}
        paint();
      });
      var b;
      if ((b = body.querySelector('#fdBegin'))) b.addEventListener('click', function () {
        if (window.dhSession) window.dhSession.start(sessionRoom.id, { aartiId: aid, title: f.dev + ' · ' + f.name });
      });
      if ((b = body.querySelector('#fdAarti'))) b.addEventListener('click', function () { if (window.dhOpenPrayer) window.dhOpenPrayer(aid); });
      if ((b = body.querySelector('#fdTemple'))) b.addEventListener('click', function () { window.dhOpenSheet('nearbySection'); });
      if ((b = body.querySelector('#fdDiwali'))) b.addEventListener('click', function () { if (window.dhMuhuratUI) window.dhMuhuratUI.openDiwali({ noPlus: true }); });
    }
    paint();
    window.dhOpenSheet('festSheet');
  }

  function init() {
    wireChips();
    renderList();
    renderDiwaliCard();
    document.addEventListener('dh-month', function (e) { month = e.detail; renderList(); });
    document.addEventListener('dh-city', renderList);
    document.addEventListener('dh-plus-change', renderList);
  }

  window.dhFestival = { open: openFestival, nextIso: nextIso };
  window.dhCalendar = { render: renderList };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
