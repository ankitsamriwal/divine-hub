/* Divine Hub — Focus Mode: one verse per screen, meaning accordion, Verse X of N */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_focus_v1';
  const LAST_KEY = 'divinehub_focus_last_v1';

  let overlay = null;
  let prayer = null;
  let idx = 0;
  let meaningOpen = false;

  function loadPos() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePos() {
    const all = loadPos();
    if (prayer) { all[prayer.id] = idx; try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch (e) {} }
  }

  function build() {
    overlay = document.createElement('div');
    overlay.id = 'focusView';
    overlay.className = 'focus-view';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="fv-glow" aria-hidden="true"></div>
      <div class="fv-top">
        <div class="fv-title-wrap">
          <span class="fv-deity" id="fvDeity"></span>
          <span class="fv-title" id="fvTitle"></span>
        </div>
        <button class="fv-change" id="fvChange" aria-haspopup="dialog" aria-label="Choose a different prayer">Change ▾</button>
        <button class="fv-close" id="fvClose" aria-label="Close focus mode">✕</button>
      </div>
      <div class="fv-picker" id="fvPicker" role="dialog" aria-modal="true" aria-labelledby="fvPickTitle" hidden>
        <div class="fv-pick-head">
          <h2 class="fv-pick-title" id="fvPickTitle"><span>एकाग्र</span> Choose what to chant</h2>
          <button class="fv-close" id="fvPickClose" aria-label="Close the list">✕</button>
        </div>
        <input type="search" class="fv-pick-search" id="fvPickSearch" placeholder="Search aarti, chalisa, mantra, deity" aria-label="Search prayers">
        <div class="fv-pick-list" id="fvPickList"></div>
      </div>
      <div class="fv-progress"><div class="fv-progress-fill" id="fvFill"></div></div>
      <div class="fv-stage" id="fvStage">
        <div class="fv-om" aria-hidden="true">ॐ</div>
        <div class="fv-count" id="fvCount"></div>
        <div class="fv-dev" id="fvDev"></div>
        <div class="fv-translit" id="fvTranslit"></div>
        <div class="fv-accordion">
          <button class="fv-acc-btn" id="fvAccBtn" aria-expanded="false">
            <span>Meaning &amp; context</span><span class="fv-acc-caret" id="fvCaret">▾</span>
          </button>
          <div class="fv-acc-body" id="fvAccBody" hidden>
            <p id="fvMeaning"></p>
          </div>
        </div>
      </div>
      <div class="fv-nav">
        <button class="fv-nav-btn" id="fvPrev" aria-label="Previous verse">‹ Prev</button>
        <button class="fv-nav-btn fv-next" id="fvNext" aria-label="Next verse">Next ›</button>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('fvClose').addEventListener('click', close);
    document.getElementById('fvChange').addEventListener('click', showPicker);
    document.getElementById('fvPickClose').addEventListener('click', hidePicker);
    document.getElementById('fvPickSearch').addEventListener('input', e => renderPicker(e.target.value));
    document.getElementById('fvPickList').addEventListener('click', e => {
      const b = e.target.closest('[data-pid]');
      if (b) { hidePicker(); open(b.dataset.pid); }
    });
    document.getElementById('fvPrev').addEventListener('click', () => step(-1));
    document.getElementById('fvNext').addEventListener('click', () => step(1));
    document.getElementById('fvAccBtn').addEventListener('click', toggleMeaning);
    document.addEventListener('keydown', e => {
      if (overlay.hidden) return;
      if (!document.getElementById('fvPicker').hidden) {
        if (e.key === 'Escape') { hidePicker(); if (!prayer) close(); }
        return;
      }
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    // swipe
    let tx = null;
    overlay.addEventListener('touchstart', e => { tx = document.getElementById('fvPicker').hidden ? e.touches[0].clientX : null; }, { passive: true });
    overlay.addEventListener('touchend', e => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
  }

  /* ---------- prayer picker: the devotee chooses what to chant ---------- */
  const TYPE_ORDER = ['Aarti', 'Chalisa', 'Stotra', 'Stotram', 'Vandana', 'Mantra', 'Upanishad'];
  function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function lastId() { try { return localStorage.getItem(LAST_KEY); } catch (e) { return null; } }

  function renderPicker(q) {
    const term = String(q || '').trim().toLowerCase();
    const all = (typeof PRAYERS !== 'undefined' ? PRAYERS : []).filter(p => p.stanzas && p.stanzas.length);
    const match = p => !term || [p.title, p.titleDev, p.deity, p.deityDev, p.type].join(' ').toLowerCase().includes(term);
    const list = all.filter(match);
    const host = document.getElementById('fvPickList');
    if (!list.length) { host.innerHTML = '<p class="fv-pick-empty">No prayer matches. Try a deity name such as Hanuman or Lakshmi.</p>'; return; }
    const current = prayer ? prayer.id : lastId();
    let html = '';
    const recent = !term && current ? all.find(p => p.id === current) : null;
    if (recent) {
      html += '<div class="fv-pick-group"><div class="fv-pick-gh">Continue</div>' + row(recent, true) + '</div>';
    }
    const byDeity = {};
    list.forEach(p => { (byDeity[p.deity] = byDeity[p.deity] || { dev: p.deityDev, items: [] }).items.push(p); });
    Object.keys(byDeity).forEach(d => {
      const g = byDeity[d];
      g.items.sort((a, b) => (TYPE_ORDER.indexOf(a.type) + 99) % 99 - (TYPE_ORDER.indexOf(b.type) + 99) % 99 || a.title.localeCompare(b.title));
      html += '<div class="fv-pick-group"><div class="fv-pick-gh"><span>' + esc(g.dev) + '</span> ' + esc(d) + '</div>' + g.items.map(p => row(p, false)).join('') + '</div>';
    });
    host.innerHTML = html;
    function row(p, isRecent) {
      const prog = window.dhFocusProgress ? window.dhFocusProgress(p.id) : null;
      const note = prog && prog.index > 0 ? 'Verse ' + (prog.index + 1) + ' of ' + prog.total : p.stanzas.length + (p.stanzas.length === 1 ? ' verse' : ' verses');
      const on = prayer && prayer.id === p.id;
      return '<button type="button" class="fv-pick-row' + (on ? ' on' : '') + '" data-pid="' + esc(p.id) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="fv-pick-main"><span class="fv-pick-dev">' + esc(p.titleDev) + '</span><span class="fv-pick-en">' + esc(p.title) + '</span></span>' +
        '<span class="fv-pick-meta"><span class="fv-pick-type">' + esc(p.type) + '</span><small>' + esc(note) + '</small></span></button>';
    }
  }

  function showPicker() {
    if (!overlay) build();
    const s = document.getElementById('fvPickSearch');
    s.value = '';
    renderPicker('');
    document.getElementById('fvPicker').hidden = false;
    overlay.classList.add('fv-picking');
    const on = document.querySelector('#fvPickList .fv-pick-row.on') || document.querySelector('#fvPickList .fv-pick-row');
    if (on) on.scrollIntoView({ block: 'nearest' });
    setTimeout(() => (on || s).focus({ preventScroll: true }), 30);
  }
  function hidePicker() {
    if (!overlay) return;
    document.getElementById('fvPicker').hidden = true;
    overlay.classList.remove('fv-picking');
    const b = document.getElementById('fvChange');
    if (b && prayer) b.focus({ preventScroll: true });
  }

  /* Opens Focus mode on the chooser, so the devotee picks the prayer instead of getting a default */
  function openPicker() {
    if (!overlay) build();
    prayer = null;
    overlay.hidden = false;
    overlay.classList.add('fv-empty');
    document.body.style.overflow = 'hidden';
    showPicker();
  }

  function render() {
    const s = prayer.stanzas[idx];
    const n = prayer.stanzas.length;
    document.getElementById('fvDeity').textContent = prayer.deityDev + ' · ' + prayer.deity;
    document.getElementById('fvTitle').textContent = prayer.title;
    document.getElementById('fvCount').textContent = 'Verse ' + (idx + 1) + ' of ' + n;
    document.getElementById('fvFill').style.width = (((idx + 1) / n) * 100) + '%';
    document.getElementById('fvDev').innerHTML = s.dev.map(l => '<div>' + l + '</div>').join('');
    document.getElementById('fvTranslit').innerHTML = s.translit.map(l => '<div>' + l + '</div>').join('');
    document.getElementById('fvMeaning').textContent = s.meaning;
    document.getElementById('fvPrev').disabled = idx === 0;
    const next = document.getElementById('fvNext');
    next.disabled = idx === n - 1;
    next.textContent = idx === n - 1 ? 'Done' : 'Next ›';
    // stage re-animation
    const stage = document.getElementById('fvStage');
    stage.classList.remove('fv-enter');
    void stage.offsetWidth;
    stage.classList.add('fv-enter');
    savePos();
  }

  function toggleMeaning() {
    meaningOpen = !meaningOpen;
    document.getElementById('fvAccBody').hidden = !meaningOpen;
    document.getElementById('fvAccBtn').setAttribute('aria-expanded', meaningOpen ? 'true' : 'false');
    document.getElementById('fvCaret').style.transform = meaningOpen ? 'rotate(180deg)' : '';
  }

  function step(d) {
    const n = prayer.stanzas.length;
    const ni = idx + d;
    if (ni < 0) return;
    if (ni >= n) { close(); return; }
    idx = ni;
    if (meaningOpen) toggleMeaning();
    render();
  }

  function open(id, startIdx) {
    const p = PRAYERS.find(x => x.id === id);
    if (!p) return;
    if (!overlay) build();
    prayer = p;
    overlay.classList.remove('fv-empty');
    try { localStorage.setItem(LAST_KEY, p.id); } catch (e) {}
    meaningOpen = false;
    document.getElementById('fvAccBody').hidden = true;
    document.getElementById('fvAccBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('fvCaret').style.transform = '';
    const saved = loadPos()[p.id];
    idx = (typeof startIdx === 'number') ? startIdx
      : (typeof saved === 'number' && saved >= 0 && saved < p.stanzas.length - 1 ? saved : 0);
    render();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    try { window.history.replaceState(null, '', '#focus-' + id); } catch (e) {}
  }

  function close() {
    if (!overlay) return;
    document.getElementById('fvPicker').hidden = true;
    overlay.classList.remove('fv-picking', 'fv-empty');
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (window.dhPrayerOpen && window.dhPrayerOpen() && prayer) {
      try { window.history.replaceState(null, '', '#prayer-' + prayer.id); } catch (e) {}
    } else {
      try { window.history.replaceState(null, '', location.pathname); } catch (e) {}
    }
  }

  window.dhOpenFocus = open;
  window.dhOpenFocusPicker = openPicker;
  window.dhFocusProgress = function (id) {
    const p = PRAYERS.find(x => x.id === id);
    const saved = loadPos()[id];
    if (!p || typeof saved !== 'number') return null;
    return { index: saved, total: p.stanzas.length };
  };
})();
