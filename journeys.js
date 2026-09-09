/* Divine Hub — Journeys: sequenced episode tracks with progress + Continue card */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_journeys_v1';

  // Episode: { p: prayerId, t: episode title, from/to: optional stanza range (inclusive) }
  const JOURNEYS = [
    {
      id: 'hanuman',
      title: 'Hanuman: Strength & Devotion',
      titleDev: 'हनुमान',
      about: 'Five sittings with Bajrangbali — the Chalisa in three parts, then the Sankatmochan and his aarti.',
      episodes: [
        { p: 'hanuman-chalisa', t: 'Chalisa, Part 1 — the invocation', from: 0, to: 9 },
        { p: 'hanuman-chalisa', t: 'Chalisa, Part 2 — the mighty deeds', from: 10, to: 25 },
        { p: 'hanuman-chalisa', t: 'Chalisa, Part 3 — the promise', from: 26, to: 42 },
        { p: 'sankatmochan-ashtak', t: 'Sankatmochan Naam Tiharo' },
        { p: 'hanuman-aarti', t: 'Aarti Kije Hanuman Lala Ki' }
      ]
    },
    {
      id: 'navratri',
      title: 'Navratri: Nights of the Mother',
      titleDev: 'दुर्गा',
      about: 'The Divine Mother in five sittings — her great aarti, the Durga Chalisa in two parts, and the Mothers of the home.',
      episodes: [
        { p: 'jai-ambe-gauri', t: 'Jai Ambe Gauri' },
        { p: 'durga-chalisa', t: 'Durga Chalisa, Part 1', from: 0, to: 19 },
        { p: 'durga-chalisa', t: 'Durga Chalisa, Part 2', from: 20, to: 40 },
        { p: 'santoshi-mata-aarti', t: 'Santoshi Mata Aarti' },
        { p: 'sheetla-mata-aarti', t: 'Sheetla Mata Aarti' }
      ]
    },
    {
      id: 'ganesh',
      title: 'The Ganesh Path',
      titleDev: 'गणेश',
      about: 'Begin every beginning with Vighnaharta — the aarti every home knows, the Marathi classic, and his essential mantras.',
      episodes: [
        { p: 'jai-ganesh-deva', t: 'Jai Ganesh Deva' },
        { p: 'sukhakarta-dukhharta', t: 'Sukhakarta Dukhharta' },
        { p: 'ganesh-mantras', t: 'Ganesh Mantras' }
      ]
    },
    {
      id: 'shiva',
      title: 'Shiva: Omkara to Tandava',
      titleDev: 'शिव',
      about: 'From the evening aarti to the cosmic dance — five sittings with Mahadev, ending with the guardian of Kashi.',
      episodes: [
        { p: 'om-jai-shiv-omkara', t: 'Om Jai Shiv Omkara' },
        { p: 'shiv-chalisa', t: 'Shiv Chalisa' },
        { p: 'lingashtakam', t: 'Lingashtakam' },
        { p: 'shiva-tandava-stotram', t: 'Shiva Tandava Stotram' },
        { p: 'kalabhairava-ashtakam', t: 'Kalabhairava Ashtakam' }
      ]
    },
    {
      id: 'krishna',
      title: 'Krishna of Braj',
      titleDev: 'कृष्ण',
      about: 'The flute under the moonlight — Kunj Bihari\'s aarti, the Krishna Chalisa, Radha Rani\'s aarti, and the Mahamantra.',
      episodes: [
        { p: 'aarti-kunj-bihari-ki', t: 'Aarti Kunj Bihari Ki' },
        { p: 'krishna-chalisa', t: 'Krishna Chalisa' },
        { p: 'radha-rani-aarti', t: 'Radha Rani Aarti' },
        { p: 'hare-krishna-mahamantra', t: 'Hare Krishna Mahamantra' }
      ]
    },
    {
      id: 'lakshmi',
      title: 'Lakshmi: Light & Plenty',
      titleDev: 'लक्ष्मी',
      about: 'For Diwali and every Friday — Mahalakshmi\'s aarti and ashtakam, the universal aarti, and Satyanarayan\'s blessing.',
      episodes: [
        { p: 'om-jai-lakshmi-mata', t: 'Om Jai Lakshmi Mata' },
        { p: 'mahalakshmi-ashtakam', t: 'Mahalakshmi Ashtakam' },
        { p: 'om-jai-jagdish-hare', t: 'Om Jai Jagdish Hare' },
        { p: 'satyanarayan-aarti', t: 'Satyanarayan Aarti' }
      ]
    }
  ];

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  function episodeRange(j, e) {
    const prayer = PRAYERS.find(x => x.id === e.p);
    const from = (typeof e.from === 'number') ? e.from : 0;
    const to = (typeof e.to === 'number') ? e.to : (prayer ? prayer.stanzas.length - 1 : 0);
    return { prayer: prayer, from: from, to: to };
  }

  // Auto-completion: focus-mode position reached the episode's last stanza.
  function isDone(j, ei, state) {
    if (state[j.id] && state[j.id].indexOf(ei) !== -1) return true;
    const e = j.episodes[ei];
    const r = episodeRange(j, e);
    if (window.dhFocusProgress) {
      const fp = window.dhFocusProgress(e.p);
      if (fp && fp.index >= r.to) return true;
    }
    return false;
  }

  function journeyStats(j, state) {
    let done = 0;
    j.episodes.forEach((e, ei) => { if (isDone(j, ei, state)) done++; });
    return { done: done, total: j.episodes.length };
  }

  function markDone(jid, ei, on) {
    const s = load();
    s[jid] = s[jid] || [];
    const i = s[jid].indexOf(ei);
    if (on && i === -1) s[jid].push(ei);
    if (!on && i !== -1) s[jid].splice(i, 1);
    save(s);
  }

  function nextUndone(j, state) {
    for (let i = 0; i < j.episodes.length; i++) {
      if (!isDone(j, i, state)) return i;
    }
    return -1;
  }

  /* ---------- home section ---------- */
  function renderSection() {
    const vod = document.getElementById('verseOfDay');
    if (!vod) return;
    let sec = document.getElementById('journeysSection');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'journeysSection';
      sec.className = 'journeys-section';
      vod.insertAdjacentElement('afterend', sec);
    }
    const state = load();

    // Continue card: first in-progress journey
    let cont = '';
    for (const j of JOURNEYS) {
      const st = journeyStats(j, state);
      if (st.done > 0 && st.done < st.total) {
        const ni = nextUndone(j, state);
        cont = '<button class="jn-continue" data-j="' + j.id + '" data-e="' + ni + '">' +
          '<span class="jn-cont-label">Continue your journey</span>' +
          '<span class="jn-cont-title">' + j.title + '</span>' +
          '<span class="jn-cont-sub">Episode ' + (ni + 1) + ' of ' + st.total + ' · ' + j.episodes[ni].t + '</span>' +
          '<span class="jn-cont-bar"><span class="jn-cont-fill" style="width:' + Math.round((st.done / st.total) * 100) + '%"></span></span>' +
          '</button>';
        break;
      }
    }

    sec.innerHTML =
      '<div class="jn-head"><h3 class="jn-heading">Journeys</h3>' +
      '<p class="jn-sub">A scripture becomes something you finish, one short sitting at a time.</p></div>' +
      cont +
      '<div class="jn-grid">' + JOURNEYS.map(j => {
        const st = journeyStats(j, state);
        const pct = Math.round((st.done / st.total) * 100);
        const status = st.done === st.total ? 'Completed 🪔' : (st.done > 0 ? st.done + ' of ' + st.total + ' done' : st.total + ' episodes');
        return '<button class="jn-card" data-j="' + j.id + '">' +
          '<span class="jn-card-dev">' + j.titleDev + '</span>' +
          '<span class="jn-card-title">' + j.title + '</span>' +
          '<span class="jn-card-meta">' + status + '</span>' +
          '<span class="jn-bar"><span class="jn-fill" style="width:' + pct + '%"></span></span>' +
          '</button>';
      }).join('') + '</div>';

    sec.querySelectorAll('.jn-card').forEach(c =>
      c.addEventListener('click', () => openJourney(c.dataset.j)));
    const cc = sec.querySelector('.jn-continue');
    if (cc) cc.addEventListener('click', () => startEpisode(cc.dataset.j, parseInt(cc.dataset.e, 10)));
  }

  /* ---------- journey detail overlay ---------- */
  let overlay = null;
  function openJourney(jid) {
    const j = JOURNEYS.find(x => x.id === jid);
    if (!j) return;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'journeyView';
      overlay.className = 'journey-view';
      overlay.hidden = true;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeJourney(); });
      document.addEventListener('keydown', e => {
        if (!overlay.hidden && e.key === 'Escape') closeJourney();
      });
    }
    const state = load();
    const st = journeyStats(j, state);
    overlay.innerHTML =
      '<div class="jv-panel">' +
      '<div class="jv-top"><div><div class="jv-dev">' + j.titleDev + '</div>' +
      '<h3 class="jv-title">' + j.title + '</h3></div>' +
      '<button class="fv-close" id="jvClose" aria-label="Close">✕</button></div>' +
      '<p class="jv-about">' + j.about + '</p>' +
      '<div class="jv-meta">' + st.done + ' of ' + st.total + ' episodes done</div>' +
      '<div class="jn-bar jv-bar"><span class="jn-fill" style="width:' + Math.round((st.done / st.total) * 100) + '%"></span></div>' +
      '<div class="jv-eps">' + j.episodes.map((e, ei) => {
        const done = isDone(j, ei, state);
        return '<div class="jv-ep' + (done ? ' done' : '') + '">' +
          '<button class="jv-ep-main" data-e="' + ei + '">' +
          '<span class="jv-ep-num">' + (ei + 1) + '</span>' +
          '<span class="jv-ep-t">' + e.t + '</span>' +
          (done ? '<span class="jv-ep-check">✓</span>' : '<span class="jv-ep-go">›</span>') +
          '</button>' +
          '<button class="jv-ep-mark" data-e="' + ei + '">' + (done ? 'Undo' : 'Mark done') + '</button>' +
          '</div>';
      }).join('') + '</div></div>';
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('#jvClose').addEventListener('click', closeJourney);
    overlay.querySelectorAll('.jv-ep-main').forEach(b =>
      b.addEventListener('click', () => startEpisode(jid, parseInt(b.dataset.e, 10))));
    overlay.querySelectorAll('.jv-ep-mark').forEach(b =>
      b.addEventListener('click', () => {
        const ei = parseInt(b.dataset.e, 10);
        const on = !(load()[jid] || []).includes(ei);
        markDone(jid, ei, on);
        openJourney(jid);
        renderSection();
      }));
  }

  function closeJourney() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    renderSection();
  }

  function startEpisode(jid, ei) {
    const j = JOURNEYS.find(x => x.id === jid);
    if (!j) return;
    const e = j.episodes[ei];
    const r = episodeRange(j, e);
    closeJourney();
    if (window.dhOpenFocus) window.dhOpenFocus(e.p, r.from);
  }

  // refresh section whenever focus mode closes (positions may have advanced)
  const origFocus = window.dhOpenFocus;
  window.dhOpenFocus = function (id, start) {
    if (origFocus) origFocus(id, start);
  };
  document.addEventListener('click', e => {
    if (e.target && e.target.id === 'fvClose') setTimeout(renderSection, 50);
  });

  window.dhJourneys = { list: JOURNEYS, stats: journeyStats, load: load, nextUndone: nextUndone, open: startEpisode, refresh: renderSection };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSection);
  } else {
    renderSection();
  }
})();
