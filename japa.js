/* Divine Hub — Japa counter: digital mala, tap + experimental listen mode, streaks */

(function () {
  'use strict';

  /* ---------- overlay open/close (japa lives in a sheet now) ---------- */
  window.dhDrawMala = function () { drawMala(); };

  /* ---------- state ---------- */
  const LS_KEY = 'divinehub_japa_v1';
  let state = load();
  let target = state.target || 108;
  let count = 0; // counts within the current round
  let listening = false;
  let recog = null;

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save() {
    state.target = target;
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  function dayRecord() {
    const d = todayStr();
    state.days = state.days || {};
    if (!state.days[d]) state.days[d] = { count: 0, rounds: 0 };
    return state.days[d];
  }

  function computeStreak() {
    // streak = consecutive days (ending today or yesterday) with at least one completed round
    const days = state.days || {};
    let streak = 0;
    let cursor = new Date();
    const has = ds => days[ds] && days[ds].rounds > 0;
    const iso = dt => dt.toISOString().slice(0, 10);
    if (!has(iso(cursor))) cursor.setDate(cursor.getDate() - 1); // today not done yet is fine
    while (has(iso(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }

  /* ---------- elements ---------- */
  const countEl = document.getElementById('japaCount');
  const targetEl = document.getElementById('japaTarget');
  const tapBtn = document.getElementById('malaTap');
  const svg = document.getElementById('malaSvg');
  const beadRing = document.getElementById('beadRing');
  const ring = document.getElementById('progressRing');
  const mantraSelect = document.getElementById('mantraSelect');
  const mantraCustom = document.getElementById('mantraCustom');
  const mantraDev = document.getElementById('mantraDev');
  const customTarget = document.getElementById('customTarget');
  const listenStatus = document.getElementById('listenStatus');
  const modeTap = document.getElementById('modeTap');
  const modeListen = document.getElementById('modeListen');
  const RING_LEN = 2 * Math.PI * 158;

  /* ---------- audio feedback (WebAudio, no assets) ---------- */
  let actx = null;
  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tick() {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.08, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.09);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.1);
  }
  function bell() {
    const a = audio(); if (!a) return;
    [523.25, 784.0, 1046.5].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = a.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + 2);
    });
  }
  function haptic(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  /* ---------- mala rendering ---------- */
  function drawMala() {
    beadRing.innerHTML = '';
    const n = target;
    const cx = 170, cy = 170, r = 128;
    const beadR = n > 100 ? 4.4 : n > 50 ? 6 : 8.5;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i / n) * 2 * Math.PI;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx + r * Math.cos(ang));
      c.setAttribute('cy', cy + r * Math.sin(ang));
      c.setAttribute('r', i === 0 ? beadR + 2.5 : beadR);
      c.setAttribute('class', 'bead' + (i === 0 ? ' meru' : ''));
      beadRing.appendChild(c);
    }
    paintBeads();
  }

  function paintBeads() {
    const beads = beadRing.children;
    for (let i = 0; i < beads.length; i++) {
      beads[i].classList.toggle('done', i < count);
      beads[i].classList.toggle('current', i === count && count < target);
    }
    const frac = target ? count / target : 0;
    ring.style.strokeDasharray = RING_LEN;
    ring.style.strokeDashoffset = RING_LEN * (1 - frac);
    countEl.textContent = count;
    targetEl.textContent = 'of ' + target;
    updateStats();
  }

  function updateStats() {
    const dr = dayRecord();
    document.getElementById('todayCount').textContent = dr.count;
    document.getElementById('roundsToday').textContent = dr.rounds;
    document.getElementById('streakDays').textContent = computeStreak();
  }

  /* ---------- counting ---------- */
  function addCount() {
    if (count >= target) return;
    count++;
    const dr = dayRecord();
    dr.count++;
    tick();
    haptic(12);
    tapBtn.classList.add('pulse');
    setTimeout(() => tapBtn.classList.remove('pulse'), 120);
    if (count >= target) completeRound(dr);
    save();
    paintBeads();
  }

  function completeRound(dr) {
    dr.rounds++;
    bell();
    haptic([40, 60, 40]);
    countEl.textContent = target;
    targetEl.textContent = 'round complete 🙏';
    setTimeout(() => {
      count = 0;
      targetEl.textContent = 'of ' + target;
      paintBeads();
    }, 2400);
  }

  tapBtn.addEventListener('click', addCount);
  svg.addEventListener('click', addCount);
  svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addCount(); } });

  document.getElementById('resetRound').addEventListener('click', () => {
    count = 0; paintBeads();
    targetEl.textContent = 'of ' + target;
  });

  /* ---------- presets ---------- */
  document.querySelectorAll('.preset').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.preset').forEach(x => x.classList.toggle('active', x === b));
      if (b.dataset.n === 'custom') {
        customTarget.hidden = false;
        target = parseInt(customTarget.value, 10) || 108;
        customTarget.focus();
      } else {
        customTarget.hidden = true;
        target = parseInt(b.dataset.n, 10);
      }
      count = 0; save(); drawMala();
    });
  });
  customTarget.addEventListener('change', () => {
    target = Math.max(1, Math.min(1000, parseInt(customTarget.value, 10) || 108));
    count = 0; save(); drawMala();
  });

  /* ---------- mantra ---------- */
  function currentPhrase() {
    if (mantraSelect.value === 'custom') return (mantraCustom.value || '').trim().toLowerCase();
    return mantraSelect.value;
  }
  mantraSelect.addEventListener('change', () => {
    const opt = mantraSelect.selectedOptions[0];
    mantraDev.textContent = opt.dataset.dev || '';
    mantraCustom.hidden = mantraSelect.value !== 'custom';
    if (listening) restartListen();
  });

  /* ---------- experimental listen mode ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  modeTap.addEventListener('click', () => {
    stopListen();
    modeTap.classList.add('active');
    modeListen.classList.remove('active');
    listenStatus.hidden = true;
  });

  modeListen.addEventListener('click', () => {
    if (!SR) {
      listenStatus.hidden = false;
      listenStatus.textContent = 'Speech recognition is not available in this browser. Try Chrome or Edge. Tap mode works everywhere.';
      return;
    }
    modeListen.classList.add('active');
    modeTap.classList.remove('active');
    startListen();
  });

  function startListen() {
    stopListen();
    recog = new SR();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'hi-IN';
    const phrase = currentPhrase();
    listenStatus.hidden = false;
    listenStatus.textContent = phrase
      ? 'Listening… each time it hears "' + phrase + '" it counts a bead. Keep the mic close and speak clearly.'
      : 'Listening… each spoken phrase counts one bead.';
    recog.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const said = e.results[i][0].transcript.toLowerCase().trim();
        if (!said) continue;
        const ph = currentPhrase();
        if (ph) {
          const parts = said.split(ph).length - 1;
          const hits = parts > 0 ? parts : 0;
          for (let k = 0; k < hits; k++) addCount();
          if (hits === 0) addCount(); // a spoken utterance still counts once
        } else {
          addCount();
        }
      }
    };
    recog.onerror = ev => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        listenStatus.textContent = 'Microphone permission was denied. Allow mic access and try again, or use tap mode.';
        stopListen();
        modeListen.classList.remove('active');
        modeTap.classList.add('active');
      }
    };
    recog.onend = () => { if (listening && recog) { try { recog.start(); } catch (e) {} } };
    try { recog.start(); listening = true; } catch (e) { listening = false; }
  }

  function stopListen() {
    listening = false;
    if (recog) { try { recog.onend = null; recog.stop(); } catch (e) {} recog = null; }
    listenStatus.hidden = true;
  }
  function restartListen() { if (listening) startListen(); }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stopListen(); });

  /* ---------- init ---------- */
  target = state.target || 108;
  drawMala();
  updateStats();
})();
