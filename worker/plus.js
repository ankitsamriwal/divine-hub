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
// WHAT IS NOT YET PROVEN
//  - No live Stripe/Razorpay account is connected. The event shapes handled below
//    follow the providers' documented payloads; test with the providers' webhook
//    test tools before taking real money (see docs/PAYMENTS.md).
//  - Storage uses env.PLUS_KV if bound, else the existing KHAU_KV namespace under
//    the "plus:" prefix. A dedicated namespace is recommended.
//
// Routes (all JSON):
//   POST /plus/claim            {claimId}                 -> {token} once paid
//   POST /plus/redeem           {code, claimId}           -> {token}
//   POST /plus/verify           {token}                   -> {ok, plan, exp, token?}
//   POST /plus/admin/issue      {plan, days, note}        -> {code}   (Bearer PLUS_ADMIN_KEY)
//   POST /plus/webhook/stripe   raw Stripe event          -> 200 after verified
//   POST /plus/webhook/razorpay raw Razorpay event        -> 200 after verified

const enc = new TextEncoder();
const DAY = 86400;
const GRACE_DAYS = 3;
const PLAN_DAYS = { monthly: 31, yearly: 366, manual: 366 };
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
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.PLUS_TOKEN_SECRET || !kv(env)) return json({ error: 'plus_not_configured' }, 503);

  // Webhooks: server-to-server, no Origin; authenticity comes from the signature.
  if (url.pathname === '/plus/webhook/stripe' || url.pathname === '/plus/webhook/razorpay') {
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
    const auth = request.headers.get('Authorization') || '';
    if (!env.PLUS_ADMIN_KEY || !safeEqual(auth, 'Bearer ' + env.PLUS_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
    let d; try { d = await request.json(); } catch (e) { d = {}; }
    const plan = ['monthly', 'yearly', 'manual'].includes(d.plan) ? d.plan : 'manual';
    const days = Math.min(Math.max(parseInt(d.days, 10) || PLAN_DAYS[plan], 1), 800);
    const raw = hex(crypto.getRandomValues(new Uint8Array(5))).toUpperCase(); // 40 bits, single use, 30-day TTL
    const code = raw.slice(0, 5) + '-' + raw.slice(5, 10);
    await kv(env).put('plus:code:' + code, JSON.stringify({ plan: plan, days: days, note: String(d.note || '').slice(0, 80), at: now() }), { expirationTtl: 30 * DAY });
    return json({ code: code, plan: plan, days: days });
  }

  // Browser routes: origin-locked and rate-limited.
  if (!allowedOrigin) return json({ error: 'forbidden_origin' }, 403);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (limited(ip, 30)) return json({ error: 'rate_limited' }, 429);
  let d; try { d = await request.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }

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
    const p = await verifyToken(env, d.token);
    if (!p) return json({ ok: false });
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
