// Divine Hub weekly content (2026-11-10). Dev Uthani Ekadashi and Tulsi Vivah fall on 20 Nov 2026, when Vishnu wakes and Tulsi is wed to Shaligram.
// Tulsi aarti compared across HinduTracks and OmKiran Bhakti, which carry the identical six-stanza edition; Drik Panchang carries a variant edition with different opening lines.
// The closing couplet "hamari vipad haro tum, kripa karo mata" appears in only one source and is left out. Om Namo Bhagavate Vasudevaya per Wikipedia, citing the Vishnu Purana and Shrimad Bhagavatam.
const PRAYERS11 = [
{
  id: 'jai-jai-tulsi-mata',
  title: 'Jai Jai Tulsi Mata (Tulsi Aarti)', titleDev: 'जय जय तुलसी माता',
  deity: 'Tulsi', deityDev: 'तुलसी', type: 'Aarti', lang: 'hi',
  about: 'The best known aarti of Tulsi, the sacred basil plant dearest to Vishnu. It is sung through the month of Kartik, at Tulsi Vivah on Dev Uthani Ekadashi, and every evening when the lamp is lit beside the Tulsi plant at home.',
  keywords: ['tulsi', 'tulasi', 'basil', 'aarti', 'kartik', 'dev uthani ekadashi', 'tulsi vivah', 'vishnu', 'evening diya', 'vrinda'],
  stanzas: [
    {
      dev: ['जय जय तुलसी माता, मैया जय तुलसी माता।', 'सब जग की सुख दाता, सबकी वर माता॥ जय तुलसी माता॥'],
      translit: ['Jai jai Tulsi Mata, maiya jai Tulsi Mata.', 'Sab jag ki sukh data, sabki var mata. Jai Tulsi Mata.'],
      meaning: 'Victory to Mother Tulsi, again and again. You give happiness to the whole world, the mother who grants every blessing. (Refrain: victory to Mother Tulsi.)'
    },
    {
      dev: ['सब योगों से ऊपर, सब रोगों से ऊपर।', 'रज से रक्ष करके, सबकी भव त्राता॥'],
      translit: ['Sab yogon se upar, sab rogon se upar.', 'Raj se raksh karke, sabki bhav trata.'],
      meaning: 'You stand above every worldly bond and above every sickness. Guarding us from the dust of sin, You carry us all across the ocean of worldly life.'
    },
    {
      dev: ['बटु पुत्री है श्यामा, सूर बल्ली है ग्राम्या।', 'विष्णुप्रिय जो नर तुमको सेवे, सो नर तर जाता॥'],
      translit: ['Batu putri hai Shyama, sur balli hai gramya.', 'Vishnupriya jo nar tumko seve, so nar tar jata.'],
      meaning: 'Shyama, the dark-leaved one, is the sacred creeper of the gods, worshipped in every village. O beloved of Vishnu, whoever serves You is carried safely across.'
    },
    {
      dev: ['हरि के शीश विराजत, त्रिभुवन से हो वंदित।', 'पतित जनों की तारिणी, तुम हो विख्याता॥'],
      translit: ['Hari ke shish virajat, tribhuvan se ho vandit.', 'Patit janon ki tarini, tum ho vikhyata.'],
      meaning: 'You shine upon the head of Hari Himself and are honoured through the three worlds. You are famed as the saviour of the fallen.'
    },
    {
      dev: ['लेकर जन्म विजन में, आई दिव्य भवन में।', 'मानव लोक तुम्हीं से, सुख संपत्ति पाता॥'],
      translit: ['Lekar janm vijan mein, aayi divya bhavan mein.', 'Manav lok tumhin se, sukh sampatti pata.'],
      meaning: 'Born in the forest, You came to dwell in the divine abode. From You alone mankind receives happiness and prosperity.'
    },
    {
      dev: ['हरि को तुम अति प्यारी, श्याम वर्ण सुकुमारी।', 'प्रेम अजब है उनका, तुमसे कैसा नाता॥'],
      translit: ['Hari ko tum ati pyari, shyam varan sukumari.', 'Prem ajab hai unka, tumse kaisa nata.'],
      meaning: 'Hari loves You dearly, O tender, dusky one. How wonderful is His love, how deep His bond with You.'
    }
  ]
},
{
  id: 'om-namo-bhagavate-vasudevaya',
  title: 'Om Namo Bhagavate Vasudevaya (Vishnu Mantra)', titleDev: 'ॐ नमो भगवते वासुदेवाय',
  deity: 'Vishnu', deityDev: 'विष्णु', type: 'Mantra', lang: 'sa',
  about: 'The Dvadashakshari, the twelve-syllable mantra of Vishnu, named in the Vishnu Purana and the Shrimad Bhagavatam as the foremost Vaishnava mantra. It is chanted on Ekadashi, on Thursdays and through Kartik, usually 108 times on a tulsi mala.',
  keywords: ['vishnu', 'vasudev', 'vasudevaya', 'om namo bhagavate vasudevaya', 'dvadashakshari', 'twelve syllable', 'ekadashi', 'thursday', 'kartik', 'japa', 'mantra', 'narayana', 'krishna'],
  stanzas: [{
    dev: ['ॐ नमो भगवते वासुदेवाय॥'],
    translit: ['Om namo bhagavate Vaasudevaaya.'],
    meaning: 'Om. I bow to Lord Vasudeva, Vishnu, the God who dwells in every being and shines through them all.'
  }]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS11);

// Deity note for the batch-11 addition (used by the Guide and filter).
if (typeof DEITIES !== 'undefined') Object.assign(DEITIES, {
  'Tulsi': { dev: 'तुलसी', aliases: ['tulsi', 'tulasi', 'vrinda', 'basil', 'holy basil', 'tulsi mata'], blurb: 'Tulsi, the holy basil, is the plant goddess dearest to Vishnu, worshipped in the courtyard of homes across India. On Dev Uthani Ekadashi in Kartik she is wed to Shaligram in the Tulsi Vivah, which opens the wedding season; her leaves are offered to no deity but Vishnu.' }
});
