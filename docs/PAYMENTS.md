# Sankalp+ payments and entitlement

Status: **code-ready, not live.** No provider account is connected and no secrets are in this repo. Until the steps below are done, the Plus sheet shows prices, says "online checkout opens very soon", and keeps the email request path working.

## How it works

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

## Environment variables

### Cloudflare worker secrets (never commit these)

Set each as a GitHub Actions secret in `ankitsamriwal/divine-hub`. `deploy-worker.yml` pushes it to the worker with `wrangler secret put` and skips any that are empty. You can also set one directly with `npx wrangler secret put NAME --name divine-guide`.

| Name | Required | What it is | How to generate |
|---|---|---|---|
| `PLUS_TOKEN_SECRET` | **yes** (Plus routes return 503 without it) | HMAC key that signs entitlement tokens | `openssl rand -base64 48` (rotating it logs every subscriber out until their next `/plus/claim`) |
| `PLUS_ADMIN_KEY` | for manual codes | Bearer key for `/plus/admin/issue` | `openssl rand -hex 32` |
| `STRIPE_WEBHOOK_SECRET` | for Stripe | `whsec_…` signing secret of the webhook endpoint | Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret |
| `RAZORPAY_WEBHOOK_SECRET` | for Razorpay | Secret you type when creating the webhook | Razorpay Dashboard → Settings → Webhooks (choose a long random string) |

### Optional worker var (not secret)

| Name | Purpose |
|---|---|
| `PLUS_EXTRA_PRICES` | JSON that maps extra currency amounts (minor units) to plans when the event has no `plan` metadata, for example `{"aed":{"799":"monthly","5499":"yearly"}}`. USD 199/1499 and INR 9900/69900 are built in. Set it under `[vars]` in `wrangler.toml` or in the dashboard. |

### KV storage

The service uses `PLUS_KV` if bound, otherwise the existing `KHAU_KV` namespace under the `plus:` prefix. **Recommended:** create a dedicated namespace (`npx wrangler kv namespace create PLUS_KV`) and add it to `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PLUS_KV"
id = "<id from the command>"
```

### Public site config (`config.js`, safe to commit)

| Key | Value |
|---|---|
| `STRIPE_LINK_MONTHLY` | Stripe Payment Link for the $1.99/month subscription |
| `STRIPE_LINK_YEARLY` | Stripe Payment Link for the $14.99/year subscription |
| `RAZORPAY_LINK_MONTHLY` | Razorpay Payment Page or Subscription link for ₹99/month |
| `RAZORPAY_LINK_YEARLY` | Razorpay Payment Page or Subscription link for ₹699/year |
| `WORKER_URL` | Already set to `https://divine-guide.ankitsamriwal.workers.dev` |

Payment links are public URLs, not secrets.

## Provider setup checklist (Ankit, by hand)

### Stripe (USD, diaspora)
1. Create a product "Sankalp+" with two recurring prices: **$1.99/month** and **$14.99/year**. To charge AED instead, add AED prices and set `PLUS_EXTRA_PRICES`.
2. Create a **Payment Link** for each price. Under "After payment" you may redirect to `https://roadtodivinity.vercel.app/#plus`.
3. Optional but recommended: in each link's metadata, add `plan=monthly` or `plan=yearly`. Stripe copies Payment Link metadata to the Checkout Session.
4. Webhooks → Add endpoint `https://divine-guide.ankitsamriwal.workers.dev/plus/webhook/stripe` with the events `checkout.session.completed` and `invoice.paid`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Put the two link URLs into `config.js`.

### Razorpay (INR, India)
1. Create a **Payment Page** (or Subscription link) for ₹99/month and one for ₹699/year. Add an input field with the exact name **`claim_id`** (it can be hidden or prefilled). The app opens the page with `?claim_id=<id>`, and Razorpay stores it in `payment.notes.claim_id`. Verify this prefill behaviour in test mode before going live; if your page type does not prefill from the URL, use Payment Links created per user through the API instead (a future change).
2. Optional: add a fixed note `plan=monthly` or `plan=yearly`.
3. Settings → Webhooks → URL `https://divine-guide.ankitsamriwal.workers.dev/plus/webhook/razorpay`, with the events `payment_link.paid`, `payment.captured` and `subscription.charged`, and a secret that you then copy into `RAZORPAY_WEBHOOK_SECRET`.
4. Put the two link URLs into `config.js`.

## Operating it

Mint a manual redeem code (owner only; the key is read from your shell, never pasted into a chat or issue):

```bash
curl -s -X POST https://divine-guide.ankitsamriwal.workers.dev/plus/admin/issue \
  -H "Authorization: Bearer $PLUS_ADMIN_KEY" -H 'Content-Type: application/json' \
  -d '{"plan":"yearly","days":366,"note":"SP-ABC123 bank transfer"}'
# -> {"code":"1A2B3-C4D5E","plan":"yearly","days":366}
```

Codes are single-use and expire after 30 days if not redeemed.

**Test before going live** (Stripe test mode / Razorpay test mode):
1. `stripe trigger checkout.session.completed` does **not** carry your claim ID. Instead, open the test Payment Link with `?client_reference_id=<32 hex>` and pay with a test card.
2. Call `POST /plus/claim {"claimId":"<same>"}` from the site origin. It should return a token.
3. A forged or edited token sent to `/plus/verify` should return `{"ok":false}`.

## Security notes
- No secret is in the repo. `config.js` holds only public links and prices.
- Webhooks are verified before parsing: Stripe uses `t`/`v1` HMAC-SHA256 with a 5-minute replay tolerance, Razorpay uses hex HMAC-SHA256 of the raw body. Both use constant-time comparison.
- Browser routes (`/plus/claim`, `/plus/redeem`, `/plus/verify`) are CORS-locked to the allowed origins and rate-limited per isolate (best effort).
- The claim ID acts as a restore key. Anyone holding it can activate the same subscription, so it is shown only on demand.
- **Client-side gating limit:** features that run fully in the browser (unlimited goals, timelines, city muhurat) are gated in JS and can be bypassed by someone editing code. That is acceptable at $2. Any future server-backed Plus feature (family circle) must verify the token in the worker.
- **Pre-existing issue, not changed in this PR:** `PUSH_KEY` in `worker/worker.js`, `panchang.js` and `sw.js` is a hardcoded shared key that ships to every browser, so it is not a secret. It gates the push-reminder routes only. Consider replacing it with a per-subscription token.
- Stripe Tax and Indian GST invoicing are not handled here. Configure them in each provider's dashboard.
