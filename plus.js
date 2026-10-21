/* Divine Hub — Sankalp+ entitlement (client).
   The browser holds only an entitlement TOKEN minted and signed by the worker
   (HMAC secret lives in the worker env; see worker/plus.js, docs/PAYMENTS.md).
   The client cannot mint or forge tokens. It re-checks the token with the worker
   at most once a day and drops it if the worker says it is invalid.

   Honest limits: features that run purely on-device (unlimited goals, timelines)
   are gated in the browser, so a determined user editing JS can still bypass
   them. Server-backed Plus features must call /plus/verify (as the worker does).

   Ways to get a token:
     1. Checkout: a payment link (from config.js) carries this device's random
        claim ID; the provider webhook marks it paid; /plus/claim returns a token.
     2. Manual: the owner mints a single-use redeem code on the worker
        (/plus/admin/issue) and the user enters it here (/plus/redeem).
   Legacy: devices unlocked with the retired client-side code keep Plus on this
   device ("grandfathered"); new old-style codes are no longer accepted. */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_plus_v1';
  const CFG = window.DH_CONFIG || {};
  const WORKER = CFG.WORKER_URL || 'https://divine-guide.ankitsamriwal.workers.dev';
  const OWNER_EMAIL = CFG.OWNER_EMAIL || 'ankitsamriwal@gmail.com';
  const VERIFY_EVERY_MS = 24 * 3600 * 1000;

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function requestId() {
    const s = load();
    if (s.requestId) return s.requestId;
    const rid = 'SP-' + Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]).join('');
    s.requestId = rid;
    save(s);
    return rid;
  }
  /* 128-bit random claim ID: the link between a payment and this device. Acts as
     a restore key, so it is shown to the user only on demand. */
  function claimId() {
    const s = load();
    if (s.claimId && /^[a-f0-9]{32}$/.test(s.claimId)) return s.claimId;
    s.claimId = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    save(s);
    return s.claimId;
  }

  function tokenPayload(tok) {
    try {
      const part = String(tok).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part + '==='.slice((part.length + 3) % 4)))));
    } catch (e) { return null; }
  }
  function tokenLive(s) { return !!(s.token && s.exp && s.exp * 1000 > Date.now()); }
  function isLegacy(s) { return !!(s.active && !s.token); }
  function isActive() { const s = load(); return tokenLive(s) || isLegacy(s); }
  function token() { const s = load(); return tokenLive(s) ? s.token : null; }

  function storeToken(tok) {
    const p = tokenPayload(tok);
    if (!p || !p.exp) return false;
    const s = load();
    s.token = tok; s.plan = p.plan; s.exp = p.exp; s.verifiedAt = Date.now();
    if (!s.unlockedAt) s.unlockedAt = new Date().toISOString();
    delete s.pendingCheckout;
    save(s);
    changed();
    return true;
  }
  function changed() {
    if (window.dhSankalp && window.dhSankalp.renderHome) window.dhSankalp.renderHome();
    if (window.dhJourneys && window.dhJourneys.refresh) window.dhJourneys.refresh();
    try { document.dispatchEvent(new CustomEvent('dh-plus-change')); } catch (e) {}
  }

  function post(path, body) {
    return fetch(WORKER + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.json().then(j => ({ status: r.status, j: j }), () => ({ status: r.status, j: {} })));
  }

  /* daily server re-check; network failure keeps the token (offline-friendly) */
  function verifySoon() {
    const s = load();
    if (!s.token || (s.verifiedAt && Date.now() - s.verifiedAt < VERIFY_EVERY_MS)) return;
    post('/plus/verify', { token: s.token }).then(r => {
      const cur = load();
      if (r.j && r.j.ok === false) { delete cur.token; delete cur.plan; delete cur.exp; save(cur); changed(); return; }
      if (r.j && r.j.ok) {
        if (r.j.token) { storeToken(r.j.token); return; }
        cur.verifiedAt = Date.now(); save(cur);
      }
    }).catch(() => {});
  }

  function claim() {
    return post('/plus/claim', { claimId: claimId() }).then(r => {
      if (r.j && r.j.token && storeToken(r.j.token)) return 'ok';
      return r.status === 202 ? 'pending' : 'error';
    }).catch(() => 'offline');
  }
  function redeem(code) {
    return post('/plus/redeem', { code: code, claimId: claimId() }).then(r => {
      if (r.j && r.j.token && storeToken(r.j.token)) return 'ok';
      return 'bad';
    }).catch(() => 'offline');
  }

  /* ---------- pricing ---------- */
  function defaultCur() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const langs = (navigator.languages || [navigator.language || '']).join(',');
    return (/-IN\b/i.test(langs) || tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') ? 'INR' : 'USD';
  }
  function currency() { return load().cur || defaultCur(); }
  function num(p) { return parseFloat(String(p).replace(/[^0-9.]/g, '')) || 0; }
  function prices(cur) {
    const m = CFG['PRICE_MONTHLY_' + cur] || (cur === 'INR' ? '₹99' : '$1.99');
    const y = CFG['PRICE_YEARLY_' + cur] || (cur === 'INR' ? '₹699' : '$14.99');
    const save = num(m) ? Math.round((1 - num(y) / (12 * num(m))) * 100) : 0;
    return { m: m, y: y, save: save };
  }
  function checkoutUrl(period, cur) {
    // INR -> Razorpay, everything else -> Stripe (USD pricing for USD/AED diaspora)
    const base = CFG[(cur === 'INR' ? 'RAZORPAY_LINK_' : 'STRIPE_LINK_') + period];
    if (!base) return '';
    let u;
    try { u = new URL(base); } catch (e) { return ''; }
    // Stripe Payment Links accept client_reference_id; the Razorpay page reads claim_id.
    // (both handled by the matching webhook in worker/plus.js)
    u.searchParams.set(cur === 'USD' ? 'client_reference_id' : 'claim_id', claimId());
    return u.toString();
  }

  function requestMailto() {
    const rid = requestId();
    const subject = 'Sankalp+ access request ' + rid;
    const body = [
      'Namaste, I would like Sankalp+ access on Divine Hub.',
      '',
      'My request ID: ' + rid,
      '',
      '(This ID only identifies this browser. Please send me a redeem code.)'
    ].join('\n');
    return 'mailto:' + OWNER_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  /* ---------- Plus sheet ---------- */
  function sheetEl() {
    let el = document.getElementById('plusSheet');
    if (!el) {
      el = document.createElement('section');
      el.id = 'plusSheet';
      el.className = 'dh-sheet plus-sheet';
      el.hidden = true;
      el.innerHTML = '<button class="dh-sheet-close" id="plusClose" aria-label="Close Sankalp+">✕</button><div class="plus-body" id="plusBody"></div>';
      document.body.appendChild(el);
      el.querySelector('#plusClose').addEventListener('click', () => window.dhCloseSheet('plusSheet'));
    }
    return el;
  }

  /* What Plus gives. `real` flags are honest: stubs say so in the UI. */
  const FEATURES = [
    { b: 'City muhurat, every day', s: 'sunrise, sunset, Brahma muhurta, Abhijit, Rahu kaal and Pradosh for Dubai, Abu Dhabi, London, New Jersey, Toronto, Singapore and Indian metros', real: true },
    { b: 'Festival alerts for your city', s: 'add every 2026-27 festival to your phone calendar with a reminder and your city\'s timings', real: true },
    { b: 'Unlimited sankalp goals', s: 'free keeps one active goal; Plus runs many side by side', real: true },
    { b: 'Journey timelines & full journal', s: 'shareable "journey so far" card; journal beyond 7 days with a weekly reflection', real: true },
    { b: 'Morning sankalp audio & advanced journeys', s: 'your intention read aloud; 21 and 40-day sadhana tracks', real: true },
    { b: 'Family sankalp circle', s: 'one shared japa goal for the whole family, across countries', real: false }
  ];
  function featsHtml() {
    return '<ul class="plus-feats">' + FEATURES.map(f =>
      '<li><b>' + esc(f.b) + (f.real ? '' : ' <span class="plus-soon">coming soon</span>') + '</b><span>' + esc(f.s) + '</span></li>').join('') + '</ul>' +
      '<p class="plus-note">Always free: every prayer text, the japa counter, the tithi panchang and the Diwali guide.</p>';
  }

  function render(msgText) {
    const body = document.getElementById('plusBody');
    if (!body) return;
    const s = load();

    if (tokenLive(s) || isLegacy(s)) {
      const until = tokenLive(s) ? new Date(s.exp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
      body.innerHTML =
        '<div class="plus-hero"><span class="plus-om">✨</span>' +
        '<h2><span class="plus-dev">सङ्कल्प</span>+ is yours</h2>' +
        '<p>' + (until ? 'Active on this device until <b>' + until + '</b>' + (s.plan ? ' (' + esc(s.plan) + ')' : '') + '. Renewals extend it automatically.'
          : 'Unlocked on this device' + (s.unlockedAt ? ' on ' + new Date(s.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '') + ' with an early-access code. Thank you for being an early supporter.') + '</p></div>' +
        featsHtml() +
        '<button class="plus-cta plus-cta-btn" id="plusMuhurat">Open city muhurat</button>' +
        (until ? '<details class="plus-owner"><summary>Use Plus on another device</summary>' +
          '<p class="plus-note">Your restore key links this purchase. Keep it private; anyone with it can activate Plus.</p>' +
          '<p class="plus-owner-out" id="plusKey">' + esc(claimId()) + '</p></details>' : '');
      const mb = body.querySelector('#plusMuhurat');
      if (mb) mb.addEventListener('click', () => { window.dhCloseSheet('plusSheet'); if (window.dhMuhuratUI) window.dhMuhuratUI.open(); });
      return;
    }

    const cur = currency();
    const p = prices(cur);
    const other = cur === 'INR' ? 'USD' : 'INR';
    const pending = s.pendingCheckout && Date.now() - s.pendingCheckout.at < 48 * 3600 * 1000;
    body.innerHTML =
      '<div class="plus-hero"><span class="plus-om">✨</span>' +
      '<h2><span class="plus-dev">सङ्कल्प</span>+ · Sankalp Plus</h2>' +
      '<p>Your city\'s muhurat, festival alerts and a deeper sankalp practice — for less than a diya a week.</p></div>' +
      featsHtml() +
      '<div class="plus-prices" role="group" aria-label="Choose a plan">' +
        '<button class="plus-price" data-period="YEARLY"><span class="plus-price-tag">Best value' + (p.save > 0 ? ' · save ' + p.save + '%' : '') + '</span>' +
          '<b>' + esc(p.y) + '</b><span>per year</span></button>' +
        '<button class="plus-price" data-period="MONTHLY"><span class="plus-price-tag">Flexible</span><b>' + esc(p.m) + '</b><span>per month</span></button>' +
      '</div>' +
      '<p class="plus-note plus-center">Prices in ' + cur + '. <button class="plus-link" id="plusCur">Show ' + other + '</button> · Cancel any time with the payment provider.</p>' +
      (pending ? '<button class="plus-cta plus-cta-btn" id="plusActivate">I\'ve paid — activate Plus</button>' : '') +
      '<p class="plus-note" id="plusMsg" role="status">' + esc(msgText || '') + '</p>' +
      '<div class="sk-label">Have a redeem code?</div>' +
      '<div class="plus-unlock-row"><input id="plusCode" type="text" placeholder="XXXXX-XXXXX" autocomplete="off" maxlength="11" aria-label="Redeem code">' +
      '<button id="plusUnlock" class="sk-j-save">Redeem</button></div>' +
      '<details class="plus-owner"><summary>Paid on another device?</summary>' +
        '<div class="plus-unlock-row"><input id="plusRestore" type="text" placeholder="32-character restore key" autocomplete="off" maxlength="32" aria-label="Restore key">' +
        '<button id="plusRestoreGo" class="sk-j-save">Restore</button></div></details>' +
      '<p class="plus-note">Card details are handled only by the payment provider; this app never sees them. ' +
        'No payment option suits you? <a href="' + requestMailto() + '">Request access by email</a> (request ID <b>' + esc(requestId()) + '</b>). ' +
        '<a href="privacy.html">Privacy</a></p>';

    const msg = t => { const m = body.querySelector('#plusMsg'); if (m) m.textContent = t; };
    body.querySelectorAll('.plus-price').forEach(b => b.addEventListener('click', () => {
      const url = checkoutUrl(b.dataset.period, cur);
      if (!url) { msg('Online checkout opens very soon. Meanwhile, request access by email below and you will get a redeem code.'); return; }
      const st = load(); st.pendingCheckout = { at: Date.now(), period: b.dataset.period, cur: cur }; save(st);
      window.open(url, '_blank', 'noopener');
      render('Complete payment in the new tab, then come back here. Plus activates automatically.');
    }));
    body.querySelector('#plusCur').addEventListener('click', () => { const st = load(); st.cur = other; save(st); render(); });
    const act = body.querySelector('#plusActivate');
    if (act) act.addEventListener('click', () => activateFlow(msg));
    body.querySelector('#plusUnlock').addEventListener('click', () => {
      const code = body.querySelector('#plusCode').value.trim().toUpperCase();
      if (/^[0-9A-F]{4}-[0-9A-F]{4}$/.test(code)) { msg('That is an old-style code, now retired. Email us your request ID and we will send a new redeem code.'); return; }
      if (!/^[0-9A-F]{5}-[0-9A-F]{5}$/.test(code)) { msg('Redeem codes look like AB12C-3D45E.'); return; }
      msg('Checking…');
      redeem(code).then(r => r === 'ok' ? render() : msg(r === 'offline' ? 'You seem to be offline. Try again when connected.' : 'That code is not valid or was already used.'));
    });
    body.querySelector('#plusCode').addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-F-]/g, '');
    });
    body.querySelector('#plusRestoreGo').addEventListener('click', () => {
      const k = body.querySelector('#plusRestore').value.trim().toLowerCase();
      if (!/^[a-f0-9]{32}$/.test(k)) { msg('A restore key is 32 letters and digits (0-9, a-f).'); return; }
      const st = load(); st.claimId = k; save(st);
      activateFlow(msg);
    });
  }

  function activateFlow(msg) {
    msg('Checking your payment…');
    claim().then(r => {
      if (r === 'ok') { render(); return; }
      msg(r === 'pending' ? 'Payment not confirmed yet. It can take a minute; try again shortly.'
        : r === 'offline' ? 'You seem to be offline. Try again when connected.'
          : 'Could not reach the Plus service. Please try again later.');
    });
  }

  /* returning from checkout: poll a few times quietly */
  function pollPending() {
    const s = load();
    if (!s.pendingCheckout || tokenLive(s) || Date.now() - s.pendingCheckout.at > 48 * 3600 * 1000) return;
    let tries = 0;
    const tick = () => claim().then(r => {
      if (r === 'ok') { const sh = document.getElementById('plusSheet'); if (sh && !sh.hidden) render(); return; }
      if (++tries < 4 && r === 'pending') setTimeout(tick, 5000);
    });
    tick();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pollPending(); });

  function openSheet() {
    sheetEl();
    render();
    window.dhOpenSheet('plusSheet');
  }

  window.dhPlus = {
    isActive: isActive,
    token: token,
    requestId: requestId,
    open: openSheet,
    claim: claim,
    pollPending: pollPending,
    renderHome: function () {} // home badge rendered by sankalp.js
  };

  verifySoon();
})();
