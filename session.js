/* Divine Hub — guided Sadhana session: दीपक → आरती → जाप → प्रार्थना.
   Reuses the prayer corpus, the sung-version card and Read aloud (app.js), and
   the live japa counter (japa.js), which is moved into the session while it runs
   and handed back to its own sheet afterwards. Nothing is paywalled here. */
(function () {
  'use strict';

  var D = window.DH_DEITY;
  if (!D) return;

  var STEPS = [
    { key: 'deepak', dev: 'दीपक', en: 'Lamp' },
    { key: 'aarti', dev: 'आरती', en: 'Aarti' },
    { key: 'jaap', dev: 'जाप', en: 'Jaap' },
    { key: 'prarthana', dev: 'प्रार्थना', en: 'Prayer' }
  ];
  var ROUNDS = [11, 21, 108];
  var LS_ROUND = 'divinehub_session_round_v1';

  var el = null, state = null;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function savedRound() { try { var n = +localStorage.getItem(LS_ROUND); return ROUNDS.indexOf(n) !== -1 ? n : 11; } catch (e) { return 11; } }
  function saveRound(n) { try { localStorage.setItem(LS_ROUND, String(n)); } catch (e) {} }

  function sheet() {
    if (el) return el;
    el = document.createElement('section');
    el.id = 'sessionView';
    el.className = 'dh-sheet session-sheet';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Guided sadhana');
    el.innerHTML = '<button class="dh-sheet-close" id="sessionClose" aria-label="End the sitting">✕</button><div class="ss-body" id="ssBody"></div>';
    document.body.appendChild(el);
    el.querySelector('#sessionClose').addEventListener('click', close);
    return el;
  }

  /* start(roomId, {aartiId, mantra, title}) */
  function start(roomId, opts) {
    opts = opts || {};
    var room = D.byId(roomId) || D.byId('vishnu');
    if (!room.aarti) room = D.byId('vishnu');
    state = {
      room: room,
      aarti: D.prayer(opts.aartiId || room.aarti) || D.prayer(room.aarti),
      mantra: opts.mantra || room.mantra,
      title: opts.title || '',
      step: 0,
      round: savedRound(),
      lit: false
    };
    sheet();
    render();
    window.dhOpenSheet('sessionView');
  }

  function close() {
    teardownStep();
    if (window.dhJapa) window.dhJapa.unmount();
    if (el) { el.querySelector('#ssBody').innerHTML = ''; window.dhCloseSheet('sessionView'); }
    state = null;
  }

  function teardownStep() {
    if (window.dhSpeak) window.dhSpeak.stop();
    if (window.dhAura) window.dhAura.stop(null, true);
    if (window.dhJapa) window.dhJapa.unmount();
  }

  function stepper() {
    return '<ol class="ss-steps" aria-label="Steps">' + STEPS.map(function (s, i) {
      var cls = i < state.step ? ' done' : (i === state.step ? ' now' : '');
      return '<li class="ss-step' + cls + '"' + (i === state.step ? ' aria-current="step"' : '') + '>' +
        '<span class="ss-step-dev">' + s.dev + '</span><span class="ss-step-en">' + s.en + '</span></li>';
    }).join('') + '</ol>';
  }

  function nav(nextLabel) {
    return '<div class="ss-nav">' +
      (state.step > 0 ? '<button type="button" class="btn-ghost ss-back" id="ssBack">‹ Back</button>' : '<span></span>') +
      '<button type="button" class="btn-gold ss-next" id="ssNext">' + nextLabel + '</button></div>';
  }

  function render() {
    var body = el.querySelector('#ssBody');
    teardownStep();
    var r = state.room, s = STEPS[state.step];
    if (!s) { renderDone(body, r); return; }
    var head = '<header class="ss-head"><span class="ss-kicker">' + esc(state.title || 'साधना · Guided sitting') + '</span>' +
      '<h2 class="ss-deity"><span class="ss-deity-dev">' + r.dev + '</span> <span class="ss-deity-en">' + esc(r.name) + '</span></h2></header>' +
      stepper();
    var html = '';
    if (s.key === 'deepak') {
      html = '<div class="ss-pane ss-deepak">' +
        '<button type="button" class="ss-diya' + (state.lit ? ' lit' : '') + '" id="ssDiya" aria-pressed="' + state.lit + '" aria-label="Light the lamp">' +
        '<span class="ss-flame" aria-hidden="true"></span><span class="ss-bowl" aria-hidden="true"></span></button>' +
        '<h3 class="ss-h">दीपक प्रज्वलित करें</h3>' +
        '<p class="ss-p">Light a ghee or oil diya before ' + esc(r.name) + '. Sit facing east or north, settle the breath, and offer the light. If there is no lamp at hand, tap the diya and hold its flame in your mind.</p>' +
        '</div>' + nav('आरती · Aarti ›');
    } else if (s.key === 'aarti') {
      var p = state.aarti;
      html = '<div class="ss-pane ss-aarti">' +
        '<h3 class="ss-h">' + esc(p.titleDev) + '</h3><p class="ss-sub">' + esc(p.title) + '</p>' +
        '<div class="ss-sung" id="ssSung"></div>' +
        '<div class="listen-bar ss-listen">' +
          '<span class="listen-label">Read aloud</span>' +
          '<select id="ssTtsLang" aria-label="Narration language"><option value="dev">' + (p.lang === 'sa' ? 'Sanskrit' : 'Hindi') + '</option><option value="translit">Transliteration</option><option value="meaning">English meaning</option></select>' +
          '<button type="button" id="ssRead">▶ Read</button><button type="button" id="ssStop" class="stop">■ Stop</button>' +
          '<span class="listen-note" id="ssNote"></span></div>' +
        '<div class="ss-tools"><button type="button" class="pv-action" id="ssFocus">🪔 Focus mode</button>' +
        '<button type="button" class="pv-action" id="ssFull">Full text &amp; meaning</button></div>' +
        '<div class="ss-text">' + p.stanzas.map(function (st) {
          return '<div class="stanza stanza-dev">' + st.dev.map(function (l) { return '<div>' + l + '</div>'; }).join('') + '</div>';
        }).join('') + '</div>' +
        '</div>' + nav('जाप · Jaap ›');
    } else if (s.key === 'jaap') {
      var m = state.mantra;
      html = '<div class="ss-pane ss-jaap">' +
        '<h3 class="ss-h ss-mantra-dev">' + esc(m.dev) + '</h3><p class="ss-sub">' + esc(m.label) + '</p>' +
        '<div class="ss-rounds" role="group" aria-label="Round length">' + ROUNDS.map(function (n) {
          return '<button type="button" class="ss-round' + (n === state.round ? ' on' : '') + '" data-n="' + n + '" aria-pressed="' + (n === state.round) + '">' + n + '</button>';
        }).join('') + '</div>' +
        '<div class="ss-japa" id="ssJapa"></div>' +
        '</div>' + nav('प्रार्थना · Prayer ›');
    } else {
      html = '<div class="ss-pane ss-prarthana">' +
        '<h3 class="ss-h">प्रार्थना</h3>' +
        '<div class="ss-shloka">ॐ सर्वे भवन्तु सुखिनः । सर्वे सन्तु निरामयाः ।<br>सर्वे भद्राणि पश्यन्तु । मा कश्चिद्दुःखभाग्भवेत् ॥<br>ॐ शान्तिः शान्तिः शान्तिः ॥</div>' +
        '<p class="ss-translit">Om sarve bhavantu sukhinah, sarve santu niramayah, sarve bhadrani pashyantu, ma kashchid duhkha bhag bhavet.</p>' +
        '<p class="ss-p">May all be happy; may all be free from illness; may all see what is auspicious; may no one suffer.</p>' +
        '<p class="ss-p">Then, with folded hands, offer your own prayer to ' + esc(r.name) + ' in your own words.</p>' +
        '</div>' + nav('🙏 पूर्ण · Complete');
    }
    body.innerHTML = head + html;
    el.scrollTop = 0;
    wire(s.key, body);
  }

  function renderDone(body, r) {
    body.innerHTML = '<header class="ss-head"><h2 class="ss-deity"><span class="ss-deity-dev">' + r.dev + '</span></h2></header>' +
      '<div class="ss-pane ss-done"><div class="sy-diya" aria-hidden="true"><div class="sy-flame"></div></div>' +
      '<p class="sy-shanti">॥ शान्तिः शान्तिः शान्तिः ॥</p><h3 class="ss-h">Your sitting is complete</h3>' +
      '<p class="ss-p">May the light stay with you through the day.</p>' +
      '<button type="button" class="btn-gold" id="ssEnd">🙏 Dhanyavaad</button></div>';
    el.scrollTop = 0;
    var end = body.querySelector('#ssEnd');
    end.addEventListener('click', close);
    end.focus();
  }

  function wire(key, body) {
    var back = body.querySelector('#ssBack');
    if (back) back.addEventListener('click', function () { state.step--; render(); });
    body.querySelector('#ssNext').addEventListener('click', function () { state.step++; render(); });
    if (key === 'deepak') {
      body.querySelector('#ssDiya').addEventListener('click', function () {
        state.lit = !state.lit;
        this.classList.toggle('lit', state.lit);
        this.setAttribute('aria-pressed', String(state.lit));
      });
    } else if (key === 'aarti') {
      var p = state.aarti;
      if (window.dhRenderSung) window.dhRenderSung(p, body.querySelector('#ssSung'));
      body.querySelector('#ssRead').addEventListener('click', function () {
        if (window.dhSpeak) window.dhSpeak.prayer(p, body.querySelector('#ssTtsLang').value, 0.88, body.querySelector('#ssNote'));
      });
      body.querySelector('#ssStop').addEventListener('click', function () { if (window.dhSpeak) window.dhSpeak.stop(); body.querySelector('#ssNote').textContent = ''; });
      body.querySelector('#ssFocus').addEventListener('click', function () { if (window.dhOpenFocus) window.dhOpenFocus(p.id, 0); });
      body.querySelector('#ssFull').addEventListener('click', function () { if (window.dhOpenPrayer) window.dhOpenPrayer(p.id); });
    } else if (key === 'jaap') {
      if (window.dhJapa) {
        window.dhJapa.preset({ value: state.mantra.value, dev: state.mantra.dev, label: state.mantra.label, target: state.round });
        window.dhJapa.mount(body.querySelector('#ssJapa'));
      }
      body.querySelectorAll('.ss-round').forEach(function (b) {
        b.addEventListener('click', function () {
          state.round = +b.dataset.n;
          saveRound(state.round);
          body.querySelectorAll('.ss-round').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
          if (window.dhJapa) window.dhJapa.preset({ target: state.round });
        });
      });
    }
  }

  /* ---------- Sadhana tab: deity picker + practice list ---------- */
  var pick = null;
  function renderStart() {
    var host = document.getElementById('sessionStart');
    if (!host) return;
    if (!pick) pick = (window.dhToday && window.dhToday.ritualRoom) ? window.dhToday.ritualRoom() : 'vishnu';
    var rooms = D.ROOMS.filter(function (r) { return r.aarti; });
    var cur = D.byId(pick) || rooms[0];
    host.innerHTML = '<span class="t-kicker">मार्गदर्शित साधना · Guided sitting</span>' +
      '<div class="ss-pick" role="radiogroup" aria-label="Choose a deity">' + rooms.map(function (r) {
        var on = r.id === cur.id;
        return '<button type="button" class="ss-pick-btn' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" data-room="' + r.id + '">' +
          '<span class="ss-pick-dev">' + r.dev + '</span><span class="ss-pick-en">' + esc(r.name) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="ss-flow"><span>दीपक</span> → <span>आरती</span> → <span>जाप</span> → <span>प्रार्थना</span></p>' +
      '<p class="ss-flow-sub">' + esc((D.prayer(cur.aarti) || {}).title || '') + ' · ' + esc(cur.mantra.label) + '</p>' +
      '<button type="button" class="btn-gold ss-begin" id="ssBegin">Begin with ' + esc(cur.name) + '</button>';
    host.querySelectorAll('.ss-pick-btn').forEach(function (b) {
      b.addEventListener('click', function () { pick = b.dataset.room; renderStart(); host.querySelector('[data-room="' + pick + '"]').focus(); });
    });
    host.querySelector('#ssBegin').addEventListener('click', function () { start(cur.id); });
  }

  function renderList() {
    var host = document.getElementById('sadhanaList');
    if (!host) return;
    host.innerHTML =
      '<button type="button" class="sd-row" id="sdJapa"><span class="sd-row-ic" aria-hidden="true">📿</span>' +
        '<span class="sd-row-main"><span class="sd-row-dev">जाप माला</span><span class="sd-row-en">Japa counter</span><small>A digital mala: 11, 21 or 108 beads, tap or listen</small></span><span class="cl-go" aria-hidden="true">›</span></button>' +
      '<button type="button" class="sd-row" id="sdFocus"><span class="sd-row-ic" aria-hidden="true">🪔</span>' +
        '<span class="sd-row-main"><span class="sd-row-dev">एकाग्र</span><span class="sd-row-en">Focus mode</span><small>Choose any aarti, chalisa or mantra; one verse at a time</small></span><span class="cl-go" aria-hidden="true">›</span></button>';
    host.querySelector('#sdJapa').addEventListener('click', function () { window.dhOpenSheet('japaSection'); });
    host.querySelector('#sdFocus').addEventListener('click', function () {
      if (window.dhOpenFocusPicker) window.dhOpenFocusPicker();
    });
  }

  function init() { renderStart(); renderList(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.dhSession = { start: start, close: close, isOpen: function () { return !!(el && !el.hidden); }, renderStart: renderStart };
})();
