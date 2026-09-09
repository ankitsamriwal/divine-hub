/* Divine Hub — Android/browser Back handling.
   Back closes the top overlay first, then steps back through main sections,
   and only exits the app at the true top level. Drives the app's own close
   buttons and tabs so all normal cleanup runs. */
(function () {
  'use strict';
  if (!('pushState' in history)) return;

  /* overlay element id -> how to close it through the app's own UI */
  var OVERLAY_CLOSERS = {
    prayerView: function () { return clickById('closePrayer') || backdrop('prayerView'); },
    chatPanel: function () { return clickById('chatClose'); },
    focusView: function () { return clickById('fvClose'); },
    journeyView: function () { return clickById('jvClose') || backdrop('journeyView'); },
    quizView: function () { return backdrop('quizView'); },
    diyaCelebration: function () { return clickById('dcClose'); },
    japaSection: function () { return clickById('japaClose'); },
    guidesSection: function () { return clickById('guidesClose'); },
    nearbySection: function () { return clickById('nearbyClose'); },
    sandhyaView: function () { return clickById('syvX') || clickById('syExit'); },
    fabMenu: function () { var m = document.getElementById('fabMenu'); if (m) { m.hidden = true; return true; } return false; }
  };
  var SECTION_IDS = ['prayerSection'];
  var SECTION_TABS = {
    prayerSection: 'tabPrayers', japaSection: 'tabJapa', festivalsSection: 'tabFestivals',
    guidesSection: 'tabGuides', whySection: 'tabWhy', nearbySection: 'tabNearby'
  };
  var BASE_SECTION = 'prayerSection';

  function clickById(id) {
    var b = document.getElementById(id);
    if (b) { b.click(); return true; }
    return false;
  }
  function backdrop(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  }

  var overlayStack = [];   // ids of visible overlays, in open order
  var sectionStack = [];   // previous section ids, for step-back
  var suppressPop = 0;     // popstate events we triggered ourselves
  var programmaticNav = false;
  var lastSection = null;

  function currentSection() {
    for (var i = 0; i < SECTION_IDS.length; i++) {
      var el = document.getElementById(SECTION_IDS[i]);
      if (el && !el.hidden) return SECTION_IDS[i];
    }
    return BASE_SECTION;
  }

  /* Track overlay visibility wherever it changes. */
  function visibleOverlays() {
    return Object.keys(OVERLAY_CLOSERS).filter(function (id) {
      var el = document.getElementById(id);
      return el && !el.hidden;
    });
  }

  var syncQueued = false;
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    setTimeout(function () {
      syncQueued = false;
      syncOverlaysFromDom();
    }, 0);
  }

  function syncOverlaysFromDom() {
    var now = visibleOverlays();
    /* keep known order, append new, drop closed */
    var next = overlayStack.filter(function (id) { return now.indexOf(id) !== -1; });
    now.forEach(function (id) { if (next.indexOf(id) === -1) next.push(id); });
    var delta = next.length - overlayStack.length;
    overlayStack = next;
    if (delta > 0) {
      for (var i = 0; i < delta; i++) {
        try { history.pushState({ dhNav: 'ov' }, '', location.href); } catch (e) {}
      }
    } else if (delta < 0) {
      suppressPop += 1;
      try { history.go(delta); } catch (e) {}
    }
  }

  /* Section tabs: push a history entry per section change. */
  Object.keys(SECTION_TABS).forEach(function (secId) {
    var tab = document.getElementById(SECTION_TABS[secId]);
    if (!tab) return;
    tab.addEventListener('click', function () {
      setTimeout(function () {
        var cur = currentSection();
        if (cur === lastSection) return;
        if (!programmaticNav) {
          sectionStack.push(lastSection);
          try { history.pushState({ dhNav: 'sec' }, '', location.href); } catch (e) {}
        }
        lastSection = cur;
      }, 0);
    });
  });

  window.addEventListener('popstate', function () {
    if (suppressPop > 0) { suppressPop -= 1; return; }
    /* 1. close the top overlay, if any */
    var now = visibleOverlays();
    if (now.length) {
      var top = overlayStack[overlayStack.length - 1];
      if (!top || now.indexOf(top) === -1 || now[now.length - 1] !== top) top = now[now.length - 1];
      overlayStack = overlayStack.filter(function (id) { return id !== top; });
      OVERLAY_CLOSERS[top]();
      queueSync();
      return;
    }
    /* 2. step back one section */
    if (sectionStack.length) {
      var prev = sectionStack.pop();
      var tab = document.getElementById(SECTION_TABS[prev]);
      if (tab) {
        programmaticNav = true;
        tab.click();
        setTimeout(function () { programmaticNav = false; lastSection = currentSection(); }, 0);
      }
      return;
    }
    /* 3. base: nothing to do — the app exits */
  });

  /* Observe hidden-attribute flips anywhere (overlays are created lazily). */
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var t = muts[i].target;
      if (t && t.id && OVERLAY_CLOSERS[t.id]) { queueSync(); return; }
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  lastSection = currentSection();
  queueSync(); /* catch deep-linked overlays opened on load */
})();
