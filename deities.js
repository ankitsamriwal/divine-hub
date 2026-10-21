/* Divine Hub — deity rooms: one shared map from deity to its prayers, aarti,
   japa mantra, festivals and weekday. Used by Today, Calendar, Sadhana and
   Library. Mantras come from the app's existing japa / sankalp / panchang data;
   nothing here is new scripture. */
(function () {
  'use strict';

  var ROOMS = [
    { id: 'ganesh', name: 'Ganesh', dev: 'गणेश', match: ['Ganesh'], aarti: 'jai-ganesh-deva',
      mantra: { value: 'om gam ganapataye namah', dev: 'ॐ गं गणपतये नमः', label: 'Om Gam Ganapataye Namah' } },
    { id: 'hanuman', name: 'Hanuman', dev: 'हनुमान', match: ['Hanuman'], aarti: 'hanuman-aarti',
      mantra: { value: 'om hanumate namah', dev: 'ॐ हनुमते नमः', label: 'Om Hanumate Namah' } },
    { id: 'shiv', name: 'Shiv', dev: 'शिव', match: ['Shiv', 'Shiva', 'Bhairav'], aarti: 'om-jai-shiv-omkara',
      mantra: { value: 'om namah shivaya', dev: 'ॐ नमः शिवाय', label: 'Om Namah Shivaya' } },
    { id: 'lakshmi', name: 'Lakshmi', dev: 'लक्ष्मी', match: ['Lakshmi'], aarti: 'om-jai-lakshmi-mata',
      mantra: { value: 'om shreem mahalakshmiyei namah', dev: 'ॐ श्रीं महालक्ष्म्यै नमः', label: 'Om Shreem Mahalakshmiyei Namah' } },
    { id: 'vishnu', name: 'Vishnu · Krishna', dev: 'विष्णु · कृष्ण', match: ['Vishnu', 'Krishna', 'Radha'], aarti: 'om-jai-jagdish-hare',
      mantra: { value: 'om namo narayanaya', dev: 'ॐ नमो नारायणाय', label: 'Om Namo Narayanaya' } },
    { id: 'durga', name: 'Durga', dev: 'दुर्गा', match: ['Durga'], aarti: 'jai-ambe-gauri',
      mantra: { value: 'om dum durgayei namah', dev: 'ॐ दुं दुर्गायै नमः', label: 'Om Dum Durgayei Namah' } },
    { id: 'ram', name: 'Ram', dev: 'राम', match: ['Ram'], aarti: 'shri-ramchandra-kripalu-bhajman',
      mantra: { value: 'jai shri ram', dev: 'जय श्री राम', label: 'Jai Shri Ram' } },
    { id: 'saraswati', name: 'Saraswati', dev: 'सरस्वती', match: ['Saraswati'], aarti: 'om-jai-saraswati-mata',
      mantra: { value: 'om aim saraswatyai namah', dev: 'ॐ ऐं सरस्वत्यै नमः', label: 'Om Aim Saraswatyai Namah' } },
    { id: 'surya', name: 'Surya', dev: 'सूर्य', match: ['Surya'], aarti: 'surya-aarti',
      mantra: { value: 'om suryaya namah', dev: 'ॐ सूर्याय नमः', label: 'Om Suryaya Namah' } },
    { id: 'others', name: 'Other deities', dev: 'अन्य', match: ['Sai Baba', 'Sheetla Mata', 'Santoshi Mata'], aarti: null, mantra: null }
  ];

  /* Sun..Sat. Friday and Saturday name the paired deity; the sitting uses the
     room whose prayers are in this collection. */
  var WEEKDAY = [
    { room: 'surya', dev: 'रविवार', en: 'Sunday', note: 'Surya' },
    { room: 'shiv', dev: 'सोमवार', en: 'Monday', note: 'Shiv' },
    { room: 'hanuman', dev: 'मंगलवार', en: 'Tuesday', note: 'Hanuman' },
    { room: 'ganesh', dev: 'बुधवार', en: 'Wednesday', note: 'Ganesh' },
    { room: 'vishnu', dev: 'गुरुवार', en: 'Thursday', note: 'Vishnu' },
    { room: 'lakshmi', dev: 'शुक्रवार', en: 'Friday', note: 'Lakshmi · Santoshi Mata' },
    { room: 'hanuman', dev: 'शनिवार', en: 'Saturday', note: 'Hanuman · Shani dev' }
  ];

  /* festival -> puja guide (guides.js) where the festival's own note names it */
  var FEST_GUIDE = {
    'Diwali (Lakshmi Puja)': 'lakshmi-puja-diwali',
    'Ganesh Chaturthi': 'ganesh-sthapana',
    'Hanuman Jayanti': 'sundarakhand-path'
  };
  /* festival -> aarti, where the festival's deity has a more specific aarti */
  var FEST_AARTI = {
    'Krishna Janmashtami': 'aarti-kunj-bihari-ki',
    'Govardhan Puja / Annakut': 'aarti-kunj-bihari-ki',
    'Ram Navami': 'shri-ramchandra-kripalu-bhajman',
    'Guru Purnima': 'sai-baba-aarti',
    'Diwali (Lakshmi Puja)': 'om-jai-lakshmi-mata'
  };
  var FEST_ROOM = { 'Ram Navami': 'ram', 'Krishna Janmashtami': 'vishnu' };

  function byId(id) { for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i]; return null; }
  function roomFor(deity) {
    for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].match.indexOf(deity) !== -1) return ROOMS[i];
    return byId('others');
  }
  function prayer(id) { return (typeof PRAYERS !== 'undefined') ? PRAYERS.find(function (p) { return p.id === id; }) || null : null; }
  function prayersFor(room) {
    return (typeof PRAYERS !== 'undefined' ? PRAYERS : []).filter(function (p) { return room.match.indexOf(p.deity) !== -1; });
  }
  function typeGroup(p) {
    var t = (p.type || '').toLowerCase();
    if (t === 'aarti') return 'aarti';
    if (t === 'chalisa') return 'chalisa';
    if (t === 'mantra') return 'mantra';
    return 'stotra';
  }
  function festivalsFor(room) {
    if (typeof FESTIVALS === 'undefined') return [];
    return FESTIVALS.filter(function (f) { return festivalRoom(f).id === room.id; });
  }
  function festivalRoom(f) { return byId(FEST_ROOM[f.name]) || roomFor(f.deity); }
  function festivalByName(name) {
    if (typeof FESTIVALS === 'undefined') return null;
    return FESTIVALS.find(function (f) { return f.name === name; }) || null;
  }
  function festivalAarti(f) { return FEST_AARTI[f.name] || (festivalRoom(f).aarti) || null; }
  function festivalGuide(f) {
    var id = FEST_GUIDE[f.name];
    if (!id || typeof PUJA_GUIDES === 'undefined') return null;
    return PUJA_GUIDES.find(function (g) { return g.id === id; }) || null;
  }
  /* japa preset from a Mantra-type prayer's first line */
  function mantraFromPrayer(p) {
    var s = p.stanzas[0];
    var dev = (s.dev[0] || '').replace(/[।॥|]+/g, '').trim();
    var tr = (s.translit[0] || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return { value: tr || p.id, dev: dev, label: p.title };
  }
  function isoOf(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }

  window.DH_DEITY = {
    ROOMS: ROOMS, WEEKDAY: WEEKDAY, byId: byId, roomFor: roomFor, prayer: prayer,
    prayersFor: prayersFor, typeGroup: typeGroup, festivalsFor: festivalsFor,
    festivalRoom: festivalRoom, festivalByName: festivalByName, festivalAarti: festivalAarti,
    festivalGuide: festivalGuide, mantraFromPrayer: mantraFromPrayer, isoOf: isoOf
  };
})();
