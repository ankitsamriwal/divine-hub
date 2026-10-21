/* Divine Hub — Library tab: deity rooms (prayers grouped by type, the deity's
   japa mantra with Start 108/21/11, its festivals), Ask inside search, and the
   Learn shelf (journeys, quizzes, Why, puja guides, find a temple). */
(function () {
  'use strict';

  var D = window.DH_DEITY;
  if (!D) return;

  var GROUPS = [
    { key: 'aarti', dev: 'आरती', en: 'Aarti' },
    { key: 'chalisa', dev: 'चालीसा', en: 'Chalisa' },
    { key: 'stotra', dev: 'स्तोत्र', en: 'Stotra' },
    { key: 'mantra', dev: 'मंत्र · जाप', en: 'Mantra & Jaap' }
  ];
  var COUNTS = [108, 21, 11];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- room grid ---------- */
  function renderRooms() {
    var host = document.getElementById('roomGrid');
    if (!host) return;
    host.innerHTML = D.ROOMS.map(function (r) {
      var n = D.prayersFor(r).length;
      return '<button type="button" class="room-card" data-room="' + r.id + '">' +
        '<span class="room-dev">' + r.dev + '</span><span class="room-en">' + esc(r.name) + '</span>' +
        '<span class="room-count">' + n + ' prayer' + (n === 1 ? '' : 's') + '</span></button>';
    }).join('') +
      '<button type="button" class="room-card room-saved" id="roomSaved"><span class="room-dev">★</span><span class="room-en">Saved</span><span class="room-count">your prayers</span></button>';
    host.querySelectorAll('[data-room]').forEach(function (b) { b.addEventListener('click', function () { openRoom(b.dataset.room); }); });
    host.querySelector('#roomSaved').addEventListener('click', function () {
      if (window.dhLibrary) window.dhLibrary.showSaved();
      var r = document.getElementById('libResults');
      if (r) r.scrollIntoView({ block: 'start' });
    });
  }

  /* ---------- room sheet ---------- */
  var sheetEl = null;
  function sheet() {
    if (sheetEl) return sheetEl;
    sheetEl = document.createElement('section');
    sheetEl.id = 'roomSheet';
    sheetEl.className = 'dh-sheet room-sheet';
    sheetEl.hidden = true;
    sheetEl.setAttribute('role', 'dialog');
    sheetEl.setAttribute('aria-label', 'Deity room');
    sheetEl.innerHTML = '<button class="dh-sheet-close" id="roomClose" aria-label="Close room">✕</button><div class="rm-body" id="rmBody"></div>';
    document.body.appendChild(sheetEl);
    sheetEl.querySelector('#roomClose').addEventListener('click', function () { window.dhCloseSheet('roomSheet'); });
    return sheetEl;
  }

  function startButtons(key) {
    return '<span class="rm-start" role="group" aria-label="Start a round">' + COUNTS.map(function (n) {
      return '<button type="button" class="rm-count" data-japa="' + key + '" data-n="' + n + '">Start ' + n + '</button>';
    }).join('') + '</span>';
  }

  function openRoom(id) {
    var r = D.byId(id);
    if (!r) return;
    var el = sheet(), body = el.querySelector('#rmBody');
    var prayers = D.prayersFor(r);
    var primary = (typeof DEITIES !== 'undefined') ? DEITIES[r.match[0]] : null;
    var mantraMap = {};
    var h = '<header class="rm-head"><span class="rm-dev">' + r.dev + '</span><h2 class="rm-en">' + esc(r.name) + '</h2>' +
      (primary && primary.blurb && r.id !== 'others' ? '<p class="rm-blurb">' + esc(primary.blurb) + '</p>' : '') +
      (r.aarti ? '<button type="button" class="btn-gold rm-begin" id="rmBegin">Begin a guided sitting · दीपक → आरती → जाप → प्रार्थना</button>' : '') +
      '</header>';
    GROUPS.forEach(function (g) {
      var list = prayers.filter(function (p) { return D.typeGroup(p) === g.key; });
      var mantraCard = (g.key === 'mantra' && r.mantra);
      if (!list.length && !mantraCard) return;
      h += '<section class="rm-group"><h3 class="rm-gh"><span class="rm-gh-dev">' + g.dev + '</span> ' + g.en + '</h3>';
      if (mantraCard) {
        mantraMap.room = r.mantra;
        h += '<div class="rm-mantra"><span class="rm-mantra-dev">' + esc(r.mantra.dev) + '</span><span class="rm-mantra-en">' + esc(r.mantra.label) + '</span>' + startButtons('room') + '</div>';
      }
      h += '<div class="rm-cards" data-group="' + g.key + '"></div></section>';
    });
    var fests = D.festivalsFor(r);
    if (fests.length) {
      h += '<section class="rm-group"><h3 class="rm-gh"><span class="rm-gh-dev">उत्सव</span> Festivals</h3><div class="rm-fests">' +
        fests.map(function (f) {
          var iso = window.dhFestival ? window.dhFestival.nextIso(f) : f.d2026;
          return '<button type="button" class="rm-fest" data-fest="' + esc(f.name) + '" data-iso="' + iso + '"><span class="rm-fest-dev">' + esc(f.dev) + '</span>' +
            '<span class="rm-fest-en">' + esc(f.name) + '</span><span class="rm-fest-date">' + (typeof fmtFestivalDate === 'function' ? fmtFestivalDate(new Date(iso + 'T00:00:00')) : iso) + '</span></button>';
        }).join('') + '</div></section>';
    }
    body.innerHTML = h;
    /* prayer cards reuse the Library card (with its Save star) */
    GROUPS.forEach(function (g) {
      var holder = body.querySelector('.rm-cards[data-group="' + g.key + '"]');
      if (!holder) return;
      prayers.filter(function (p) { return D.typeGroup(p) === g.key; }).forEach(function (p) {
        var wrap = document.createElement('div');
        wrap.className = 'rm-cardwrap';
        if (window.dhPrayerCard) wrap.appendChild(window.dhPrayerCard(p));
        if (g.key === 'mantra') {
          mantraMap[p.id] = D.mantraFromPrayer(p);
          wrap.insertAdjacentHTML('beforeend', startButtons(p.id));
        }
        holder.appendChild(wrap);
      });
    });
    body.querySelectorAll('.rm-count').forEach(function (b) {
      b.addEventListener('click', function () {
        var m = mantraMap[b.dataset.japa];
        if (m && window.dhJapa) window.dhJapa.open({ value: m.value, dev: m.dev, label: m.label, target: +b.dataset.n });
      });
    });
    body.querySelectorAll('.rm-fest').forEach(function (b) {
      b.addEventListener('click', function () { if (window.dhFestival) window.dhFestival.open(b.dataset.fest, b.dataset.iso); });
    });
    var begin = body.querySelector('#rmBegin');
    if (begin) begin.addEventListener('click', function () { if (window.dhSession) window.dhSession.start(r.id); });
    el.scrollTop = 0;
    window.dhOpenSheet('roomSheet');
  }

  /* ---------- Ask inside search ---------- */
  function wireAsk() {
    var b = document.getElementById('libAsk');
    if (!b) return;
    b.addEventListener('click', function () {
      var q = (document.getElementById('searchInput') || {}).value || '';
      if (window.dhOpenChat) window.dhOpenChat(q.trim());
    });
  }

  /* ---------- Learn shelf ---------- */
  function renderLearn() {
    var host = document.getElementById('learnLinks');
    if (!host) return;
    host.innerHTML =
      '<button type="button" class="learn-card" id="lnGuides"><span class="learn-dev">पूजा विधि</span><span class="learn-en">Puja guides</span><span class="learn-sub">Samagri lists and steps</span></button>' +
      '<button type="button" class="learn-card" id="lnNearby"><span class="learn-dev">मंदिर</span><span class="learn-en">Find a temple or pandit</span><span class="learn-sub">Temples, samagri shops, pandits</span></button>';
    host.querySelector('#lnGuides').addEventListener('click', function () { window.dhOpenSheet('guidesSection'); });
    host.querySelector('#lnNearby').addEventListener('click', function () { window.dhOpenSheet('nearbySection'); });
  }

  function init() { renderRooms(); wireAsk(); renderLearn(); }
  window.dhRoom = { open: openRoom };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
