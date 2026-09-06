/* Divine Hub — app logic: grid, filters, prayer view, TTS, guide chatbot */

(function () {
  /* opening intro: once per session, tap to skip */
  (function intro() {
    const el = document.getElementById('intro');
    if (!el) return;
    try { sessionStorage.setItem('dh_intro_seen', '1'); } catch (e) {}
    const dismiss = () => { el.style.animation = 'none'; el.style.transition = 'opacity .35s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 380); };
    el.addEventListener('click', dismiss);
    el.addEventListener('animationend', () => el.remove());
  })();

  'use strict';

  const grid = document.getElementById('prayerGrid');
  const filterNav = document.getElementById('deityFilter');
  const searchInput = document.getElementById('searchInput');
  const prayerView = document.getElementById('prayerView');
  const prayerContent = document.getElementById('prayerContent');
  const closePrayerBtn = document.getElementById('closePrayer');

  let activeDeities = new Set();
  let searchQuery = '';

  const deityOrder = ['Ganesh', 'Hanuman', 'Shiv', 'Lakshmi', 'Vishnu', 'Krishna', 'Durga', 'Saraswati', 'Radha', 'Surya', 'Sai Baba', 'Sheetla Mata', 'Santoshi Mata', 'Bhairav'];

  /* ---------- deity multi-select ---------- */
  const filterBtn = document.getElementById('deityFilterBtn');
  const filterMenu = document.getElementById('deityMenu');
  const filterLabel = document.getElementById('deityFilterLabel');

  function updateFilterLabel() {
    const n = activeDeities.size;
    if (!n) { filterLabel.textContent = 'All deities'; return; }
    const arr = [...activeDeities];
    filterLabel.textContent = n <= 2 ? arr.join(' + ') : n + ' deities selected';
  }

  const optionRows = {};
  deityOrder.forEach(d => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'deity-option';
    row.setAttribute('role', 'menuitemcheckbox');
    row.setAttribute('aria-checked', 'false');
    const count = PRAYERS.filter(p => p.deity === d).length;
    row.innerHTML = `<span class="df-check" aria-hidden="true"></span><span class="df-name">${d}</span><span class="df-count">${count}</span>`;
    row.addEventListener('click', () => {
      if (activeDeities.has(d)) activeDeities.delete(d); else activeDeities.add(d);
      const on = activeDeities.has(d);
      row.classList.toggle('selected', on);
      row.setAttribute('aria-checked', on);
      clearRow.hidden = activeDeities.size === 0;
      updateFilterLabel();
      renderGrid();
    });
    filterMenu.appendChild(row);
    optionRows[d] = row;
  });

  const clearRow = document.createElement('button');
  clearRow.type = 'button';
  clearRow.className = 'deity-clear';
  clearRow.textContent = 'Clear \u2014 show all';
  clearRow.hidden = true;
  clearRow.addEventListener('click', () => {
    activeDeities.clear();
    Object.values(optionRows).forEach(r => { r.classList.remove('selected'); r.setAttribute('aria-checked', 'false'); });
    clearRow.hidden = true;
    updateFilterLabel();
    renderGrid();
  });
  filterMenu.appendChild(clearRow);

  function setMenuOpen(open) {
    filterMenu.hidden = !open;
    filterBtn.setAttribute('aria-expanded', String(open));
  }
  filterBtn.addEventListener('click', e => { e.stopPropagation(); setMenuOpen(filterMenu.hidden); });
  document.addEventListener('click', e => { if (!filterMenu.hidden && !e.target.closest('.deity-filter')) setMenuOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !filterMenu.hidden) { setMenuOpen(false); filterBtn.focus(); } });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderGrid();
  });

  /* ---------- grid ---------- */
  function prayerMatches(p) {
    if (activeDeities.size && !activeDeities.has(p.deity)) return false;
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
    const langLabel = p.lang === 'sa' ? 'Sanskrit' : (p.lang === 'mr' ? 'Marathi' : 'Hindi');
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

  const DEITY_VOICE_GENDER = {
    'Lakshmi': 'f', 'Durga': 'f', 'Saraswati': 'f', 'Radha': 'f',
    'Sheetla Mata': 'f', 'Santoshi Mata': 'f',
    'Shiv': 'm', 'Ganesh': 'm', 'Hanuman': 'm', 'Vishnu': 'm',
    'Krishna': 'm', 'Surya': 'm', 'Sai Baba': 'm', 'Bhairav': 'm'
  };
  // Best-effort gender detection from voice display names.
  const FEMALE_HINTS = /female|woman|heera|kalpana|swara|lekha|madhur|aditi|raveena|neerja|kanya|susan|zira|samantha|karen|moira|tessa|fiona|catherine|shelley|sonia|samantha/i;
  const MALE_HINTS = /male(?!.*female)|man|hemant|prabhat|ravi|mohan|arjun|daniel|fred|alex|george|james|david|aaron|arthur|gordon|rishi/i;
  function voiceGender(v) {
    const n = v.name || '';
    if (FEMALE_HINTS.test(n)) return 'f';
    if (MALE_HINTS.test(n) && !/female/i.test(n)) return 'm';
    return null;
  }
  function pickVoice(pref, gender) {
    if (!voices.length) loadVoices();
    const norm = v => (v.lang || '').toLowerCase();
    let pool;
    if (pref === 'hi') {
      pool = [voices.filter(v => norm(v).startsWith('hi')),
              voices.filter(v => norm(v).startsWith('sa')),
              voices.filter(v => norm(v) === 'en-in')];
    } else {
      pool = [voices.filter(v => norm(v) === 'en-in'),
              voices.filter(v => norm(v).startsWith('en'))];
    }
    for (const group of pool) {
      if (!group.length) continue;
      if (gender) {
        const g = group.find(v => voiceGender(v) === gender);
        if (g) return g;
      }
      return group[0];
    }
    return null;
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
    const v = pickVoice(voicePref, DEITY_VOICE_GENDER[p.deity]);
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

  /* ---------- Gemini key settings ---------- */
  const WORKER_URL = 'https://divine-guide.ankitsamriwal.workers.dev'; // set to the deployed Cloudflare worker origin, e.g. https://divine-guide.<subdomain>.workers.dev
  const KEY_LS = 'divinehub_gemini_key';
  const settingsBtn = document.getElementById('chatSettings');
  const settingsRow = document.getElementById('chatSettingsRow');
  const keyInput = document.getElementById('geminiKeyInput');
  const chatMode = document.getElementById('chatMode');

  function refreshModeLabel() {
    chatMode.textContent = WORKER_URL
      ? 'online guide · ask anything'
      : (localStorage.getItem(KEY_LS)
        ? 'gemini-powered · ask anything'
        : 'on-device guide · ask about prayers, meanings, deities');
  }
  refreshModeLabel();

  settingsBtn.addEventListener('click', () => {
    settingsRow.hidden = !settingsRow.hidden;
    if (!settingsRow.hidden) keyInput.value = localStorage.getItem(KEY_LS) || '';
  });
  document.getElementById('geminiKeySave').addEventListener('click', () => {
    const k = keyInput.value.trim();
    if (k) localStorage.setItem(KEY_LS, k);
    refreshModeLabel();
    settingsRow.hidden = true;
    if (k) botSay('Key saved - I will answer with Gemini now. Ask me anything about the prayers, their meanings, or the deities.');
  });
  document.getElementById('geminiKeyClear').addEventListener('click', () => {
    localStorage.removeItem(KEY_LS);
    keyInput.value = '';
    refreshModeLabel();
    settingsRow.hidden = true;
    botSay('Key removed - I am back to my built-in on-device knowledge.');
  });

  /* ---------- Guide backends: Cloudflare worker proxy (world-visible, no key) → personal Gemini key → on-device ---------- */
  async function askWorker(question) {
    const contents = history.slice(-8).map(h => ({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: 'user', parts: [{ text: question }] });
    const res = await fetch(WORKER_URL + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT_WORKER }] }, contents: contents })
    });
    if (!res.ok) throw new Error('worker HTTP ' + res.status);
    const data = await res.json();
    if (!data || !data.text) throw new Error('worker empty');
    history.push({ role: 'user', text: question }, { role: 'model', text: data.text.trim() });
    return data.text.trim();
  }
  const LLM_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
  const LLM_URL = (model, key) =>
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key);

  function corpusContextCore() {
    const parts = PRAYERS.map(p => {
      const meanings = p.stanzas.map((s, i) => (i + 1) + '. ' + s.meaning).join('\n');
      return '### ' + p.title + ' (' + p.titleDev + ') — ' + p.type + ' of ' + p.deity +
        '\nAbout: ' + p.about + '\nMeanings:\n' + meanings;
    });
    const deityNotes = Object.entries(DEITIES).map(([n, d]) => '- ' + n + ': ' + d.blurb).join('\n');
    return parts.join('\n\n') + '\n\nDEITY NOTES:\n' + deityNotes;
  }

  function corpusContextCoreCompact() {
    const parts = PRAYERS.map(p =>
      '### ' + p.title + ' (' + p.titleDev + ') — ' + p.type + ' of ' + p.deity + '. ' + p.about);
    const deityNotes = Object.entries(DEITIES).map(([n, d]) => '- ' + n + ': ' + d.blurb).join('\n');
    return parts.join('\n') + '\n\nDEITY NOTES:\n' + deityNotes;
  }

  const FESTIVALS_TEXT = '\n\nFESTIVAL CALENDAR (verified 2026-2027):\n' + FESTIVALS.map(f =>
    '- ' + f.name + ' (' + f.dev + '): 2026 on ' + f.d2026 + ', 2027 on ' + f.d2027 + '. ' + f.note).join('\n');
  const WHY_TEXT = '\n\nPUJA ITEMS - WHY THEY ARE USED:\n' + WHY_CATEGORIES.map(c =>
    c.title + ': ' + c.items.map(i => i.item + ' - ' + i.role + ' ' + i.traditional).join(' | ')).join('\n');
  const GUIDES_TEXT = '\n\nPUJA GUIDES (samagri + steps available in the app):\n' + PUJA_GUIDES.map(g =>
    '- ' + g.title + ' (' + g.dev + '): ' + g.about + ' When: ' + g.when).join('\n');
  const TITHIS_TEXT = '\n\nAMAVASYA AND POORNIMA (new/full moon) DATES 2026-2027:\n' + TITHIS.map(t =>
    '- ' + t.name + ': ' + t.date).join('\n');
  const LIFE_EVENTS_TEXT = '\n\nWHICH PUJA FOR A LIFE EVENT (traditional recommendations):\n' + LIFE_EVENTS.map(e =>
    '- ' + e.event + ': ' + e.puja + ' (' + e.deity + '). ' + e.why + (e.note ? ' Note: ' + e.note : '')).join('\n');
  const NEARBY_TEXT = '\n\nNEARBY: The app has a Nearby tab with map searches for temples, pandits for home puja, and flower/prasad shops, plus online pandit booking links (SmartPuja, PujariJi and similar). For "find a pandit" questions, point people there.';

  const SYSTEM_PROMPT_BASE = 'You are the Divine Guide inside "Divine Hub", a serene web app of traditional Hindu prayers. ' +
    'Answer with warmth, accuracy and reverence. Ground every answer in the corpus below. ' +
    'If asked about a prayer, deity or text not in the corpus, say gently that it is not in this collection yet and offer what is here. ' +
    'Never invent scripture verses or attribute made-up quotes to sacred texts. ' +
    'Keep answers short - 2 to 5 sentences unless the person asks for detail. Use the prayer titles so they can find them in the app.\n' +
    'TODAY IS ' + new Date().toDateString() + '. For "next" or "upcoming" Amavasya, Poornima or festival questions, pick the first date in the corpus ON OR AFTER today, and name it with its date.\n\nCORPUS:\n';
  const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE + corpusContext();
  const SYSTEM_PROMPT_WORKER = SYSTEM_PROMPT_BASE + corpusContextCompact();

  const history = []; // {role:'user'|'model', text}

  async function askLLM(question, key) {
    const contents = history.slice(-8).map(h => ({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: 'user', parts: [{ text: question }] });
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 2500 }
    };
    let lastErr = null;
    for (const model of LLM_MODELS) {
      try {
        const res = await fetch(LLM_URL(model, key), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) { lastErr = new Error('HTTP ' + res.status); continue; }
        const data = await res.json();
        const text = data && data.candidates && data.candidates[0] &&
          data.candidates[0].content && data.candidates[0].content.parts &&
          data.candidates[0].content.parts.map(p => p.text).join('');
        if (text && text.trim()) {
          history.push({ role: 'user', text: question }, { role: 'model', text: text.trim() });
          return text.trim();
        }
        lastErr = new Error('empty response');
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('LLM unavailable');
  }

  /* typing indicator */
  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'msg bot typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;
  }
  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  async function respond(q) {
    const key = localStorage.getItem(KEY_LS);
    if (WORKER_URL || key) {
      showTyping();
      if (WORKER_URL) {
        try {
          const a = await askWorker(q);
          hideTyping();
          botSay(a);
          return;
        } catch (e) { /* fall through to personal key / on-device */ }
      }
      if (key) {
        try {
          const a = await askLLM(q, key);
          hideTyping();
          botSay(a);
          return;
        } catch (e) { /* fall through to on-device */ }
      }
      hideTyping();
      botSay('The online guide is unreachable right now. Answering from my built-in knowledge instead:\n\n' + botAnswer(q));
      return;
    }
    botSay(botAnswer(q));
  }

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

  function botAnswerCore(q) {
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


  /* ---------- expansion wrappers: festivals, why, guides ---------- */

  function corpusContext() { return corpusContextCore() + FESTIVALS_TEXT + TITHIS_TEXT + WHY_TEXT + GUIDES_TEXT + LIFE_EVENTS_TEXT + NEARBY_TEXT; }
  function corpusContextCompact() { return corpusContextCoreCompact() + FESTIVALS_TEXT + TITHIS_TEXT + WHY_TEXT + GUIDES_TEXT + LIFE_EVENTS_TEXT + NEARBY_TEXT; }

  function botAnswer(q) {
    const qRaw = q.toLowerCase().trim();

    // Festival questions
    const prayerMentioned = PRAYERS.some(pp => qRaw.includes(pp.title.toLowerCase()));
    const festHit = FESTIVALS.find(f => {
      const n = f.name.toLowerCase().split(' ')[0];
      return n.length > 3 && qRaw.includes(n);
    });
    if (festHit && !prayerMentioned && !/(mean|meaning|arth|matlab|chalisa|aarti|stotra|mantra|ashtakam|vandana)/.test(qRaw)) {
      return festHit.name + ' (' + festHit.dev + ') falls on ' + fmtFestivalDate(new Date(festHit.d2026 + 'T00:00:00')) + ' in 2026 and ' + fmtFestivalDate(new Date(festHit.d2027 + 'T00:00:00')) + ' in 2027.\n\n' + festHit.note + '\n\nSee the Festivals tab for the full calendar.';
    }
    if (/(festival|upcoming|next.*(festival|tyohar|tyohaar)|panchang|calendar|tyohar|tyohaar)/.test(qRaw)) {
      const up = festivalsUpcoming(new Date()).slice(0, 3);
      return 'The next festivals on the calendar:\n' + up.map(r => '• ' + r.f.name + ' — ' + fmtFestivalDate(r.date)).join('\n') + '\n\nThe Festivals tab has the full verified 2026-2027 calendar.';
    }

    // Why-database questions
    if (/^why |what is |what\'s |significance|meaning of|why do|why are/.test(qRaw) || /(camphor|kapoor|kumkum|roli|haldi|turmeric|chandan|sandal|sindoor|kesar|saffron|vibhuti|bhasma|diya|deepak|lamp|agarbatti|incense|dhoop|guggal|loban|ittar|panchamrit|akshat|rice|coconut|nariyal|paan|betel|supari|honey|milk|curd|ghee|modak|laddu|tulsi|bel patra|bilva|durva|datura|lotus|kamal|marigold|rose|harsingar|parijat|mango leaf|moli|kalava|red thread|chunri|janeyu|kalash|lota|thali|ghanta|bell|shankh|conch|navadhanya|til|sesame|gangajal|dakshina|havan)/.test(qRaw)) {
      const hits = whyFind(qRaw);
      if (hits.length) {
        const it = hits[0];
        return it.item + ' (' + it.dev + ')\n\n' + it.role + '\n\nTraditionally: ' + it.traditional + '\n\nPractically: ' + it.science + '\n\nThe Why Puja? tab has 58 such entries across seven categories.';
      }
    }

    // Puja guide questions
    if (/(how to|how do|vidhi|samagri|checklist|griha pravesh|griha|housewarming|satyanarayan|sunderkand|sundarakhand|sthapana|diwali puja|lakshmi puja|ganesh puja|path|paath)/.test(qRaw)) {
      const g = PUJA_GUIDES.find(x => qRaw.includes(x.title.split(' ')[0].toLowerCase())) || PUJA_GUIDES[0];
      return g.title + ' (' + g.dev + ') — ' + g.about + '\n\nWhen: ' + g.when + '\n\nThe full guide — ' + g.samagri.length + ' samagri items with quantities and ' + g.steps.length + ' steps — is in the Puja Guides tab.';
    }

    // Amavasya / Poornima tithi questions
    if (/(amavasya|amavas|new moon)/.test(qRaw)) {
      const n = tithiNext('Amavasya', new Date());
      return (n ? 'The next Amavasya is ' + n.name + ' on ' + fmtFestivalDate(new Date(n.date + 'T00:00:00')) + '.' : '') +
        '\n\nAmavasya is the new-moon day - the traditional time for Pitru Tarpan and shradh for ancestors, and for quiet japa and fasting. Sarva Pitru Amavasya (Mahalaya) is the most observed of the year.' +
        '\n\nThe Festivals tab lists every Amavasya and Poornima of 2026-2027.';
    }
    if (/(poornima|purnima|pooranmashi|pournami|full moon)/.test(qRaw)) {
      const n = tithiNext('Poornima', new Date());
      return (n ? 'The next Poornima is ' + n.name + ' on ' + fmtFestivalDate(new Date(n.date + 'T00:00:00')) + '.' : '') +
        '\n\nPoornima is the full-moon day - Satyanarayan puja is traditionally performed on it, and several great festivals (Guru Purnima, Sharad Purnima, Kartik Purnima) fall on full moons.' +
        '\n\nThe Festivals tab has the full 2026-2027 tithi calendar.';
    }

    // Life-event puja recommendations
    const evHits = lifeEventFind(qRaw);
    if (evHits.length) {
      const e = evHits[0];
      return 'For ' + e.event.toLowerCase() + ': ' + e.puja + ' - ' + e.deity + ' is invoked.\n\n' + e.why +
        (e.note ? '\n\n' + e.note : '') +
        '\n\nFor the samagri and steps, see the Puja Guides tab; for a priest, see the Nearby tab.';
    }

    // Pandit / priest nearby
    if (/(pandit|panditji|pandit ji|purohit|pujari|priest|near me|nearby)/.test(qRaw)) {
      return 'The Nearby tab has one-tap map searches for pandits for home puja, temples, and flower/prasad shops around you, plus online pandit-booking services (SmartPuja, PujariJi, and others) if you want a fixed-price package with samagri included.';
    }

    return botAnswerCore(q);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    userSay(q);
    input.value = '';
    respond(q);
  });

  renderGrid();
})();
