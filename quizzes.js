/* Divine Hub — Quizzes: per-story quiz + a daily puzzle */

(function () {
  'use strict';

  const LS_KEY = 'divinehub_quiz_v1';

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  // Quiz bank: 3 questions per journey/story, grounded in the corpus content.
  const QUIZZES = {
    'hanuman': [
      { q: 'Whose son is Hanuman?', a: ['Vayu, the wind god', 'Indra, king of gods', 'Surya, the sun god'], c: 0 },
      { q: 'What did Hanuman bring to save Lakshman?', a: ['The Sanjeevani herb mountain', 'Amrit from the gods', 'The Ganga in his kamandal'], c: 0 },
      { q: 'In the Chalisa, what does Hanuman hold in his hands?', a: ['Mace and flag', 'Bow and arrow', 'Conch and discus'], c: 0 }
    ],
    'navratri': [
      { q: 'Which demon\'s defeat is at the heart of Durga\'s story?', a: ['Mahishasur, the buffalo-demon', 'Ravana', 'Kansa'], c: 0 },
      { q: 'The Durga Chalisa says the Mother\'s eternal flame burns at…', a: ['Jwala Ji', 'Vaishno Devi', 'Kamakhya'], c: 0 },
      { q: 'Which of these is NOT named as a form of the Mother in the Chalisa?', a: ['Sita', 'Saraswati', 'Lakshmi'], c: 0 }
    ],
    'ganesh': [
      { q: 'Who are Ganesh\'s parents, as the aarti sings?', a: ['Parvati and Mahadev', 'Lakshmi and Vishnu', 'Sita and Ram'], c: 0 },
      { q: 'What is offered to Ganesh in the aarti?', a: ['Laddus', 'Kheer', 'Tulsi leaves'], c: 0 },
      { q: 'Sukhakarta Dukhharta was composed by…', a: ['Samarth Ramdas', 'Tulsidas', 'Surdas'], c: 0 }
    ],
    'shiva': [
      { q: 'In Om Jai Shiv Omkara, Brahma, Vishnu and Sadashiv are…', a: ['One in Omkara', 'Three rivals', 'Shiva\'s sons'], c: 0 },
      { q: 'What adorns Shiva\'s forehead?', a: ['The crescent moon', 'A third eye of gold', 'A tilak of sandal'], c: 0 },
      { q: 'Kalabhairava is the guardian (kotwal) of which city?', a: ['Kashi', 'Mathura', 'Ujjain'], c: 0 }
    ],
    'krishna': [
      { q: 'Kunj Bihari means Krishna as the one who…', a: ['Wanders the groves of Vrindavan', 'Rules Dwarka', 'Drives Arjuna\'s chariot'], c: 0 },
      { q: 'The Mahamantra comes from which Upanishad?', a: ['Kali-Santarana Upanishad', 'Isha Upanishad', 'Mandukya Upanishad'], c: 0 },
      { q: 'Radha Rani is the queen of…', a: ['Braj', 'Ayodhya', 'Mithila'], c: 0 }
    ],
    'lakshmi': [
      { q: 'Lakshmi rose from…', a: ['The churning of the Ocean of Milk', 'A lotus in the Ganga', 'Agni\'s flame'], c: 0 },
      { q: 'Om Jai Jagdish Hare is addressed to Vishnu as…', a: ['Lord of the Universe', 'The Dark One', 'The Lion-Man'], c: 0 },
      { q: 'Which festival centres on Lakshmi Puja?', a: ['Diwali', 'Holi', 'Raksha Bandhan'], c: 0 }
    ]
  };

  // Daily puzzle pool: guess the deity from a stanza meaning.
  function dailyPuzzle() {
    const pool = [];
    PRAYERS.forEach(p => p.stanzas.forEach((s, si) => {
      if (s.meaning && s.meaning.length > 60) pool.push({ p: p, s: s, si: si });
    }));
    const dayIndex = Math.floor(Date.now() / 86400000);
    const pick = pool[(dayIndex * 7 + 3) % pool.length]; // offset from verse-of-day
    const deities = [...new Set(PRAYERS.map(p => p.deity))];
    const wrong = deities.filter(d => d !== pick.p.deity);
    const opts = [];
    let seed = dayIndex;
    while (opts.length < 2 && wrong.length) {
      const i = (seed * 31 + 17) % wrong.length;
      opts.push(wrong.splice(i, 1)[0]);
      seed++;
    }
    const options = [pick.p.deity, ...opts].sort(() => ((dayIndex % 3) - 1));
    return { pick: pick, options: options, answer: pick.p.deity };
  }

  /* ---------- quiz/puzzle overlay ---------- */
  let overlay = null;
  function ensure() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'quizView';
    overlay.className = 'quiz-view';
    overlay.hidden = true;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (!overlay.hidden && e.key === 'Escape') close(); });
  }
  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function runQuiz(title, questions, onDone) {
    ensure();
    let i = 0, score = 0;
    const state = load();
    function render() {
      if (i >= questions.length) {
        const perfect = score === questions.length;
        overlay.innerHTML =
          '<div class="qz-panel"><div class="qz-result">' +
          '<div class="qz-om">🪔</div>' +
          '<div class="qz-score">' + score + ' / ' + questions.length + '</div>' +
          '<div class="qz-verdict">' + (perfect ? 'Perfect — the story is yours now.' : 'Well begun — the story rewards a second sitting.') + '</div>' +
          '<button class="pv-action" id="qzDone">Done</button></div></div>';
        overlay.querySelector('#qzDone').addEventListener('click', () => { close(); if (onDone) onDone(score); });
        return;
      }
      const q = questions[i];
      overlay.innerHTML =
        '<div class="qz-panel">' +
        '<div class="qz-top"><span class="qz-title">' + title + '</span>' +
        '<span class="qz-count">' + (i + 1) + ' / ' + questions.length + '</span></div>' +
        '<div class="qz-q">' + q.q + '</div>' +
        '<div class="qz-opts">' + q.a.map((o, oi) =>
          '<button class="qz-opt" data-i="' + oi + '">' + o + '</button>').join('') + '</div>' +
        '<div class="qz-fb" id="qzFb"></div></div>';
      overlay.querySelectorAll('.qz-opt').forEach(b =>
        b.addEventListener('click', () => {
          const pick = parseInt(b.dataset.i, 10);
          const right = pick === q.c;
          if (right) score++;
          overlay.querySelectorAll('.qz-opt').forEach((x, xi) => {
            x.disabled = true;
            if (xi === q.c) x.classList.add('right');
            else if (xi === pick) x.classList.add('wrong');
          });
          const fb = overlay.querySelector('#qzFb');
          fb.innerHTML = '<div class="qz-fb-t ' + (right ? 'ok' : 'no') + '">' +
            (right ? 'Right.' : 'Not quite.') + '</div>' +
            '<button class="pv-action" id="qzNext">' + (i === questions.length - 1 ? 'See result' : 'Next') + '</button>';
          fb.querySelector('#qzNext').addEventListener('click', () => { i++; render(); });
        }));
    }
    render();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function openJourneyQuiz(jid) {
    const qs = QUIZZES[jid];
    if (!qs) return;
    const j = window.dhJourneys ? window.dhJourneys.list.find(x => x.id === jid) : null;
    runQuiz((j ? j.title : 'Story') + ' — Quiz', qs, score => {
      const s = load();
      s.journeyQuiz = s.journeyQuiz || {};
      s.journeyQuiz[jid] = Math.max(s.journeyQuiz[jid] || 0, score);
      save(s);
      renderPuzzleCard();
    });
  }

  function openDailyPuzzle() {
    const pz = dailyPuzzle();
    const s = load();
    if (s.puzzle && s.puzzle.day === todayStr() && s.puzzle.done) {
      runPuzzleDone(pz, s.puzzle.right);
      return;
    }
    runPuzzleLive(pz);
  }

  function runPuzzleDone(pz, wasRight) {
    ensure();
    overlay.innerHTML =
      '<div class="qz-panel"><div class="qz-result">' +
      '<div class="qz-om">🧩</div>' +
      '<div class="qz-verdict">Today\'s puzzle is done' + (wasRight ? ' — and you had it right.' : '.') + '</div>' +
      '<div class="qz-q" style="margin-top:1rem">' + pz.pick.s.meaning + '</div>' +
      '<div class="qz-src">' + pz.pick.p.title + ' · ' + pz.pick.p.deity + '</div>' +
      '<button class="pv-action" id="qzDone" style="margin-top:1rem">Done</button></div></div>';
    overlay.querySelector('#qzDone').addEventListener('click', close);
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function runPuzzleLive(pz) {
    ensure();
    overlay.innerHTML =
      '<div class="qz-panel">' +
      '<div class="qz-top"><span class="qz-title">🧩 Daily puzzle</span><span class="qz-count">' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</span></div>' +
      '<div class="qz-hint">Whose words are these?</div>' +
      '<div class="qz-q">' + pz.pick.s.meaning + '</div>' +
      '<div class="qz-opts">' + pz.options.map(o =>
        '<button class="qz-opt" data-d="' + o + '">' + o + '</button>').join('') + '</div>' +
      '<div class="qz-fb" id="qzFb"></div></div>';
    overlay.querySelectorAll('.qz-opt').forEach(b =>
      b.addEventListener('click', () => {
        const right = b.dataset.d === pz.answer;
        const s = load();
        s.puzzle = { day: todayStr(), done: true, right: right };
        save(s);
        overlay.querySelectorAll('.qz-opt').forEach(x => {
          x.disabled = true;
          if (x.dataset.d === pz.answer) x.classList.add('right');
          else if (x === b) x.classList.add('wrong');
        });
        const fb = overlay.querySelector('#qzFb');
        fb.innerHTML = '<div class="qz-fb-t ' + (right ? 'ok' : 'no') + '">' +
          (right ? 'Right — from ' + pz.pick.p.title + '.' : 'It was ' + pz.answer + ' — from ' + pz.pick.p.title + '.') + '</div>' +
          '<button class="pv-action" id="qzNext">Done</button>';
        fb.querySelector('#qzNext').addEventListener('click', () => { close(); renderPuzzleCard(); });
      }));
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  /* ---------- home card ---------- */
  function renderPuzzleCard() {
    const jn = document.getElementById('journeysSection');
    if (!jn) { setTimeout(renderPuzzleCard, 400); return; }
    let sec = document.getElementById('puzzleSection');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'puzzleSection';
      sec.className = 'puzzle-section';
      jn.insertAdjacentElement('afterend', sec);
    }
    const s = load();
    const doneToday = s.puzzle && s.puzzle.day === todayStr() && s.puzzle.done;
    sec.innerHTML =
      '<button class="pz-card" id="pzOpen">' +
      '<span class="pz-ico">🧩</span>' +
      '<span class="pz-text"><span class="pz-title">Daily puzzle</span>' +
      '<span class="pz-sub">' + (doneToday ? (s.puzzle.right ? 'Solved today — well done.' : 'Done today — a new one tomorrow.') : 'Whose words are these? One a day.') + '</span></span>' +
      '<span class="pz-state">' + (doneToday ? '✓' : '›') + '</span>' +
      '</button>';
    sec.querySelector('#pzOpen').addEventListener('click', openDailyPuzzle);
  }

  window.dhQuiz = { journey: openJourneyQuiz, daily: openDailyPuzzle, has: jid => !!QUIZZES[jid] };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPuzzleCard);
  } else {
    renderPuzzleCard();
  }
})();
