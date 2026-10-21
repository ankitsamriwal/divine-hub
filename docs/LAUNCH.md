# Sankalp+ launch: free trial and demand test

Status: **code-ready, not live.** No secrets are in this repo and nothing is deployed by this PR.

**This release takes no payments** (owner decision). There is no payment gateway, no checkout link and no buy button. Sankalp+ is offered as a **7-day free trial with no card**, and at the end of the trial the app asks one anonymous question: would you pay the planned price? The Stripe and Razorpay code is still in the repo but **dormant** behind `PAYMENTS_ENABLED` (off by default). See "Switching payments on later" below.

## 1. The free trial

```
browser (plus.js)                                 Cloudflare worker (worker/plus.js)
-----------------                                 ----------------------------------
deviceId = random 128-bit hex
  (kept in localStorage + IndexedDB)
"Start 7-day free trial" ─ POST /plus/trial/start {deviceId} ─▶ key = plus:trial:<sha256("trial:"+deviceId)>
                                                    no record  -> create {start, exp: now+7d, ext:false}
                                                    live record -> re-issue token, same exp (never restarts)
                                                    expired     -> 409 trial_used
            ◀──────────── token = HMAC(PLUS_TOKEN_SECRET), plan "trial", exp = start+7d, no grace
daily POST /plus/verify {token} ──────────────────▶ signature + exp check, then the KV record must be live
```

- **Same signing as paid tokens** (`v1.<payload>.<sig>`, HMAC-SHA256 with `PLUS_TOKEN_SECRET`), with `plan: "trial"`, `src: "trial"` and a hard 7-day `exp` (no 3-day grace).
- **Rejected server-side after expiry**: `verifyToken` refuses any token past `exp`, and `/plus/verify` also requires the KV trial record to be live, so a token re-signed with a later `exp` still fails once the record has expired.
- **One trial per device ID.** The worker never stores the device ID. It stores `{start, exp, ext}` under a SHA-256 hash of it, kept for about 13 months. The browser keeps the ID in both localStorage and IndexedDB, so clearing local storage alone does not create a new ID or a new trial.
- **Limits (stated plainly):** a new device, a different browser, a private window, or "clear all site data" (which also wipes IndexedDB) produces a new device ID and **can get a new trial**. Accounts would be needed to stop that; at $0 risk this is accepted.
- **Expiry falls back to free.** When the trial ends the token is dropped, Plus-only features return to their free versions (one active sankalp goal, no city muhurat, and so on). **Nothing is deleted**: goals, journal entries, japa counts and settings stay.
- **UI:** the primary buttons on the Plus sheet and the Diwali banner/guide read **"Start 7-day free trial"**. During the trial the header shows **"Plus trial · N days left"**. Redeem codes still work.

## 2. The demand test

On the last day of the trial (Plus sheet), automatically once when the app is opened after the trial ends, and on the Plus sheet any time after expiry, the app shows:

