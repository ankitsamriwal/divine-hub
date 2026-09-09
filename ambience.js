/* ---------- Temple ambience: bells, falling petals, incense vapor ----------
   Bells: real temple-bell recording "2HinduTemplesBells2.wav" by LoopUdu,
   freesound.org/people/LoopUdu/sounds/271627, license CC0 (public domain).
   Trimmed to ~9s, softened, mono 56kbps. No synthesis anywhere.
   Autoplay rules: audio starts only after the first user gesture; visuals
   start on load. Everything honors the ambience toggle + reduced motion. */
(function () {
  'use strict';
  var KEY = 'divinehub_ambience_v1';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pref() {
    try { var v = localStorage.getItem(KEY); return v === null ? 'on' : v; } catch (e) { return 'on'; }
  }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var on = pref() === 'on';

  /* =============== BELLS =============== */
  var actx = null, bellBuf = null, bellGain = null, bellTimer = null, bellLoading = false;
  // single-strike windows inside bells.mp3 [offset s, duration s] for sparse repeats
  var STRIKES = [[0.50, 2.3], [3.95, 2.5], [5.85, 2.6], [7.30, 1.6]];

  function loadBells() {
    if (bellLoading || bellBuf) return;
    bellLoading = true;
    fetch('assets/bells.mp3')
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) {
        if (!actx) { bellLoading = false; return; }
        return actx.decodeAudioData(ab).then(function (buf) { bellBuf = buf; });
      })
      .catch(function () {})
      .then(function () { bellLoading = false; });
  }

  function ensureCtx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      bellGain = actx.createGain();
      bellGain.gain.value = 0.55; // gentle, humble - never loud
      bellGain.connect(actx.destination);
      loadBells();
    }
    if (actx.state === 'suspended') actx.resume().catch(function () {});
    return actx;
  }

  function playBells(offset, dur) {
    if (!on || !actx || !bellBuf || document.hidden) return;
    try {
      var src = actx.createBufferSource();
      src.buffer = bellBuf;
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.linearRampToValueAtTime(1, actx.currentTime + 0.15);
      g.gain.setValueAtTime(1, actx.currentTime + Math.max(0.2, dur - 0.9));
      g.gain.linearRampToValueAtTime(0.0001, actx.currentTime + dur + 0.4);
      src.connect(g); g.connect(bellGain);
      src.start(0, offset, dur + 0.5);
      src.stop(actx.currentTime + dur + 0.5);
    } catch (e) {}
  }

  function scheduleSparse() {
    clearTimeout(bellTimer);
    if (!on) return;
    var wait = 55000 + Math.random() * 65000; // one soft strike every ~1-2 min
    bellTimer = setTimeout(function () {
      if (on && !document.hidden && bellBuf) {
        var s = STRIKES[Math.floor(Math.random() * STRIKES.length)];
        playBells(s[0], s[1]);
      }
      scheduleSparse();
    }, wait);
  }

  function bellsOnFirstGesture() {
    if (!on) return;
    if (!ensureCtx()) return;
    // opening sequence: the full gentle peal, once
    if (bellBuf) playBells(0, 8.4);
    else setTimeout(function () { if (on && bellBuf) playBells(0, 8.4); }, 1200);
    scheduleSparse();
  }

  function onGesture() {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
    bellsOnFirstGesture();
  }

  function armGesture() {
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture);
  }

  document.addEventListener('visibilitychange', function () {
    if (!actx) return;
    if (document.hidden) { actx.suspend().catch(function () {}); }
    else if (on) { actx.resume().catch(function () {}); }
  });

  /* =============== PETALS =============== */
  var petalTimers = [];
  var PALETTES = [
    ['#f4b6c2', '#d2697f'], // rose pink
    ['#efa3b5', '#c4556e'], // deep rose
    ['#f6c56e', '#dc8c39'], // marigold
    ['#f0d3a0', '#cf9a4e']  // pale marigold
  ];

  function spawnPetal() {
    if (!on || reduced || document.hidden) return;
    var w = 14 + Math.random() * 12;                     // 14-26px, sparse + small
    var x = 6 + Math.random() * 88;                      // vw start
    var landX = Math.max(3, Math.min(94, x + (Math.random() * 26 - 13)));
    var landY = innerHeight - 6 - Math.random() * 26;    // rest along bottom edge
    var pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];

    var el = document.createElement('div');
    el.className = 'amb-petal';
    el.style.width = w + 'px';
    el.style.height = (w * 1.3) + 'px';
    el.style.setProperty('--c1', pal[0]);
    el.style.setProperty('--c2', pal[1]);
    document.body.appendChild(el);

    var sway = 14 + Math.random() * 26;
    var spin = 140 + Math.random() * 260;
    var dir = Math.random() < 0.5 ? -1 : 1;
    var startY = -40;
    var fall = 7000 + Math.random() * 4500;              // slow, gentle
    var steps = 6;
    var kf = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var y = startY + (landY - startY) * t;
      var sx = x + (landX - x) * t + Math.sin(t * Math.PI * (2 + Math.random() * 0.4)) * (sway * Math.sin(Math.PI * t)) / innerWidth * 100;
      kf.push({
        transform: 'translate(' + sx + 'vw,' + y + 'px) rotate(' + (dir * spin * t) + 'deg)',
        opacity: t < 0.08 ? t / 0.08 : 1
      });
    }
    var anim = el.animate(kf, { duration: fall, easing: 'cubic-bezier(.45,.05,.65,1)', fill: 'forwards' });
    anim.onfinish = function () {
      // settle: a soft rock as it lands, then rest visibly, then fade away
      var rest = 4500 + Math.random() * 5000;
      var settle = el.animate([
        { transform: kf[steps].transform },
        { transform: 'translate(' + landX + 'vw,' + landY + 'px) rotate(' + (dir * spin + dir * 9) + 'deg)' },
        { transform: 'translate(' + landX + 'vw,' + landY + 'px) rotate(' + (dir * spin) + 'deg)' }
      ], { duration: 700, easing: 'ease-out', fill: 'forwards' });
      settle.onfinish = function () {
        var t1 = setTimeout(function () {
          var fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 3800, easing: 'ease-in', fill: 'forwards' });
          fade.onfinish = function () { el.remove(); };
        }, rest);
        petalTimers.push(t1);
      };
    };
  }

  function petalsStart() {
    petalsStop();
    if (!on || reduced) return;
    // opening flurry: a few petals drifting down over the first ~25s
    var n = 4 + Math.floor(Math.random() * 2);
    for (var i = 0; i < n; i++) {
      petalTimers.push(setTimeout(spawnPetal, 900 + i * (3500 + Math.random() * 2600)));
    }
    // then an occasional single petal, sparse
    (function recur() {
      petalTimers.push(setTimeout(function () {
        spawnPetal();
        recur();
      }, 26000 + Math.random() * 30000));
    })();
  }
  function petalsStop() {
    petalTimers.forEach(clearTimeout);
    petalTimers = [];
    document.querySelectorAll('.amb-petal').forEach(function (el) { el.remove(); });
  }

  /* =============== INCENSE VAPOR =============== */
  var cv = null, cx = null, parts = [], raf = null, lastSpawn = 0;

  function smokeSetup() {
    cv = document.createElement('canvas');
    cv.className = 'amb-smoke';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    cx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!cv) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
  }
  function spawnPuff(now) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var baseX = innerWidth * (0.5 + (Math.random() * 0.14 - 0.07)); // near center-bottom, like incense by the deity
    parts.push({
      x: baseX * dpr,
      y: (innerHeight + 8) * dpr,
      r: (3 + Math.random() * 4) * dpr,
      vy: (9 + Math.random() * 8) * dpr / 60,
      drift: Math.random() * Math.PI * 2,
      driftSpd: 0.35 + Math.random() * 0.5,
      born: now,
      life: 8000 + Math.random() * 5000
    });
    if (parts.length > 26) parts.shift();
  }
  function frame(now) {
    raf = null;
    if (!on || reduced || document.hidden) { stopSmoke(true); return; }
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (now - lastSpawn > 700 + Math.random() * 500) { spawnPuff(now); lastSpawn = now; }
    cx.clearRect(0, 0, cv.width, cv.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      var age = now - p.born;
      if (age > p.life || p.y < -30 * dpr) { parts.splice(i, 1); continue; }
      var t = age / p.life;
      p.y -= p.vy * 16;
      p.x += Math.sin(p.drift + age / 1000 * p.driftSpd) * 0.55 * dpr;
      p.r += 0.028 * dpr * 16;
      // fade in fast, linger, dissipate slow
      var a = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
      a *= 0.10; // whisper-subtle
      var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(232,214,186,' + a.toFixed(3) + ')');
      g.addColorStop(0.55, 'rgba(214,192,164,' + (a * 0.55).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(214,192,164,0)');
      cx.fillStyle = g;
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  function startSmoke() {
    if (!on || reduced) return;
    if (!cv) smokeSetup();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stopSmoke(clear) {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (clear && cx) { parts = []; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopSmoke(true); }
    else { startSmoke(); }
  });

  /* =============== TOGGLE =============== */
  function applyState() {
    if (on) {
      armGesture();
      petalsStart();
      startSmoke();
      if (actx) { actx.resume().catch(function () {}); scheduleSparse(); }
    } else {
      clearTimeout(bellTimer);
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      if (actx) actx.suspend().catch(function () {});
      petalsStop();
      stopSmoke(true);
    }
    var b = document.getElementById('ambToggle');
    if (b) {
      b.textContent = on ? '🪔 Temple ambience: on' : '🪔 Temple ambience: off';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function mountToggle() {
    var footer = document.querySelector('.site-footer');
    if (!footer || document.getElementById('ambToggle')) return;
    var b = document.createElement('button');
    b.id = 'ambToggle';
    b.className = 'amb-toggle';
    b.type = 'button';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      on = !on;
      setPref(on ? 'on' : 'off');
      applyState();
    });
    footer.insertBefore(b, footer.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mountToggle(); applyState(); });
  } else {
    mountToggle(); applyState();
  }
})();
