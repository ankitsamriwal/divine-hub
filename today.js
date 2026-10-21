/* Divine Hub — Today tab: city + today's panchang, today's ritual (festival,
   weekday deity, or Sandhya aarti after sunset), next festival, Continue
   (active sankalp), and the one Plus entry. Values come from muhurat.js,
   panchang.js and almanac.js; anything not computable is left out. */
(function () {
  'use strict';

  var M = window.dhMuhurat, D = window.DH_DEITY;
  if (!M || !D) return;

  var PAKSHA_DEV = { Shukla: 'शुक्ल', Krishna: 'कृष्ण' };
  var TITHI_DEV = {
    Pratipada: 'प्रतिपदा', Dwitiya: 'द्वितीया', Tritiya: 'तृतीया', Chaturthi: 'चतुर्थी', Panchami: 'पंचमी',
    Shashthi: 'षष्ठी', Saptami: 'सप्तमी', Ashtami: 'अष्टमी', Navami: 'नवमी', Dashami: 'दशमी',
    Ekadashi: 'एकादशी', Dwadashi: 'द्वादशी', Trayodashi: 'त्रयोदशी', Chaturdashi: 'चतुर्दशी',
    Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या'
  };
  var ritual = null;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function todayInfo() {
    var city = M.getCity(), t = M.cityToday(city);
    return { city: city, t: t, iso: D.isoOf(t.y, t.m, t.d), w: M.daily(city, t.y, t.m, t.d) };
  }

  /* ---------- date + city ---------- */
  function renderHead(info) {
    var wd = D.WEEKDAY[new Date(Date.UTC(info.t.y, info.t.m, info.t.d)).getUTCDay()];
    var d = new Date(info.t.y, info.t.m, info.t.d);
    document.getElementById('todayDate').innerHTML = '<span class="td-dev">' + wd.dev + '</span> · ' +
      d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var sel = document.getElementById('todayCity');
    if (!sel.options.length) {
      sel.innerHTML = M.CITIES.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
      sel.addEventListener('change', function () {
        M.setCity(sel.value);
        try { document.dispatchEvent(new CustomEvent('dh-city')); } catch (e) {}
      });
    }
    sel.value = info.city.id;
  }

  /* ---------- panchang card ---------- */
  function renderPanchang(info) {
    var w = info.w, city = info.city, rows = [];
    var tithi = w && w.tithi ? w.tithi : null;
    if (!tithi && window.dhPanchang) tithi = window.dhPanchang.tithiInfo(window.dhPanchang.tithiAt(new Date()));
    var nak = (window.dhAlmanac && w) ? window.dhAlmanac.nakshatraOf(w.sunrise) : null;
    var h = '<div class="tp-top"><span class="t-kicker">पंचांग · Today</span><button type="button" class="t-link" id="tpCal">Calendar ›</button></div>';
    if (tithi) {
      h += '<p class="tp-tithi"><span class="tp-tithi-dev">' + PAKSHA_DEV[tithi.paksha] + ' ' + (TITHI_DEV[tithi.name] || '') + '</span>' +
        '<span class="tp-tithi-en">' + esc(tithi.paksha + ' ' + tithi.name) + (w ? ' at sunrise' : '') + '</span></p>';
    }
    if (nak) rows.push(['Nakshatra', esc(nak.name) + ' <small>(approx.)</small>']);
    if (w) {
      rows.push(['Sunrise', M.fmt(w.sunrise, city)]);
      rows.push(['Sunset', M.fmt(w.sunset, city)]);
      rows.push(['Rahu kaal', M.range(w.rahu[0], w.rahu[1], city) + ' <small>avoid</small>']);
      rows.push(['Abhijit', M.range(w.abhijit[0], w.abhijit[1], city) + (w.weekday === 3 ? ' <small>avoided on Wednesday</small>' : '')]);
    }
    if (rows.length) h += '<dl class="tp-grid">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    h += '<p class="tp-note">For ' + esc(city.name) + ', computed on your device. Tithi and nakshatra can differ from Drik Panchang by a few hours.</p>';
    var el = document.getElementById('todayPanchang');
    el.innerHTML = h;
    el.querySelector('#tpCal').addEventListener('click', function () { window.dhTab('calendar'); });
  }

  /* ---------- today's ritual ---------- */
  function pickRitual(info) {
    var fest = (typeof FESTIVALS !== 'undefined') ? FESTIVALS.find(function (f) { return f.d2026 === info.iso || f.d2027 === info.iso; }) : null;
    var wd = D.WEEKDAY[new Date(Date.UTC(info.t.y, info.t.m, info.t.d)).getUTCDay()];
    var dayRoom = D.byId(wd.room);
    if (fest) {
      var fr = D.festivalRoom(fest);
      var room = fr.aarti ? fr : dayRoom;
      return { kind: 'festival', fest: fest, room: room, aartiId: D.festivalAarti(fest) || room.aarti, wd: wd };
    }
    if (info.w && Date.now() >= +info.w.sunset && window.dhSandhya) {
      return { kind: 'sandhya', room: dayRoom, aartiId: dayRoom.aarti, wd: wd };
    }
    return { kind: 'weekday', room: dayRoom, aartiId: dayRoom.aarti, wd: wd };
  }

  function renderRitual(info) {
    ritual = pickRitual(info);
    var r = ritual, el = document.getElementById('todayRitual'), h;
    if (r.kind === 'festival') {
      h = '<span class="t-kicker">आज का अनुष्ठान · Today\'s ritual</span>' +
        '<h2 class="tr-dev">' + esc(r.fest.dev) + '</h2><p class="tr-en">' + esc(r.fest.name) + ' is today</p>' +
        '<p class="tr-sub">' + esc(r.fest.note) + '</p>';
    } else if (r.kind === 'sandhya') {
      h = '<span class="t-kicker">आज का अनुष्ठान · Today\'s ritual</span>' +
        '<h2 class="tr-dev">संध्या आरती</h2><p class="tr-en">Sandhya aarti · the evening lamp</p>' +
        '<p class="tr-sub">The sun has set. Three aartis with temple bells: Ganesh, Jagdish and Hanuman.</p>';
    } else {
      h = '<span class="t-kicker">आज का अनुष्ठान · Today\'s ritual</span>' +
        '<h2 class="tr-dev">' + r.wd.dev + ' · ' + r.room.dev + '</h2><p class="tr-en">' + r.wd.en + ' is ' + esc(r.wd.note) + '\'s day</p>' +
        '<p class="tr-sub">Light the lamp, sing the aarti, a round of ' + esc(r.room.mantra.label) + ', and a closing prayer.</p>';
    }
    h += '<div class="tr-actions"><button type="button" class="btn-gold tr-begin" id="trBegin">Begin</button>' +
      (r.kind === 'sandhya' ? '<button type="button" class="t-link" id="trAlt">or a sitting with ' + esc(r.room.name) + ' ›</button>' : '') + '</div>';
    el.innerHTML = h;
    el.querySelector('#trBegin').addEventListener('click', function () {
      if (r.kind === 'sandhya') { window.dhSandhya.open(); return; }
      if (window.dhSession) window.dhSession.start(r.room.id, { aartiId: r.aartiId, title: r.kind === 'festival' ? r.fest.dev + ' · ' + r.fest.name : r.wd.dev + ' · ' + r.wd.en });
    });
    var alt = el.querySelector('#trAlt');
    if (alt) alt.addEventListener('click', function () { if (window.dhSession) window.dhSession.start(r.room.id, { title: r.wd.dev + ' · ' + r.wd.en }); });
  }

  /* ---------- next festival ---------- */
  function renderNext(info) {
    var host = document.getElementById('todayNext');
    if (typeof FESTIVALS === 'undefined') { host.innerHTML = ''; return; }
    var best = null;
    FESTIVALS.forEach(function (f) {
      [f.d2026, f.d2027].forEach(function (iso) {
        if (iso > info.iso && (!best || iso < best.iso)) best = { f: f, iso: iso };
      });
    });
    if (!best) { host.innerHTML = ''; return; }
    var p = best.iso.split('-').map(Number);
    var n = Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - Date.UTC(info.t.y, info.t.m, info.t.d)) / 86400000);
    host.innerHTML = '<button type="button" class="t-card t-next" id="tnGo">' +
      '<span class="tn-days"><b>' + n + '</b><small>day' + (n === 1 ? '' : 's') + ' to go</small></span>' +
      '<span class="tn-main"><span class="t-kicker">अगला उत्सव · Next festival</span>' +
      '<span class="tn-dev">' + esc(best.f.dev) + '</span><span class="tn-en">' + esc(best.f.name) + ' · ' +
      new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '</span></span>' +
      '<span class="cl-go" aria-hidden="true">›</span></button>';
    host.querySelector('#tnGo').addEventListener('click', function () {
      window.dhTab('calendar');
      if (window.dhPanchang && window.dhPanchang.showMonth) window.dhPanchang.showMonth(p[0], p[1] - 1);
      if (window.dhFestival) window.dhFestival.open(best.f.name, best.iso);
    });
  }

  /* ---------- continue (active sankalp) ---------- */
  function renderContinue() {
    var host = document.getElementById('todayContinue');
    var a = window.dhSankalp && window.dhSankalp.active ? window.dhSankalp.active() : null;
    if (!a) { host.innerHTML = ''; return; }
    var sub = a.scheduled ? 'Begins ' + new Date(a.startISO + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'Day ' + a.day + ' of ' + a.duration + ' · ' + (a.sealedToday ? 'today is sealed' : a.taps + ' of ' + a.target + ' today');
    host.innerHTML = '<button type="button" class="t-card t-continue" id="tcGo">' +
      '<span class="tn-main"><span class="t-kicker">जारी रखें · Continue</span>' +
      '<span class="tc-dev">सङ्कल्प · <span class="' + (/[ऀ-ॿ]/.test(a.text) ? 'tc-text-dev' : 'tc-text') + '">' + esc(a.text) + '</span></span>' +
      '<span class="tn-en">' + esc(a.mantraDev) + ' · ' + sub + '</span></span><span class="cl-go" aria-hidden="true">›</span></button>';
    host.querySelector('#tcGo').addEventListener('click', function () { window.dhSankalp.openGoal(a.id); });
  }

  /* ---------- the one Plus entry (Today only) ---------- */
  function renderPlus() {
    var host = document.getElementById('todayPlus');
    var P = window.dhPlus;
    if (!host || !P) return;
    var h;
    if (P.isActive()) {
      h = '<span class="tpl-main"><b>✨ Sankalp+</b><small>' + (P.trialDaysLeft && P.trialDaysLeft() ? P.trialDaysLeft() + ' trial day' + (P.trialDaysLeft() === 1 ? '' : 's') + ' left · ' : '') + 'daily muhurat for any date and city, festival alerts</small></span>' +
        '<span class="tpl-cta">Open city muhurat ›</span>';
    } else if (P.canStartTrial && P.canStartTrial()) {
      h = '<span class="tpl-main"><b>✨ Sankalp+</b><small>Muhurat for any date, festival alerts in your calendar, a deeper sankalp. Prayers are always free.</small></span>' +
        '<span class="tpl-cta">Try 7 days free ›</span>';
    } else {
      h = '<span class="tpl-main"><b>✨ Sankalp+</b><small>Muhurat for any date, festival alerts, a deeper sankalp.</small></span><span class="tpl-cta">See Sankalp+ ›</span>';
    }
    host.innerHTML = '<button type="button" class="t-plus" id="tplGo">' + h + '</button>';
    host.querySelector('#tplGo').addEventListener('click', function () {
      if (P.isActive() && window.dhMuhuratUI) window.dhMuhuratUI.open(); else P.open();
    });
  }

  function render() {
    var info = todayInfo();
    renderHead(info);
    renderPanchang(info);
    renderRitual(info);
    renderNext(info);
    renderContinue();
    renderPlus();
  }

  window.dhToday = {
    render: render,
    ritualPrayerId: function () { if (!ritual) ritual = pickRitual(todayInfo()); return ritual.aartiId || 'om-jai-jagdish-hare'; },
    ritualRoom: function () { if (!ritual) ritual = pickRitual(todayInfo()); return ritual.room.id; }
  };

  function init() {
    render();
    document.addEventListener('dh-city', render);
    document.addEventListener('dh-sankalp-change', renderContinue);
    document.addEventListener('dh-plus-change', renderPlus);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
    setInterval(function () { if (!document.hidden) renderRitual(todayInfo()); }, 5 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
