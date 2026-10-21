/* Divine Hub — view router + renderers for Festivals, Puja Guides, Why, Nearby */

(function () {
  'use strict';

  /* ---------- sheet overlays (japa, guides, nearby) ---------- */
  /* Sheets stack in the order they open (a japa sheet opened from a deity
     room must sit above the room), so each one gets the next z-index. */
  window.dhOpenSheet = function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var open = document.querySelectorAll('.dh-sheet:not([hidden])').length;
    el.style.zIndex = String(80 + (el.hidden ? open : Math.max(open - 1, 0)));
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    el.scrollTop = 0;
    if (id === 'japaSection' && typeof window.dhDrawMala === 'function') window.dhDrawMala();
  };
  window.dhCloseSheet = function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = true;
    if (!document.querySelector('.dh-sheet:not([hidden])')) document.body.style.overflow = '';
  };
  [['guidesClose', 'guidesSection'], ['nearbyClose', 'nearbySection'], ['japaClose', 'japaSection']]
    .forEach(function (pair) {
      var b = document.getElementById(pair[0]);
      if (b) b.addEventListener('click', function () { window.dhCloseSheet(pair[1]); });
    });

  /* ---------- Festivals (Calendar tab) ---------- */
  function festBtn(f, date, cls, inner) {
    const iso = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return '<button type="button" class="' + cls + '" data-fest="' + f.name.replace(/"/g, '&quot;') + '" data-iso="' + iso + '">' + inner + '</button>';
  }
  const up = festivalsUpcoming(new Date());
  document.getElementById('festivalUpcoming').innerHTML = up.slice(0, 5).map(r =>
    festBtn(r.f, r.date, 'fest-card', '<span class="fest-when">' + fmtFestivalDate(r.date) + '</span>' +
    '<span class="fest-dev">' + r.f.dev + '</span><span class="fest-name">' + r.f.name + '</span>' +
    '<span class="fest-note">' + r.f.note + '</span>')).join('');
  document.getElementById('festivalTable').innerHTML = FESTIVALS.map(f => {
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const d26 = new Date(f.d2026 + 'T00:00:00');
    const d = d26 >= t0 ? d26 : new Date(f.d2027 + 'T00:00:00'); /* detail opens the next occurrence */
    return festBtn(f, d, 'fest-row', '<span class="fest-row-name"><span class="fest-dev-inline">' + f.dev + '</span> ' + f.name + '</span>' +
      '<span class="fest-row-dates">' + fmtFestivalDate(d26) + ' · ' + fmtFestivalDate(new Date(f.d2027 + 'T00:00:00')) + '</span>');
  }).join('');
  document.getElementById('festivalsSection').addEventListener('click', e => {
    const b = e.target.closest('[data-fest]');
    if (b && window.dhFestival) window.dhFestival.open(b.dataset.fest, b.dataset.iso);
  });
  function wireToggle(btnId, wrapId) {
    const t = document.getElementById(btnId);
    if (!t) return;
    t.addEventListener('click', function () {
      const w = document.getElementById(wrapId);
      const open = w.hidden;
      w.hidden = !open;
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      t.classList.toggle('open', open);
    });
  }
  wireToggle('festTableToggle', 'festTableWrap');
  wireToggle('whyToggle', 'whyWrap');

  /* ---------- Puja Guides ---------- */
  document.getElementById('guideList').innerHTML = PUJA_GUIDES.map((g, gi) =>
    '<article class="guide-card">' +
    '<h3 class="guide-title">' + g.title + ' <span class="guide-dev">' + g.dev + '</span></h3>' +
    '<p class="guide-when">' + g.when + '</p>' +
    '<p class="guide-about">' + g.about + '</p>' +
    '<button class="btn-ghost guide-toggle" data-g="' + gi + '">Samagri list &amp; steps</button>' +
    '<div class="guide-detail" id="guideDetail' + gi + '" hidden>' +
      '<h4>Samagri (' + g.samagri.length + ' items)</h4><ul class="samagri-list">' +
      g.samagri.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
      '<h4>Vidhi — ' + g.steps.length + ' steps</h4><ol class="step-list">' +
      g.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' +
    '</div></article>').join('');
  document.querySelectorAll('.guide-toggle').forEach(b => b.addEventListener('click', () => {
    const d = document.getElementById('guideDetail' + b.dataset.g);
    d.hidden = !d.hidden;
    b.textContent = d.hidden ? 'Samagri list & steps' : 'Hide list & steps';
  }));

  /* ---------- Why ---------- */
  function renderWhy(filter) {
    const f = (filter || '').toLowerCase().trim();
    document.getElementById('whyList').innerHTML = WHY_CATEGORIES.map(c => {
      const items = c.items.filter(it => !f ||
        (it.item + ' ' + it.dev + ' ' + it.role + ' ' + it.traditional + ' ' + c.title).toLowerCase().includes(f));
      if (!items.length) return '';
      return '<div class="why-cat"><h3 class="why-cat-title">' + c.title + ' <span class="why-dev">' + c.dev + '</span></h3>' +
        items.map(it =>
          '<details class="why-item"><summary>' + it.item + ' <span class="why-dev">' + it.dev + '</span></summary>' +
          '<p class="why-role">' + it.role + '</p>' +
          '<p><span class="why-tag">Tradition</span> ' + it.traditional + '</p>' +
          '<p><span class="why-tag">Practical</span> ' + it.science + '</p></details>').join('') +
        '</div>';
    }).join('');
  }
  renderWhy('');
  document.getElementById('whySearch').addEventListener('input', e => renderWhy(e.target.value));

  /* ---------- Nearby ---------- */
  const status = document.getElementById('nearbyStatus');
  const links = document.getElementById('nearbyLinks');
  function mapsUrl(q, ll) {
    return 'https://www.google.com/maps/search/' + encodeURIComponent(q) + (ll ? '/@' + ll + ',14z' : '');
  }
  function renderNearby(ll) {
    links.innerHTML =
      '<a class="nearby-card" target="_blank" rel="noopener" href="' + mapsUrl('hindu temple near me', ll) + '">🛕 <strong>Temples</strong><span>Open Google Maps for temples near you</span></a>' +
      '<a class="nearby-card" target="_blank" rel="noopener" href="' + mapsUrl('puja samagri shop near me', ll) + '">🪔 <strong>Puja samagri shops</strong><span>Find shops for flowers, diyas, havan items</span></a>' +
      '<a class="nearby-card" target="_blank" rel="noopener" href="' + mapsUrl('hindu priest pandit near me', ll) + '">🙏 <strong>Pandits</strong><span>Local priests for home puja</span></a>';
  }
  renderNearby(null);
  document.getElementById('nearbyLocate').addEventListener('click', () => {
    if (!navigator.geolocation) { status.textContent = 'Geolocation is not supported in this browser.'; return; }
    status.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(pos => {
      const ll = pos.coords.latitude.toFixed(4) + ',' + pos.coords.longitude.toFixed(4);
      status.textContent = 'Location found — map links are centred on you.';
      renderNearby(ll);
    }, () => {
      status.textContent = 'Could not get your location. The links below still work — Maps will centre itself.';
      renderNearby(null);
    }, { timeout: 10000 });
  });

  /* hash routing (deep links, manifest shortcuts, tabs) now lives in shell.js */
})();
