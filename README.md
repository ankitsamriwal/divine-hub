# Divine Hub

A serene, single-page web app of sacred Hindu prayers — aartis, chalisas, stotrams and mantras — with:

- Original Devanagari text, readable transliteration, and full English meaning for every verse
- Browse and filter by deity (Ganesh, Hanuman, Shiv, Lakshmi, Vishnu, Krishna, Durga, Saraswati)
- Japa counter: a digital mala with 21 / 108 / custom rounds, a bead ring that fills as you count, soft tick and completion bell, haptics on mobile, daily streaks (stored locally), and an experimental auto-listen mode using on-device speech recognition
- Listen mode: in-browser narration of the original text or its meaning via the Web Speech API (Hindi voices ship with Chrome/Edge)
- Divine Guide chatbot: on-device by default (no key, nothing leaves the browser). Add a free Gemini API key (Google AI Studio) in the Guide's settings for fully conversational answers grounded in the corpus; falls back to the on-device guide automatically. Store the key only in the browser and restrict it by HTTP referrer to this site

## Run

Static site — no build. Serve the folder or open `index.html`:

```
python3 -m http.server
```

## Texts

All prayers are centuries-old traditional works in the public domain, compiled against widely sung canonical versions. Regional variations in wording exist.

## Stack

Vanilla HTML/CSS/JS. Fonts: Space Grotesk, Space Mono, Tiro Devanagari Hindi (Google Fonts). Audio: Web Speech API. Chat: local retrieval over the bundled corpus. Japa: localStorage streaks, WebAudio chimes, Web Speech recognition. $0 to run.

## Sankalp+ (paid tier)

$1.99/month or $14.99/year (₹99 / ₹699 in India). Entitlement is a token signed by the Cloudflare worker (`worker/plus.js`); the browser never holds a signing secret. Checkout routes India to Razorpay and everyone else to Stripe. Setup, env vars and test steps: [docs/PAYMENTS.md](docs/PAYMENTS.md). What is stored and how to delete it: [privacy.html](privacy.html).

Free forever: all prayer texts, the japa counter, the tithi panchang and the Diwali guide. Plus: daily city muhurat for diaspora cities and Indian metros (`muhurat.js`), festival calendar alerts, and the existing Sankalp extras. The family sankalp circle is a marked stub (`/plus/circle/*` returns 501).

## Hosting hygiene

`.vercelignore` keeps `assets/*.apk`, `assets/*.zip`, `worker/`, `docs/` and `.github/` out of the Vercel deployment. The files remain in git history. GitHub Pages, if still enabled for this repo, serves the whole tree; disable it or move those files to another repo to stop serving them there.
