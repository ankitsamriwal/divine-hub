// Divine Hub — Sankalp+ entitlement service (Cloudflare worker module).
//
// WHAT IS REAL HERE
//  - Signed entitlement tokens: HMAC-SHA256 with env.PLUS_TOKEN_SECRET (a worker
//    secret; never in code). Format: "v1.<b64url(json payload)>.<b64url(sig)>".
//  - Webhook signature verification for Stripe (Stripe-Signature, t/v1 scheme,
//    5-minute tolerance) and Razorpay (X-Razorpay-Signature, hex HMAC of raw body).
//  - Claim flow: the browser makes a random 128-bit claim ID, passes it to the
//    payment link, and after payment exchanges it for a token at /plus/claim.
//  - Manual unlock: the owner mints a single-use redeem code at /plus/admin/issue
//    (Bearer env.PLUS_ADMIN_KEY); the user types it into the Plus sheet.
//
// PAYMENTS ARE DORMANT IN THIS RELEASE (owner decision, MES-7)
//  - Every payment path is behind env.PAYMENTS_ENABLED (must be the string "true"
//    to switch on; default off). While off, /plus/webhook/* returns 404 and the
//    Stripe/Razorpay handlers below are never reached. The code is kept, not
//    deleted, so payments can be switched on later (see docs/LAUNCH.md).
//
// FREE TRIAL + DEMAND TEST (live in this release)
//  - 7-day Plus trial, no card. The trial token uses the same HMAC signing as paid
//    tokens with a hard 7-day exp and no grace period. One trial per device ID: the
//    record lives at plus:trial:<sha256("trial:"+deviceId)>, so the raw device ID
//    is never stored. Expired trial tokens fail verifyToken (exp check) and
//    /plus/verify also checks the KV record.
//  - At trial end the app asks "Would you pay $1.99/month (₹99 in India)?". The
//    answer is added to anonymous aggregate counters (answer x locale / country /
//    city). No email, name, IP or device ID is stored with a vote. Voting once
//    extends the trial by 7 days; that is tracked only as ext:true on the hashed
//    device record, which never holds the answer.
//
// WHAT IS NOT YET PROVEN
//  - No live Stripe/Razorpay account is connected. The event shapes handled below
//    follow the providers' documented payloads; test with the providers' webhook
//    test tools before taking real money (see docs/LAUNCH.md).
//  - Storage uses env.PLUS_KV if bound, else the existing KHAU_KV namespace under
//    the "plus:" prefix. A dedicated namespace is recommended.
//
// Routes (all JSON):
//   POST /plus/trial/start      {deviceId}                -> {token, exp} | 409 trial_used
//   POST /plus/trial/vote       {deviceId, answer, locale, city} -> {token, exp} | 409
//   POST /plus/claim            {claimId}                 -> {token} once paid
//   POST /plus/redeem           {code, claimId}           -> {token}
//   POST /plus/verify           {token}                   -> {ok, plan, exp, token?}
//   POST /plus/admin/issue      {plan, days, note}        -> {code}   (Bearer PLUS_ADMIN_KEY)
//   GET  /plus/admin/stats                                -> counts   (Bearer PLUS_ADMIN_KEY)
//   POST /plus/webhook/stripe   raw Stripe event          -> 200 after verified (404 while payments are off)
//   POST /plus/webhook/razorpay raw Razorpay event        -> 200 after verified (404 while payments are off)

