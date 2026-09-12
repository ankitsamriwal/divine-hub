/* Divine Hub — Sankalp+ entitlement: a manual, zero-backend premium gate.
   Request access lands in the owner's Gmail (mailto with a device request ID).
   After payment the owner replies with an unlock code, derived deterministically
   from the request ID, so no server or payment platform is involved. */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_plus_v1';
  const OWNER_EMAIL = 'ankitsamriwal@gmail.com';
  const SALT = 'sankalpplus:v1:divinehub';

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  function requestId() {
    const s = load();
    if (s.requestId) return s.requestId;
    const rid = 'SP-' + Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]).join('');
    s.requestId = rid;
    save(s);
    return rid;
  }

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* Unlock code for a request ID: first 8 hex chars of the hash, grouped. */
  async function codeFor(rid) {
    const h = await sha256Hex(SALT + ':' + String(rid || '').trim().toUpperCase());
    return (h.slice(0, 4) + '-' + h.slice(4, 8)).toUpperCase();
  }

  function isActive() { return !!load().active; }

  async function unlock(code) {
    const want = (await codeFor(requestId())).toUpperCase();
    const got = String(code || '').trim().toUpperCase();
    if (got === want) {
      const s = load();
      s.active = true;
      s.unlockedAt = new Date().toISOString();
      save(s);
      return true;
    }
    return false;
  }

  function requestMailto() {
    const rid = requestId();
    const subject = 'Sankalp+ access request ' + rid;
    const body = [
      'Namaste, I would like Sankalp+ access on Divine Hub.',
      '',
      'My request ID: ' + rid,
      '',
      '(This ID is needed to generate my unlock code. It identifies only this browser — no personal data is collected.)'
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

  function render() {
    const body = document.getElementById('plusBody');
    if (!body) return;
    if (isActive()) {
      const s = load();
      body.innerHTML =
        '<div class="plus-hero"><span class="plus-om">✨</span>' +
        '<h2><span class="plus-dev">सङ्कल्प</span>+ is yours</h2>' +
        '<p>Unlocked ' + new Date(s.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' on this device. Every door below is open.</p></div>' +
        '<ul class="plus-feats">' +
        '<li><b>Unlimited sankalp goals</b><span>run several intentions side by side</span></li>' +
        '<li><b>Journey timelines</b><span>a shareable card of the road so far</span></li>' +
        '<li><b>Full journal history</b><span>and a gentle AI reflection every week</span></li>' +
        '<li><b>Morning sankalp audio</b><span>your intention, spoken in the deity\'s voice</span></li>' +
        '<li><b>Advanced journeys</b><span>long-form sadhana tracks in Practice</span></li>' +
        '</ul>' +
        ownerToolsHtml();
      wireOwner(body);
      return;
    }

    body.innerHTML =
      '<div class="plus-hero"><span class="plus-om">✨</span>' +
      '<h2><span class="plus-dev">सङ्कल्प</span>+ · Sankalp Plus</h2>' +
      '<p>Manifestation, kept the old way: an intention, a mantra, a practice window — and a journey you can watch unfold.</p></div>' +
      '<ul class="plus-feats">' +
      '<li><b>Unlimited sankalp goals</b><span>free keeps one active goal; Plus runs many</span></li>' +
      '<li><b>Journey timelines</b><span>milestones and a shareable "journey so far" card</span></li>' +
      '<li><b>Journal without limits</b><span>free shows 7 days; Plus keeps it all, with a weekly AI reflection</span></li>' +
      '<li><b>Morning sankalp audio</b><span>your intention narrated aloud, gendered to the deity</span></li>' +
      '<li><b>Advanced journeys</b><span>21 and 40-day sadhana tracks</span></li>' +
      '</ul>' +
      '<a class="plus-cta" id="plusRequest" href="' + requestMailto() + '">Request Sankalp+ access</a>' +
      '<p class="plus-note">Requests go straight to the app\'s maker by email — no accounts, no cards stored here. ' +
      'Your request ID is <b>' + requestId() + '</b>; it is included in the email automatically.</p>' +
      '<div class="sk-label">Have an unlock code?</div>' +
      '<div class="plus-unlock-row"><input id="plusCode" type="text" placeholder="XXXX-XXXX" autocomplete="off" maxlength="9">' +
      '<button id="plusUnlock" class="sk-j-save">Unlock</button></div>' +
      '<p class="plus-note" id="plusMsg"></p>' +
      ownerToolsHtml();

    body.querySelector('#plusUnlock').addEventListener('click', async () => {
      const ok = await unlock(body.querySelector('#plusCode').value);
      const msg = body.querySelector('#plusMsg');
      if (ok) {
        render();
        if (window.dhSankalp && window.dhSankalp.renderHome) window.dhSankalp.renderHome();
        if (window.dhJourneys && window.dhJourneys.refresh) window.dhJourneys.refresh();
      } else {
        msg.textContent = 'That code does not match this device\'s request ID. Check the code and try again.';
      }
    });
    body.querySelector('#plusCode').addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-F-]/g, '');
    });
    wireOwner(body);
  }

  /* Owner tools: paste a requester's ID, get their unlock code. Obscurity-grade
     by design — the whole gate is client-side; it deters casual bypass, not attack. */
  function ownerToolsHtml() {
    return '<details class="plus-owner"><summary>Owner tools</summary>' +
      '<div class="sk-label">Generate an unlock code</div>' +
      '<div class="plus-unlock-row"><input id="plusOwnerRid" type="text" placeholder="Request ID, e.g. SP-AB12CD" autocomplete="off">' +
      '<button id="plusOwnerGen" class="sk-j-save">Generate</button></div>' +
      '<p class="plus-owner-out" id="plusOwnerOut"></p></details>';
  }
  function wireOwner(body) {
    const btn = body.querySelector('#plusOwnerGen');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const rid = body.querySelector('#plusOwnerRid').value.trim();
      if (!rid) return;
      body.querySelector('#plusOwnerOut').textContent = 'Unlock code for ' + rid.toUpperCase() + ': ' + (await codeFor(rid));
    });
  }

  function openSheet() {
    sheetEl();
    render();
    window.dhOpenSheet('plusSheet');
  }

  window.dhPlus = {
    isActive: isActive,
    requestId: requestId,
    open: openSheet,
    unlock: unlock,
    codeFor: codeFor,
    renderHome: function () {} // home badge rendered by sankalp.js
  };
})();
