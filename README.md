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
