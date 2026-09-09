/* Divine Hub — Focus Mode: one verse per screen, meaning accordion, Verse X of N */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_focus_v1';

  let overlay = null;
  let prayer = null;
  let idx = 0;
  let meaningOpen = false;

  function loadPos() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePos() {
    const all = loadPos();
    if (prayer) { all[prayer.id] = idx; localStorage.setItem(LS_KEY, JSON.stringify(all)); }
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
        <button class="fv-close" id="fvClose" aria-label="Close focus mode">✕</button>
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
    document.getElementById('fvPrev').addEventListener('click', () => step(-1));
    document.getElementById('fvNext').addEventListener('click', () => step(1));
    document.getElementById('fvAccBtn').addEventListener('click', toggleMeaning);
    document.addEventListener('keydown', e => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    // swipe
    let tx = null;
    overlay.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    overlay.addEventListener('touchend', e => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
      tx = null;
    }, { passive: true });
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
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (window.dhPrayerOpen && window.dhPrayerOpen() && prayer) {
      try { window.history.replaceState(null, '', '#prayer-' + prayer.id); } catch (e) {}
    } else {
      try { window.history.replaceState(null, '', location.pathname); } catch (e) {}
    }
  }

  window.dhOpenFocus = open;
  window.dhFocusProgress = function (id) {
    const p = PRAYERS.find(x => x.id === id);
    const saved = loadPos()[id];
    if (!p || typeof saved !== 'number') return null;
    return { index: saved, total: p.stanzas.length };
  };
})();
