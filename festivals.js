// Divine Hub — festival panchang 2026-2027
// Dates cross-checked against Drik Panchang and Indian national holiday calendars.
// Hindu festival dates follow the lunar calendar; regional observance can differ
// by a day. This table is a fixed, verified dataset (no live API).

const FESTIVALS = [
  { name: 'Makar Sankranti', dev: 'मकर संक्रांति', d2026: '2026-01-14', d2027: '2027-01-15', deity: 'Surya', note: 'The sun’s entry into Capricorn. Kites, til-gud sweets, holy dips — a harvest festival of gratitude.' },
  { name: 'Vasant Panchami', dev: 'वसंत पंचमी', d2026: '2026-01-23', d2027: '2027-02-11', deity: 'Saraswati', note: 'Spring’s arrival, dedicated to Saraswati. Children begin learning; yellow is worn and offered.' },
  { name: 'Maha Shivratri', dev: 'महाशिवरात्रि', d2026: '2026-02-15', d2027: '2027-03-06', deity: 'Shiv', note: 'The great night of Shiva — fasting, bel-patra offerings, abhishek and night-long japa of Om Namah Shivaya.' },
  { name: 'Holi', dev: 'होली', d2026: '2026-03-04', d2027: '2027-03-22', deity: 'Vishnu', note: 'Festival of colours. Holika dahan the evening before marks the burning of evil; the next day is play, forgiveness and gujiya.' },
  { name: 'Gudi Padwa / Ugadi', dev: 'गुड़ी पड़वा / युगादि', d2026: '2026-03-19', d2027: '2027-04-07', deity: 'Vishnu', note: 'The Hindu New Year in Maharashtra and the Deccan; a gudi flag is raised at the door for victory and prosperity.' },
  { name: 'Chaitra Navratri begins', dev: 'चैत्र नवरात्रि', d2026: '2026-03-19', d2027: '2027-04-07', deity: 'Durga', note: 'Nine nights of the Goddess beginning the new year, ending at Ram Navami. Fasting, Durga Saptashati path and kanya pujan.' },
  { name: 'Ram Navami', dev: 'राम नवमी', d2026: '2026-03-26', d2027: '2027-04-15', deity: 'Vishnu', note: 'The appearance day of Shri Ram in Ayodhya. Ramcharitmanas path, bhajans and midday abhishek.' },
  { name: 'Hanuman Jayanti', dev: 'हनुमान जयंती', d2026: '2026-04-02', d2027: '2027-04-20', deity: 'Hanuman', note: 'Birth of Hanuman on Chaitra Purnima. Hanuman Chalisa recitations, sindoor offerings and Sundarakhand path.' },
  { name: 'Guru Purnima', dev: 'गुरु पूर्णिमा', d2026: '2026-07-29', d2027: '2027-07-18', deity: 'Sai Baba', note: 'Full moon of Ashadha, honouring the guru — the day of Ved Vyasa. Sai devotees keep special Shirdi remembrance.' },
  { name: 'Nag Panchami', dev: 'नाग पंचमी', d2026: '2026-08-17', d2027: '2027-08-06', deity: 'Shiv', note: 'Worship of the serpent deities; milk offerings and prayers for protection of the family.' },
  { name: 'Raksha Bandhan', dev: 'रक्षा बंधन', d2026: '2026-08-28', d2027: '2027-08-17', deity: 'Vishnu', note: 'Sisters tie the rakhi of protection on brothers’ wrists on the Shravan full moon.' },
  { name: 'Krishna Janmashtami', dev: 'कृष्ण जन्माष्टमी', d2026: '2026-09-04', d2027: '2027-08-25', deity: 'Krishna', note: 'Midnight birth of Shri Krishna. Fasting, cradle-jhula, dahi handi, and the singing of Krishna bhajans till midnight.' },
  { name: 'Ganesh Chaturthi', dev: 'गणेश चतुर्थी', d2026: '2026-09-14', d2027: '2027-09-04', deity: 'Ganesh', note: 'Ganesh’s birthday. Clay murtis are welcomed home with modak offerings, aartis, and visarjan on Anant Chaturdashi.' },
  { name: 'Sharad Navratri begins', dev: 'शरद नवरात्रि', d2026: '2026-10-11', d2027: '2027-09-30', deity: 'Durga', note: 'The autumn nine nights of Durga — the year’s biggest Devi festival: fasting, garba, and nine forms of the Goddess.' },
  { name: 'Dussehra (Vijayadashami)', dev: 'दशहरा', d2026: '2026-10-20', d2027: '2027-10-09', deity: 'Durga', note: 'Victory of Ram over Ravan and of Durga over Mahishasur. Ravan effigies burn; weapons and tools are worshipped.' },
  { name: 'Karva Chauth', dev: 'करवा चौथ', d2026: '2026-10-29', d2027: '2027-10-18', deity: 'Shiv', note: 'Married women fast sunrise to moonrise for their husbands’ long life, breaking the fast after seeing the moon through a sieve.' },
  { name: 'Diwali (Lakshmi Puja)', dev: 'दीपावली', d2026: '2026-11-08', d2027: '2027-10-29', deity: 'Lakshmi', note: 'The festival of lights — Lakshmi-Ganesh puja at dusk, diyas in every window, marking Ram’s return to Ayodhya.' },
  { name: 'Govardhan Puja / Annakut', dev: 'गोवर्धन पूजा', d2026: '2026-11-10', d2027: '2027-10-30', deity: 'Krishna', note: 'Krishna lifted Govardhan hill to shelter Braj from Indra’s storm; mountains of food (annakut) are offered in thanks.' },
  { name: 'Bhai Dooj', dev: 'भाई दूज', d2026: '2026-11-11', d2027: '2027-10-31', deity: 'Vishnu', note: 'Sisters mark brothers’ foreheads with tilak and pray for their long life — Yama and Yamuna’s day.' }
];

// Next occurrence helper: given a Date, return festivals sorted by next date.
function festivalsUpcoming(fromDate) {
  const y = fromDate.getFullYear();
  const today = new Date(y, fromDate.getMonth(), fromDate.getDate());
  const rows = [];
  FESTIVALS.forEach(f => {
    [f.d2026, f.d2027].forEach(d => {
      const dt = new Date(d + 'T00:00:00');
      if (dt >= today) rows.push({ f: f, date: dt });
    });
  });
  rows.sort((a, b) => a.date - b.date);
  return rows;
}

function fmtFestivalDate(dt) {
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
