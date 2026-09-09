/* ---------- Sandhya Aarti: the evening temple gate ----------
   At sandhya (dusk) a temple gate opens on the home page. The devotee makes a
   small offering (min Rs 21), the doors part, and a 15-20 minute aarti sequence
   plays - three aartis back to back with bell strikes and the temple feel.

   PAYMENT SEAM: the money rail is deliberately isolated in window.dhSandhyaPay.
   It is in TEST MODE now (no real charge). When the merchant decision lands
   (Razorpay or UPI-first), replace pay() with the real checkout call and flip
   mode to 'live' - keep the {amountINR} -> Promise<{ok, id}> contract and the
   rest of the flow works unchanged. */
(function () {
  'use strict';

  var CFG = {
    openMin: 17 * 60 + 30,   // gate opens 5:30 PM local
    closeMin: 21 * 60 + 30,  // gate closes 9:30 PM local
    minAmount: 21,
    stanzaMs: 33000,         // sung pace: ~33s per stanza
    titleMs: 8000,           // aarti title card
    set: ['jai-ganesh-deva', 'om-jai-jagdish-hare', 'hanuman-aarti']
  };
  var LS_KEY = 'divinehub_sandhya_v1';

  window.dhSandhyaPay = {
    mode: 'test',
    pay: function (opts) {
      // TEST rail: simulates a successful offering. No real charge.
      return new Promise(function (res) {
        setTimeout(function () { res({ ok: true, id: 'test_' + Date.now() }); }, 1400);
      });
    }
  };

  function store() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || { offerings: [] }; }
    catch (e) { return { offerings: [] }; }
  }
  function save(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }

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
  function ensureAudio() {
    if (!ambOn()) return;
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      gain = actx.createGain();
      gain.gain.value = 0.5;
      gain.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(function () {});
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

  /* ---------- gate card ---------- */
  var cardTimer = null;
  function renderGate() {
    var card = document.getElementById('syCard');
    if (!card) return;
    var open = gateOpen();
    var s = store();
    var last = s.offerings.length ? s.offerings[s.offerings.length - 1] : null;
    if (open) {
      card.className = 'sy-card sy-open';
      card.innerHTML =
        '<div class="sy-glow" aria-hidden="true"></div>' +
        '<span class="sy-kicker">संध्या · SANDHYA</span>' +
        '<h3 class="sy-title">The temple gate is open</h3>' +
        '<p class="sy-sub">Three aartis, about ' + totalMinutes() + ' minutes, with bells. A small offering (min ₹' + CFG.minAmount + ') lights the lamp.</p>' +
        '<button class="sy-enter" id="syEnter">Enter the aarti</button>' +
        (last ? '<span class="sy-last">Last offering: ₹' + last.amount + '</span>' : '');
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
    ensureAudio();
    state = { preview: preview, amount: CFG.minAmount, step: 'offer' };
    renderOffer();
    view.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeFlow() {
    stopTimer();
    view.hidden = true;
    document.body.style.overflow = '';
    renderGate();
  }

  function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }

  /* ----- step 1: offering ----- */
  function renderOffer() {
    state.step = 'offer';
    var chips = [21, 51, 101, 201];
    view.innerHTML =
      '<div class="syv-inner">' +
      '<button class="syv-close" id="syvX" aria-label="Close">✕</button>' +
      '<span class="sy-kicker">संध्या आरती</span>' +
      '<h3 class="syv-h">Make your offering</h3>' +
      '<p class="syv-p">A diya is lit in your name tonight. Minimum ₹' + CFG.minAmount + ', give what your heart says.</p>' +
      '<div class="sy-chips">' + chips.map(function (c) {
        return '<button class="sy-chip" data-a="' + c + '">₹' + c + '</button>';
      }).join('') + '</div>' +
      '<div class="sy-custom"><span>₹</span><input id="syAmt" type="number" min="' + CFG.minAmount + '" step="1" value="' + CFG.minAmount + '" inputmode="numeric"></div>' +
      '<input class="sy-field" id="syName" type="text" placeholder="Your name" autocomplete="name">' +
      '<input class="sy-field" id="syEmail" type="email" placeholder="Email for the confirmation" autocomplete="email" inputmode="email">' +
      '<p class="sy-err" id="syErr" hidden>At least ₹' + CFG.minAmount + ', please.</p>' +
      '<p class="sy-err" id="syErrWho" hidden>Name and a valid email, please - the confirmation goes there.</p>' +
      '<button class="sy-offer" id="syGo">Offer ₹' + CFG.minAmount + '</button>' +
      (window.dhSandhyaPay.mode === 'test' ? '<p class="sy-test">Test mode - no real charge yet. The payment rail plugs in here.</p>' : '') +
      '</div>';
    var amt = view.querySelector('#syAmt');
    var go = view.querySelector('#syGo');
    function sync() {
      var v = parseInt(amt.value, 10);
      state.amount = isNaN(v) ? 0 : v;
      go.textContent = 'Offer ₹' + (isNaN(v) ? '…' : v);
    }
    view.querySelectorAll('.sy-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        amt.value = b.dataset.a;
        view.querySelectorAll('.sy-chip').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        sync();
      });
    });
    amt.addEventListener('input', sync);
    view.querySelector('#syvX').addEventListener('click', closeFlow);
    go.addEventListener('click', function () {
      sync();
      var name = view.querySelector('#syName').value.trim();
      var email = view.querySelector('#syEmail').value.trim();
      var okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
      view.querySelector('#syErr').hidden = state.amount >= CFG.minAmount;
      view.querySelector('#syErrWho').hidden = !!(name && okMail);
      if (state.amount < CFG.minAmount || !name || !okMail) return;
      state.name = name;
      state.email = email;
      renderMockPay();
    });
  }

  /* ----- step 1b: mock payment screen (real Razorpay/UPI rail drops in here) ----- */
  function renderMockPay() {
    state.step = 'mockpay';
    view.innerHTML =
      '<div class="syv-inner">' +
      '<span class="sy-kicker">MOCK CHECKOUT</span>' +
      '<h3 class="syv-h">₹' + state.amount + '</h3>' +
      '<p class="syv-p">' + state.name + ' · ' + state.email + '</p>' +
      '<div class="sy-paybox">' +
      '<div class="sy-payrow"><span>Sandhya Aarti offering</span><span>₹' + state.amount + '</span></div>' +
      '<div class="sy-payrow sy-payrow-dim"><span>Divine Hub (test merchant)</span><span>tonight\u2019s diya</span></div>' +
      '</div>' +
      '<button class="sy-offer" id="syPay">Pay ₹' + state.amount + ' (mock)</button>' +
      '<p class="sy-test">Mock screen - no real charge. Razorpay or UPI replaces this exact step.</p>' +
      '<button class="sy-back" id="syBack">‹ back</button>' +
      '</div>';
    view.querySelector('#syBack').addEventListener('click', renderOffer);
    view.querySelector('#syPay').addEventListener('click', function () {
      var b = view.querySelector('#syPay');
      b.disabled = true;
      b.textContent = 'Processing…';
      window.dhSandhyaPay.pay({ amountINR: state.amount, name: state.name, email: state.email }).then(function (r) {
        if (!r || !r.ok) { b.disabled = false; b.textContent = 'Try again'; return; }
        state.payId = r.id;
        var s = store();
        s.offerings.push({ amount: state.amount, id: r.id, name: state.name, email: state.email, ts: Date.now(), mode: window.dhSandhyaPay.mode });
        save(s);
        sendConfirmation(); // fire and forget - never blocks the aarti
        renderPaid();
      });
    });
  }

  /* ----- email seam: confirmation notice. Real rail (or worker + provider) owns this later. ----- */
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

  /* ----- paid: in-app confirmation, then the doors ----- */
  function renderPaid() {
    state.step = 'paid';
    view.innerHTML =
      '<div class="syv-inner sy-paid">' +
      '<div class="sy-tick" aria-hidden="true">✓</div>' +
      '<h3 class="syv-h">Offering received, ' + state.name.split(' ')[0] + '</h3>' +
      '<p class="syv-p">₹' + state.amount + ' · confirmation ' + state.payId + '<br>' +
      (window.dhSandhyaPay.mode === 'test'
        ? 'A confirmation notice for <b>' + state.email + '</b> is recorded (mock email in test mode).'
        : 'A confirmation email is on its way to <b>' + state.email + '</b>.') + '</p>' +
      '<p class="syv-p syv-enter-note">The doors are opening…</p>' +
      '</div>';
    timer = setTimeout(renderDoors, 2200);
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
      peal();
    } else if (state.si > 0) {
      soft(); // a gentle strike with each verse, like the temple bell keeper
    }
    showCurrent();
  }

  function showCurrent() {
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
      if (!state.paused) scheduleNext(CFG.stanzaMs);
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
      if (state.paused) stopTimer();
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
    state.step = 'end';
    stopTimer();
    if (!early) { soft(); setTimeout(soft, 1200); setTimeout(soft, 2400); }
    view.innerHTML =
      '<div class="syv-inner sy-end">' +
      '<div class="sy-diya" aria-hidden="true"><div class="sy-flame"></div></div>' +
      '<p class="sy-shanti">॥ शान्तिः शान्तिः शान्तिः ॥</p>' +
      '<h3 class="syv-h">' + (early ? 'Aarti paused midway' : 'Your sandhya aarti is complete') + '</h3>' +
      '<p class="syv-p">Offering of ₹' + state.amount + ' received with gratitude' + (window.dhSandhyaPay.mode === 'test' ? ' (test mode)' : '') + '. Come back at dusk tomorrow.</p>' +
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