const enc = new TextEncoder();
const DAY = 86400;
const GRACE_DAYS = 3;
const PLAN_DAYS = { monthly: 31, yearly: 366, manual: 366 };
const TRIAL_DAYS = 7;
const EXTEND_DAYS = 7;
const TRIAL_RECORD_TTL = 400 * DAY; // keep the one-trial-per-device record ~13 months
// City IDs the app offers (muhurat.js); anything else is counted as "other".
const CITY_IDS = new Set(['dubai', 'abudhabi', 'london', 'newjersey', 'toronto', 'singapore', 'delhi', 'mumbai',
  'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'pune']);
export function paymentsEnabled(env) { return String(env.PAYMENTS_ENABLED || '').toLowerCase() === 'true'; }
// Price -> plan mapping (minor units). Used when the provider event has no plan metadata.
const PRICE_PLAN = {
  usd: { 199: 'monthly', 1499: 'yearly' },
  inr: { 9900: 'monthly', 69900: 'yearly' }
};

/* ---------- encoding + crypto helpers ---------- */
function b64u(bytes) {
  let s = '';
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDecode(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function hex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(data));
}
async function sha256Hex(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
// constant-time string compare (equal-length check leaks only length)
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const now = () => Math.floor(Date.now() / 1000);
// Admin check: compare SHA-256 digests so the comparison time does not depend on
// the supplied header's length or content.
async function adminOk(env, request) {
  if (!env.PLUS_ADMIN_KEY) return false;
  const got = await sha256Hex(request.headers.get('Authorization') || '');
  const want = await sha256Hex('Bearer ' + env.PLUS_ADMIN_KEY);
  return safeEqual(got, want);
}

/* ---------- tokens ---------- */
export async function signToken(env, payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = b64u(await hmac(env.PLUS_TOKEN_SECRET, 'v1.' + body));
  return 'v1.' + body + '.' + sig;
}
export async function verifyToken(env, token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const want = b64u(await hmac(env.PLUS_TOKEN_SECRET, 'v1.' + parts[1]));
  if (!safeEqual(want, parts[2])) return null;
  let p;
  try { p = JSON.parse(new TextDecoder().decode(b64uDecode(parts[1]))); } catch (e) { return null; }
  if (!p || typeof p.exp !== 'number' || p.exp < now()) return null;
  return p;
}

/* ---------- storage ---------- */
function kv(env) { return env.PLUS_KV || env.KHAU_KV || null; }
async function getEnt(env, sub) { return kv(env).get('plus:ent:' + sub, 'json'); }
async function putEnt(env, sub, ent) {
  // keep the record a little past expiry so a late renewal can still find it
  await kv(env).put('plus:ent:' + sub, JSON.stringify(ent), { expirationTtl: Math.max(120, ent.exp - now() + 30 * DAY) });
}
async function grant(env, claimId, plan, periodEnd, src, extra) {
  if (!/^[a-f0-9]{32}$/.test(String(claimId || ''))) return { ok: false, reason: 'bad_claim_id' };
  const sub = await sha256Hex('claim:' + claimId);
  const prev = await getEnt(env, sub);
  const exp = Math.max(periodEnd || (now() + (PLAN_DAYS[plan] || 31) * DAY), prev && prev.exp || 0) + GRACE_DAYS * DAY;
  await putEnt(env, sub, { plan: plan, exp: exp, src: src, at: now(), ...(extra || {}) });
  return { ok: true, sub: sub };
}
function tokenPayload(sub, ent) { return { v: 1, sub: sub, plan: ent.plan, exp: ent.exp, iat: now(), src: ent.src }; }

/* ---------- free trial (no card) ---------- */
const DEVICE_RE = /^[a-f0-9]{32}$/;
async function trialKey(deviceId) { return 'plus:trial:' + await sha256Hex('trial:' + deviceId); }
async function getTrial(env, key) { return kv(env).get(key, 'json'); }
async function putTrial(env, key, rec) {
  // metadata lets /plus/admin/stats count active/expired/extended with list() alone
  await kv(env).put(key, JSON.stringify(rec), { expirationTtl: TRIAL_RECORD_TTL, metadata: { exp: rec.exp, ext: !!rec.ext } });
}
function trialPayload(key, rec) { return { v: 1, sub: key, plan: 'trial', exp: rec.exp, iat: now(), src: 'trial' }; }

/* Anonymous demand-test counters: one aggregate document, no per-vote rows, no
   timestamps, no identifiers. Read-modify-write on KV, so two votes landing in the
   same instant can lose one increment; fine for a demand signal. */
const VOTES_KEY = 'plus:votes:v1';
function cleanLocale(l) { const m = /^([a-z]{2,3})(?:[-_]([a-z]{2}))?$/i.exec(String(l || '').trim()); return m ? m[1].toLowerCase() + (m[2] ? '-' + m[2].toUpperCase() : '') : 'other'; }
function cleanCountry(c) { return /^[A-Z]{2}$/.test(String(c || '')) ? String(c) : 'XX'; }
function cleanCity(c) { c = String(c || '').toLowerCase(); return CITY_IDS.has(c) ? c : 'other'; }
async function addVote(env, answer, locale, country, city) {
  const doc = (await kv(env).get(VOTES_KEY, 'json')) || {};
  const a = doc[answer] || (doc[answer] = { total: 0, byLocale: {}, byCountry: {}, byCity: {} });
  a.total++;
  a.byLocale[locale] = (a.byLocale[locale] || 0) + 1;
  a.byCountry[country] = (a.byCountry[country] || 0) + 1;
  a.byCity[city] = (a.byCity[city] || 0) + 1;
  await kv(env).put(VOTES_KEY, JSON.stringify(doc));
}
async function trialStats(env) {
  const t = now();
  const out = { starts: 0, active: 0, expired: 0, extended: 0 };
  let cursor;
  for (let page = 0; page < 50; page++) { // up to 50k records
    const r = await kv(env).list({ prefix: 'plus:trial:', cursor: cursor });
    for (const k of r.keys) {
      const m = k.metadata || {};
      out.starts++;
      if (m.ext) out.extended++;
      if (typeof m.exp === 'number' && m.exp > t) out.active++; else out.expired++;
    }
    if (r.list_complete || !r.cursor) break;
    cursor = r.cursor;
  }
  return out;
}

/* ---------- best-effort per-isolate rate limit for public plus routes ---------- */
const hits = new Map();
function limited(ip, max) {
  const t = Date.now();
  let b = hits.get(ip);
  if (!b || t - b.s > 600000) { b = { s: t, n: 0 }; hits.set(ip, b); }
  if (hits.size > 5000) hits.clear();
  return ++b.n > max;
}

/* ---------- provider webhooks ---------- */
async function stripeVerify(env, raw, header) {
  if (!env.STRIPE_WEBHOOK_SECRET || !header) return false;
  const items = String(header).split(',').map(s => s.trim().split('='));
  const t = (items.find(i => i[0] === 't') || [])[1];
  const v1s = items.filter(i => i[0] === 'v1').map(i => i[1]);
  if (!t || !v1s.length || Math.abs(now() - Number(t)) > 300) return false;
  const want = hex(await hmac(env.STRIPE_WEBHOOK_SECRET, t + '.' + raw));
  return v1s.some(v => safeEqual(v, want));
}
async function razorpayVerify(env, raw, header) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !header) return false;
  return safeEqual(hex(await hmac(env.RAZORPAY_WEBHOOK_SECRET, raw)), String(header));
}
function planFrom(env, meta, amount, currency) {
  const p = meta && String(meta.plan || '').toLowerCase();
  if (p === 'monthly' || p === 'yearly') return p;
  const cur = String(currency || '').toLowerCase();
  // Optional env var PLUS_EXTRA_PRICES (plain var, not secret), e.g. {"aed":{"799":"monthly","5499":"yearly"}}
  let extra = {};
  try { extra = env.PLUS_EXTRA_PRICES ? JSON.parse(env.PLUS_EXTRA_PRICES) : {}; } catch (e) {}
  const table = Object.assign({}, PRICE_PLAN[cur] || {}, extra[cur] || {});
  return (table && table[Number(amount)]) || null;
}

async function handleStripe(env, ev) {
  const o = ev && ev.data && ev.data.object || {};
  if (ev.type === 'checkout.session.completed') {
    if (o.payment_status !== 'paid') return { ignored: 'unpaid' };
    const plan = planFrom(env, o.metadata, o.amount_total, o.currency);
    if (!plan) return { ignored: 'unknown_price' };
    const r = await grant(env, o.client_reference_id, plan, null, 'stripe', { subId: o.subscription || null });
    if (r.ok && o.subscription) await kv(env).put('plus:sub:' + o.subscription, r.sub, { expirationTtl: 400 * DAY });
    return r;
  }
  if (ev.type === 'invoice.paid' && o.subscription && o.billing_reason === 'subscription_cycle') {
    const sub = await kv(env).get('plus:sub:' + o.subscription);
    if (!sub) return { ignored: 'unknown_subscription' };
    const ent = await getEnt(env, sub);
    const line = o.lines && o.lines.data && o.lines.data[0];
    const end = line && line.period && line.period.end;
    if (!ent || !end) return { ignored: 'no_period' };
    ent.exp = Math.max(ent.exp, end + GRACE_DAYS * DAY);
    await putEnt(env, sub, ent);
    return { ok: true, renewed: true };
  }
  // customer.subscription.deleted needs no action: the token simply is not renewed.
  return { ignored: ev.type };
}

async function handleRazorpay(env, ev) {
  const pl = ev && ev.payload || {};
  // Claim ID travels in notes.claim_id (Payment Page custom field or link notes).
  if (ev.event === 'payment_link.paid' || ev.event === 'payment.captured') {
    const pay = pl.payment && pl.payment.entity || {};
    const link = pl.payment_link && pl.payment_link.entity || {};
    const notes = Object.assign({}, pay.notes || {}, link.notes || {});
    const claimId = String(notes.claim_id || link.reference_id || '').toLowerCase();
    const plan = planFrom(env, notes, pay.amount, pay.currency);
    if (!plan) return { ignored: 'unknown_price' };
    return grant(env, claimId, plan, null, 'razorpay');
  }
  if (ev.event === 'subscription.charged') {
    const s = pl.subscription && pl.subscription.entity || {};
    const pay = pl.payment && pl.payment.entity || {};
    const notes = s.notes || {};
    const plan = planFrom(env, notes, pay.amount, pay.currency) || 'monthly';
    return grant(env, String(notes.claim_id || '').toLowerCase(), plan, s.current_end || null, 'razorpay');
  }
  return { ignored: ev.event };
}

/* ---------- router ---------- */
export async function handlePlusRoute(request, env, url, headers, allowedOrigin) {
  if (!url.pathname.startsWith('/plus/')) return null;
  const json = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  const isWebhook = url.pathname === '/plus/webhook/stripe' || url.pathname === '/plus/webhook/razorpay';
  // Payments are dormant unless PAYMENTS_ENABLED="true": the webhook routes do not exist.
  if (isWebhook && !paymentsEnabled(env)) return json({ error: 'not_found' }, 404);
  const isStats = url.pathname === '/plus/admin/stats';
  if (request.method !== 'POST' && !(isStats && request.method === 'GET')) return json({ error: 'method_not_allowed' }, 405);
  if (!env.PLUS_TOKEN_SECRET || !kv(env)) return json({ error: 'plus_not_configured' }, 503);

  // Webhooks: server-to-server, no Origin; authenticity comes from the signature.
  if (isWebhook) {
    const raw = await request.text();
    const isStripe = url.pathname.endsWith('/stripe');
    const ok = isStripe
      ? await stripeVerify(env, raw, request.headers.get('Stripe-Signature'))
      : await razorpayVerify(env, raw, request.headers.get('X-Razorpay-Signature'));
    if (!ok) return json({ error: 'bad_signature' }, 400);
    let ev; try { ev = JSON.parse(raw); } catch (e) { return json({ error: 'bad_json' }, 400); }
    const r = isStripe ? await handleStripe(env, ev) : await handleRazorpay(env, ev);
    return json({ received: true, result: r && r.ok ? 'granted' : (r && (r.ignored || r.reason)) || 'ignored' });
  }

  // Owner-only: mint a single-use redeem code (manual unlock path, e.g. after a bank transfer).
  if (url.pathname === '/plus/admin/issue') {
    if (!(await adminOk(env, request))) return json({ error: 'unauthorized' }, 401);
    let d; try { d = await request.json(); } catch (e) { d = {}; }
    const plan = ['monthly', 'yearly', 'manual'].includes(d.plan) ? d.plan : 'manual';
    const days = Math.min(Math.max(parseInt(d.days, 10) || PLAN_DAYS[plan], 1), 800);
    const raw = hex(crypto.getRandomValues(new Uint8Array(5))).toUpperCase(); // 40 bits, single use, 30-day TTL
    const code = raw.slice(0, 5) + '-' + raw.slice(5, 10);
    await kv(env).put('plus:code:' + code, JSON.stringify({ plan: plan, days: days, note: String(d.note || '').slice(0, 80), at: now() }), { expirationTtl: 30 * DAY });
    return json({ code: code, plan: plan, days: days });
  }

  // Owner-only: trial and demand-test numbers. Aggregates only; no identifiers exist to return.
  if (isStats) {
    if (!(await adminOk(env, request))) return json({ error: 'unauthorized' }, 401);
    const votes = (await kv(env).get(VOTES_KEY, 'json')) || {};
    const empty = { total: 0, byLocale: {}, byCountry: {}, byCity: {} };
    return json({
      generatedAt: new Date().toISOString(),
      paymentsEnabled: paymentsEnabled(env),
      trials: await trialStats(env),
      votes: { yes: votes.yes || empty, no: votes.no || empty }
    });
  }

  // Browser routes: origin-locked and rate-limited.
  if (!allowedOrigin) return json({ error: 'forbidden_origin' }, 403);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (limited(ip, 30)) return json({ error: 'rate_limited' }, 429);
  let d; try { d = await request.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }

  if (url.pathname === '/plus/trial/start') {
    const deviceId = String(d.deviceId || '').toLowerCase();
    if (!DEVICE_RE.test(deviceId)) return json({ error: 'bad_device_id' }, 400);
    const key = await trialKey(deviceId);
    const rec = await getTrial(env, key);
    if (rec) {
      // Same device asking again (e.g. its token was lost): re-issue while still live, never restart.
      if (rec.exp > now()) return json({ token: await signToken(env, trialPayload(key, rec)), exp: rec.exp, ext: !!rec.ext, resumed: true });
      return json({ error: 'trial_used', exp: rec.exp, ext: !!rec.ext }, 409);
    }
    const t = now();
    const fresh = { start: t, exp: t + TRIAL_DAYS * DAY, ext: false };
    await putTrial(env, key, fresh);
    return json({ token: await signToken(env, trialPayload(key, fresh)), exp: fresh.exp, ext: false });
  }

  if (url.pathname === '/plus/trial/vote') {
    const deviceId = String(d.deviceId || '').toLowerCase();
    const answer = d.answer === 'yes' ? 'yes' : d.answer === 'no' ? 'no' : null;
    if (!DEVICE_RE.test(deviceId) || !answer) return json({ error: 'bad_request' }, 400);
    const key = await trialKey(deviceId);
    const rec = await getTrial(env, key);
    if (!rec) return json({ error: 'no_trial' }, 409);
    if (rec.ext) return json({ error: 'already_extended', exp: rec.exp }, 409);
    if (rec.exp - now() > DAY) return json({ error: 'too_early', exp: rec.exp }, 409); // the question is asked at trial end
    // Anonymous: only the answer and coarse location go into the aggregate counters.
    const country = cleanCountry(request.cf && request.cf.country);
    await addVote(env, answer, cleanLocale(d.locale), country, cleanCity(d.city));
    // Separately, mark the hashed device record as extended (it never holds the answer).
    rec.ext = true;
    rec.exp = Math.max(now(), rec.exp) + EXTEND_DAYS * DAY;
    await putTrial(env, key, rec);
    return json({ token: await signToken(env, trialPayload(key, rec)), exp: rec.exp, ext: true });
  }

  if (url.pathname === '/plus/claim') {
    const claimId = String(d.claimId || '').toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(claimId)) return json({ error: 'bad_claim_id' }, 400);
    const sub = await sha256Hex('claim:' + claimId);
    const ent = await getEnt(env, sub);
    if (!ent || ent.exp < now()) return json({ pending: true }, 202);
    return json({ token: await signToken(env, tokenPayload(sub, ent)), plan: ent.plan, exp: ent.exp });
  }

  if (url.pathname === '/plus/redeem') {
    const code = String(d.code || '').trim().toUpperCase();
    const claimId = String(d.claimId || '').toLowerCase();
    if (!/^[0-9A-F]{5}-[0-9A-F]{5}$/.test(code) || !/^[a-f0-9]{32}$/.test(claimId)) return json({ error: 'bad_code' }, 400);
    const rec = await kv(env).get('plus:code:' + code, 'json');
    if (!rec) return json({ error: 'bad_code' }, 400);
    await kv(env).delete('plus:code:' + code); // single use (KV is eventually consistent; good enough for hand-issued codes)
    const r = await grant(env, claimId, rec.plan, now() + rec.days * DAY, 'manual');
    if (!r.ok) return json({ error: r.reason }, 400);
    const ent = await getEnt(env, r.sub);
    return json({ token: await signToken(env, tokenPayload(r.sub, ent)), plan: ent.plan, exp: ent.exp });
  }

  if (url.pathname === '/plus/verify') {
    const p = await verifyToken(env, d.token); // rejects any token past its exp, trial or paid
    if (!p) return json({ ok: false });
    if (p.src === 'trial') {
      const rec = String(p.sub).startsWith('plus:trial:') ? await getTrial(env, p.sub) : null;
      if (!rec || rec.exp <= now()) return json({ ok: false, expired: true });
      if (rec.exp > p.exp) return json({ ok: true, plan: 'trial', exp: rec.exp, token: await signToken(env, trialPayload(p.sub, rec)) });
      return json({ ok: true, plan: 'trial', exp: p.exp });
    }
    const ent = await getEnt(env, p.sub);
    if (ent && ent.revoked) return json({ ok: false, revoked: true });
    // renewal landed since this token was minted: hand back a fresher one
    if (ent && ent.exp > p.exp) return json({ ok: true, plan: ent.plan, exp: ent.exp, token: await signToken(env, tokenPayload(p.sub, ent)) });
    return json({ ok: true, plan: p.plan, exp: p.exp });
  }

  // STUB — Family sankalp circle (shared japa goal across family members).
  // Deliberately NOT implemented this sprint: it needs invite links that cannot be
  // guessed, per-member rate limits, abuse controls on shared display names, and a
  // KV write budget review (free tier: 1,000 writes/day). Planned shape:
  //   POST /plus/circle/create {token, goal}      -> {circleId, inviteCode}
  //   POST /plus/circle/join   {inviteCode, name} -> {circleId}
  //   POST /plus/circle/add    {circleId, count}  -> {total}
  // Creating a circle will require a verified Plus token; joining will be free.
  if (url.pathname.startsWith('/plus/circle/')) return json({ error: 'not_implemented', feature: 'family_circle' }, 501);

  return json({ error: 'not_found' }, 404);
}
