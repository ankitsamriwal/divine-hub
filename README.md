# Divine Hub

A serene, single-page web app of sacred Hindu prayers — aartis, chalisas, stotrams and mantras — with:

- Original Devanagari text, readable transliteration, and full English meaning for every verse
- Browse and filter by deity (Ganesh, Hanuman, Shiv, Lakshmi, Vishnu, Krishna, Durga, Saraswati)
- Listen mode: in-browser narration of the original text or its meaning via the Web Speech API (Hindi voices ship with Chrome/Edge)
- Divine Guide: an on-device chatbot that answers questions about the prayers, meanings, deities and occasions — no API key, nothing leaves the browser

## Run

Static site — no build. Serve the folder or open `index.html`:

```
python3 -m http.server
```

## Texts

All prayers are centuries-old traditional works in the public domain, compiled against widely sung canonical versions. Regional variations in wording exist.

## Stack

Vanilla HTML/CSS/JS. Fonts: Space Grotesk, Space Mono, Tiro Devanagari Hindi (Google Fonts). Audio: Web Speech API. Chat: local retrieval over the bundled corpus. $0 to run.
