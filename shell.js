/* Divine Hub — app shell: the four-tab bottom navigation and deep-link routing.
   Tabs: #today, #calendar, #sadhana, #library. Older links keep working:
   #prayer-<id>, #japa, #guides, #nearby, #diwali, #muhurat, #plus, #festivals,
   #panchang, #why, #sankalp, #sandhya. The last tab is remembered per device. */
(function () {
  'use strict';

  var TABS = ['today', 'calendar', 'sadhana', 'library'];
  var LS_TAB = 'divinehub_tab_v1';
  var current = null;

  function storeTab(t) { try { localStorage.setItem(LS_TAB, t); } catch (e) {} }
  function storedTab() { try { var t = localStorage.getItem(LS_TAB); return TABS.indexOf(t) !== -1 ? t : null; } catch (e) { return null; } }

  function setHash(t) {
    var h = (location.hash || '').replace(/^#/, '');
    if (h && TABS.indexOf(h) === -1) return; /* leave other deep links alone */
    try { history.replaceState(history.state, '', location.pathname + location.search + '#' + t); } catch (e) {}
  }

  function show(t, opts) {
    opts = opts || {};
    if (TABS.indexOf(t) === -1) t = 'today';
    var changed = t !== current;
    TABS.forEach(function (name) {
      var panel = document.getElementById('tab-' + name);
      var btn = document.querySelector('.bn-tab[data-tab="' + name + '"]');
      var on = name === t;
      if (panel) panel.hidden = !on;
      if (btn) {
        btn.setAttribute('aria-selected', String(on));
        btn.tabIndex = on ? 0 : -1;
        btn.classList.toggle('on', on);
      }
    });
    current = t;
    try { document.documentElement.setAttribute('data-tab', t); } catch (e) {}
    storeTab(t);
    if (!opts.keepHash) setHash(t);
    if (changed) {
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      try { document.dispatchEvent(new CustomEvent('dh-tab', { detail: t })); } catch (e) {}
    }
    if (opts.focus) {
      var p = document.getElementById('tab-' + t);
      if (p) p.focus({ preventScroll: true });
    }
  }
  window.dhTab = function (t, opts) { show(t, opts); };
  window.dhCurrentTab = function () { return current; };

  /* ---------- bottom nav ---------- */
  var nav = document.getElementById('bottomNav');
  if (nav) {
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.bn-tab');
      if (b) show(b.dataset.tab);
    });
    nav.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) === -1) return;
      var i = TABS.indexOf(current);
      if (e.key === 'ArrowRight') i = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') i = (i + TABS.length - 1) % TABS.length;
      else if (e.key === 'Home') i = 0;
      else i = TABS.length - 1;
      e.preventDefault();
      var b = document.querySelector('.bn-tab[data-tab="' + TABS[i] + '"]');
      if (b) { b.click(); b.focus(); }
    });
  }

  /* ---------- deep links ---------- */
  function consume() { try { history.replaceState(history.state, '', location.pathname + location.search + '#' + current); } catch (e) {} }
  function route() {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return false;
    if (TABS.indexOf(h) !== -1) { show(h, { keepHash: true }); return true; }
    if (h.indexOf('prayer-') === 0 && typeof window.dhOpenPrayer === 'function') {
      show('library');
      window.dhOpenPrayer(h.slice(7));
      /* consume the deep link so navigating back to this entry cannot reopen the view */
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      return true;
    }
    var map = {
      japa: ['sadhana', function () { window.dhOpenSheet('japaSection'); }],
      sankalp: ['sadhana', function () { if (window.dhSankalp) window.dhSankalp.open(); }],
      sandhya: ['sadhana', null],
      guides: ['library', function () { window.dhOpenSheet('guidesSection'); }],
      nearby: ['library', function () { window.dhOpenSheet('nearbySection'); }],
      why: ['library', function () {
        var t = document.getElementById('whyToggle'), w = document.getElementById('whyWrap');
        if (t && w && w.hidden) t.click();
        if (t) t.scrollIntoView({ block: 'start' });
      }],
      diwali: ['today', function () { if (window.dhMuhuratUI) window.dhMuhuratUI.openDiwali(); }],
      muhurat: ['today', function () { if (window.dhMuhuratUI) window.dhMuhuratUI.open(); }],
      plus: ['today', function () { if (window.dhPlus) window.dhPlus.open(); }],
      festivals: ['calendar', function () { var f = document.getElementById('festivalsSection'); if (f) f.scrollIntoView({ block: 'start' }); }],
      panchang: ['calendar', null]
    };
    var r = map[h];
    if (!r) return false;
    show(r[0], { keepHash: true });
    consume();
    if (r[1]) r[1]();
    return true;
  }
  window.addEventListener('hashchange', route);

  function boot() {
    if (!route()) show(storedTab() || 'today');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
