/* Divine Hub — Diwali 2026 banner + Diwali guide sheet + city muhurat sheet.
   Free: the Diwali guide (puja steps, aarti link) and Diwali's Pradosh window for
   ONE city. Plus: daily muhurat for any date and city, and festival calendar alerts.
   All times come from muhurat.js (NOAA sun + on-device tithi model). Lagna-based
   sthir muhurat is NOT computed; the UI points to a local panchang for it. */

(function () {
  'use strict';

  var M = window.dhMuhurat;
  if (!M) return;
  var BANNER_UNTIL = Date.UTC(2026, 10, 12); // through Bhai Dooj (11 Nov)
  var LS_BANNER = 'divinehub_diwali_banner_v1';
  var DISCLAIMER = 'Timings are computed on your device for the selected city and vary by city and by panchang tradition. Lagna (sthir) muhurat is not computed here; for the exact puja time, see your local panchang or family pandit.';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plus() { return !!(window.dhPlus && window.dhPlus.isActive()); }
  function openPlus() { if (window.dhPlus) window.dhPlus.open(); }

  function cityOptions(sel) {
    return M.CITIES.map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
  }

  function sheet(id, label) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('section');
      el.id = id;
      el.className = 'dh-sheet info-section dw-sheet';
      el.hidden = true;
      el.innerHTML = '<button class="dh-sheet-close" id="' + id + 'Close" aria-label="Close ' + label + '">✕</button><div id="' + id + 'Body"></div>';
      document.body.appendChild(el);
      el.querySelector('#' + id + 'Close').addEventListener('click', function () { window.dhCloseSheet(id); });
    }
    return el;
  }

  /* ---------- Diwali guide ---------- */
  function diwaliHtml(city) {
    var x = M.diwali(city);
    var g = (typeof PUJA_GUIDES !== 'undefined') ? PUJA_GUIDES.find(function (p) { return p.id === 'lakshmi-puja-diwali'; }) : null;
    var h = '<div class="pk-ornament" aria-hidden="true"><span>✦</span><b>🪔</b><span>✦</span></div>' +
      '<h2 class="info-title">दीपावली · Diwali 2026</h2>' +
      '<p class="info-sub">Lakshmi-Ganesh puja on <b>Sunday 8 November 2026</b>, Kartik Amavasya.</p>' +
      '<div class="dw-card"><label class="sk-label" for="dwCity">Your city</label>' +
      '<select id="dwCity" class="dw-select">' + cityOptions(city) + '</select>';
    if (x) {
      h += '<dl class="dw-times">' +
        '<div><dt>Sunset</dt><dd>' + M.fmt(x.w.sunset, city) + '</dd></div>' +
        '<div><dt>Pradosh kaal</dt><dd>' + M.range(x.w.pradosh[0], x.w.pradosh[1], city) + '</dd></div>' +
        (x.amaStart && x.amaEnd ? '<div><dt>Amavasya (approx.)</dt><dd>' + M.fmtDay(x.amaStart, city) + ' ' + M.fmt(x.amaStart, city) + ' → ' + M.fmtDay(x.amaEnd, city) + ' ' + M.fmt(x.amaEnd, city) + '</dd></div>' : '') +
        '</dl>' +
        (x.window
          ? '<p class="dw-lead">Lakshmi puja is traditionally done in <b>Pradosh kaal while Amavasya prevails</b>: in ' + esc(city.name) + ' that is about <b>' + M.range(x.window[0], x.window[1], city) + '</b>.</p>'
          : '<p class="dw-lead">The on-device model could not place Amavasya within Pradosh kaal for this city. <b>See your local panchang</b> for the puja time.</p>');
    } else {
      h += '<p class="dw-lead">Timings could not be computed for this city. <b>See your local panchang.</b></p>';
    }
    h += '<p class="dw-disclaimer">' + esc(DISCLAIMER) + ' Pradosh = sunset plus one fifth of the night.</p></div>';

    h += '<div class="dw-actions">' +
      '<button class="btn-gold" id="dwAarti">Om Jai Lakshmi Mata aarti</button>' +
      '<button class="btn-ghost" id="dwAshtakam">Mahalakshmi Ashtakam</button></div>';

    if (g) {
      h += '<h3 class="info-h3">Puja vidhi: ' + g.steps.length + ' steps</h3><ol class="step-list">' +
        g.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<details class="why-item"><summary>Samagri (' + g.samagri.length + ' items)</summary><ul class="samagri-list">' +
        g.samagri.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></details>';
    }
    h += '<div class="dw-plus">' + (plus()
      ? '<b>✨ Plus:</b> open <button class="plus-link" id="dwDaily">daily muhurat</button> for Dhanteras, Govardhan and Bhai Dooj in your city, or <button class="plus-link" id="dwIcs">add all festivals to your calendar</button>.'
      : '<b>✨ Sankalp+</b> gives you this for every day of the year: Brahma muhurta, Abhijit, Rahu kaal and Pradosh for your city, plus festival alerts in your phone calendar. <button class="plus-cta plus-cta-btn" id="dwGoPlus">See Plus · from ' + esc(priceHint()) + '</button>') +
      '</div>';
    return h;
  }
  function priceHint() {
    var C = window.DH_CONFIG || {}, tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') ? (C.PRICE_MONTHLY_INR || '₹99') + '/mo' : (C.PRICE_MONTHLY_USD || '$1.99') + '/mo';
  }

  function openDiwali() {
    var el = sheet('diwaliSheet', 'Diwali guide');
    var body = el.querySelector('#diwaliSheetBody');
    function paint() {
      var city = M.getCity();
      body.innerHTML = diwaliHtml(city);
      body.querySelector('#dwCity').addEventListener('change', function (e) { M.setCity(e.target.value); paint(); });
      function prayer(id) { window.dhCloseSheet('diwaliSheet'); if (window.dhOpenPrayer) window.dhOpenPrayer(id); }
      body.querySelector('#dwAarti').addEventListener('click', function () { prayer('om-jai-lakshmi-mata'); });
      body.querySelector('#dwAshtakam').addEventListener('click', function () { prayer('mahalakshmi-ashtakam'); });
      var b;
      if ((b = body.querySelector('#dwGoPlus'))) b.addEventListener('click', openPlus);
      if ((b = body.querySelector('#dwDaily'))) b.addEventListener('click', function () { window.dhCloseSheet('diwaliSheet'); openMuhurat(); });
      if ((b = body.querySelector('#dwIcs'))) b.addEventListener('click', function () { M.downloadIcs(M.getCity()); });
    }
    paint();
    window.dhOpenSheet('diwaliSheet');
  }

  /* ---------- daily city muhurat (Plus) ---------- */
  var mView = null;
  function muhuratHtml(city, w) {
    var h = '<h2 class="info-title">मुहूर्त · City muhurat</h2>' +
      '<p class="info-sub">Sun-based windows for your city, with the day\'s tithi.</p>' +
      '<div class="dw-card"><div class="dw-row"><select id="muCity" class="dw-select" aria-label="City">' + cityOptions(city) + '</select>' +
      '<input id="muDate" class="dw-select" type="date" min="2025-01-01" max="2028-12-31" value="' + w.y + '-' + String(w.m + 1).padStart(2, '0') + '-' + String(w.d).padStart(2, '0') + '" aria-label="Date"></div>';
    h += '<dl class="dw-times">' +
      (w.tithi ? '<div><dt>Tithi at sunrise</dt><dd>' + esc(w.tithi.paksha + ' ' + w.tithi.name) + '</dd></div>' : '') +
      '<div><dt>Sunrise · Sunset</dt><dd>' + M.fmt(w.sunrise, city) + ' · ' + M.fmt(w.sunset, city) + '</dd></div>' +
      '<div><dt>Brahma muhurta</dt><dd>' + M.range(w.brahma[0], w.brahma[1], city) + '</dd></div>' +
      '<div><dt>Abhijit muhurat</dt><dd>' + M.range(w.abhijit[0], w.abhijit[1], city) + (w.weekday === 3 ? ' <small>(traditionally avoided on Wednesday)</small>' : '') + '</dd></div>' +
      '<div><dt>Rahu kaal (avoid)</dt><dd>' + M.range(w.rahu[0], w.rahu[1], city) + '</dd></div>' +
      '<div><dt>Pradosh kaal</dt><dd>' + M.range(w.pradosh[0], w.pradosh[1], city) + '</dd></div></dl>';
    var soon = M.festivalSoon(city, 14);
    if (soon) h += '<p class="dw-lead">🪔 <b>' + esc(soon.f.name) + '</b> ' + (soon.inDays === 0 ? 'is today' : 'in ' + soon.inDays + ' day' + (soon.inDays === 1 ? '' : 's')) + '.</p>';
    h += '<p class="dw-disclaimer">' + esc(DISCLAIMER) + ' Definitions: Brahma muhurta = two night-muhurtas before sunrise; Abhijit = 8th of 15 day-muhurtas; Rahu kaal by weekday eighth of daylight; Pradosh = sunset plus one fifth of the night. Tithi uses an on-device lunar model and can differ from Drik Panchang by a few hours.</p></div>' +
      '<button class="plus-cta plus-cta-btn" id="muIcs">Add 2026-27 festivals to my calendar</button>' +
      '<p class="plus-note">Downloads a calendar file with a reminder the evening before each festival, with ' + esc(city.name) + ' timings. Nothing is sent to a server.</p>';
    return h;
  }
  function openMuhurat() {
    if (!plus()) { openPlus(); return; }
    var el = sheet('muhuratSheet', 'City muhurat');
    var body = el.querySelector('#muhuratSheetBody');
    var city = M.getCity();
    if (!mView) mView = M.cityToday(city);
    function paint() {
      var c = M.getCity();
      var w = M.daily(c, mView.y, mView.m, mView.d);
      if (!w) { body.innerHTML = '<p class="info-sub">Timings unavailable for this city and date. See your local panchang.</p>'; return; }
      body.innerHTML = muhuratHtml(c, w);
      body.querySelector('#muCity').addEventListener('change', function (e) { M.setCity(e.target.value); paint(); });
      body.querySelector('#muDate').addEventListener('change', function (e) {
        var p = String(e.target.value).split('-').map(Number);
        if (p.length === 3 && p[0]) { mView = { y: p[0], m: p[1] - 1, d: p[2] }; paint(); }
      });
      body.querySelector('#muIcs').addEventListener('click', function () { M.downloadIcs(M.getCity()); });
    }
    paint();
    window.dhOpenSheet('muhuratSheet');
  }

  /* ---------- home banner ---------- */
  function banner() {
    if (Date.now() > BANNER_UNTIL) return;
    try { if (localStorage.getItem(LS_BANNER) === 'x') return; } catch (e) {}
    var host = document.getElementById('zoneSadhana');
    if (!host || document.getElementById('dwBanner')) return;
    var t = M.cityToday(M.getCity());
    var days = Math.round((Date.UTC(2026, 10, 8) - Date.UTC(t.y, t.m, t.d)) / 86400000);
    var when = days > 1 ? 'in ' + days + ' days' : days === 1 ? 'tomorrow' : days === 0 ? 'today' : 'this week';
    var b = document.createElement('div');
    b.id = 'dwBanner';
    b.className = 'dw-banner';
    b.innerHTML = '<button class="dw-banner-main" id="dwBannerGo"><span class="dw-banner-diya" aria-hidden="true">🪔</span>' +
      '<span><b>Diwali is ' + when + '</b> · Sun 8 Nov 2026<br><small>Lakshmi puja steps, aarti and the Pradosh time for your city</small></span></button>' +
      '<button class="dw-banner-x" id="dwBannerX" aria-label="Hide Diwali banner">✕</button>';
    host.insertBefore(b, host.querySelector('.zone-head') ? host.querySelector('.zone-head').nextSibling : host.firstChild);
    b.querySelector('#dwBannerGo').addEventListener('click', openDiwali);
    b.querySelector('#dwBannerX').addEventListener('click', function () { try { localStorage.setItem(LS_BANNER, 'x'); } catch (e) {} b.remove(); });
  }

  function wireFab() {
    var b = document.getElementById('fabMuhurat');
    if (b) b.addEventListener('click', function () { var m = document.getElementById('fabMenu'); if (m) m.hidden = true; plus() ? openMuhurat() : openPlus(); });
    var d = document.getElementById('fabDiwali');
    if (d) d.addEventListener('click', function () { var m = document.getElementById('fabMenu'); if (m) m.hidden = true; openDiwali(); });
  }

  window.dhMuhuratUI = { open: openMuhurat, openDiwali: openDiwali };

  function init() {
    banner(); wireFab();
    if (window.dhPlus && window.dhPlus.pollPending) window.dhPlus.pollPending();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
