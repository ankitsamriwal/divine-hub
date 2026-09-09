/* ---------- Sandhya Aarti: the evening temple gate ----------
   At sandhya (dusk) a temple gate opens on the home page. The devotee steps in,
   the doors part, and a ~17 minute aarti sequence plays - three aartis back to
   back with bell strikes and the temple feel. Free, no donation step.

   PAYMENT + EMAIL SEAMS (DORMANT): donations were removed by user decision
   (Sep 2026, unclear tax treatment of donations to an individual in India).
   window.dhSandhyaPay and sendConfirmation() stay in the codebase, never
   called. Revive only if the user explicitly re-asks for donations. */
(function () {
  'use strict';

  var CFG = {
    openMin: 17 * 60 + 30,   // gate opens 5:30 PM local
    closeMin: 21 * 60 + 30,  // gate closes 9:30 PM local
    minAmount: 21,
    stanzaMs: 33000,         // sung pace: ~33s per stanza
    titleMs: 8000,           // aarti title card
    set: ['jai-ganesh-deva', 'om-jai-jagdish-hare', 'hanuman-aarti'],
    /* Vocal recordings per aarti id. Modular: to add one, drop the mp3 in
       assets/ and add a line here - no other changes. Sources in assets/LICENSES.md. */
    audio: {
      'hanuman-aarti': 'assets/hanuman-aarti.mp3'
    }
  };
  /* DORMANT by user decision (Sep 2026): no donations on the site - Indian tax
     treatment of donations to an individual is unclear. This payment seam and the
     email-confirmation seam below stay in the codebase but are NEVER called.
     Revive only if the user explicitly re-asks for donations. */
  window.dhSandhyaPay = {
    mode: 'test',
    pay: function (opts) {
      // TEST rail: simulates a successful offering. No real charge.
      return new Promise(function (res) {
        setTimeout(function () { res({ ok: true, id: 'test_' + Date.now() }); }, 1400);
      });
    }
  };

  function nowMin() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  function gateOpen() {
    try {
      var f = localStorage.getItem('divinehub_sandhya_force');
      if (f === 'open') return true;
      if (f === 'closed') return false;
    } catch (e) {}
    var m = nowMin();
    return m >= CFG.openMin && m < CFG.closeMin;
  }
  function fmtHour(min) {
    var h = Math.floor(min / 60), m = min % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (!h) h = 12;
    return h + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap;
  }

  function sequence() {
    var out = [];
    CFG.set.forEach(function (id) {
      var p = (typeof PRAYERS !== 'undefined' ? PRAYERS : []).find(function (x) { return x.id === id; });
      if (p) out.push(p);
    });
    return out;
  }
  function totalMinutes() {
    var stanzas = sequence().reduce(function (n, p) { return n + p.stanzas.length; }, 0);
    return Math.round((stanzas * CFG.stanzaMs + sequence().length * CFG.titleMs + 90000) / 60000);
  }

  /* ---------- bells (reuses the ambience recording, honors its toggle) ---------- */
  var actx = null, buf = null, gain = null, loading = false;
  function ambOn() {
    try { return localStorage.getItem('divinehub_ambience_v1') !== 'off'; } catch (e) { return true; }
  }
  function ensureActx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      actx = new AC();
      gain = actx.createGain();
      gain.gain.value = 0.5;
      gain.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(function () {});
    return true;
  }
  function ensureAudio() {
    if (!ambOn()) return;
    if (!ensureActx()) return;
    if (!buf && !loading) {
      loading = true;
      fetch('assets/bells.mp3')
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (ab) { return actx.decodeAudioData(ab); })
        .then(function (b) { buf = b; })
        .catch(function () {})
        .then(function () { loading = false; });
    }
  }
  function strike(offset, dur, vol) {
    if (!actx || !buf) return;
    try {
      var s = actx.createBufferSource();
      s.buffer = buf;
      var g = actx.createGain();
      var t = actx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol || 0.8, t + 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
      s.connect(g); g.connect(gain);
      s.start(0, offset, dur + 0.6);
    } catch (e) {}
  }
  var PEAL = [0, 8.4], STRIKE = [3.95, 2.5];
  function peal() { strike(PEAL[0], PEAL[1], 1); }
  function soft() { strike(STRIKE[0], STRIKE[1], 0.65); }

  /* ---------- vocal recordings: main audio for aartis that have one ----------
     Played through the same WebAudio context as the bells - the Enter tap
     unlocks it, so the recording may start minutes later without an autoplay
     block. Pause/resume emulate with offset tracking. */
  var vocalBufs = {};
  var vocalSrc = null, vocalUrl = null, vocalOffset = 0, vocalStartedAt = 0;
  function stopVocal() {
    if (vocalSrc) { try { vocalSrc.stop(); } catch (e) {} vocalSrc = null; }
    vocalUrl = null; vocalOffset = 0;
  }
  function pauseVocal() {
    if (!vocalSrc || !actx) return;
    vocalOffset += actx.currentTime - vocalStartedAt;
    try { vocalSrc.stop(); } catch (e) {}
    vocalSrc = null;
  }
  function resumeVocal() {
    if (!vocalUrl || vocalSrc || !actx) return;
    var b = vocalBufs[vocalUrl];
    if (!b || vocalOffset >= b.duration) return;
    var src = actx.createBufferSource();
    src.buffer = b;
    var g = actx.createGain();
    g.gain.value = 0.95;
    src.connect(g); g.connect(actx.destination);
    src.start(0, vocalOffset);
    vocalSrc = src;
    vocalStartedAt = actx.currentTime;
  }
  function syncVocal() {
    var p = state.seq[state.ai];
    var url = p ? (CFG.audio[p.id] || null) : null;
    if (url === vocalUrl) return;
    stopVocal();
    state.stanzaMs = null;
    if (!url) return;
    vocalUrl = url; vocalOffset = 0;
    if (!vocalBufs[url]) {
      if (!ensureActx()) return;
      fetch(url)
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (ab) { return actx.decodeAudioData(ab); })
        .then(function (b) {
          vocalBufs[url] = b;
          var cur = state.seq[state.ai];
          if (cur && CFG.audio[cur.id] === url) {
            /* pace the lyric scroll to the recording: full length minus the
               title card and a short tail, spread over the stanzas */
            state.stanzaMs = Math.max(15000, Math.round((b.duration * 1000 - CFG.titleMs - 4000) / cur.stanzas.length));
          }
          if (vocalUrl === url && !state.paused) resumeVocal();
        })
        .catch(function () {});
    } else if (!state.paused) {
      resumeVocal();
    }
  }

  /* ---------- gate card ---------- */
  var cardTimer = null;
  function renderGate() {
    var card = document.getElementById('syCard');
    if (!card) return;
    var open = gateOpen();
    if (open) {
      card.className = 'sy-card sy-open';
      card.innerHTML =
        '<div class="sy-glow" aria-hidden="true"></div>' +
        '<span class="sy-kicker">संध्या · SANDHYA</span>' +
        '<h3 class="sy-title">The temple gate is open</h3>' +
        '<p class="sy-sub">Three aartis, about ' + totalMinutes() + ' minutes, with bells. Step in and sit a while.</p>' +
        '<button class="sy-enter" id="syEnter">Enter the aarti</button>';
      card.querySelector('#syEnter').addEventListener('click', function () { openFlow(false); });
    } else {
      card.className = 'sy-card sy-closed';
      card.innerHTML =
        '<span class="sy-kicker">संध्या · SANDHYA</span>' +
        '<h3 class="sy-title">Sandhya Aarti</h3>' +
        '<p class="sy-sub">The temple gate opens every evening at ' + fmtHour(CFG.openMin) + ' and closes at ' + fmtHour(CFG.closeMin) + '. Three aartis with bells, about ' + totalMinutes() + ' minutes.</p>' +
        '<button class="sy-preview" id="syPreview">Preview the experience</button>';
      card.querySelector('#syPreview').addEventListener('click', function () { openFlow(true); });
    }
  }

  /* ---------- flow overlay ---------- */
  var view = null, timer = null, state = null;

  function buildView() {
    view = document.createElement('div');
    view.id = 'sandhyaView';
    view.className = 'sandhya-view';
    view.hidden = true;
    document.body.appendChild(view);
  }

  function openFlow(preview) {
    ensureActx(); // unlock audio inside the tap, even with ambience off
    ensureAudio();
    state = { preview: preview, step: 'doors' };
    renderDoors();
    view.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeFlow() {
    stopTimer();
    stopVocal();
    view.hidden = true;
    document.body.style.overflow = '';
    renderGate();
  }

  function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }

  /* ----- DORMANT email seam: confirmation notice. Kept for the day a rail returns;
     nothing calls sendConfirmation() while donations are removed. ----- */
  function sendConfirmation() {
    var payload = {
      name: state.name, email: state.email, amount: state.amount,
      id: state.payId, mode: window.dhSandhyaPay.mode, ts: Date.now()
    };
    try {
      fetch('https://divine-guide.ankitsamriwal.workers.dev/sandhya-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  /* ----- step 2: doors ----- */
  function renderDoors() {
    state.step = 'doors';
    view.innerHTML =
      '<div class="sy-doors">' +
      '<div class="sy-door sy-door-l"><span class="sy-door-om">ॐ</span></div>' +
      '<div class="sy-door sy-door-r"><span class="sy-door-om">ॐ</span></div>' +
      '<div class="sy-doors-light"></div>' +
      '</div>';
    peal();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { view.querySelector('.sy-doors').classList.add('parting'); });
    });
    timer = setTimeout(function () { startSequence(); }, 2600);
  }

  /* ----- step 3: the aarti sequence ----- */
  function startSequence() {
    var seq = sequence();
    state.seq = seq;
    state.ai = 0;   // aarti index
    state.si = -1;  // -1 = title card
    state.paused = false;
    state.step = 'play';
    showCurrent();
  }

  function scheduleNext(ms) {
    stopTimer();
    timer = setTimeout(function () { advance(false); }, ms);
  }

  function advance(manual) {
    if (state.step !== 'play') return;
    if (state.paused && !manual) return;
    if (state.paused && manual) stopTimer();
    var p = state.seq[state.ai];
    state.si++;
    if (state.si >= p.stanzas.length) {
      state.ai++;
      state.si = -1;
      if (state.ai >= state.seq.length) { renderEnd(); return; }
      if (!CFG.audio[state.seq[state.ai].id]) peal(); // recorded aartis carry their own opening
    } else if (state.si > 0) {
      strike(STRIKE[0], STRIKE[1], vocalUrl ? 0.22 : 0.65); // bells stay soft under the singing
    }
    showCurrent();
  }

  function showCurrent() {
    view.classList.add('sy-playing');
    syncVocal();
    var p = state.seq[state.ai];
    var total = state.seq.length;
    var body;
    if (state.si === -1) {
      body =
        '<div class="sy-verse sy-titlecard">' +
        '<span class="sy-aarti-of">Aarti ' + (state.ai + 1) + ' of ' + total + '</span>' +
        '<h3 class="sy-aarti-dev">' + p.titleDev + '</h3>' +
        '<span class="sy-aarti-title">' + p.title + ' · ' + p.deityDev + '</span>' +
        '</div>';
      view.innerHTML = chrome(p) + body + controls();
      if (!state.paused) scheduleNext(CFG.titleMs);
    } else {
      var st = p.stanzas[state.si];
      body =
        '<div class="sy-verse" key="' + state.ai + '-' + state.si + '">' +
        '<div class="sy-dev">' + st.dev.join('<br>') + '</div>' +
        '<div class="sy-translit">' + st.translit.join('<br>') + '</div>' +
        '<div class="sy-meaning">' + st.meaning + '</div>' +
        '</div>';
      view.innerHTML = chrome(p) + body + controls();
      if (!state.paused) scheduleNext(state.stanzaMs || CFG.stanzaMs);
    }
    wireControls();
  }

  function chrome(p) {
    var stanzas = p.stanzas.length;
    var pct = state.si < 0 ? 0 : Math.round(((state.si + 1) / stanzas) * 100);
    return '<div class="sy-chrome">' +
      '<span class="sy-chrome-l">Aarti ' + (state.ai + 1) + ' of ' + state.seq.length + '</span>' +
      '<span class="sy-chrome-r">' + p.title + '</span>' +
      '</div>' +
      '<div class="sy-prog"><span style="width:' + pct + '%"></span></div>';
  }

  function controls() {
    return '<div class="sy-controls">' +
      '<button class="sy-ctl" id="syPrev" aria-label="Previous verse">‹</button>' +
      '<button class="sy-ctl sy-ctl-big" id="syPause" aria-label="Pause or resume">' + (state.paused ? '▶' : '⏸') + '</button>' +
      '<button class="sy-ctl" id="syNext" aria-label="Next verse">›</button>' +
      '<button class="sy-ctl sy-ctl-exit" id="syExit" aria-label="End aarti">✕</button>' +
      '</div>' +
      (state.paused ? '<p class="sy-paused">Paused - the lamp waits with you.</p>' : '');
  }

  function wireControls() {
    view.querySelector('#syPause').addEventListener('click', function () {
      state.paused = !state.paused;
      if (state.paused) { stopTimer(); pauseVocal(); }
      else resumeVocal();
      showCurrent();
    });
    view.querySelector('#syNext').addEventListener('click', function () { advance(true); });
    view.querySelector('#syPrev').addEventListener('click', function () {
      stopTimer();
      if (state.si === -1) {
        if (state.ai > 0) { state.ai--; state.si = state.seq[state.ai].stanzas.length - 1; }
      } else {
        state.si--;
      }
      showCurrent();
    });
    view.querySelector('#syExit').addEventListener('click', function () { renderEnd(true); });
  }

  /* ----- step 4: closing ----- */
  function renderEnd(early) {
    view.classList.remove('sy-playing');
    state.step = 'end';
    stopTimer();
    stopVocal();
    if (!early) { soft(); setTimeout(soft, 1200); setTimeout(soft, 2400); }
    view.innerHTML =
      '<div class="syv-inner sy-end">' +
      '<div class="sy-diya" aria-hidden="true"><div class="sy-flame"></div></div>' +
      '<p class="sy-shanti">॥ शान्तिः शान्तिः शान्तिः ॥</p>' +
      '<h3 class="syv-h">' + (early ? 'Aarti paused midway' : 'Your sandhya aarti is complete') + '</h3>' +
      '<p class="syv-p">Come back at dusk tomorrow - the gate opens again at ' + fmtHour(CFG.openMin) + '.</p>' +
      '<button class="sy-offer" id="syDone">🙏 Dhanyavaad</button>' +
      '</div>';
    view.querySelector('#syDone').addEventListener('click', closeFlow);
  }

  /* ---------- init ---------- */
  function init() {
    if (!document.getElementById('syCard')) return;
    buildView();
    renderGate();
    cardTimer = setInterval(renderGate, 60000); // gate opens/closes with the clock
    document.addEventListener('visibilitychange', function () { if (!document.hidden) renderGate(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
