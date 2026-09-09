/* Divine Hub — Today's Sadhana: daily checklist, diya streak, DIYA LIT celebration */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_sadhana_v1';

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  function dayState() {
    const s = load();
    const d = todayStr();
    s.days = s.days || {};
    if (!s.days[d]) s.days[d] = {};
    return { all: s, day: s.days[d], key: d };
  }

  function japaRoundsToday() {
    try {
      const j = JSON.parse(localStorage.getItem('divinehub_japa_v1')) || {};
      const dr = (j.days || {})[todayStr()];
      return dr ? (dr.rounds || 0) : 0;
    } catch (e) { return 0; }
  }

  const ITEMS = [
    { key: 'vod', label: 'Read today\'s verse', sub: 'आज का पाठ', done: ds => !!ds.vod },
    { key: 'japa', label: 'Complete one mala round', sub: '108 beads, one breath at a time', done: () => japaRoundsToday() > 0 },
    { key: 'prayer', label: 'Open a prayer', sub: 'Read it, or let it be read to you', done: ds => !!ds.prayer },
    { key: 'focus', label: 'One sitting in focus mode', sub: 'One verse at a time', done: ds => !!ds.focus }
  ];

  function completedCount(ds) {
    return ITEMS.filter(i => i.done(ds)).length;
  }
  function isComplete(ds) {
    return completedCount(ds) === ITEMS.length;
  }

  function computeStreak() {
    const s = load();
    const days = s.days || {};
    const full = ds => {
      const d = days[ds];
      if (!d) return false;
      // japa lives in the japa store; reconstruct for past days via stored flag
      return !!(d.vod && d.prayer && d.focus && (d.japa || japaWasDone(ds)));
    };
    function japaWasDone(ds) {
      try {
        const j = JSON.parse(localStorage.getItem('divinehub_japa_v1')) || {};
        const dr = (j.days || {})[ds];
        return dr ? (dr.rounds || 0) > 0 : false;
      } catch (e) { return false; }
    }
    let streak = 0;
    let cursor = new Date();
    const iso = dt => dt.toISOString().slice(0, 10);
    if (!full(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (full(iso(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }

  function mark(key) {
    const { all, day } = dayState();
    if (day[key]) return;
    day[key] = true;
    save(all);
    renderCard();
    maybeCelebrate();
  }

  /* ---------- celebration ---------- */
  let celeb = null;
  function maybeCelebrate() {
    const { all, day, key } = dayState();
    if (!isComplete(day) || day.celebrated) return;
    day.celebrated = true;
    save(all);
    showCelebration(computeStreak());
  }

  function showCelebration(streak) {
    if (!celeb) {
      celeb = document.createElement('div');
      celeb.id = 'diyaCelebration';
      celeb.className = 'diya-celeb';
      celeb.hidden = true;
      celeb.innerHTML =
        '<div class="dc-glow"></div>' +
        '<div class="dc-diya" aria-hidden="true">' +
        '<div class="dc-flame"><div class="dc-flame-core"></div></div>' +
        '<div class="dc-bowl"></div>' +
        '</div>' +
        '<h2 class="dc-title">Diya Lit</h2>' +
        '<p class="dc-sub" id="dcSub"></p>' +
        '<p class="dc-note">Come back tomorrow and keep the flame alive.</p>' +
        '<button class="dc-close" id="dcClose">🙏</button>';
      document.body.appendChild(celeb);
      celeb.querySelector('#dcClose').addEventListener('click', () => {
        celeb.hidden = true;
        document.body.style.overflow = '';
      });
    }
    document.getElementById('dcSub').textContent =
      streak > 1 ? 'Day ' + streak + ' of your sadhana streak.' : 'Your first sadhana day is complete.';
    celeb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  /* ---------- checklist card ---------- */
  function renderCard() {
    const zone = document.getElementById('zoneSadhana');
    if (!zone) return;
    let sec = document.getElementById('sadhanaSection');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'sadhanaSection';
      sec.className = 'sadhana-section';
      zone.appendChild(sec);
    }
    const { day } = dayState();
    const streak = computeStreak();
    const n = completedCount(day);
    sec.innerHTML =
      '<div class="sd-card">' +
      '<div class="sd-head">' +
      '<div><span class="sd-label">Today\'s Sadhana</span>' +
      '<span class="sd-count">' + n + ' of ' + ITEMS.length + '</span></div>' +
      '<div class="sd-streak" title="Consecutive days with a full sadhana">' +
      '<span class="sd-diya-ico">🪔</span><span class="sd-streak-num">' + streak + '</span>' +
      '<span class="sd-streak-lbl">day streak</span></div>' +
      '</div>' +
      '<div class="sd-bar"><span class="sd-fill" style="width:' + Math.round((n / ITEMS.length) * 100) + '%"></span></div>' +
      '<div class="sd-items">' + ITEMS.map(i => {
        const done = i.done(day);
        return '<button class="sd-item' + (done ? ' done' : '') + '" data-k="' + i.key + '">' +
          '<span class="sd-check">' + (done ? '✓' : '') + '</span>' +
          '<span class="sd-text"><span class="sd-label-t">' + i.label + '</span>' +
          '<span class="sd-sub">' + i.sub + '</span></span>' +
          (done ? '' : '<span class="sd-go">›</span>') +
          '</button>';
      }).join('') + '</div></div>';

    sec.querySelectorAll('.sd-item:not(.done)').forEach(b =>
      b.addEventListener('click', () => goDo(b.dataset.k)));
  }

  function goDo(key) {
    if (key === 'vod') {
      const vod = document.getElementById('verseOfDay');
      if (vod && !vod.hidden) vod.click();
    } else if (key === 'japa') {
      if (window.dhOpenSheet) window.dhOpenSheet('japaSection');
    } else if (key === 'prayer') {
      const card = document.querySelector('.prayer-grid .prayer-card, .prayer-grid article, .prayer-grid button');
      if (card) card.click();
    } else if (key === 'focus') {
      if (window.dhJourneys) {
        const st = window.dhJourneys.load();
        for (const j of window.dhJourneys.list) {
          const s = window.dhJourneys.stats(j, st);
          if (s.done > 0 && s.done < s.total) {
            window.dhJourneys.open(j.id, window.dhJourneys.nextUndone(j, st));
            return;
          }
        }
      }
      if (window.dhOpenFocus) window.dhOpenFocus('hanuman-chalisa');
    }
  }

  /* ---------- detection hooks ---------- */
  function hook() {
    // 1. today's verse clicked
    const vod = document.getElementById('verseOfDay');
    if (vod) vod.addEventListener('click', () => mark('vod'));

    // 2. japa rounds: re-render on tab switches + page visibility
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderCard(); maybeCelebrate(); } });
    const tabPrayers = document.getElementById('tabPrayers');
    if (tabPrayers) tabPrayers.addEventListener('click', () => setTimeout(() => { renderCard(); maybeCelebrate(); }, 300));

    // 3. prayer view opened
    const pv = document.getElementById('prayerView');
    if (pv) {
      new MutationObserver(() => { if (!pv.hidden) { mark('prayer'); } })
        .observe(pv, { attributes: true, attributeFilter: ['hidden'] });
    }

    // 4. focus view opened
    const watchFocus = () => {
      const fv = document.getElementById('focusView');
      if (!fv) { setTimeout(watchFocus, 500); return; }
      new MutationObserver(() => { if (!fv.hidden) mark('focus'); })
        .observe(fv, { attributes: true, attributeFilter: ['hidden'] });
    };
    watchFocus();

    // japa completion can happen while sadhana card is visible behind the japa tab;
    // re-check when the user returns to prayers (handled above) and every so often.
    setInterval(() => {
      const { day } = dayState();
      if (!day.japa && japaRoundsToday() > 0) mark('japa');
    }, 5000);
  }

  window.dhSadhana = { render: renderCard, streak: computeStreak, state: dayState };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderCard(); hook(); });
  } else {
    renderCard();
    hook();
  }
})();