> We plan to offer Sankalp+ at **$1.99/month** (**₹99/month** for India locale: `-IN` language or `Asia/Kolkata` time zone). Nothing is on sale yet and nothing will be charged. Would you pay for this?
> **[I'd pay for this]  [Not for me]**

`POST /plus/trial/vote {deviceId, answer: "yes"|"no", locale, city}`:

- **Recorded anonymously:** the worker increments one aggregate document `plus:votes:v1` = `{yes|no: {total, byLocale, byCountry, byCity}}`. Locale is normalised to `ll` or `ll-CC` (else `other`); country comes from Cloudflare's `request.cf.country` (2 letters, else `XX`); city must be one of the app's 14 city IDs (else `other`). **No email, name, IP, device ID, hash or timestamp is stored with a vote**, and there are no per-vote rows.
- **One-time extension:** the first answer from a device extends Plus by **7 days from now** (or from the old expiry if still live). This is tracked only as `ext: true` on the hashed device record, which never holds the answer. A second attempt returns `409 already_extended` and is **not counted again**.
- The question is accepted only in the last 24 hours of the trial or after it (`409 too_early` otherwise), and only from a device that had a trial (`409 no_trial`).
- KV is eventually consistent and the counter is read-modify-write, so two votes in the same instant can lose one increment. That is acceptable for a demand signal.

## 3. Admin stats endpoint

```bash
# key is read from your shell; never paste it into a chat, issue or commit
curl -s https://divine-guide.ankitsamriwal.workers.dev/plus/admin/stats \
  -H "Authorization: Bearer $PLUS_ADMIN_KEY"
```

Returns `401` without the right key (the comparison is constant-time: both sides are SHA-256 hashed, then compared with `safeEqual`). With it:

```json
{
  "generatedAt": "2026-11-15T08:00:00.000Z",
  "paymentsEnabled": false,
  "trials": { "starts": 3, "active": 2, "expired": 1, "extended": 2 },
  "votes": {
    "yes": { "total": 1, "byLocale": {"en-AE": 1}, "byCountry": {"AE": 1}, "byCity": {"dubai": 1} },
    "no":  { "total": 1, "byLocale": {"other": 1}, "byCountry": {"GB": 1}, "byCity": {"other": 1} }
  }
}
```

- `starts` = trial records (one per device), `active` = not yet expired (including extended), `expired` = past expiry, `extended` = devices that answered the question and received the extra 7 days.
- Trial counts come from KV `list()` metadata (one list call per 1,000 trials, so no per-record reads). Records expire from KV after about 13 months, so `starts` is a rolling count.
- KV free tier allows 1,000 writes a day: each trial start is 1 write and each vote is 2. Watch this if usage grows.

## 4. Environment variables

### Cloudflare worker secrets (never commit these)

Set each as a GitHub Actions secret in `ankitsamriwal/divine-hub`. `deploy-worker.yml` pushes it with `wrangler secret put` and skips any that are empty. You can also run `npx wrangler secret put NAME --name divine-guide`.

| Name | Needed now? | What it is | How to generate |
|---|---|---|---|
| `PLUS_TOKEN_SECRET` | **yes**: every `/plus/*` route except webhooks returns 503 without it | HMAC key that signs trial and paid tokens | `openssl rand -base64 48` (rotating it ends every live trial until the user taps the trial button again, which re-issues the same expiry) |
| `PLUS_ADMIN_KEY` | **yes**, for `/plus/admin/stats` and redeem codes | Bearer key for the admin routes | `openssl rand -hex 32` |
| `STRIPE_WEBHOOK_SECRET` | no (payments off) | Stripe endpoint signing secret | Only when switching payments on |
| `RAZORPAY_WEBHOOK_SECRET` | no (payments off) | Razorpay webhook secret | Only when switching payments on |

### Worker vars (not secret; `[vars]` in `worker/wrangler.toml`)

| Name | Value now | Purpose |
|---|---|---|
| `PAYMENTS_ENABLED` | `"false"` | Must be exactly `"true"` to enable `/plus/webhook/stripe` and `/plus/webhook/razorpay`. Anything else returns 404 on those routes. |
| `PLUS_EXTRA_PRICES` | unset | Payments only: maps extra currency amounts to plans, for example `{"aed":{"799":"monthly","5499":"yearly"}}`. |

### KV storage

`PLUS_KV` if bound, otherwise the existing `KHAU_KV` under the `plus:` prefix. Keys used: `plus:trial:<hash>` (trial records), `plus:votes:v1` (vote counters), `plus:code:<code>` (redeem codes), plus `plus:ent:*` and `plus:sub:*` (payments only). **Recommended:** a dedicated namespace (`npx wrangler kv namespace create PLUS_KV`) added to `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PLUS_KV"
id = "<id from the command>"
```

### Public site config (`config.js`, safe to commit)

| Key | Value now |
|---|---|
| `PAYMENTS_ENABLED` | `false`: no prices with buy buttons and no checkout links are rendered; the payment links below are ignored |
| `PRICE_MONTHLY_USD` / `PRICE_MONTHLY_INR` | `$1.99` / `₹99`: the planned price shown in the demand test |
| `STRIPE_LINK_*`, `RAZORPAY_LINK_*` | empty and unused while payments are off |

## 5. Manual redeem codes (still available)

```bash
curl -s -X POST https://divine-guide.ankitsamriwal.workers.dev/plus/admin/issue \
  -H "Authorization: Bearer $PLUS_ADMIN_KEY" -H 'Content-Type: application/json' \
  -d '{"plan":"manual","days":30,"note":"tester"}'
# -> {"code":"1A2B3-C4D5E","plan":"manual","days":30}
```

Codes are single-use and expire after 30 days if not redeemed. Use them for testers or friends; no money is involved.

## 6. Switching payments on later

Only after the demand test says it is worth it, and as its own reviewed PR:

1. Create the provider products and links (checklist below), and set `STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET`.
2. Put the four public links into `config.js`.
3. Set `PAYMENTS_ENABLED: true` in `config.js` **and** `PAYMENTS_ENABLED = "true"` under `[vars]` in `worker/wrangler.toml`. Keep the two in step: the client flag shows prices and checkout, and the worker flag opens the webhook routes.
4. Bump the cache version (`?v=` in `index.html` and `sw.js`) so browsers pick up the new `config.js`.
5. Test end to end in Stripe and Razorpay **test mode** before taking real money. The trial keeps working alongside paid plans: the Plus sheet then shows the trial button, the prices and the restore-key path.

### How paid entitlement works

```
browser (plus.js)                     Cloudflare worker (worker/plus.js)            provider
-----------------                     ----------------------------------            --------
claimId = random 128-bit hex
click price  ───────────────────────────────────────────────────────────────────▶ payment link
  (Stripe: ?client_reference_id=claimId; Razorpay: ?claim_id=claimId)              user pays
                                      POST /plus/webhook/{stripe|razorpay}  ◀────── signed event
                                      verify signature with *_WEBHOOK_SECRET
                                      KV: plus:ent:<sha256(claimId)> = {plan, exp}
POST /plus/claim {claimId} ─────────▶ returns token = HMAC(PLUS_TOKEN_SECRET)
store token in localStorage
daily POST /plus/verify {token} ────▶ ok / refreshed token after renewal / ok:false
```

- **Routing** (Ankit's decision): India (INR locale or `Asia/Kolkata` time zone) → **Razorpay** at ₹99/month, ₹699/year. Everyone else, USD/AED diaspora included → **Stripe** at $1.99/month, $14.99/year. Users can switch currency in the sheet.
- **Tokens** are `v1.<payload>.<sig>`, signed with HMAC-SHA256, with `exp` set to the paid period plus a 3-day grace. The browser can read a token but cannot forge one.
- **Manual unlock** (bank transfer, gifts, support): the owner mints a single-use code, and the user types it in the sheet under "Have a redeem code?".
- **Legacy unlocks**: devices unlocked with the retired client-side `XXXX-XXXX` code keep Plus on that device ("grandfathered"). New old-style codes are rejected, and the user is told to email for a redeem code.

### Provider setup checklist (Ankit, by hand)

#### Stripe (USD, diaspora)
1. Create a product "Sankalp+" with two recurring prices: **$1.99/month** and **$14.99/year**. To charge AED instead, add AED prices and set `PLUS_EXTRA_PRICES`.
2. Create a **Payment Link** for each price. Under "After payment" you may redirect to `https://roadtodivinity.vercel.app/#plus`.
3. Optional but recommended: in each link's metadata, add `plan=monthly` or `plan=yearly`. Stripe copies Payment Link metadata to the Checkout Session.
4. Webhooks → Add endpoint `https://divine-guide.ankitsamriwal.workers.dev/plus/webhook/stripe` with the events `checkout.session.completed` and `invoice.paid`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Put the two link URLs into `config.js`.

#### Razorpay (INR, India)
1. Create a **Payment Page** (or Subscription link) for ₹99/month and one for ₹699/year. Add an input field with the exact name **`claim_id`** (it can be hidden or prefilled). The app opens the page with `?claim_id=<id>`, and Razorpay stores it in `payment.notes.claim_id`. Verify this prefill behaviour in test mode before going live; if your page type does not prefill from the URL, use Payment Links created per user through the API instead (a future change).
2. Optional: add a fixed note `plan=monthly` or `plan=yearly`.
3. Settings → Webhooks → URL `https://divine-guide.ankitsamriwal.workers.dev/plus/webhook/razorpay`, with the events `payment_link.paid`, `payment.captured` and `subscription.charged`, and a secret that you then copy into `RAZORPAY_WEBHOOK_SECRET`.
4. Put the two link URLs into `config.js`.

### Payment security notes
- Webhooks are verified before parsing: Stripe uses `t`/`v1` HMAC-SHA256 with a 5-minute replay tolerance, and Razorpay uses hex HMAC-SHA256 of the raw body. Both use constant-time comparison.
- The claim ID acts as a restore key, so it is shown only on demand.
- Stripe Tax and Indian GST invoicing are not handled here; configure them in each provider's dashboard.

## Security notes (this release)
- No secret is in the repo. `config.js` holds only public values.
- Browser routes (`/plus/trial/*`, `/plus/claim`, `/plus/redeem`, `/plus/verify`) are CORS-locked to the allowed origins and rate-limited per isolate (best effort, 30 per 10 minutes per IP; the IP is held in memory only and never written to KV).
- **Client-side gating limit:** features that run fully in the browser (unlimited goals, timelines, city muhurat) are gated in JS and can be bypassed by someone editing code. At this price point that is acceptable. Any future server-backed Plus feature must verify the token in the worker.
- **Trial abuse:** one trial per device ID, not per person (see the limits above). The worst case is free Plus features that cost nothing to serve.
- **Vote stuffing:** each vote needs a device that had a trial, and each device can vote once, but someone who scripts many fresh device IDs could inflate the counts. Read the numbers as a signal, not a census.
- **Pre-existing, not changed here:** `PUSH_KEY` in `worker/worker.js`, `panchang.js` and `sw.js` is a hardcoded shared key that ships to every browser. It gates the push-reminder routes only. Consider replacing it with a per-subscription token.
