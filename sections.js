/* Divine Hub — view router + renderers for Festivals, Puja Guides, Why, Nearby */

(function () {
  'use strict';

  const VIEWS = ['prayers', 'japa', 'festivals', 'guides', 'why', 'nearby'];
  const TAB = {
    prayers: 'tabPrayers', japa: 'tabJapa', festivals: 'tabFestivals',
    guides: 'tabGuides', why: 'tabWhy', nearby: 'tabNearby'
  };
  const SECTION = {
    prayers: 'prayerSection', japa: 'japaSection', festivals: 'festivalsSection',
    guides: 'guidesSection', why: 'whySection', nearby: 'nearbySection'
  };

  function show(which) {
    VIEWS.forEach(v => {
      const t = document.getElementById(TAB[v]);
      const sec = document.getElementById(SECTION[v]);
      if (t) t.classList.toggle('active', v === which);
      if (sec) sec.hidden = v !== which;
    });
    window.scrollTo(0, 0);
    if (which === 'japa' && typeof drawMalaGlobal === 'function') drawMalaGlobal();
  }

  // japa.js owns prayers/japa clicks; we add ours and also listen on those two
  // to hide the new sections when the user goes back.
  ['festivals', 'guides', 'why', 'nearby'].forEach(v => {
    document.getElementById(TAB[v]).addEventListener('click', () => show(v));
  });
  ['prayers', 'japa'].forEach(v => {
    document.getElementById(TAB[v]).addEventListener('click', () => {
      ['festivals', 'guides', 'why', 'nearby'].forEach(x => {
        document.getElementById(TAB[x]).classList.remove('active');
        document.getElementById(SECTION[x]).hidden = true;
      });
    });
  });

  /* ---------- Festivals ---------- */
  const up = festivalsUpcoming(new Date());
  document.getElementById('festivalUpcoming').innerHTML = up.slice(0, 5).map(r =>
    '<div class="fest-card"><div class="fest-when">' + fmtFestivalDate(r.date) + '</div>' +
    '<div class="fest-name">' + r.f.name + '</div><div class="fest-dev">' + r.f.dev + '</div>' +
    '<div class="fest-note">' + r.f.note + '</div></div>').join('');
  document.getElementById('festivalTable').innerHTML = FESTIVALS.map(f =>
    '<div class="fest-row"><div class="fest-row-name">' + f.name + ' <span class="fest-dev-inline">' + f.dev + '</span></div>' +
    '<div class="fest-row-dates">' + fmtFestivalDate(new Date(f.d2026 + 'T00:00:00')) + ' · ' + fmtFestivalDate(new Date(f.d2027 + 'T00:00:00')) + '</div></div>').join('');

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
})();
