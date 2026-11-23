// Divine Hub weekly content (2026-11-24). Kartik Purnima and Dev Deepawali fall today, 24 Nov 2026: the gods light lamps in Kashi, and the year's most sacred Ganga snaan.
// Kashi Vishwanath Ashtakam (attributed to Maharshi Vyasa) compared across sanatani.in and astrobhava.com, which carry the identical eight verses plus the two closing phalashruti verses.
// Om Jai Gange Mata compared across Drik Panchang and snatanbhakti.com, which carry the identical five-part text.
const PRAYERS13 = [
{
  id: 'kashi-vishwanath-ashtakam',
  title: 'Kashi Vishwanath Ashtakam', titleDev: 'काशीविश्वनाथाष्टकम्',
  deity: 'Shiv', deityDev: 'शिव', type: 'Stotram', lang: 'sa',
  about: 'Eight verses in praise of Vishwanath, the Shiva of Kashi, attributed to Maharshi Vyasa. Kashi is his own city, and on Kartik Purnima, Dev Deepawali, the gods themselves come down to light its ghats with lamps. Sung here with its two closing phalashruti verses.',
  keywords: ['shiva', 'shiv', 'kashi', 'vishwanath', 'vishvanath', 'vishweshwar', 'varanasi', 'banaras', 'kashi vishwanath ashtakam', 'vyasa', 'ashtakam', 'dev deepawali', 'kartik purnima', 'stotram', 'jyotirlinga'],
  stanzas: [
    {
      dev: ['गङ्गातरङ्गरमणीयजटाकलापं गौरीनिरन्तरविभूषितवामभागम्।', 'नारायणप्रियमनङ्गमदापहारं वाराणसीपुरपतिं भज विश्वनाथम्॥ १॥'],
      translit: ['Gangaataranga-ramaneeya-jataakalaapam Gauree-nirantara-vibhooshita-vaamabhaagam,', 'Naaraayana-priyam-ananga-madaapahaaram Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: his matted locks are graced by the waves of the Ganga, his left side is forever adorned by Gauri, and he, the beloved of Narayana, put down the pride of the bodiless god of love.'
    },
    {
      dev: ['वाचामगोचरमनेकगुणस्वरूपं वागीशविष्णुसुरसेवितपादपीठम्।', 'वामेन विग्रहवरेण कलत्रवन्तं वाराणसीपुरपतिं भज विश्वनाथम्॥ २॥'],
      translit: ['Vaachaam-agocharam-aneka-guna-svaroopam Vaageesha-Vishnu-sura-sevita-paada-peetham,', 'Vaamena vigraha-varena kalatra-vantam Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: beyond the reach of words, of many forms and countless virtues, whose footstool Brahma, Vishnu and the gods serve, and whose own left half is his beloved wife.'
    },
    {
      dev: ['भूताधिपं भुजगभूषणभूषिताङ्गं व्याघ्राजिनाम्बरधरं जटिलं त्रिनेत्रम्।', 'पाशाङ्कुशाभयवरप्रदशूलपाणिं वाराणसीपुरपतिं भज विश्वनाथम्॥ ३॥'],
      translit: ['Bhootaadhipam bhujaga-bhooshana-bhooshitaangam vyaaghraajinaambara-dharam jatilam trinetram,', 'Paashaankushaabhaya-vara-prada-shoola-paanim Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: the lord of all beings, his body hung with serpent ornaments, wearing the tiger skin, matted-haired and three-eyed, his hands holding the noose, the goad, the gesture of fearlessness, the gift of boons and the trident.'
    },
    {
      dev: ['शीतांशुशोभितकिरीटविराजमानं भालेक्षणानलविशोषितपञ्चबाणम्।', 'नागाधिपारचितभासुरकर्णपूरं वाराणसीपुरपतिं भज विश्वनाथम्॥ ४॥'],
      translit: ['Sheetaamshu-shobhita-kireeta-viraajamaanam bhaalekshanaanala-vishoshita-panchabaanam,', 'Naagaadhipaarchita-bhaasura-karna-pooram Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: radiant in a crest lit by the cool moon, whose forehead eye burned up the five arrows of the god of love, his bright earrings adored by the king of serpents.'
    },
    {
      dev: ['पञ्चाननं दुरितमत्तमतङ्गजानां नागान्तकं दनुजपुङ्गवपन्नगानाम्।', 'दावानलं मरणशोकजराटवीनां वाराणसीपुरपतिं भज विश्वनाथम्॥ ५॥'],
      translit: ['Panchaananam durita-matta-matangajaanaam naagaantakam danuja-pungava-pannagaanaam,', 'Daavaanalam marana-shoka-jaraataveenaam Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: five-faced, the lion to the mad elephants of sin, Garuda to the serpents of the demon lords, and the forest fire to the dark woods of death, grief and old age.'
    },
    {
      dev: ['तेजोमयं सगुणनिर्गुणमद्वितीय- मानन्दकन्दमपराजितमप्रमेयम्।', 'नागात्मकं सकलनिष्कलमात्मरूपं वाराणसीपुरपतिं भज विश्वनाथम्॥ ६॥'],
      translit: ['Tejomayam saguna-nirgunam-adviteeyam aananda-kandam-aparaajitam-aprameyam,', 'Naagaatmakam sakala-nishkalam-aatmaroopam Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: pure splendour, with form and beyond form, second to none, the root of all bliss, unconquered and immeasurable, bearing serpents on his body, the Self that is at once with parts and without any part.'
    },
    {
      dev: ['रागादिदोषरहितं स्वजनानुरागं वैराग्यशान्तिनिलयं गिरिजासहायम्।', 'माधुर्यधैर्यसुभगं गरलाभिरामं वाराणसीपुरपतिं भज विश्वनाथम्॥ ७॥'],
      translit: ['Raagaadi-dosha-rahitam svajanaanuraagam vairaagya-shaanti-nilayam Girijaasahaayam,', 'Maadhurya-dhairya-subhagam garalaabhiraamam Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'I worship Vishwanath, the Lord of Varanasi: free of every taint of passion, tender toward his own, the dwelling of detachment and peace, forever with Girija, lovely in patience and sweetness, beautiful with the poison held at his throat.'
    },
    {
      dev: ['आशां विहाय परिहृत्य परस्य निन्दां पापे रतिं च सुनिवार्य मनः समाधौ।', 'आदाय हृत्कमलमध्यगतं परेशं वाराणसीपुरपतिं भज विश्वनाथम्॥ ८॥'],
      translit: ['Aashaam vihaaya parihritya parasya nindaam paape ratim cha sunivaarya manah samaadhau,', 'Aadaaya hrit-kamala-madhyagatam Paresham Vaaraanasee-pura-patim bhaja Vishvanaatham.'],
      meaning: 'Laying aside every desire, abandoning the fault-finding of others, turning the heart away from delight in sin and fixing the mind in meditation, I worship Vishwanath, the Lord of Varanasi, the Supreme Lord dwelling in the lotus of the heart.'
    },
    {
      dev: ['वाराणसीपुरपतेः स्तवनं शिवस्य व्याख्यातमष्टकमिदं पठते मनुष्यः।', 'विद्यां श्रियं विपुलसौख्यमनन्तकीर्तिं सम्प्राप्य देहविलये लभते च मोक्षम्॥ ९॥'],
      translit: ['Vaaraanasee-pura-pateh stavanam Shivasya vyaakhyaatam-ashtakam-idam pathate manushyah,', 'Vidyaam shriyam vipula-saukhyam-ananta-keertim sampraapya deha-vilaye labhate cha moksham.'],
      meaning: 'The one who reads this ashtakam, the praise of Shiva, the Lord of Varanasi, gains learning, wealth, abundant happiness and endless fame, and when the body falls away attains liberation. (Phalashruti, the fruit of reciting.)'
    },
    {
      dev: ['विश्वनाथाष्टकमिदं यः पठेच्छिवसन्निधौ।', 'शिवलोकमवाप्नोति शिवेन सह मोदते॥ १०॥'],
      translit: ['Vishvanaathaashtakam-idam yah pathech-chhiva-sannidhau,', 'Shivalokam-avaapnoti Shivena saha modate.'],
      meaning: 'Whoever recites this Vishwanath Ashtakam in the presence of Shiva reaches Shiva\'s world and rejoices there together with him. (Phalashruti, the fruit of reciting.)'
    }
  ]
},
{
  id: 'om-jai-gange-mata',
  title: 'Om Jai Gange Mata (Ganga Aarti)', titleDev: 'ॐ जय गंगे माता',
  deity: 'Ganga', deityDev: 'गंगा', type: 'Aarti', lang: 'hi',
  about: 'The best known aarti of Mother Ganga, sung every evening on her ghats in Haridwar, Rishikesh and Varanasi. On Kartik Purnima the year\'s most sacred Ganga snaan is taken, and this is the aarti sung by her banks.',
  keywords: ['ganga', 'gange', 'ganga mata', 'ganga maiya', 'aarti', 'kartik purnima', 'ganga snaan', 'dev deepawali', 'varanasi', 'haridwar', 'rishikesh', 'river goddess', 'ganges'],
  stanzas: [
    {
      dev: ['ॐ जय गंगे माता, मैया जय गंगे माता।', 'जो नर तुमको ध्याता, मनवांछित फल पाता॥ ॐ जय गंगे माता॥'],
      translit: ['Om jai Gange Mata, maiya jai Gange Mata.', 'Jo nar tumko dhyata, manvanchhit phal pata. Om jai Gange Mata.'],
      meaning: 'Victory to Mother Ganga, again and again. Whoever meditates on You receives the heart\'s longed-for fruit. (Refrain: victory to Mother Ganga.)'
    },
    {
      dev: ['चन्द्र-सी ज्योति तुम्हारी, जल निर्मल आता।', 'शरण पड़े जो तेरी, सो नर तर जाता॥'],
      translit: ['Chandra-si jyoti tumhari, jal nirmal aata.', 'Sharan pare jo teri, so nar tar jata.'],
      meaning: 'Your light is like the moon\'s and Your waters come pure and clear. Whoever takes shelter in You is carried safely across.'
    },
    {
      dev: ['पुत्र सगर के तारे, सब जग को ज्ञाता।', 'कृपा दृष्टि हो तुम्हारी, त्रिभुवन सुख दाता॥'],
      translit: ['Putra Sagar ke taare, sab jag ko gyata.', 'Kripa drishti ho tumhari, tribhuvan sukh data.'],
      meaning: 'You rescued the sons of King Sagar, as the whole world knows. When Your gracious glance falls, all three worlds find happiness.'
    },
    {
      dev: ['एक बार जो प्राणी, शरण तेरी आता।', 'यम की त्रास मिटाकर, परमगति पाता॥'],
      translit: ['Ek baar jo prani, sharan teri aata.', 'Yam ki traas mitakar, paramgati pata.'],
      meaning: 'The being who comes to Your shelter even once loses all fear of Yama, the lord of death, and attains the highest state.'
    },
    {
      dev: ['आरती मातु तुम्हारी, जो नर नित गाता।', 'सेवक वही सहज में, मुक्ति को पाता॥'],
      translit: ['Aarti matu tumhari, jo nar nit gata.', 'Sevak vahi sahaj mein, mukti ko pata.'],
      meaning: 'Whoever sings this aarti of the Mother every day, that servant easily finds liberation.'
    }
  ]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS13);

// Deity note for the batch-13 addition (used by the Guide and filter).
if (typeof DEITIES !== 'undefined') Object.assign(DEITIES, {
  'Ganga': { dev: 'गंगा', aliases: ['ganga', 'gange', 'ganga mata', 'ganga maiya', 'ganges', 'bhagirathi', 'river ganga'], blurb: 'Ganga, the river goddess who descended from heaven through Shiva\'s locks, is held to wash away every sin. Bathing in her waters on Kartik Purnima, the full moon that closes the holy month, is among the most sacred acts of the year, and her evening aarti fills the ghats of Haridwar, Rishikesh and Varanasi.' }
});
