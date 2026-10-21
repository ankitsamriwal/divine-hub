/* Divine Hub — Sankalp+ entitlement (client).
   The browser holds only an entitlement TOKEN minted and signed by the worker
   (HMAC secret lives in the worker env; see worker/plus.js, docs/LAUNCH.md).
   The client cannot mint or forge tokens. It re-checks the token with the worker
   at most once a day and drops it if the worker says it is invalid.

   Honest limits: features that run purely on-device (unlimited goals, timelines)
   are gated in the browser, so a determined user editing JS can still bypass
   them. Server-backed Plus features must call /plus/verify (as the worker does).

   THIS RELEASE: payments are dormant (DH_CONFIG.PAYMENTS_ENABLED is false). No
   prices with buy buttons and no checkout links are shown. Instead:
     - 7-day free trial, no card: /plus/trial/start returns a worker-signed token
       with a hard 7-day expiry, one trial per device ID (the worker keys its record
       by a hash of the ID). The ID is kept in localStorage AND IndexedDB, so clearing
       only one of them does not mint a new ID. "Clear site data" removes both, and a
       new device gets a new trial; see docs/LAUNCH.md.
     - Demand test at trial end: planned price plus "I'd pay for this" / "Not for
       me". The worker stores only anonymous counters; answering once extends the
       trial by 7 days.
   The checkout code below stays in place, dormant, for when payments are enabled.

   Ways to get a token:
     0. Trial (above).
     1. Checkout (only when PAYMENTS_ENABLED): a payment link (from config.js) carries this device's random
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
  const PAYMENTS_ENABLED = CFG.PAYMENTS_ENABLED === true;
  const DAY_MS = 24 * 3600 * 1000;
  const IDB_NAME = 'divinehub_device_v1';

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

  /* ---------- device ID (trial: one per device) ----------
     Random 128-bit ID, not derived from the device or the person. Mirrored into
     IndexedDB so that clearing localStorage alone keeps the same ID. */
  function idbOpen() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open(IDB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  function idbGet() {
    return idbOpen().then(db => new Promise(res => {
      const q = db.transaction('kv', 'readonly').objectStore('kv').get('deviceId');
      q.onsuccess = () => res(q.result || null); q.onerror = () => res(null);
    })).catch(() => null);
  }
  function idbPut(v) {
    return idbOpen().then(db => new Promise(res => {
      const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, 'deviceId');
      t.oncomplete = () => res(true); t.onerror = () => res(false);
    })).catch(() => false);
  }
  const HEX32 = /^[a-f0-9]{32}$/;
  function deviceId() {
    const s = load();
    return idbGet().then(fromIdb => {
      let id = HEX32.test(fromIdb || '') ? fromIdb : (HEX32.test(s.deviceId || '') ? s.deviceId : null);
      if (!id) id = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
      if (s.deviceId !== id) { const st = load(); st.deviceId = id; save(st); }
      if (fromIdb !== id) idbPut(id);
      return id;
    });
  }

  function tokenPayload(tok) {
    try {
      const part = String(tok).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(part + '==='.slice((part.length + 3) % 4)))));
    } catch (e) { return null; }
  }
  function tokenLive(s) { return !!(s.token && s.exp && s.exp * 1000 > Date.now()); }
  function isLegacy(s) { return !!(s.active && !s.token); }
  function trialLive(s) { return !!(s.trial && s.trial.token && s.trial.exp * 1000 > Date.now()); }
  function trialEnded(s) { return !!(s.trial && (s.trial.used || (s.trial.exp && s.trial.exp * 1000 <= Date.now()))) && !trialLive(s); }
  function paidOrLegacy(s) { return tokenLive(s) || isLegacy(s); }
  function isActive() { const s = load(); return paidOrLegacy(s) || trialLive(s); }
  function token() { const s = load(); return tokenLive(s) ? s.token : trialLive(s) ? s.trial.token : null; }
  function trialDaysLeft() { const s = load(); return trialLive(s) ? Math.max(1, Math.ceil((s.trial.exp * 1000 - Date.now()) / DAY_MS)) : 0; }
  function canStartTrial() { const s = load(); return !paidOrLegacy(s) && !s.trial; }

  /* Expired trial: drop only the token; every goal, journal entry and setting stays.
     Plus-only features simply fall back to their free versions. */
  function storeTrial(r) {
    const p = r.token ? tokenPayload(r.token) : null;
    const s = load();
    s.trial = Object.assign({}, s.trial || {}, p && p.exp ? { token: r.token, exp: p.exp } : {}, { ext: !!r.ext });
    if (!p && r.exp) { s.trial.exp = r.exp; s.trial.used = true; delete s.trial.token; }
    save(s);
    changed();
  }
  function startTrial() {
    if (!canStartTrial()) return Promise.resolve('not_eligible');
    return deviceId().then(id => post('/plus/trial/start', { deviceId: id })).then(r => {
      if (r.j && r.j.token) { storeTrial(r.j); return 'ok'; }
      if (r.status === 409) { storeTrial({ exp: r.j.exp || Math.floor(Date.now() / 1000), ext: r.j.ext }); return 'used'; }
      return 'error';
    }).catch(() => 'offline');
  }
  function vote(answer) {
    let city = '';
    try { city = window.dhMuhurat ? window.dhMuhurat.getCity().id : ''; } catch (e) {}
    const locale = (navigator.language || '').slice(0, 10);
    return deviceId().then(id => post('/plus/trial/vote', { deviceId: id, answer: answer, locale: locale, city: city })).then(r => {
      const mark = () => { const s = load(); s.voted = true; save(s); }; // remembers THAT this device answered, never what
      if (r.j && r.j.token) { mark(); storeTrial(r.j); return 'extended'; }
      if (r.status === 409 && r.j && r.j.error === 'already_extended') {
        mark(); const st = load(); if (st.trial) { st.trial.ext = true; save(st); } return 'already';
      }
      return 'error';
    }).catch(() => 'offline');
  }

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
    const s0 = load();
    if (trialLive(s0) && !(s0.trial.verifiedAt && Date.now() - s0.trial.verifiedAt < VERIFY_EVERY_MS)) {
      post('/plus/verify', { token: s0.trial.token }).then(r => {
        const cur = load();
        if (!cur.trial) return;
        if (r.j && r.j.ok === false) { delete cur.trial.token; cur.trial.used = true; save(cur); changed(); return; }
        if (r.j && r.j.ok) {
          if (r.j.token) { const p = tokenPayload(r.j.token); if (p) { cur.trial.token = r.j.token; cur.trial.exp = p.exp; } }
          cur.trial.verifiedAt = Date.now(); save(cur); changed();
        }
      }).catch(() => {});
    }
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
    if (!PAYMENTS_ENABLED) return ''; // dormant: config.js links are not used in this release
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

  /* ---------- demand test (no payment is taken) ---------- */
  function plannedPrice() {
    const cur = defaultCur(); // India locale -> INR, everyone else -> USD
    return cur === 'INR' ? (CFG.PRICE_MONTHLY_INR || '₹99') + '/month' : (CFG.PRICE_MONTHLY_USD || '$1.99') + '/month';
  }
  function demandHtml(s) {
    if (s.voted) return '<p class="plus-note plus-center">Thank you for answering. It helps decide whether Sankalp+ becomes a paid plan.</p>';
    return '<div class="plus-demand" id="plusDemand"><div class="sk-label">One quick question</div>' +
      '<p>We plan to offer Sankalp+ at <b>' + esc(plannedPrice()) + '</b>. Nothing is on sale yet and nothing will be charged. Would you pay for this?</p>' +
      '<div class="plus-demand-row"><button class="plus-cta plus-cta-btn" data-vote="yes">I\'d pay for this</button>' +
      '<button class="plus-ghost" data-vote="no">Not for me</button></div>' +
      '<p class="plus-note">Your answer is counted anonymously (with your language setting, country and chosen city only). Answering ' +
        ((s.trial && s.trial.ext) ? 'is optional.' : 'adds <b>7 more days</b> of Plus, once per device.') + '</p></div>';
  }
  function wireDemand(body, msg) {
    body.querySelectorAll('[data-vote]').forEach(b => b.addEventListener('click', () => {
      body.querySelectorAll('[data-vote]').forEach(x => { x.disabled = true; });
      msg('Saving…');
      vote(b.dataset.vote).then(r => {
        if (r === 'extended') { render('Thank you. Plus is extended by 7 days.'); return; }
        if (r === 'already') { render('This device has already answered. Thank you.'); return; }
        body.querySelectorAll('[data-vote]').forEach(x => { x.disabled = false; });
        msg(r === 'offline' ? 'You seem to be offline. Try again when connected.' : 'Could not save your answer. Please try again later.');
      });
    }));
  }
  function fmtDate(sec) { return new Date(sec * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  function render(msgText) {
    const body = document.getElementById('plusBody');
    if (!body) return;
    const s = load();
    const msg = t => { const m = body.querySelector('#plusMsg'); if (m) m.textContent = t; };

    if (!paidOrLegacy(s) && trialLive(s)) {
      const left = trialDaysLeft();
      body.innerHTML =
        '<div class="plus-hero"><span class="plus-om">✨</span>' +
        '<h2><span class="plus-dev">सङ्कल्प</span>+ free trial</h2>' +
        '<p><b>' + left + ' day' + (left === 1 ? '' : 's') + ' left</b> · ends ' + fmtDate(s.trial.exp) + '. No card, nothing to cancel. When it ends you keep everything you made; Plus-only features go back to their free versions.</p></div>' +
        featsHtml() +
        '<button class="plus-cta plus-cta-btn" id="plusMuhurat">Open city muhurat</button>' +
        (left <= 1 ? demandHtml(s) : '') +
        '<p class="plus-note" id="plusMsg" role="status">' + esc(msgText || '') + '</p>';
      body.querySelector('#plusMuhurat').addEventListener('click', () => { window.dhCloseSheet('plusSheet'); if (window.dhMuhuratUI) window.dhMuhuratUI.open(); });
      wireDemand(body, msg);
      return;
    }

    if (paidOrLegacy(s)) {
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

    const ended = trialEnded(s);
    const trialBtn = canStartTrial()
      ? '<button class="plus-cta plus-cta-btn" id="plusTrial">Start 7-day free trial</button>' +
        '<p class="plus-note plus-center">No card needed. One trial per device. Nothing is charged at the end.</p>'
      : '';
    const redeemHtml =
      '<div class="sk-label">Have a redeem code?</div>' +
      '<div class="plus-unlock-row"><input id="plusCode" type="text" placeholder="XXXXX-XXXXX" autocomplete="off" maxlength="11" aria-label="Redeem code">' +
      '<button id="plusUnlock" class="sk-j-save">Redeem</button></div>';
    const heroHtml = ended
      ? '<div class="plus-hero"><span class="plus-om">✨</span><h2><span class="plus-dev">सङ्कल्प</span>+ trial ended</h2>' +
        '<p>Your trial ended' + (s.trial.exp ? ' on ' + fmtDate(s.trial.exp) : '') + '. Everything you made is still here; Plus-only features are back to their free versions.</p></div>'
      : '<div class="plus-hero"><span class="plus-om">✨</span>' +
        '<h2><span class="plus-dev">सङ्कल्प</span>+ · Sankalp Plus</h2>' +
        '<p>Your city\'s muhurat, festival alerts and a deeper sankalp practice. Try all of it free for 7 days.</p></div>';

    if (!PAYMENTS_ENABLED) {
      // Payments dormant: no prices with buy buttons, no checkout links, no restore-a-purchase path.
      body.innerHTML = heroHtml + (ended ? demandHtml(s) : '') + featsHtml() + trialBtn +
        '<p class="plus-note" id="plusMsg" role="status">' + esc(msgText || '') + '</p>' +
        redeemHtml +
        '<p class="plus-note">Sankalp+ is not on sale yet. <a href="' + requestMailto() + '">Questions? Email us</a> (request ID <b>' + esc(requestId()) + '</b>). ' +
        '<a href="privacy.html">Privacy</a></p>';
      wireTrial(body, msg);
      wireDemand(body, msg);
      wireRedeem(body, msg);
      return;
    }

    /* ----- PAYMENTS_ENABLED only (dormant in this release) ----- */
    const cur = currency();
    const p = prices(cur);
    const other = cur === 'INR' ? 'USD' : 'INR';
    const pending = s.pendingCheckout && Date.now() - s.pendingCheckout.at < 48 * 3600 * 1000;
    body.innerHTML =
      heroHtml + (ended ? demandHtml(s) : '') +
      featsHtml() + trialBtn +
      '<div class="plus-prices" role="group" aria-label="Choose a plan">' +
        '<button class="plus-price" data-period="YEARLY"><span class="plus-price-tag">Best value' + (p.save > 0 ? ' · save ' + p.save + '%' : '') + '</span>' +
          '<b>' + esc(p.y) + '</b><span>per year</span></button>' +
        '<button class="plus-price" data-period="MONTHLY"><span class="plus-price-tag">Flexible</span><b>' + esc(p.m) + '</b><span>per month</span></button>' +
      '</div>' +
      '<p class="plus-note plus-center">Prices in ' + cur + '. <button class="plus-link" id="plusCur">Show ' + other + '</button> · Cancel any time with the payment provider.</p>' +
      (pending ? '<button class="plus-cta plus-cta-btn" id="plusActivate">I\'ve paid — activate Plus</button>' : '') +
      '<p class="plus-note" id="plusMsg" role="status">' + esc(msgText || '') + '</p>' +
      redeemHtml +
      '<details class="plus-owner"><summary>Paid on another device?</summary>' +
        '<div class="plus-unlock-row"><input id="plusRestore" type="text" placeholder="32-character restore key" autocomplete="off" maxlength="32" aria-label="Restore key">' +
        '<button id="plusRestoreGo" class="sk-j-save">Restore</button></div></details>' +
      '<p class="plus-note">Card details are handled only by the payment provider; this app never sees them. ' +
        'No payment option suits you? <a href="' + requestMailto() + '">Request access by email</a> (request ID <b>' + esc(requestId()) + '</b>). ' +
        '<a href="privacy.html">Privacy</a></p>';

    wireTrial(body, msg);
    wireDemand(body, msg);
    wireRedeem(body, msg);
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
    body.querySelector('#plusRestoreGo').addEventListener('click', () => {
      const k = body.querySelector('#plusRestore').value.trim().toLowerCase();
      if (!/^[a-f0-9]{32}$/.test(k)) { msg('A restore key is 32 letters and digits (0-9, a-f).'); return; }
      const st = load(); st.claimId = k; save(st);
      activateFlow(msg);
    });
  }

  function wireTrial(body, msg) {
    const b = body.querySelector('#plusTrial');
    if (!b) return;
    b.addEventListener('click', () => {
      b.disabled = true;
      msg('Starting your trial…');
      startTrial().then(r => {
        if (r === 'ok') { render(); return; }
        b.disabled = false;
        if (r === 'used') { render('This device has already used its free trial.'); return; }
        msg(r === 'offline' ? 'You seem to be offline. Try again when connected.' : 'Could not start the trial. Please try again later.');
      });
    });
  }
  function wireRedeem(body, msg) {
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
    if (!PAYMENTS_ENABLED) return;
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

  /* ---------- header: days left during the trial ---------- */
  function renderBadge() {
    const hdr = document.querySelector('.site-header');
    if (!hdr) return;
    let b = document.getElementById('plusTrialBadge');
    const s = load();
    const left = !paidOrLegacy(s) && trialLive(s) ? trialDaysLeft() : 0;
    if (!left) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'plusTrialBadge';
      b.className = 'plus-trial-badge';
      b.addEventListener('click', openSheet);
      hdr.appendChild(b);
    }
    b.textContent = '✨ Plus trial · ' + left + ' day' + (left === 1 ? '' : 's') + ' left';
  }
  document.addEventListener('dh-plus-change', renderBadge);

  /* At trial end, ask the demand-test question once, when the app is next opened. */
  function askAtTrialEnd() {
    const s = load();
    if (paidOrLegacy(s) || !trialEnded(s) || s.voted || s.askedAtEnd) return;
    s.askedAtEnd = Date.now(); save(s);
    setTimeout(() => { if (window.dhOpenSheet) openSheet(); }, 1200);
  }

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
    startTrial: startTrial,
    canStartTrial: canStartTrial,
    trialDaysLeft: trialDaysLeft,
    paymentsEnabled: PAYMENTS_ENABLED,
    claim: claim,
    pollPending: pollPending,
    renderHome: function () {} // home badge rendered by sankalp.js
  };

  verifySoon();
  function boot() { renderBadge(); askAtTrialEnd(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // trial expiry while the app stays open: refresh the badge and gates hourly
  setInterval(() => { const s = load(); if (s.trial && s.trial.token && !trialLive(s)) changed(); renderBadge(); }, 3600 * 1000);
})();
