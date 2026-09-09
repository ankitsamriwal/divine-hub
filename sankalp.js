/* Divine Hub — Sankalp Mode: one daily intention, 108 affirmations, streaks,
   an evening one-line journal, and shareable streak cards. All on-device. */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_sankalp_v1';
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

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch (e) { return null; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function todayISO() { return isoOf(new Date()); }
  function parseISO(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) { return parseISO(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function hasDev(s) { return /[\u0900-\u097F]/.test(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function doneCount(s) {
    if (!s) return 0;
    return Object.keys(s.days || {}).filter(k => s.days[k] && s.days[k].done).length;
  }
  function streakOf(s) {
    if (!s) return 0;
    let n = 0;
    const d = new Date();
    if (!(s.days[todayISO()] && s.days[todayISO()].done)) d.setDate(d.getDate() - 1);
    while (s.days[isoOf(d)] && s.days[isoOf(d)].done) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function todayEntry(s) {
    return (s.days && s.days[todayISO()]) || { taps: 0, done: false, journal: '' };
  }
  function isComplete(s) { return doneCount(s) >= s.duration; }
  function isScheduled(s) { return parseISO(s.startISO) > parseISO(todayISO()); }

  function tithiLabel(dateISO) {
    if (!window.dhAlmanac) return '';
    const d = parseISO(dateISO);
    const noon = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
    const t = window.dhAlmanac.tithiOf(noon);
    return t.name + ' · ' + t.paksha + ' paksha';
  }

  /* auspicious start-day suggestions: today, next bright Pratipada, next Purnima,
     next Ekadashi (either paksha), next Monday */
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

  /* ---------- share card (1080x1920 story) ---------- */
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

  function drawShareCard(s, done, streak, final) {
    const cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    const x = cv.getContext('2d');

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

    x.fillStyle = '#cbb99e';
    x.font = '400 30px "Space Mono", monospace';
    x.fillText(final ? 'A  V O W  K E P T' : 'A  D A I L Y  V O W', 540, 530);

    const dev = hasDev(s.text);
    x.fillStyle = '#f4e9d6';
    x.font = (dev ? '400 64px "Tiro Devanagari Hindi", serif' : '500 56px "Space Grotesk", sans-serif');
    const lines = wrapLines(x, s.text, 800);
    const lh = dev ? 92 : 78;
    let y = 760 - ((lines.length - 1) * lh) / 2;
    lines.forEach(l => { x.fillText(l, 540, y); y += lh; });

    x.fillStyle = '#e2a94e';
    x.font = '700 150px "Space Grotesk", sans-serif';
    x.fillText('Day ' + done, 540, 1120);
    x.fillStyle = '#cbb99e';
    x.font = '400 38px "Space Grotesk", sans-serif';
    x.fillText('of a ' + s.duration + '-day sankalp', 540, 1188);

    x.font = '400 30px "Space Mono", monospace';
    x.fillStyle = '#cbb99e';
    const bits = ['108 AFFIRMATIONS DAILY'];
    if (streak > 1) bits.push(streak + '-DAY STREAK');
    x.fillText(bits.join('  ·  '), 540, 1270);

    x.fillStyle = 'rgba(203,185,158,0.85)';
    x.font = '400 28px "Space Grotesk", sans-serif';
    x.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 540, 1680);
    x.fillStyle = '#e2a94e';
    x.font = '500 34px "Space Grotesk", sans-serif';
    x.fillText('Divine Hub', 540, 1770);
    x.fillStyle = 'rgba(203,185,158,0.7)';
    x.font = '400 26px "Space Mono", monospace';
    x.fillText('roadtodivinity.vercel.app', 540, 1814);

    return cv;
  }

  function shareCard(s, final) {
    const done = doneCount(s), streak = streakOf(s);
    document.fonts.ready.then(() => {
      const cv = drawShareCard(s, done, streak, final);
      cv.toBlob(blob => {
        const file = new File([blob], 'sankalp-day-' + done + '.png', { type: 'image/png' });
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
    });
  }

  /* ---------- sheet ---------- */
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

  function renderSheet() {
    const body = document.getElementById('skBody');
    if (!body) return;
    const s = load();

    if (!s) {
      const opts = startOptions();
      body.innerHTML =
        '<div class="sk-hero"><span class="sk-om">ॐ</span>' +
        '<h2><span class="sk-dev">सङ्कल्प</span> · Sankalp</h2>' +
        '<p>One intention, affirmed 108 times a day. An old practice: a vow taken with a steady mind, kept one day at a time.</p></div>' +
        '<label class="sk-label" for="skText">Your sankalp — in Hindi or English</label>' +
        '<textarea id="skText" class="sk-text" rows="2" maxlength="140" placeholder="मैं रोज़ थोड़ा बेहतर बन रहा हूँ…"></textarea>' +
        '<div class="sk-label">Or choose one</div>' +
        '<div class="sk-presets">' + PRESETS.map(p =>
          '<button class="sk-preset" data-hi="' + esc(p.hi) + '"><span class="sk-p-hi">' + p.hi + '</span><span class="sk-p-en">' + p.en + '</span></button>').join('') + '</div>' +
        '<div class="sk-label">Length of the vow</div>' +
        '<div class="sk-chips" id="skDurs">' + DURATIONS.map(d =>
          '<button class="sk-chip' + (d === 40 ? ' on' : '') + '" data-d="' + d + '">' + d + ' days</button>').join('') + '</div>' +
        '<div class="sk-label">Begin on</div>' +
        '<div class="sk-chips sk-dates" id="skDates">' + opts.map((o, i) =>
          '<button class="sk-chip sk-date' + (i === 0 ? ' on' : '') + '" data-iso="' + o.iso + '"><span>' + o.label + '</span>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</button>').join('') + '</div>' +
        '<button class="sk-begin" id="skBegin">Take the vow · सङ्कल्प लें</button>' +
        '<p class="sk-note">Kept privately on this device. Start dates follow the tithi where it matters.</p>';

      body.querySelectorAll('.sk-preset').forEach(b => b.addEventListener('click', () => {
        body.querySelector('#skText').value = b.getAttribute('data-hi');
      }));
      body.querySelectorAll('#skDurs .sk-chip').forEach(b => b.addEventListener('click', () => {
        body.querySelectorAll('#skDurs .sk-chip').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      }));
      body.querySelectorAll('#skDates .sk-chip').forEach(b => b.addEventListener('click', () => {
        body.querySelectorAll('#skDates .sk-chip').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      }));
      body.querySelector('#skBegin').addEventListener('click', () => {
        const text = body.querySelector('#skText').value.trim();
        if (!text) { body.querySelector('#skText').focus(); return; }
        const dur = +body.querySelector('#skDurs .on').getAttribute('data-d');
        const startISO = body.querySelector('#skDates .on').getAttribute('data-iso');
        save({ text: text, startISO: startISO, duration: dur, days: {} });
        renderSheet(); renderHome();
      });
      return;
    }

    if (isComplete(s)) {
      body.innerHTML =
        '<div class="sk-hero"><span class="sk-om">🪔</span>' +
        '<h2><span class="sk-dev">सङ्कल्प सिद्ध</span></h2>' +
        '<p>' + s.duration + ' days, kept. "' + esc(s.text) + '"</p></div>' +
        '<button class="sk-begin" id="skShare">Share the card</button>' +
        '<button class="sk-ghost" id="skNew">Begin a new sankalp</button>';
      body.querySelector('#skShare').addEventListener('click', () => shareCard(s, true));
      body.querySelector('#skNew').addEventListener('click', () => {
        if (confirm('Begin anew? The completed sankalp is archived.')) {
          save(null); renderSheet(); renderHome();
        }
      });
      return;
    }

    if (isScheduled(s)) {
      body.innerHTML =
        '<div class="sk-hero"><span class="sk-om">ॐ</span>' +
        '<h2>The vow is taken</h2>' +
        '<p class="sk-sankalp-text' + (hasDev(s.text) ? ' sk-dev-text' : '') + '">"' + esc(s.text) + '"</p>' +
        '<p>It begins on <b>' + fmtDate(s.startISO) + '</b><br><span class="sk-dim">' + tithiLabel(s.startISO) + '</span></p></div>' +
        '<button class="sk-ghost" id="skEnd">Let go of this sankalp</button>';
      body.querySelector('#skEnd').addEventListener('click', () => {
        if (confirm('Let go of this sankalp?')) { save(null); renderSheet(); renderHome(); }
      });
      return;
    }

    /* active */
    const e = todayEntry(s);
    const done = doneCount(s), streak = streakOf(s);
    const left = s.duration - done;
    const taps = e.taps || 0;
    const pct = Math.min(100, Math.round(taps / 108 * 100));
    const journals = Object.keys(s.days).filter(k => s.days[k].journal).sort().reverse().slice(0, 7);

    body.innerHTML =
      '<div class="sk-hero sk-hero-tight">' +
      '<span class="sk-daymono">DAY ' + (done + (e.done ? 0 : 1)) + ' OF ' + s.duration + (streak ? ' · ' + streak + '-DAY STREAK' : '') + '</span>' +
      '<p class="sk-sankalp-text' + (hasDev(s.text) ? ' sk-dev-text' : '') + '">' + esc(s.text) + '</p>' +
      '<div class="sk-journey"><div class="sk-journey-fill" style="width:' + Math.round(done / s.duration * 100) + '%"></div></div>' +
      '<span class="sk-dim">' + done + ' days kept · ' + left + ' to go · ' + tithiLabel(todayISO()) + '</span>' +
      '</div>' +
      (e.done
        ? '<div class="sk-sealed"><span class="sk-sealed-ic">🪔</span> Today\'s sankalp is sealed — 108 done.</div>'
        : '<button class="sk-tap" id="skTap" aria-label="Tap to affirm">' +
          '<svg viewBox="0 0 200 200" class="sk-ring"><circle cx="100" cy="100" r="90" fill="none" stroke="rgba(226,169,78,0.15)" stroke-width="6"/>' +
          '<circle id="skRingFill" cx="100" cy="100" r="90" fill="none" stroke="#e2a94e" stroke-width="6" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="565.5" stroke-dashoffset="' + (565.5 * (1 - pct / 100)) + '"/></svg>' +
          '<span class="sk-tap-count" id="skCount">' + taps + '</span>' +
          '<span class="sk-tap-of">of 108</span>' +
          '<span class="sk-tap-hint">tap to affirm</span></button>') +
      '<div class="sk-journal">' +
      '<label class="sk-label" for="skJ">Evening line — how did today honor the vow?</label>' +
      '<div class="sk-j-row"><input id="skJ" type="text" maxlength="120" placeholder="One line, before you sleep…" value="' + esc(e.journal || '') + '">' +
      '<button id="skJSave" class="sk-j-save">Save</button></div>' +
      (journals.length ? '<div class="sk-j-past">' + journals.map(k =>
        '<div class="sk-j-line"><span>' + fmtDate(k) + '</span>' + esc(s.days[k].journal) + '</div>').join('') + '</div>' : '') +
      '</div>' +
      '<button class="sk-begin" id="skShare">Share today\'s card</button>' +
      '<button class="sk-ghost" id="skEnd">Let go of this sankalp</button>';

    const tapBtn = body.querySelector('#skTap');
    if (tapBtn) {
      tapBtn.addEventListener('click', () => {
        const cur = todayEntry(s);
        cur.taps = (cur.taps || 0) + 1;
        if (cur.taps >= 108) { cur.taps = 108; cur.done = true; }
        s.days[todayISO()] = cur;
        save(s);
        if (cur.done) { renderSheet(); renderHome(); return; }
        body.querySelector('#skCount').textContent = cur.taps;
        const p = cur.taps / 108;
        body.querySelector('#skRingFill').setAttribute('stroke-dashoffset', String(565.5 * (1 - p)));
        if (navigator.vibrate && cur.taps % 27 === 0) navigator.vibrate(12);
      });
    }
    body.querySelector('#skJSave').addEventListener('click', () => {
      const cur = todayEntry(s);
      cur.journal = body.querySelector('#skJ').value.trim();
      s.days[todayISO()] = cur;
      save(s);
      renderSheet(); renderHome();
    });
    body.querySelector('#skShare').addEventListener('click', () => shareCard(s, false));
    body.querySelector('#skEnd').addEventListener('click', () => {
      if (confirm('Let go of this sankalp? The streak will be lost.')) { save(null); renderSheet(); renderHome(); }
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
    if (!s) {
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title"><span class="sk-dev">सङ्कल्प</span> · Sankalp</span>' +
        '<span class="sk-home-sub">One intention, 108 affirmations a day, a streak that builds.</span></span>' +
        '<span class="sk-home-cta">Begin →</span>';
    } else if (isComplete(s)) {
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title">🪔 <span class="sk-dev">सङ्कल्प सिद्ध</span></span>' +
        '<span class="sk-home-sub">' + s.duration + ' days kept. Share the card, or begin anew.</span></span>' +
        '<span class="sk-home-cta">Open →</span>';
    } else if (isScheduled(s)) {
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title"><span class="sk-dev">सङ्कल्प</span> · begins ' + fmtDate(s.startISO) + '</span>' +
        '<span class="sk-home-sub">"' + esc(s.text) + '"</span></span>' +
        '<span class="sk-home-cta">Open →</span>';
    } else {
      const e = todayEntry(s);
      const done = doneCount(s), streak = streakOf(s);
      card.innerHTML =
        '<span class="sk-home-main"><span class="sk-home-title"><span class="sk-dev">सङ्कल्प</span> · Day ' + (done + (e.done ? 0 : 1)) + ' of ' + s.duration + (streak ? ' · ' + streak + '🔥' : '') + '</span>' +
        '<span class="sk-home-sub">' + (e.done ? 'Today sealed — 108 done. ' : 'Today: ' + (e.taps || 0) + ' of 108 · ') + '"' + esc(s.text) + '"</span></span>' +
        '<span class="sk-home-cta">' + (e.done ? 'Journal →' : 'Affirm →') + '</span>';
    }
  }

  function openSheet() {
    sheetEl();
    renderSheet();
    window.dhOpenSheet('sankalpSheet');
  }

  function wireFab() {
    const b = document.getElementById('fabSankalp');
    if (b) b.addEventListener('click', () => {
      const m = document.getElementById('fabMenu');
      if (m) m.hidden = true;
      openSheet();
    });
  }

  window.dhSankalp = { open: openSheet, renderHome: renderHome, card: function () { const s = load(); return s ? drawShareCard(s, doneCount(s), streakOf(s), isComplete(s)) : null; } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { renderHome(); wireFab(); });
  } else { renderHome(); wireFab(); }
})();
