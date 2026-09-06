/* Divine Hub — app logic: grid, filters, prayer view, TTS, guide chatbot */

(function () {
  'use strict';

  const grid = document.getElementById('prayerGrid');
  const filterNav = document.getElementById('deityFilter');
  const searchInput = document.getElementById('searchInput');
  const prayerView = document.getElementById('prayerView');
  const prayerContent = document.getElementById('prayerContent');
  const closePrayerBtn = document.getElementById('closePrayer');

  let activeDeity = 'All';
  let searchQuery = '';

  const deityOrder = ['All', 'Ganesh', 'Hanuman', 'Shiv', 'Lakshmi', 'Vishnu', 'Krishna', 'Durga', 'Saraswati'];

  /* ---------- filter chips ---------- */
  deityOrder.forEach(d => {
    const b = document.createElement('button');
    b.className = 'chip' + (d === 'All' ? ' active' : '');
    b.textContent = d === 'All' ? 'All' : d;
    b.setAttribute('aria-pressed', d === 'All');
    b.addEventListener('click', () => {
      activeDeity = d;
      filterNav.querySelectorAll('.chip').forEach(c => {
        const on = c.textContent === d || (d === 'All' && c.textContent === 'All');
        c.classList.toggle('active', c === b);
        c.setAttribute('aria-pressed', c === b);
      });
      renderGrid();
    });
    filterNav.appendChild(b);
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderGrid();
  });

  /* ---------- grid ---------- */
  function prayerMatches(p) {
    if (activeDeity !== 'All' && p.deity !== activeDeity) return false;
    if (!searchQuery) return true;
    const hay = [p.title, p.titleDev, p.deity, p.deityDev, p.type, p.about, (p.keywords || []).join(' '),
      p.stanzas.map(s => s.translit.join(' ') + ' ' + s.dev.join(' ')).join(' ')].join(' ').toLowerCase();
    return hay.includes(searchQuery);
  }

  function renderGrid() {
    grid.innerHTML = '';
    const list = PRAYERS.filter(prayerMatches);
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No prayers match. Try another deity or search term.</div>';
      return;
    }
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', p.title);
      const firstLines = p.stanzas[0].dev.slice(0, 2).join('<br>');
      const verseCount = p.stanzas.length;
      card.innerHTML = `
        <div class="card-tags">
          <span class="tag">${p.deityDev} · ${p.deity}</span>
          <span class="tag type">${p.type}</span>
        </div>
        <h3>${p.title}</h3>
        <div class="card-dev">${firstLines}</div>
        <div class="card-meta">${verseCount} verse${verseCount === 1 ? '' : 's'} · ${p.lang === 'sa' ? 'Sanskrit' : 'Hindi'}</div>`;
      card.addEventListener('click', () => openPrayer(p.id));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPrayer(p.id); } });
      grid.appendChild(card);
    });
  }

  /* ---------- prayer view ---------- */
  let currentPrayer = null;
  let currentTab = 'dev';

  function openPrayer(id) {
    const p = PRAYERS.find(x => x.id === id);
    if (!p) return;
    currentPrayer = p;
    currentTab = 'dev';
    renderPrayerView();
    prayerView.hidden = false;
    document.body.style.overflow = 'hidden';
    prayerView.scrollTop = 0;
  }

  function closePrayer() {
    stopSpeech();
    prayerView.hidden = true;
    document.body.style.overflow = '';
    currentPrayer = null;
  }
  closePrayerBtn.addEventListener('click', closePrayer);
  prayerView.addEventListener('click', e => { if (e.target === prayerView) closePrayer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !prayerView.hidden) closePrayer(); });

  function renderPrayerView() {
    const p = currentPrayer;
    const langLabel = p.lang === 'sa' ? 'Sanskrit' : 'Hindi';
    prayerContent.innerHTML = `
      <div class="pv-deity">${p.deityDev} · ${p.deity} — ${p.type}</div>
      <h2 class="pv-title">${p.title}</h2>
      <div class="pv-title-dev">${p.titleDev}</div>
      <p class="pv-about">${p.about}</p>
      <div class="listen-bar">
        <span class="listen-label">Listen</span>
        <select id="ttsLang" aria-label="Narration language">
          <option value="dev">${langLabel} (original text)</option>
          <option value="translit">Transliteration (sounds like the original)</option>
          <option value="meaning">English (the meaning)</option>
        </select>
        <button id="ttsPlay">▶ Play</button>
        <button id="ttsStop" class="stop">■ Stop</button>
        <span class="rate-wrap">pace <input type="range" id="ttsRate" min="60" max="110" value="88"></span>
        <span class="listen-note" id="ttsNote"></span>
      </div>
      <div class="text-tabs">
        <button class="text-tab active" data-tab="dev">देवनागरी</button>
        <button class="text-tab" data-tab="translit">Transliteration</button>
        <button class="text-tab" data-tab="meaning">Meaning (English)</button>
      </div>
      <div id="stanzaWrap"></div>`;

    renderStanzas();

    prayerContent.querySelectorAll('.text-tab').forEach(t => {
      t.addEventListener('click', () => {
        currentTab = t.dataset.tab;
        prayerContent.querySelectorAll('.text-tab').forEach(x => x.classList.toggle('active', x === t));
        renderStanzas();
      });
    });

    document.getElementById('ttsPlay').addEventListener('click', speakCurrent);
    document.getElementById('ttsStop').addEventListener('click', stopSpeech);
    document.getElementById('ttsLang').addEventListener('change', stopSpeech);
  }

  function renderStanzas() {
    const p = currentPrayer;
    const wrap = document.getElementById('stanzaWrap');
    wrap.innerHTML = '';
    p.stanzas.forEach(s => {
      const div = document.createElement('div');
      if (currentTab === 'dev') {
        div.className = 'stanza stanza-dev';
        div.innerHTML = s.dev.map(l => `<div>${l}</div>`).join('');
      } else if (currentTab === 'translit') {
        div.className = 'stanza stanza-translit';
        div.innerHTML = '<span class="m-label">Transliteration</span>' + s.translit.map(l => `<div>${l}</div>`).join('');
      } else {
        div.className = 'stanza stanza-meaning';
        div.innerHTML = '<span class="m-label">Meaning</span><div>' + s.meaning + '</div>';
      }
      wrap.appendChild(div);
    });
  }

  /* ---------- text to speech (Web Speech API) ---------- */
  const synth = window.speechSynthesis || null;
  let voices = [];
  function loadVoices() { if (synth) voices = synth.getVoices(); }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  function pickVoice(pref) {
    if (!voices.length) loadVoices();
    const norm = v => (v.lang || '').toLowerCase();
    if (pref === 'hi') {
      return voices.find(v => norm(v).startsWith('hi'))
        || voices.find(v => norm(v).startsWith('sa'))
        || voices.find(v => norm(v) === 'en-in')
        || null;
    }
    return voices.find(v => norm(v) === 'en-in')
      || voices.find(v => norm(v).startsWith('en'))
      || null;
  }

  function stopSpeech() {
    if (synth) synth.cancel();
    const note = document.getElementById('ttsNote');
    if (note) note.textContent = '';
  }

  function speakCurrent() {
    if (!currentPrayer) return;
    if (!synth) {
      document.getElementById('ttsNote').textContent = 'Audio narration is not supported in this browser.';
      return;
    }
    synth.cancel();
    const mode = document.getElementById('ttsLang').value;
    const rate = document.getElementById('ttsRate').value / 100;
    const p = currentPrayer;
    let text, voicePref, langTag;
    if (mode === 'meaning') {
      text = p.stanzas.map(s => s.meaning).join(' ');
      voicePref = 'en'; langTag = 'en-IN';
    } else if (mode === 'translit') {
      text = p.stanzas.map(s => s.translit.join(' ')).join(' ');
      voicePref = 'hi'; langTag = 'hi-IN';
    } else {
      text = p.stanzas.map(s => s.dev.join(' ')).join(' ');
      voicePref = 'hi'; langTag = 'hi-IN';
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langTag;
    u.rate = rate;
    u.pitch = 1;
    const v = pickVoice(voicePref);
    if (v) u.voice = v;
    const note = document.getElementById('ttsNote');
    if (voicePref === 'hi' && v && !(v.lang || '').toLowerCase().startsWith('hi') && !(v.lang || '').toLowerCase().startsWith('sa')) {
      note.textContent = 'No Hindi voice found on this device — falling back to an English voice. For best results open in Chrome or Edge, which ship Hindi voices.';
    } else {
      note.textContent = v ? ('Narrating with: ' + v.name) : '';
    }
    synth.speak(u);
  }

  /* ---------- guide chatbot (on-device, no keys) ---------- */
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const messages = document.getElementById('chatMessages');
  const chips = document.getElementById('chatChips');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  let chatOpened = false;

  fab.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden && !chatOpened) {
      chatOpened = true;
      botSay('नमस्ते 🙏 I am the Divine Guide. Ask me about any prayer here — its meaning, its deity, when it is sung — or about the deities themselves.');
      renderChips(CHAT_SUGGESTIONS);
    }
    if (!panel.hidden) input.focus();
  });
  chatClose.addEventListener('click', () => { panel.hidden = true; });

  function renderChips(list) {
    chips.innerHTML = '';
    list.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', () => { input.value = q; form.dispatchEvent(new Event('submit')); });
      chips.appendChild(b);
    });
  }

  function botSay(text) {
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }
  function userSay(text) {
    const d = document.createElement('div');
    d.className = 'msg user';
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'for', 'and', 'or', 'what', 'which', 'who', 'me', 'my', 'i', 'about', 'tell', 'show', 'do', 'does', 'it', 'this', 'that', 'ki', 'ka', 'ke', 'hai', 'kya']);

  function tokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ').split(/\s+/).filter(t => t && !STOPWORDS.has(t));
  }

  function findDeity(q) {
    const ql = q.toLowerCase();
    for (const [name, d] of Object.entries(DEITIES)) {
      if (d.aliases.some(a => ql.includes(a)) || ql.includes(d.dev)) return name;
    }
    return null;
  }

  function scorePrayer(p, qTokens, qRaw) {
    let score = 0;
    const title = p.title.toLowerCase();
    if (qRaw.includes(title) || title.includes(qRaw.trim())) score += 8;
    for (const t of qTokens) {
      if (title.includes(t)) score += 4;
      if ((p.keywords || []).some(k => k.includes(t) || t.includes(k))) score += 3;
      if (p.deity.toLowerCase().includes(t)) score += 2;
      if (p.about.toLowerCase().includes(t)) score += 1;
      if (p.type.toLowerCase().includes(t)) score += 1;
      if (p.stanzas.some(s => s.meaning.toLowerCase().includes(t))) score += 1;
    }
    return score;
  }

  function botAnswer(q) {
    const qRaw = q.toLowerCase().trim();
    const qTokens = tokens(q);

    if (/^(hi|hii+|hello|hey|namaste|namaskar|jai shri|ram ram|pranam)\b/.test(qRaw)) {
      return 'नमस्ते 🙏 How may I help? You can ask about a prayer ("Hanuman Chalisa meaning"), a deity ("tell me about Lakshmi"), or an occasion ("which aarti for Diwali?").';
    }
    if (/(thank|dhanyavad|shukriya)/.test(qRaw)) return 'You are most welcome. 🙏 May your prayers bear fruit.';
    if (/(who are you|what are you)/.test(qRaw)) return 'I am the Divine Guide — a small on-device helper for this collection. I answer from the prayers and deity notes housed here; nothing leaves your browser.';

    const occasionMap = [
      { words: ['diwali', 'deepavali', 'dhanteras'], ids: ['om-jai-lakshmi-mata', 'mahalakshmi-ashtakam'], note: 'For Diwali and Dhanteras, Lakshmi is worshipped: ' },
      { words: ['janmashtami', 'gokulashtami'], ids: ['aarti-kunj-bihari-ki'], note: 'For Janmashtami, the aarti of Krishna: ' },
      { words: ['shivratri', 'shivaratri', 'mahashivratri', 'shravan', 'sawan', 'monday'], ids: ['om-jai-shiv-omkara', 'shiva-tandava-stotram', 'lingashtakam'], note: 'For Shiva worship — Mahashivratri, Shravan, Mondays: ' },
      { words: ['navratri', 'navaratri', 'durga puja'], ids: ['jai-ambe-gauri'], note: 'For Navratri and Durga Puja: ' },
      { words: ['ganesh chaturthi', 'chaturthi', 'new beginning', 'new venture', 'new job', 'exam'], ids: ['jai-ganesh-deva', 'ganesh-mantras'], note: 'Ganesh is invoked before every new beginning: ' },
      { words: ['tuesday', 'saturday', 'hanuman jayanti'], ids: ['hanuman-chalisa', 'hanuman-aarti'], note: 'For Hanuman — Tuesdays, Saturdays, Hanuman Jayanti: ' },
      { words: ['vasant panchami', 'basant panchami', 'study', 'studies', 'learning', 'music'], ids: ['saraswati-vandana'], note: 'For learning, music and Vasant Panchami: ' },
      { words: ['friday'], ids: ['om-jai-lakshmi-mata'], note: 'Friday evening is Lakshmi\'s time: ' }
    ];
    for (const o of occasionMap) {
      if (o.words.some(w => qRaw.includes(w))) {
        const names = o.ids.map(id => PRAYERS.find(p => p.id === id)).filter(Boolean).map(p => '• ' + p.title + ' (' + p.titleDev + ')').join('\n');
        return o.note + '\n' + names + '\n\nOpen any of them from the grid to read the full text, meaning, or listen aloud.';
      }
    }

    const needMap = [
      { words: ['strength', 'courage', 'fear', 'afraid', 'protection', 'strong', 'power'], ids: ['hanuman-chalisa'], why: 'For strength, courage and protection from fear, devotees turn to Hanuman — Sankat Mochan, the remover of troubles.' },
      { words: ['obstacle', 'block', 'stuck', 'success', 'start', 'begin'], ids: ['jai-ganesh-deva', 'ganesh-mantras'], why: 'For the removal of obstacles and success in new undertakings, Ganesh — Vighnaharta — is invoked first.' },
      { words: ['wealth', 'money', 'prosperity', 'fortune', 'rich'], ids: ['om-jai-lakshmi-mata', 'mahalakshmi-ashtakam'], why: 'For wealth and prosperity, the prayers of Goddess Lakshmi.' },
      { words: ['wisdom', 'knowledge', 'intelligence', 'memory', 'concentration'], ids: ['saraswati-vandana', 'ganesh-mantras'], why: 'For wisdom and learning, Saraswati and Ganesh are the patrons.' },
      { words: ['peace', 'calm', 'mind', 'stress', 'anxiety', 'meditation'], ids: ['shiva-tandava-stotram', 'lingashtakam'], why: 'For stillness of mind, devotees meditate on Shiva — the great yogi — and chant his stotrams.' },
      { words: ['surrender', 'refuge', 'devotion', 'bhakti'], ids: ['om-jai-jagdish-hare'], why: 'Om Jai Jagdish Hare is the classic prayer of complete surrender — You are my mother and my father.' }
    ];
    for (const n of needMap) {
      if (n.words.some(w => qRaw.includes(w))) {
        const names = n.ids.map(id => PRAYERS.find(p => p.id === id)).filter(Boolean).map(p => '• ' + p.title).join('\n');
        return n.why + '\n\nRecommended here:\n' + names;
      }
    }

    const deity = findDeity(q);
    const scored = PRAYERS.map(p => ({ p, s: scorePrayer(p, qTokens, qRaw) })).sort((a, b) => b.s - a.s);
    const best = scored[0];

    if (best && best.s >= 6) {
      const p = best.p;
      let out = p.title + ' (' + p.titleDev + ') — a ' + p.type.toLowerCase() + ' of ' + p.deity + '.\n\n' + p.about;
      if (/(mean|meaning|arth|matlab)/.test(qRaw)) {
        out += '\n\nA taste of the meaning — ' + p.stanzas[0].meaning;
      }
      out += '\n\nOpen "' + p.title + '" from the grid for the full text, transliteration, meaning and audio.';
      return out;
    }

    if (deity) {
      const d = DEITIES[deity];
      const theirPrayers = PRAYERS.filter(p => p.deity === deity).map(p => '• ' + p.title + ' — ' + p.type).join('\n');
      return d.blurb + '\n\nPrayers of ' + deity + ' in this collection:\n' + theirPrayers;
    }

    if (/(list|all|what.*(prayer|aarti|have))/.test(qRaw)) {
      return 'This collection holds:\n' + PRAYERS.map(p => '• ' + p.title + ' (' + p.deity + ')').join('\n');
    }

    return 'I could not place that one. Try asking about a deity (Hanuman, Ganesh, Shiv, Lakshmi, Vishnu, Krishna, Durga, Saraswati), a prayer by name, an occasion like Diwali or Navratri, or a need — strength, wisdom, prosperity, peace.';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    userSay(q);
    input.value = '';
    setTimeout(() => botSay(botAnswer(q)), 250);
  });

  renderGrid();
})();
