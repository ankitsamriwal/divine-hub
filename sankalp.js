/* Divine Hub — Sankalp Mode v2: manifestation goals as sankalps.
   Each goal: an intention, a deity/mantra pairing, a 21/40/108-day window,
   a daily mala of affirmations, milestones, and a gratitude journal.
   Sankalp+ unlocks unlimited goals, journey timeline cards, full journal
   history with a weekly AI reflection, and morning sankalp audio.
   Everything lives on-device. */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_sankalp_v2';
  const LS_LEGACY = 'divinehub_sankalp_v1';
  const WORKER_URL = 'https://divine-guide.ankitsamriwal.workers.dev';

  const PRESETS = [
    { hi: 'मैं शांत हूँ, स्थिर हूँ।', en: 'I am calm and steady.' },
    { hi: 'मेरा मन मेरे वश में है।', en: 'My mind obeys me.' },
    { hi: 'मैं रोज़ थोड़ा बेहतर बन रहा हूँ।', en: 'Each day I become a little better.' },
    { hi: 'मेरी सेहत मेरा धर्म है।', en: 'My health is my duty.' },
    { hi: 'मैं कृतज्ञ हूँ, मेरे पास पर्याप्त है।', en: 'I am grateful; I have enough.' },
    { hi: 'धैर्य ही मेरी शक्ति है।', en: 'Patience is my strength.' },
    { hi: 'मैं अपना वचन निभाता हूँ।', en: 'I keep my word.' },
    { hi: 'मैं निर्भय हूँ।', en: 'I am fearless.' }
  ];
  const DURATIONS = [21, 40, 108];
  const TARGETS = [27, 54, 108];
  const CATEGORIES = [
    { id: 'career', label: 'Career', icon: '🎯' },
    { id: 'health', label: 'Health', icon: '🌿' },
    { id: 'wealth', label: 'Wealth', icon: '🪙' },
    { id: 'relationships', label: 'Relationships', icon: '🤝' },
    { id: 'growth', label: 'Growth', icon: '🌱' },
    { id: 'peace', label: 'Peace', icon: '🕊️' }
  ];
  const DEITIES = [
    { name: 'Ganesh', dev: 'गणेश', mantra: 'Om Gam Ganapataye Namah', mantraDev: 'ॐ गं गणपतये नमः', gender: 'm', for: 'beginnings and obstacles' },
    { name: 'Shiv', dev: 'शिव', mantra: 'Om Namah Shivaya', mantraDev: 'ॐ नमः शिवाय', gender: 'm', for: 'stillness and transformation' },
    { name: 'Hanuman', dev: 'हनुमान', mantra: 'Om Hanumate Namah', mantraDev: 'ॐ हनुमते नमः', gender: 'm', for: 'strength and courage' },
    { name: 'Lakshmi', dev: 'लक्ष्मी', mantra: 'Om Shreem Mahalakshmiyei Namah', mantraDev: 'ॐ श्रीं महालक्ष्म्यै नमः', gender: 'f', for: 'abundance and plenty' },
    { name: 'Durga', dev: 'दुर्गा', mantra: 'Om Dum Durgayei Namah', mantraDev: 'ॐ दुं दुर्गायै नमः', gender: 'f', for: 'protection and resolve' },
    { name: 'Saraswati', dev: 'सरस्वती', mantra: 'Om Aim Saraswatyai Namah', mantraDev: 'ॐ ऐं सरस्वत्यै नमः', gender: 'f', for: 'learning and clarity' },
    { name: 'Krishna', dev: 'कृष्ण', mantra: 'Om Kleem Krishnaya Namah', mantraDev: 'ॐ क्लीं कृष्णाय नमः', gender: 'm', for: 'love and devotion' },
    { name: 'Vishnu', dev: 'विष्णु', mantra: 'Om Namo Narayanaya', mantraDev: 'ॐ नमो नारायणाय', gender: 'm', for: 'order and preservation' },
    { name: 'Surya', dev: 'सूर्य', mantra: 'Om Suryaya Namah', mantraDev: 'ॐ सूर्याय नमः', gender: 'm', for: 'vitality and discipline' }
  ];
  const MOODS = [
    { id: 'calm', icon: '🕊️', label: 'calm' },
    { id: 'grateful', icon: '🙏', label: 'grateful' },
    { id: 'fired', icon: '🔥', label: 'fired up' },
    { id: 'neutral', icon: '😐', label: 'neutral' },
    { id: 'heavy', icon: '🌧️', label: 'heavy' }
  ];

  function isPlus() { return !!(window.dhPlus && window.dhPlus.isActive()); }

  /* ---------- state ---------- */
  function blank() { return { goals: [], weekly: {} }; }
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
    if (s && s.goals) return s;
    /* migrate v1 single-sankalp state into one goal */
    s = blank();
    try {
      const old = JSON.parse(localStorage.getItem(LS_LEGACY));
      if (old && old.text) {
        s.goals.push({
          id: 'g' + Date.now().toString(36),
          text: old.text,
          deity: 'Shiv',
          category: 'growth',
          startISO: old.startISO,
          duration: old.duration,
          target: 108,
          createdISO: old.startISO,
          days: old.days || {},
          archived: false
        });
        save(s);
      }
    } catch (e) {}
    return s;
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function todayISO() { return isoOf(new Date()); }
  function parseISO(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) { return parseISO(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function hasDev(s) { return /[\u0900-\u097F]/.test(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function deityOf(g) { return DEITIES.find(d => d.name === g.deity) || DEITIES[1]; }
  function catOf(g) { return CATEGORIES.find(c => c.id === g.category) || CATEGORIES[4]; }

  function doneCount(g) { return Object.keys(g.days || {}).filter(k => g.days[k] && g.days[k].done).length; }
  function streakOf(g) {
    let n = 0;
    const d = new Date();
    if (!(g.days[todayISO()] && g.days[todayISO()].done)) d.setDate(d.getDate() - 1);
    while (g.days[isoOf(d)] && g.days[isoOf(d)].done) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function todayEntry(g) { return (g.days && g.days[todayISO()]) || { taps: 0, done: false }; }
  function isComplete(g) { return doneCount(g) >= g.duration; }
  function isScheduled(g) { return parseISO(g.startISO) > parseISO(todayISO()); }
  function activeGoals(s) { return s.goals.filter(g => !g.archived && !isComplete(g)); }
  function completedGoals(s) { return s.goals.filter(g => !g.archived && isComplete(g)); }

  function milestones(g) {
    const D = g.duration;
    const marks = new Set([1, 7, 21, 40, 54, 108, Math.round(D * 0.25), Math.round(D * 0.5), Math.round(D * 0.75), D]);
    return Array.from(marks).filter(m => m >= 1 && m <= D).sort((a, b) => a - b);
  }

  function tithiLabel(dateISO) {
    if (!window.dhAlmanac) return '';
    const d = parseISO(dateISO);
    const noon = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
    const t = window.dhAlmanac.tithiOf(noon);
    return t.name + ' · ' + t.paksha + ' paksha';
  }

  function startOptions() {
    const out = [{ iso: todayISO(), label: 'Today', sub: tithiLabel(todayISO()) }];
    if (!window.dhAlmanac) return out;
    const now = new Date();
    const cand = [];
    const wanted = { 0: 'Shukla Pratipada — first day of the bright moon', 14: 'Purnima — full moon', 10: 'Shukla Ekadashi — for discipline', 25: 'Krishna Ekadashi — for discipline' };
    for (let i = 1; i <= 32; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const noon = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
      const t = window.dhAlmanac.tithiOf(noon);
      if (wanted[t.index] && !cand.some(c => c.label === wanted[t.index])) {
        cand.push({ iso: isoOf(d), label: fmtDate(isoOf(d)), sub: wanted[t.index] });
      }
      if (d.getDay() === 1 && !cand.some(c => c.sub === "Monday — Shiva's day")) {
        cand.push({ iso: isoOf(d), label: fmtDate(isoOf(d)), sub: "Monday — Shiva's day" });
      }
    }
    cand.sort((a, b) => a.iso < b.iso ? -1 : 1);
    return out.concat(cand.slice(0, 3));
  }

  /* ---------- share cards ---------- */
  function wrapLines(ctx, text, maxW) {
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function cardChrome(x) {
    x.fillStyle = '#140f0b';
    x.fillRect(0, 0, 1080, 1920);
    let g = x.createRadialGradient(540, 240, 40, 540, 240, 900);
    g.addColorStop(0, 'rgba(217,112,44,0.28)'); g.addColorStop(1, 'rgba(217,112,44,0)');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1000);
    g = x.createRadialGradient(540, 1750, 40, 540, 1750, 800);
    g.addColorStop(0, 'rgba(226,169,78,0.16)'); g.addColorStop(1, 'rgba(226,169,78,0)');
    x.fillStyle = g; x.fillRect(0, 920, 1080, 1000);
    x.strokeStyle = 'rgba(226,169,78,0.45)'; x.lineWidth = 2;
    x.strokeRect(64, 64, 952, 1792);
    x.strokeStyle = 'rgba(226,169,78,0.18)';
    x.strokeRect(84, 84, 912, 1752);
    x.textAlign = 'center';
    x.fillStyle = '#e2a94e';
    x.font = '400 150px "Tiro Devanagari Hindi", serif';
    x.fillText('ॐ', 540, 300);
    x.font = '400 96px "Tiro Devanagari Hindi", serif';
    x.fillText('सङ्कल्प', 540, 448);
  }
  function cardFooter(x) {
    x.textAlign = 'center';
    x.fillStyle = 'rgba(203,185,158,0.85)';
    x.font = '400 28px "Space Grotesk", sans-serif';
    x.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 540, 1680);
    x.fillStyle = '#e2a94e';
    x.font = '500 34px "Space Grotesk", sans-serif';
    x.fillText('Divine Hub', 540, 1770);
    x.fillStyle = 'rgba(203,185,158,0.7)';
    x.font = '400 26px "Space Mono", monospace';
    x.fillText('roadtodivinity.vercel.app', 540, 1814);
  }

  function drawShareCard(g, final) {
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    const x = cv.getContext('2d');
    const done = doneCount(g), streak = streakOf(g);
    cardChrome(x);
    x.fillStyle = '#cbb99e';
    x.font = '400 30px "Space Mono", monospace';
    x.fillText(final ? 'A  V O W  K E P T' : 'A  D A I L Y  V O W', 540, 530);

    const dev = hasDev(g.text);
    x.fillStyle = '#f4e9d6';
    x.font = (dev ? '400 64px "Tiro Devanagari Hindi", serif' : '500 56px "Space Grotesk", sans-serif');
    const lines = wrapLines(x, g.text, 800);
    const lh = dev ? 92 : 78;
    let y = 760 - ((lines.length - 1) * lh) / 2;
    lines.forEach(l => { x.fillText(l, 540, y); y += lh; });

    x.fillStyle = '#e2a94e';
    x.font = '700 150px "Space Grotesk", sans-serif';
    x.fillText('Day ' + done, 540, 1120);
    x.fillStyle = '#cbb99e';
    x.font = '400 38px "Space Grotesk", sans-serif';
    x.fillText('of a ' + g.duration + '-day sankalp', 540, 1188);

    const dt = deityOf(g);
    x.font = '400 30px "Space Mono", monospace';
    const bits = [dt.mantra.toUpperCase()];
    if (streak > 1) bits.push(streak + '-DAY STREAK');
    x.fillText(bits.join('  ·  '), 540, 1270);
    cardFooter(x);
    return cv;
  }

  /* Journey timeline card (Sankalp+): the whole arc at a glance. */
  function drawTimelineCard(g) {
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    const x = cv.getContext('2d');
    const done = doneCount(g), streak = streakOf(g);
    cardChrome(x);
    x.fillStyle = '#cbb99e';
    x.font = '400 30px "Space Mono", monospace';
    x.fillText('T H E   J O U R N E Y   S O   F A R', 540, 530);

    const dev = hasDev(g.text);
    x.fillStyle = '#f4e9d6';
    x.font = (dev ? '400 56px "Tiro Devanagari Hindi", serif' : '500 48px "Space Grotesk", sans-serif');
    const lines = wrapLines(x, g.text, 820);
    const lh = dev ? 80 : 66;
    let y = 690 - ((lines.length - 1) * lh) / 2;
    lines.forEach(l => { x.fillText(l, 540, y); y += lh; });

    const dt = deityOf(g), ct = catOf(g);
    x.fillStyle = '#e2a94e';
    x.font = '400 40px "Tiro Devanagari Hindi", serif';
    x.fillText(dt.mantraDev, 540, 800);
    x.fillStyle = '#cbb99e';
    x.font = '400 28px "Space Mono", monospace';
    x.fillText(ct.label.toUpperCase() + '  ·  ' + dt.mantra.toUpperCase(), 540, 850);

    /* day dots grid */
    const D = g.duration;
    const cols = D <= 21 ? 7 : (D <= 40 ? 8 : 12);
    const rows = Math.ceil(D / cols);
    const gapX = Math.min(78, 880 / cols), gapY = 74;
    const w = (cols - 1) * gapX;
    const x0 = 540 - w / 2, y0 = 960;
    const ms = milestones(g);
    for (let i = 1; i <= D; i++) {
      const r = Math.floor((i - 1) / cols), c = (i - 1) % cols;
      const cx = x0 + c * gapX, cy = y0 + r * gapY;
      const dISO = isoOf(new Date(parseISO(g.startISO).getTime() + (i - 1) * 86400000));
      const day = g.days[dISO];
      const kept = day && day.done;
      const journaled = day && (day.journal || day.gratitude);
      x.beginPath();
      x.arc(cx, cy, ms.indexOf(i) !== -1 ? 17 : 12, 0, Math.PI * 2);
      if (kept) { x.fillStyle = '#e2a94e'; x.fill(); }
      else { x.strokeStyle = 'rgba(226,169,78,0.4)'; x.lineWidth = 2; x.stroke(); }
      if (journaled) {
        x.beginPath(); x.arc(cx, cy, 4, 0, Math.PI * 2);
        x.fillStyle = kept ? '#140f0b' : '#e2a94e'; x.fill();
      }
      if (ms.indexOf(i) !== -1) {
        x.fillStyle = kept ? '#f4e9d6' : '#cbb99e';
        x.font = '400 20px "Space Mono", monospace';
        x.fillText(String(i), cx, cy + 38);
      }
    }

    const yb = y0 + rows * gapY + 60;
    x.fillStyle = '#e2a94e';
    x.font = '700 110px "Space Grotesk", sans-serif';
    x.fillText('Day ' + done + ' of ' + D, 540, yb + 40);
    x.fillStyle = '#cbb99e';
    x.font = '400 30px "Space Mono", monospace';
    const bits = [];
    if (streak > 1) bits.push(streak + '-DAY STREAK');
    bits.push('STARTED ' + parseISO(g.startISO).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase());
    x.fillText(bits.join('  ·  '), 540, yb + 105);
    cardFooter(x);
    return cv;
  }

  function downloadCv(cv, name) {
    cv.toBlob(blob => {
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'My sankalp' }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    }, 'image/png');
  }
  function shareCard(g, final) {
    document.fonts.ready.then(() => downloadCv(drawShareCard(g, final), 'sankalp-day-' + doneCount(g) + '.png'));
  }
  function shareTimeline(g) {
    document.fonts.ready.then(() => downloadCv(drawTimelineCard(g), 'sankalp-journey-day-' + doneCount(g) + '.png'));
  }

  /* ---------- morning sankalp audio (Sankalp+) ---------- */
  function speakMorning(g) {
    const synth = window.speechSynthesis;
    if (!synth) { alert('Audio narration is not supported in this browser.'); return; }
    synth.cancel();
    const dt = deityOf(g);
    const day = Math.min(doneCount(g) + 1, g.duration);
    const dev = hasDev(g.text);
    const script = dev
      ? 'ॐ। शुभ प्रभात। आपके ' + g.duration + ' दिनों के सङ्कल्प का दिन ' + day + ' है। आपका सङ्कल्प: ' + g.text +
        '। आपका मंत्र: ' + dt.mantraDev + '। मेरे साथ बोलिए। ' + dt.mantraDev + '। ' + dt.mantraDev + '। ' + dt.mantraDev + '। इसे आज अपने साथ रखिए।'
      : 'Om. Good morning. Day ' + day + ' of your ' + g.duration + '-day sankalp. Your intention: ' + g.text +
        '. Your mantra: ' + dt.mantra + '. Say it with me. ' + dt.mantra + '. ' + dt.mantra + '. ' + dt.mantra + '. Carry it with you today.';
    const u = new SpeechSynthesisUtterance(script);
    u.lang = dev ? 'hi-IN' : 'en-IN';
    u.rate = 0.92;
    u.pitch = 1;
    if (window.dhTTS) {
      const v = window.dhTTS.pickVoice(dev ? 'hi' : 'en', dt.gender);
      if (v) u.voice = v;
    }
    synth.speak(u);
    return u;
  }

  /* ---------- weekly AI reflection (Sankalp+) ---------- */
  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + week;
  }
  function collectJournal(days) {
    const s = load();
    const out = [];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (days || 7));
    s.goals.forEach(g => {
      Object.keys(g.days || {}).forEach(k => {
        const e = g.days[k];
        if ((e.journal || e.gratitude || e.mood) && parseISO(k) >= cutoff) {
          out.push({ date: k, goal: g.text, gratitude: e.gratitude, journal: e.journal, mood: e.mood });
        }
      });
    });
    return out.sort((a, b) => a.date < b.date ? -1 : 1);
  }
  async function weeklyReflection() {
    const entries = collectJournal(7);
    if (!entries.length) throw new Error('empty');
    const lines = entries.map(e =>
      e.date + ' (' + e.goal + ')' +
      (e.mood ? ' mood:' + e.mood : '') +
      (e.gratitude ? ' grateful for: ' + e.gratitude : '') +
      (e.journal ? ' reflection: ' + e.journal : '')).join('\n');
    const sys = 'You are a gentle spiritual journaling companion inside a Hindu prayer app. ' +
      'Write a short weekly reflection (under 150 words) on the user\'s journal entries below: name the themes, ' +
      'honor the effort, and close with one sentence of encouragement tied to their sankalp. Warm, plain, no lists.';
    const res = await fetch(WORKER_URL + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: 'My journal this week:\n' + lines }] }]
      })
    });
    if (!res.ok) throw new Error('worker HTTP ' + res.status);
    const data = await res.json();
    if (!data || !data.text) throw new Error('empty');
    return data.text.trim();
  }

  /* ---------- sheet scaffolding ---------- */
  function sheetEl() {
    let el = document.getElementById('sankalpSheet');
    if (!el) {
      el = document.createElement('section');
      el.id = 'sankalpSheet';
      el.className = 'dh-sheet sankalp-sheet';
      el.hidden = true;
      el.innerHTML = '<button class="dh-sheet-close" id="sankalpClose" aria-label="Close sankalp">✕</button><div class="sk-body" id="skBody"></div>';
      document.body.appendChild(el);
      el.querySelector('#sankalpClose').addEventListener('click', () => window.dhCloseSheet('sankalpSheet'));
    }
    return el;
  }

  let view = { name: 'list', goalId: null };

  function openSheet() {
    sheetEl();
    const s = load();
    if (!s.goals.length) view = { name: 'new', goalId: null };
    else if (view.name === 'new' && s.goals.length) view = { name: 'list', goalId: null };
    renderSheet();
    window.dhOpenSheet('sankalpSheet');
  }

  function renderSheet() {
    if (view.name === 'new') renderNew();
    else if (view.name === 'goal') renderGoal(view.goalId);
    else renderList();
  }

  function plusTeaser(feature) {
    return '<button class="sk-plus-lock" id="skPlusGo">✨ <b>Sankalp+</b> — ' + feature + '</button>';
  }
  function wirePlusTeaser(body) {
    const b = body.querySelector('#skPlusGo');
    if (b) b.addEventListener('click', () => { if (window.dhPlus) window.dhPlus.open(); });
  }

  /* ---------- list view ---------- */
  function renderList() {
    const body = document.getElementById('skBody');
    const s = load();
    const act = activeGoals(s);
    const comp = completedGoals(s);

    body.innerHTML =
      '<div class="sk-hero sk-hero-tight"><span class="sk-om">ॐ</span>' +
      '<h2><span class="sk-dev">सङ्कल्प</span> · Sankalp</h2>' +
      '<p>Your intentions, each on its own journey — a vow kept one day at a time.</p></div>' +
      (act.length ? '<div class="sk-goal-list">' + act.map(g => goalRow(g)).join('') + '</div>' : '') +
      (comp.length ? '<div class="sk-label">Kept and sealed</div><div class="sk-goal-list">' + comp.map(g => goalRow(g)).join('') + '</div>' : '') +
      '<button class="sk-begin" id="skNew">New sankalp</button>' +
      (!isPlus() && act.length >= 1
        ? '<p class="sk-note">Free keeps one active goal. ' + plusTeaser('unlimited goals, journey timelines, morning audio') + '</p>'
        : '') +
      weeklyBlock();

    body.querySelectorAll('.sk-goal-row').forEach(r =>
      r.addEventListener('click', () => { view = { name: 'goal', goalId: r.dataset.g }; renderSheet(); }));
    body.querySelector('#skNew').addEventListener('click', () => {
      if (!isPlus() && activeGoals(load()).length >= 1) {
        if (window.dhPlus) window.dhPlus.open();
        return;
      }
      view = { name: 'new', goalId: null };
      renderSheet();
    });
    wirePlusTeaser(body);
    wireWeekly(body);
  }

  function goalRow(g) {
    const done = doneCount(g), streak = streakOf(g);
    const dt = deityOf(g), ct = catOf(g);
    const complete = isComplete(g);
    const sub = complete
      ? g.duration + ' days kept · sealed'
      : isScheduled(g)
        ? 'begins ' + fmtDate(g.startISO)
        : 'Day ' + Math.min(done + 1, g.duration) + ' of ' + g.duration + (streak ? ' · ' + streak + '🔥' : '');
    return '<button class="sk-goal-row" data-g="' + g.id + '">' +
      '<span class="sk-goal-ic">' + (complete ? '🪔' : ct.icon) + '</span>' +
      '<span class="sk-goal-main"><span class="sk-goal-text' + (hasDev(g.text) ? ' sk-dev-text' : '') + '">' + esc(g.text) + '</span>' +
      '<span class="sk-goal-sub">' + dt.dev + ' ' + dt.name + ' · ' + sub + '</span>' +
      '<span class="sk-goal-bar"><span class="sk-goal-fill" style="width:' + Math.round(done / g.duration * 100) + '%"></span></span></span>' +
      '<span class="sk-home-cta">›</span></button>';
  }

  function weeklyBlock() {
    const entries = collectJournal(7);
    if (!entries.length) return '';
    if (!isPlus()) {
      return '<div class="sk-weekly">' + plusTeaser('a gentle AI reflection on your week\'s journal') + '</div>';
    }
    const s = load();
    const wk = weekKey();
    const cached = s.weekly && s.weekly[wk];
    return '<div class="sk-weekly"><div class="sk-label">This week\'s reflection ✨</div>' +
      (cached
        ? '<p class="sk-weekly-text">' + esc(cached) + '</p>'
        : '<button class="sk-ghost" id="skWeekly">Reflect on my week</button>') +
      '</div>';
  }
  function wireWeekly(body) {
    const b = body.querySelector('#skWeekly');
    if (!b) return;
    b.addEventListener('click', async () => {
      b.disabled = true;
      b.textContent = 'Reflecting…';
      try {
        const text = await weeklyReflection();
        const s = load();
        s.weekly = s.weekly || {};
        s.weekly[weekKey()] = text;
        save(s);
        renderSheet();
      } catch (e) {
        b.disabled = false;
        b.textContent = 'Reflection unavailable right now — try again';
      }
    });
  }

  /* ---------- new goal form ---------- */
  function renderNew() {
    const body = document.getElementById('skBody');
    const opts = startOptions();
    body.innerHTML =
      (load().goals.length ? '<button class="sk-back" id="skBack">‹ My sankalps</button>' : '') +
      '<div class="sk-hero"><span class="sk-om">ॐ</span>' +
      '<h2><span class="sk-dev">सङ्कल्प</span> · New sankalp</h2>' +
      '<p>Name the intention, pair it with a deity and mantra, choose your window. The journey tracks itself.</p></div>' +
      '<label class="sk-label" for="skText">Your intention — in Hindi or English</label>' +
      '<textarea id="skText" class="sk-text" rows="2" maxlength="140" placeholder="मैं रोज़ थोड़ा बेहतर बन रहा हूँ…"></textarea>' +
      '<div class="sk-label">Or choose one</div>' +
      '<div class="sk-presets">' + PRESETS.map(p =>
        '<button class="sk-preset" data-hi="' + esc(p.hi) + '"><span class="sk-p-hi">' + p.hi + '</span><span class="sk-p-en">' + p.en + '</span></button>').join('') + '</div>' +
      '<div class="sk-label">This is a goal of</div>' +
      '<div class="sk-chips" id="skCats">' + CATEGORIES.map((c, i) =>
        '<button class="sk-chip' + (i === 4 ? ' on' : '') + '" data-c="' + c.id + '">' + c.icon + ' ' + c.label + '</button>').join('') + '</div>' +
      '<div class="sk-label">Pair with a deity &amp; mantra</div>' +
      '<div class="sk-deity-grid" id="skDeities">' + DEITIES.map((d, i) =>
        '<button class="sk-deity' + (i === 0 ? ' on' : '') + '" data-d="' + d.name + '">' +
        '<span class="sk-deity-dev">' + d.dev + '</span><span class="sk-deity-name">' + d.name + '</span>' +
        '<span class="sk-deity-for">' + d.for + '</span></button>').join('') + '</div>' +
      '<div class="sk-mantra-preview" id="skMantra"><span class="sk-mantra-dev">' + DEITIES[0].mantraDev + '</span><span class="sk-mantra-en">' + DEITIES[0].mantra + '</span></div>' +
      '<div class="sk-label">Length of the vow</div>' +
      '<div class="sk-chips" id="skDurs">' + DURATIONS.map(d =>
        '<button class="sk-chip' + (d === 40 ? ' on' : '') + '" data-d="' + d + '">' + d + ' days</button>').join('') + '</div>' +
      '<div class="sk-label">Daily affirmations</div>' +
      '<div class="sk-chips" id="skTargets">' + TARGETS.map(t =>
        '<button class="sk-chip' + (t === 108 ? ' on' : '') + '" data-t="' + t + '">' + t + ' a day</button>').join('') + '</div>' +
      '<div class="sk-label">Begin on</div>' +
      '<div class="sk-chips sk-dates" id="skDates">' + opts.map((o, i) =>
        '<button class="sk-chip sk-date' + (i === 0 ? ' on' : '') + '" data-iso="' + o.iso + '"><span>' + o.label + '</span>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</button>').join('') + '</div>' +
      '<button class="sk-begin" id="skBegin">Take the vow · सङ्कल्प लें</button>' +
      '<p class="sk-note">Kept privately on this device. Start dates follow the tithi where it matters.</p>';

    body.querySelectorAll('.sk-preset').forEach(b => b.addEventListener('click', () => {
      body.querySelector('#skText').value = b.getAttribute('data-hi');
    }));
    [['#skCats', 'c'], ['#skDurs', 'd'], ['#skTargets', 't'], ['#skDates', 'iso']].forEach(pair => {
      body.querySelectorAll(pair[0] + ' .sk-chip').forEach(b => b.addEventListener('click', () => {
        body.querySelectorAll(pair[0] + ' .sk-chip').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      }));
    });
    body.querySelectorAll('#skDeities .sk-deity').forEach(b => b.addEventListener('click', () => {
      body.querySelectorAll('#skDeities .sk-deity').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const d = DEITIES.find(x => x.name === b.dataset.d);
      body.querySelector('#skMantra').innerHTML = '<span class="sk-mantra-dev">' + d.mantraDev + '</span><span class="sk-mantra-en">' + d.mantra + '</span>';
    }));
    const back = body.querySelector('#skBack');
    if (back) back.addEventListener('click', () => { view = { name: 'list', goalId: null }; renderSheet(); });
    body.querySelector('#skBegin').addEventListener('click', () => {
      const text = body.querySelector('#skText').value.trim();
      if (!text) { body.querySelector('#skText').focus(); return; }
      const s = load();
      const g = {
        id: 'g' + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36),
        text: text,
        deity: body.querySelector('#skDeities .on').dataset.d,
        category: body.querySelector('#skCats .on').dataset.c,
        startISO: body.querySelector('#skDates .on').dataset.iso,
        duration: +body.querySelector('#skDurs .on').dataset.d,
        target: +body.querySelector('#skTargets .on').dataset.t,
        createdISO: todayISO(),
        days: {},
        archived: false
      };
      s.goals.push(g);
      save(s);
      view = { name: 'goal', goalId: g.id };
      renderSheet();
      renderHome();
    });
  }

  /* ---------- goal practice view ---------- */
  function renderGoal(goalId) {
    const body = document.getElementById('skBody');
    const s = load();
    const g = s.goals.find(x => x.id === goalId);
    if (!g) { view = { name: 'list', goalId: null }; renderSheet(); return; }
    const dt = deityOf(g), ct = catOf(g);

    if (isComplete(g)) {
      body.innerHTML =
        '<button class="sk-back" id="skBack">‹ My sankalps</button>' +
        '<div class="sk-hero"><span class="sk-om">🪔</span>' +
        '<h2><span class="sk-dev">सङ्कल्प सिद्ध</span></h2>' +
        '<p>' + g.duration + ' days, kept. "' + esc(g.text) + '"</p></div>' +
        '<button class="sk-begin" id="skShare">Share the card</button>' +
        (isPlus() ? '<button class="sk-ghost" id="skTimeline">Share the journey timeline ✨</button>' : plusTeaser('the journey timeline card')) +
        '<button class="sk-ghost" id="skNewGoal">Begin a new sankalp</button>';
      body.querySelector('#skBack').addEventListener('click', () => { view = { name: 'list', goalId: null }; renderSheet(); });
      body.querySelector('#skShare').addEventListener('click', () => shareCard(g, true));
      const tl = body.querySelector('#skTimeline');
      if (tl) tl.addEventListener('click', () => shareTimeline(g));
      body.querySelector('#skNewGoal').addEventListener('click', () => {
        if (!isPlus() && activeGoals(load()).length >= 1) { if (window.dhPlus) window.dhPlus.open(); return; }
        view = { name: 'new', goalId: null }; renderSheet();
      });
      wirePlusTeaser(body);
      return;
    }

    if (isScheduled(g)) {
      body.innerHTML =
        '<button class="sk-back" id="skBack">‹ My sankalps</button>' +
        '<div class="sk-hero"><span class="sk-om">ॐ</span>' +
        '<h2>The vow is taken</h2>' +
        '<p class="sk-sankalp-text' + (hasDev(g.text) ? ' sk-dev-text' : '') + '">"' + esc(g.text) + '"</p>' +
        '<p>' + dt.dev + ' ' + dt.name + ' · ' + dt.mantra + '<br>It begins on <b>' + fmtDate(g.startISO) + '</b><br><span class="sk-dim">' + tithiLabel(g.startISO) + '</span></p></div>' +
        '<button class="sk-ghost" id="skEnd">Let go of this sankalp</button>';
      body.querySelector('#skBack').addEventListener('click', () => { view = { name: 'list', goalId: null }; renderSheet(); });
      body.querySelector('#skEnd').addEventListener('click', () => {
        if (confirm('Let go of this sankalp?')) {
          const st = load();
          st.goals = st.goals.filter(x => x.id !== g.id);
          save(st);
          view = { name: 'list', goalId: null };
          renderSheet(); renderHome();
        }
      });
      return;
    }

    /* active */
    const e = todayEntry(g);
    const done = doneCount(g), streak = streakOf(g);
    const left = g.duration - done;
    const taps = e.taps || 0;
    const target = g.target || 108;
    const pct = Math.min(100, Math.round(taps / target * 100));
    const dayNum = Math.min(done + (e.done ? 0 : 1), g.duration);
    const ms = milestones(g);
    const ringLen = 565.5;

    body.innerHTML =
      '<button class="sk-back" id="skBack">‹ My sankalps</button>' +
      '<div class="sk-hero sk-hero-tight">' +
      '<span class="sk-daymono">' + ct.icon + ' ' + ct.label.toUpperCase() + ' · DAY ' + dayNum + ' OF ' + g.duration + (streak ? ' · ' + streak + '-DAY STREAK' : '') + '</span>' +
      '<p class="sk-sankalp-text' + (hasDev(g.text) ? ' sk-dev-text' : '') + '">' + esc(g.text) + '</p>' +
      '<span class="sk-mantra-inline"><b>' + dt.mantraDev + '</b> · ' + dt.mantra + '</span>' +
      '<div class="sk-journey"><div class="sk-journey-fill" style="width:' + Math.round(done / g.duration * 100) + '%"></div></div>' +
      '<div class="sk-miles">' + ms.map(m =>
        '<span class="sk-mile' + (done >= m ? ' hit' : '') + (m === dayNum ? ' now' : '') + '">' + m + '</span>').join('') + '</div>' +
      '<span class="sk-dim">' + done + ' days kept · ' + left + ' to go · ' + tithiLabel(todayISO()) + '</span>' +
      '</div>' +
      (isPlus()
        ? '<button class="sk-audio" id="skAudio">▶ Morning sankalp — hear it spoken</button>'
        : plusTeaser('morning sankalp audio, in ' + dt.name + '\'s voice')) +
      (e.done
        ? '<div class="sk-sealed"><span class="sk-sealed-ic">🪔</span> Today\'s sankalp is sealed — ' + target + ' done.</div>'
        : '<button class="sk-tap" id="skTap" aria-label="Tap to affirm">' +
          '<svg viewBox="0 0 200 200" class="sk-ring"><circle cx="100" cy="100" r="90" fill="none" stroke="rgba(226,169,78,0.15)" stroke-width="6"/>' +
          '<circle id="skRingFill" cx="100" cy="100" r="90" fill="none" stroke="#e2a94e" stroke-width="6" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="' + ringLen + '" stroke-dashoffset="' + (ringLen * (1 - pct / 100)) + '"/></svg>' +
          '<span class="sk-tap-count" id="skCount">' + taps + '</span>' +
          '<span class="sk-tap-of">of ' + target + '</span>' +
          '<span class="sk-tap-hint">tap to affirm</span></button>') +
      journalHtml(g, e) +
      '<button class="sk-begin" id="skShare">Share today\'s card</button>' +
      (isPlus() ? '<button class="sk-ghost" id="skTimeline">Share the journey timeline ✨</button>' : '') +
      '<button class="sk-ghost" id="skEnd">Let go of this sankalp</button>';

    body.querySelector('#skBack').addEventListener('click', () => { view = { name: 'list', goalId: null }; renderSheet(); });

    const tapBtn = body.querySelector('#skTap');
    if (tapBtn) {
      tapBtn.addEventListener('click', () => {
        const st = load();
        const gg = st.goals.find(x => x.id === g.id);
        const cur = todayEntry(gg);
        cur.taps = (cur.taps || 0) + 1;
        if (cur.taps >= target) { cur.taps = target; cur.done = true; }
        gg.days[todayISO()] = cur;
        save(st);
        if (cur.done) { renderSheet(); renderHome(); return; }
        body.querySelector('#skCount').textContent = cur.taps;
        body.querySelector('#skRingFill').setAttribute('stroke-dashoffset', String(ringLen * (1 - cur.taps / target)));
        if (navigator.vibrate && cur.taps % 27 === 0) navigator.vibrate(12);
      });
    }
    const audioBtn = body.querySelector('#skAudio');
    if (audioBtn) audioBtn.addEventListener('click', () => {
      speakMorning(g);
      audioBtn.textContent = '🔊 Speaking… (tap again to restart)';
    });
    wireJournal(body, g);
    body.querySelector('#skShare').addEventListener('click', () => shareCard(g, false));
    const tl = body.querySelector('#skTimeline');
    if (tl) tl.addEventListener('click', () => shareTimeline(g));
    wirePlusTeaser(body);
    body.querySelector('#skEnd').addEventListener('click', () => {
      if (confirm('Let go of this sankalp? The streak will be lost.')) {
        const st = load();
        st.goals = st.goals.filter(x => x.id !== g.id);
        save(st);
        view = { name: 'list', goalId: null };
        renderSheet(); renderHome();
      }
    });
  }

  /* ---------- journal ---------- */
  function journalHtml(g, e) {
    const keys = Object.keys(g.days || {}).filter(k => {
      const d = g.days[k];
      return d && (d.journal || d.gratitude || d.mood);
    }).sort().reverse();
    const visible = isPlus() ? keys : keys.slice(0, 7);
    const hiddenCount = keys.length - visible.length;
    return '<div class="sk-journal">' +
      '<div class="sk-label">Daily journal — after practice</div>' +
      '<input id="skGrat" type="text" maxlength="120" placeholder="Gratitude — one thing you\'re thankful for…" value="' + esc(e.gratitude || '') + '">' +
      '<input id="skJ" type="text" maxlength="140" placeholder="Reflection — how did today honor the vow?" value="' + esc(e.journal || '') + '">' +
      '<div class="sk-moods" id="skMoods">' + MOODS.map(m =>
        '<button class="sk-mood' + (e.mood === m.id ? ' on' : '') + '" data-m="' + m.id + '" title="' + m.label + '">' + m.icon + '</button>').join('') + '</div>' +
      '<button id="skJSave" class="sk-j-save sk-j-save-wide">Save today\'s entry</button>' +
      (visible.length ? '<div class="sk-j-past">' + visible.map(k => {
        const d = g.days[k];
        const mood = MOODS.find(m => m.id === d.mood);
        return '<div class="sk-j-line"><span>' + fmtDate(k) + (mood ? ' ' + mood.icon : '') + '</span>' +
          (d.gratitude ? '<em>🙏 ' + esc(d.gratitude) + '</em>' : '') + esc(d.journal || '') + '</div>';
      }).join('') + '</div>' : '') +
      (hiddenCount > 0 ? plusTeaser(hiddenCount + ' older entr' + (hiddenCount === 1 ? 'y' : 'ies') + ' — full journal history') : '') +
      '</div>';
  }
  function wireJournal(body, g) {
    body.querySelectorAll('#skMoods .sk-mood').forEach(b => b.addEventListener('click', () => {
      body.querySelectorAll('#skMoods .sk-mood').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    }));
    body.querySelector('#skJSave').addEventListener('click', () => {
      const st = load();
      const gg = st.goals.find(x => x.id === g.id);
      const cur = todayEntry(gg);
      cur.gratitude = body.querySelector('#skGrat').value.trim();
      cur.journal = body.querySelector('#skJ').value.trim();
      const mood = body.querySelector('#skMoods .sk-mood.on');
      if (mood) cur.mood = mood.dataset.m;
      gg.days[todayISO()] = cur;
      save(st);
      renderSheet(); renderHome();
    });
  }

  /* ---------- home card ---------- */
  function renderHome() {
    const zone = document.getElementById('zoneSadhana');
    if (!zone) { setTimeout(renderHome, 400); return; }
    let card = document.getElementById('sankalpHome');
    if (!card) {
      card = document.createElement('button');
      card.id = 'sankalpHome';
      card.className = 'sk-home';
      card.type = 'button';
      const sandhya = document.getElementById('sandhyaSection');
      zone.insertBefore(card, sandhya || null);
      card.addEventListener('click', openSheet);
    }
    const s = load();
    const act = activeGoals(s);
    const comp = completedGoals(s);
    const plusTag = isPlus() ? ' <span class="sk-plus-tag">✨</span>' : '';
    if (!s.goals.length) {
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title"><span class="sk-dev">सङ्कल्प</span> · Sankalp' + plusTag + '</span>' +
        '<span class="sk-home-sub">Set an intention, pair it with a mantra, and watch the journey build.</span></span>' +
        '<span class="sk-home-cta">Begin →</span>';
    } else if (!act.length && comp.length) {
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title">🪔 <span class="sk-dev">सङ्कल्प सिद्ध</span>' + plusTag + '</span>' +
        '<span class="sk-home-sub">' + comp[comp.length - 1].duration + ' days kept. Share the card, or begin anew.</span></span>' +
        '<span class="sk-home-cta">Open →</span>';
    } else {
      const g = act[0];
      const e = todayEntry(g);
      const done = doneCount(g), streak = streakOf(g);
      const more = act.length > 1 ? ' (+' + (act.length - 1) + ' more)' : '';
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title"><span class="sk-dev">सङ्कल्प</span> · Day ' + Math.min(done + (e.done ? 0 : 1), g.duration) + ' of ' + g.duration + (streak ? ' · ' + streak + '🔥' : '') + more + plusTag + '</span>' +
        '<span class="sk-home-sub">' + (e.done ? 'Today sealed. ' : 'Today: ' + (e.taps || 0) + ' of ' + (g.target || 108) + ' · ') + '"' + esc(g.text) + '"</span></span>' +
        '<span class="sk-home-cta">' + (e.done ? 'Journal →' : 'Affirm →') + '</span>';
    }
  }

  function wireFab() {
    const b = document.getElementById('fabSankalp');
    if (b) b.addEventListener('click', () => {
      const m = document.getElementById('fabMenu');
      if (m) m.hidden = true;
      openSheet();
    });
  }

  window.dhSankalp = {
    open: openSheet,
    renderHome: renderHome,
    card: function () {
      const s = load();
      const g = activeGoals(s)[0] || s.goals[s.goals.length - 1];
      return g ? drawShareCard(g, isComplete(g)) : null;
    },
    timelineCard: function () {
      const s = load();
      const g = activeGoals(s)[0] || s.goals[s.goals.length - 1];
      return g ? drawTimelineCard(g) : null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderHome(); wireFab(); });
  } else { renderHome(); wireFab(); }
})();
