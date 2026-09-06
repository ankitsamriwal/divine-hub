// Divine Hub — sacred text corpus
// Traditional public-domain prayers. Each stanza: dev (Devanagari lines),
// translit (romanized lines), meaning (English).

const PRAYERS = [

{
  id: 'jai-ganesh-deva',
  title: 'Jai Ganesh Deva',
  titleDev: 'जय गणेश जय गणेश देवा',
  deity: 'Ganesh',
  deityDev: 'गणेश',
  type: 'Aarti',
  lang: 'hi',
  about: 'The most beloved aarti of Lord Ganesh, sung at the start of every auspicious undertaking. It praises the elephant-headed remover of obstacles — son of Parvati and Mahadev — who grants wisdom, fulfils wishes, and blesses every new beginning.',
  keywords: ['ganesh', 'ganpati', 'aarti', 'obstacles', 'vighnaharta', 'beginning', 'wisdom', 'laddu', 'modak', 'elephant'],
  stanzas: [
    {
      dev: ['जय गणेश जय गणेश, जय गणेश देवा।', 'माता जाकी पार्वती, पिता महादेवा॥'],
      translit: ['Jai Ganesh, Jai Ganesh, Jai Ganesh Deva.', 'Mata jaki Parvati, pita Mahadeva.'],
      meaning: 'Victory to You, O Ganesh, victory O Lord Ganesh. Your mother is Parvati, Your father is Mahadev (Shiva).'
    },
    {
      dev: ['एक दंत दयावंत, चार भुजा धारी।', 'माथे सिंदूर सोहे, मूसे की सवारी॥'],
      translit: ['Ek dant dayavant, char bhuja dhari.', 'Mathe sindoor sohe, mooshak ki sawari.'],
      meaning: 'You have one tusk and a compassionate heart, four arms, vermilion adorning Your forehead, and You ride upon the mouse.'
    },
    {
      dev: ['अंधन को आँख देत, कोढ़िन को काया।', 'बाँझन को पुत्र देत, निर्धन को माया॥'],
      translit: ['Andhan ko aankh det, kodhin ko kaya.', 'Banjhan ko putra det, nirdhan ko maya.'],
      meaning: 'You give sight to the blind, a healed body to the leper, a child to the childless, and wealth to the poor.'
    },
    {
      dev: ['पान चढ़े, फूल चढ़े, और चढ़े मेवा।', 'लड्डुअन का भोग लगे, संत करें सेवा॥'],
      translit: ['Paan chadhe, phool chadhe, aur chadhe mewa.', 'Ladduan ka bhog lage, sant karen sewa.'],
      meaning: 'Betel leaves, flowers and dry fruits are offered to You; laddus are placed before You, and saints serve You with devotion.'
    },
    {
      dev: ['दीनन की लाज रखो, शंभु सुतवारी।', 'कामना को पूरा करो, जय बलिहारी॥'],
      translit: ['Deenan ki laaj rakho, Shambhu sutwari.', 'Kaamna ko poora karo, jay balihari.'],
      meaning: 'Protect the honour of the humble, O son of Shambhu; fulfil our desires — victory to You, we surrender ourselves to You.'
    },
    {
      dev: ['जय गणेश जय गणेश, जय गणेश देवा।', 'माता जाकी पार्वती, पिता महादेवा॥'],
      translit: ['Jai Ganesh, Jai Ganesh, Jai Ganesh Deva.', 'Mata jaki Parvati, pita Mahadeva.'],
      meaning: 'Victory to You, O Ganesh, victory O Lord Ganesh. Your mother is Parvati, Your father is Mahadev.'
    }
  ]
},

{
  id: 'ganesh-mantras',
  title: 'Ganesh Mantras',
  titleDev: 'गणेश मंत्र',
  deity: 'Ganesh',
  deityDev: 'गणेश',
  type: 'Mantra',
  lang: 'sa',
  about: 'The essential Sanskrit mantras of Lord Ganesh: the Vakratunda invocation recited before any new work, the Ganesh Gayatri for wisdom, the seed mantra Om Gam Ganapataye Namah, and the Shuklambaradharam dhyana shloka for the removal of all obstacles.',
  keywords: ['ganesh', 'mantra', 'vakratunda', 'gayatri', 'om gam ganapataye', 'shuklambaradharam', 'obstacles', 'beginning'],
  stanzas: [
    {
      dev: ['वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।', 'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥'],
      translit: ['Vakratunda mahakaya suryakoti samaprabha.', 'Nirvighnam kuru me deva sarvakaryeshu sarvada.'],
      meaning: 'O Lord with a curved trunk and a mighty body, radiant like a million suns — free all my undertakings from every obstacle, always.'
    },
    {
      dev: ['ॐ एकदन्ताय विद्महे, वक्रतुण्डाय धीमहि।', 'तन्नो दन्ती प्रचोदयात्॥'],
      translit: ['Om ekadantaya vidmahe, vakratundaya dheemahi.', 'Tanno danti prachodayat.'],
      meaning: 'Om. We meditate upon the One-Tusked Lord; we contemplate the One with the curved trunk. May that Tusked One guide and inspire our intellect. (The Ganesh Gayatri.)'
    },
    {
      dev: ['ॐ गं गणपतये नमः॥'],
      translit: ['Om gam ganapataye namah.'],
      meaning: 'Om. Salutations to Ganapati, the lord of all beings (ganas). "Gam" is the seed (bija) sound of Ganesh — this is His most widely chanted mantra for blessings and the removal of obstacles.'
    },
    {
      dev: ['शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम्।', 'प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये॥'],
      translit: ['Shuklambaradharam vishnum shashivarnam chaturbhujam.', 'Prasannavadanam dhyayet sarvavighnopashantaye.'],
      meaning: 'Meditate upon the all-pervading Lord clad in white, moon-bright in complexion, four-armed and gracious-faced — for the calming of every obstacle.'
    }
  ]
},

{
  id: 'hanuman-aarti',
  title: 'Aarti Kije Hanuman Lala Ki',
  titleDev: 'आरती कीजै हनुमान लला की',
  deity: 'Hanuman',
  deityDev: 'हनुमान',
  type: 'Aarti',
  lang: 'hi',
  about: 'The traditional aarti of Hanuman, the mighty son of Anjani and the wind-god, devoted servant of Shri Ram. It recounts his burning of Lanka, his rescue of Lakshman with the Sanjeevani herb, and his victory over the demon Ahiravan.',
  keywords: ['hanuman', 'aarti', 'bajrangbali', 'strength', 'courage', 'ram', 'devotion', 'lanka', 'anjani'],
  stanzas: [
    {
      dev: ['आरती कीजै हनुमान लला की।', 'दुष्ट दलन रघुनाथ कला की॥'],
      translit: ['Aarti kije Hanuman lala ki.', 'Dusht dalan Raghunath kala ki.'],
      meaning: 'Let us perform the aarti of Hanuman, the beloved son — the crusher of the wicked, who carries the divine power of Raghunath (Lord Ram).'
    },
    {
      dev: ['जाके बल से गिरिवर काँपे।', 'रोग दोष जाके निकट न झाँके॥'],
      translit: ['Jake bal se girivar kaanpe.', 'Rog dosh jake nikat na jhaanke.'],
      meaning: 'At whose strength even the great mountains tremble; sickness and impurity dare not come near him.'
    },
    {
      dev: ['अंजनि पुत्र महा बलदाई।', 'संतन के प्रभु सदा सहाई॥'],
      translit: ['Anjani putra maha baladayi.', 'Santan ke prabhu sada sahayi.'],
      meaning: 'Son of Anjani, giver of immense strength — O Lord, ever the helper of the good and the saintly.'
    },
    {
      dev: ['दे बीरा रघुनाथ पठाए।', 'लंका जारि सिया सुधि लाए॥'],
      translit: ['De beera Raghunath pathaye.', 'Lanka jari Siya sudhi laye.'],
      meaning: 'Raghunath sent forth this hero, who burned Lanka and brought back news of Sita.'
    },
    {
      dev: ['लंका सो कोट समुद्र सी खाई।', 'जात पवनसुत बार न लाई॥'],
      translit: ['Lanka so kot samudra si khayi.', 'Jaat Pavansut baar na layi.'],
      meaning: 'The fortress of Lanka stood beyond a moat-like sea — yet the son of the Wind crossed it without a moment\'s delay.'
    },
    {
      dev: ['लंका जारि असुर संहारे।', 'सियारामजी के काज सँवारे॥'],
      translit: ['Lanka jari asur sanhare.', 'Siyaramji ke kaaj sanvare.'],
      meaning: 'He burned Lanka and destroyed the demons, and accomplished the work of Sita and Ram.'
    },
    {
      dev: ['लक्ष्मण मूर्छित पड़े सकारे।', 'आनि संजीवन प्राण उबारे॥'],
      translit: ['Lakshman moorchhit pare sakare.', 'Aani sanjeevan pran ubare.'],
      meaning: 'When Lakshman lay fallen and unconscious in battle, Hanuman brought the Sanjeevani herb and saved his life.'
    },
    {
      dev: ['पैठि पाताल तोरि जमकारे।', 'अहिरावण की भुजा उखारे॥'],
      translit: ['Paithi patal tori jamkare.', 'Ahiravan ki bhuja ukhare.'],
      meaning: 'He descended into the underworld and broke the arms of death itself, tearing off the arms of the demon Ahiravan.'
    },
    {
      dev: ['बाएँ भुजा असुर दल मारे।', 'दाहिने भुजा संतजन तारे॥'],
      translit: ['Baayen bhuja asur dal mare.', 'Dahine bhuja santjan tare.'],
      meaning: 'With his left arm he struck down the demon hordes; with his right arm he carried the saints to safety.'
    },
    {
      dev: ['सुर नर मुनिजन आरती उतारे।', 'जय जय जय हनुमान उचारे॥'],
      translit: ['Sur nar munijan aarti utare.', 'Jay jay jay Hanuman uchare.'],
      meaning: 'Gods, men and sages wave his aarti lamp, crying "Victory, victory, victory to Hanuman!"'
    },
    {
      dev: ['कंचन थार कपूर लौ छाई।', 'आरती करत अंजना माई॥'],
      translit: ['Kanchan thaar kapoor lau chhayi.', 'Aarti karat Anjana mayi.'],
      meaning: 'On a golden plate the camphor flame glows as mother Anjana herself performs his aarti.'
    },
    {
      dev: ['जो हनुमानजी की आरती गावै।', 'बसि बैकुण्ठ परम पद पावै॥'],
      translit: ['Jo Hanumanji ki aarti gave.', 'Basi Baikunth param pad pave.'],
      meaning: 'Whoever sings this aarti of Hanuman will dwell in Vaikuntha and attain the supreme abode.'
    }
  ]
},

{
  id: 'hanuman-chalisa',
  title: 'Hanuman Chalisa',
  titleDev: 'श्री हनुमान चालीसा',
  deity: 'Hanuman',
  deityDev: 'हनुमान',
  type: 'Chalisa',
  lang: 'hi',
  about: 'Composed by Goswami Tulsidas in Awadhi in the 16th century, the Hanuman Chalisa is the most recited hymn in North India — forty chaupais in praise of Hanuman\'s strength, wisdom, and boundless devotion to Shri Ram. Devotees recite it for courage, protection, and freedom from fear.',
  keywords: ['hanuman', 'chalisa', 'tulsidas', 'bajrangbali', 'maruti', 'strength', 'fear', 'protection', 'ram bhakt', 'sankat mochan'],
  stanzas: [
    {
      dev: ['श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि।', 'बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥'],
      translit: ['Shri Guru charan saroj raj, nij manu mukuru sudhari.', 'Baranau Raghubar bimal jasu, jo dayaku phal chari.'],
      meaning: 'Doha: Polishing the mirror of my mind with the dust of my Guru\'s lotus feet, I sing the pure glory of Raghubar (Ram), which bestows the four fruits of life — dharma, artha, kama and moksha.'
    },
    {
      dev: ['बुद्धिहीन तनु जानिके, सुमिरौं पवन कुमार।', 'बल बुधि विद्या देहु मोहि, हरहु कलेश विकार॥'],
      translit: ['Buddhiheen tanu janike, sumirau Pavan Kumar.', 'Bal budhi vidya dehu mohi, harahu kalesh vikar.'],
      meaning: 'Doha: Knowing myself to be without wisdom, I remember the son of the Wind. Grant me strength, understanding and knowledge, and take away my sorrows and impurities.'
    },
    {
      dev: ['जय हनुमान ज्ञान गुन सागर।', 'जय कपीस तिहुँ लोक उजागर॥ १॥'],
      translit: ['Jay Hanuman gyan gun sagar.', 'Jay Kapis tihu lok ujagar.'],
      meaning: 'Victory to Hanuman, ocean of wisdom and virtue; victory to the lord of the vanaras who illumines all three worlds.'
    },
    {
      dev: ['राम दूत अतुलित बल धामा।', 'अंजनि पुत्र पवनसुत नामा॥ २॥'],
      translit: ['Ram doot atulit bal dhama.', 'Anjani putra Pavansut nama.'],
      meaning: 'Messenger of Ram, abode of matchless strength — known as the son of Anjani, the son of the Wind.'
    },
    {
      dev: ['महाबीर बिक्रम बजरंगी।', 'कुमति निवार सुमति के संगी॥ ३॥'],
      translit: ['Mahavir bikram Bajrangi.', 'Kumati nivar sumati ke sangi.'],
      meaning: 'Great hero, mighty as the thunderbolt — remover of wrong thinking and companion of wisdom.'
    },
    {
      dev: ['कंचन बरन बिराज सुबेसा।', 'कानन कुंडल कुंचित केसा॥ ४॥'],
      translit: ['Kanchan baran biraj subesa.', 'Kanan kundal kunchit kesa.'],
      meaning: 'Your golden-hued form is splendidly attired, with earrings in Your ears and curling hair.'
    },
    {
      dev: ['हाथ बज्र औ ध्वजा बिराजै।', 'काँधे मूँज जनेऊ साजै॥ ५॥'],
      translit: ['Hath bajra au dhwaja birajai.', 'Kaandhe moonj janeu sajai.'],
      meaning: 'In Your hands shine the mace and the banner; across Your shoulder rests the sacred thread of munja grass.'
    },
    {
      dev: ['शंकर सुवन केसरी नंदन।', 'तेज प्रताप महा जग वंदन॥ ६॥'],
      translit: ['Shankar suvan Kesari nandan.', 'Tej pratap maha jag vandan.'],
      meaning: 'Born of Shankar, son of Kesari — Your radiance and glory are revered by the whole world.'
    },
    {
      dev: ['विद्यावान गुनी अति चातुर।', 'राम काज करिबे को आतुर॥ ७॥'],
      translit: ['Vidyavan guni ati chatur.', 'Ram kaj karibe ko atur.'],
      meaning: 'Learned, virtuous and supremely clever, You are ever eager to do the work of Ram.'
    },
    {
      dev: ['प्रभु चरित्र सुनिबे को रसिया।', 'राम लखन सीता मन बसिया॥ ८॥'],
      translit: ['Prabhu charitra sunibe ko rasiya.', 'Ram Lakhan Sita man basiya.'],
      meaning: 'You delight in hearing the story of the Lord; Ram, Lakshman and Sita dwell in Your heart.'
    },
    {
      dev: ['सूक्ष्म रूप धरि सियहि दिखावा।', 'बिकट रूप धरि लंक जरावा॥ ९॥'],
      translit: ['Sukshm roop dhari Siyahi dikhava.', 'Bikat roop dhari Lanka jarava.'],
      meaning: 'Taking a tiny form You appeared before Sita; taking a terrifying form You set Lanka ablaze.'
    },
    {
      dev: ['भीम रूप धरि असुर सँहारे।', 'रामचंद्र के काज सँवारे॥ १०॥'],
      translit: ['Bheem roop dhari asur sanhare.', 'Ramchandra ke kaj sanvare.'],
      meaning: 'Taking a colossal form You destroyed the demons and accomplished the tasks of Ramchandra.'
    },
    {
      dev: ['लाय सजीवन लखन जियाए।', 'श्री रघुबीर हरषि उर लाए॥ ११॥'],
      translit: ['Lay sajivan Lakhan jiyaye.', 'Shri Raghubir harashi ur laye.'],
      meaning: 'You brought the Sanjeevani herb and revived Lakshman; the joyful Raghubir embraced You to his heart.'
    },
    {
      dev: ['रघुपति कीन्ही बहुत बड़ाई।', 'तुम मम प्रिय भरतहि सम भाई॥ १२॥'],
      translit: ['Raghupati keenhi bahut badayi.', 'Tum mam priy Bharatahi sam bhayi.'],
      meaning: 'The Lord of the Raghus praised You greatly: "You are as dear to me as my brother Bharat."'
    },
    {
      dev: ['सहस बदन तुम्हरो जस गावैं।', 'अस कहि श्रीपति कंठ लगावैं॥ १३॥'],
      translit: ['Sahas badan tumharo jas gavai.', 'As kahi Shripati kanth lagavai.'],
      meaning: '"The thousand-headed Shesha sings Your glory" — saying this, the Lord of Lakshmi embraced You.'
    },
    {
      dev: ['सनकादिक ब्रह्मादि मुनीसा।', 'नारद सारद सहित अहीसा॥ १४॥'],
      translit: ['Sanakadik Brahmadi munisa.', 'Narad Sarad sahit Ahisa.'],
      meaning: 'Sages like Sanaka, lords like Brahma, Narad, Saraswati and the serpent-king Shesha all sing of You.'
    },
    {
      dev: ['जम कुबेर दिगपाल जहाँ ते।', 'कवि कोविद कहि सके कहाँ ते॥ १५॥'],
      translit: ['Jam Kuber digpal jahan te.', 'Kavi kovid kahi sake kahan te.'],
      meaning: 'Yama, Kuber and the guardians of the directions praise You — how then can poets and scholars fully describe You?'
    },
    {
      dev: ['तुम उपकार सुग्रीवहि कीन्हा।', 'राम मिलाय राज पद दीन्हा॥ १६॥'],
      translit: ['Tum upkar Sugrivahi keenha.', 'Ram milay raj pad deenha.'],
      meaning: 'You did a great service to Sugriva: You united him with Ram and gave him the throne.'
    },
    {
      dev: ['तुम्हरो मंत्र बिभीषण माना।', 'लंकेश्वर भए सब जग जाना॥ १७॥'],
      translit: ['Tumharo mantra Vibhishan mana.', 'Lankeshwar bhaye sab jag jana.'],
      meaning: 'Vibhishan heeded Your counsel and became the king of Lanka, as all the world knows.'
    },
    {
      dev: ['जुग सहस्त्र जोजन पर भानू।', 'लील्यो ताहि मधुर फल जानू॥ १८॥'],
      translit: ['Jug sahastra jojan par bhanu.', 'Lilyo tahi madhur phal janu.'],
      meaning: 'The sun was thousands of yojanas away, yet thinking it a sweet fruit You swallowed it.'
    },
    {
      dev: ['प्रभु मुद्रिका मेलि मुख माहीं।', 'जलधि लाँघि गए अचरज नाहीं॥ १९॥'],
      translit: ['Prabhu mudrika meli mukh mahi.', 'Jaladhi langhi gaye acharaj nahi.'],
      meaning: 'Holding the Lord\'s ring in Your mouth, You leapt across the ocean — no wonder at all.'
    },
    {
      dev: ['दुर्गम काज जगत के जेते।', 'सुगम अनुग्रह तुम्हरे तेते॥ २०॥'],
      translit: ['Durgam kaj jagat ke jete.', 'Sugam anugrah tumhare tete.'],
      meaning: 'Every difficult task in this world becomes easy by Your grace.'
    },
    {
      dev: ['राम दुआरे तुम रखवारे।', 'होत न आज्ञा बिनु पैसारे॥ २१॥'],
      translit: ['Ram duare tum rakhvare.', 'Hot na aagya binu paisare.'],
      meaning: 'You are the guardian at Ram\'s door; none may enter without Your leave.'
    },
    {
      dev: ['सब सुख लहै तुम्हारी सरना।', 'तुम रक्षक काहू को डरना॥ २२॥'],
      translit: ['Sab sukh lahai tumhari sarna.', 'Tum rakshak kahu ko darna.'],
      meaning: 'All happiness is found in Your refuge; with You as protector, there is nothing to fear.'
    },
    {
      dev: ['आपन तेज सम्हारो आपै।', 'तीनों लोक हाँक तै काँपै॥ २३॥'],
      translit: ['Aapan tej samharo aapai.', 'Teenon lok haank tai kaanpai.'],
      meaning: 'You alone can contain Your own splendour; at Your roar all three worlds tremble.'
    },
    {
      dev: ['भूत पिसाच निकट नहि आवै।', 'महाबीर जब नाम सुनावै॥ २४॥'],
      translit: ['Bhoot pisach nikat nahi avai.', 'Mahavir jab naam sunavai.'],
      meaning: 'Ghosts and evil spirits dare not come near when one speaks the name of the Great Hero.'
    },
    {
      dev: ['नासै रोग हरै सब पीरा।', 'जपत निरंतर हनुमत बीरा॥ २५॥'],
      translit: ['Nasai rog harai sab peera.', 'Japat nirantar Hanumat beera.'],
      meaning: 'Disease is destroyed and all pain removed for one who constantly repeats the name of brave Hanuman.'
    },
    {
      dev: ['संकट तै हनुमान छुड़ावै।', 'मन क्रम वचन ध्यान जो लावै॥ २६॥'],
      translit: ['Sankat tai Hanuman chhuravai.', 'Man kram vachan dhyan jo lavai.'],
      meaning: 'Hanuman frees from every trouble the one who meditates on him in thought, word and deed.'
    },
    {
      dev: ['सब पर राम तपस्वी राजा।', 'तिन के काज सकल तुम साजा॥ २७॥'],
      translit: ['Sab par Ram tapasvi raja.', 'Tin ke kaj sakal tum saja.'],
      meaning: 'Ram, the ascetic king, reigns over all — and You accomplished every one of his tasks.'
    },
    {
      dev: ['और मनोरथ जो कोई लावै।', 'सोइ अमित जीवन फल पावै॥ २८॥'],
      translit: ['Aur manorath jo koi lavai.', 'Soi amit jeevan phal pavai.'],
      meaning: 'Whatever wish a devotee brings, that one receives the boundless fruit of life.'
    },
    {
      dev: ['चारों जुग परताप तुम्हारा।', 'है परसिद्ध जगत उजियारा॥ २९॥'],
      translit: ['Charon jug partap tumhara.', 'Hai parasiddh jagat ujiyara.'],
      meaning: 'Your glory shines through all four ages; Your fame lights up the whole world.'
    },
    {
      dev: ['साधु संत के तुम रखवारे।', 'असुर निकंदन राम दुलारे॥ ३०॥'],
      translit: ['Sadhu sant ke tum rakhvare.', 'Asur nikandan Ram dulare.'],
      meaning: 'You guard the saints and the good, destroyer of demons, beloved of Ram.'
    },
    {
      dev: ['अष्ट सिद्धि नौ निधि के दाता।', 'अस बर दीन जानकी माता॥ ३१॥'],
      translit: ['Ashta siddhi nau nidhi ke data.', 'As bar deen Janaki mata.'],
      meaning: 'Mother Janaki granted You the boon to bestow the eight siddhis (powers) and the nine nidhis (treasures).'
    },
    {
      dev: ['राम रसायन तुम्हरे पासा।', 'सदा रहो रघुपति के दासा॥ ३२॥'],
      translit: ['Ram rasayan tumhare pasa.', 'Sada raho Raghupati ke dasa.'],
      meaning: 'You hold the elixir of Ram\'s name; may You forever remain the servant of Raghupati.'
    },
    {
      dev: ['तुम्हरे भजन राम को पावै।', 'जनम जनम के दुख बिसरावै॥ ३३॥'],
      translit: ['Tumhare bhajan Ram ko pavai.', 'Janam janam ke dukh bisravai.'],
      meaning: 'Through devotion to You one attains Ram, and the sorrows of countless lives are forgotten.'
    },
    {
      dev: ['अंत काल रघुबर पुर जाई।', 'जहाँ जन्म हरि भक्त कहाई॥ ३४॥'],
      translit: ['Ant kal Raghubar pur jayi.', 'Jahan janm Hari bhakt kahayi.'],
      meaning: 'At the end of life one goes to the city of Raghubar, and if born again, is known as a devotee of Hari.'
    },
    {
      dev: ['और देवता चित्त न धरई।', 'हनुमत सेइ सर्व सुख करई॥ ३५॥'],
      translit: ['Aur devta chitt na dharayi.', 'Hanumat sei sarv sukh karayi.'],
      meaning: 'One need not even turn the mind to other gods — serving Hanuman brings every happiness.'
    },
    {
      dev: ['संकट कटै मिटै सब पीरा।', 'जो सुमिरै हनुमत बलबीरा॥ ३६॥'],
      translit: ['Sankat katai mitai sab peera.', 'Jo sumirai Hanumat Balbeera.'],
      meaning: 'Trouble is cut away and all pain erased for one who remembers mighty, powerful Hanuman.'
    },
    {
      dev: ['जय जय जय हनुमान गुसाईं।', 'कृपा करहु गुरुदेव की नाईं॥ ३७॥'],
      translit: ['Jay jay jay Hanuman Gusayi.', 'Kripa karahu Gurudev ki nayi.'],
      meaning: 'Victory, victory, victory to You, Lord Hanuman — shower Your grace upon me as a true Guru would.'
    },
    {
      dev: ['जो सत बार पाठ कर कोई।', 'छूटहि बंदि महा सुख होई॥ ३८॥'],
      translit: ['Jo sat baar path kar koi.', 'Chhutahi bandi maha sukh hoyi.'],
      meaning: 'Whoever recites this a hundred times is freed from bondage and knows great bliss.'
    },
    {
      dev: ['जो यह पढ़ै हनुमान चालीसा।', 'होय सिद्ध साखी गौरीसा॥ ३९॥'],
      translit: ['Jo yah padhai Hanuman Chalisa.', 'Hoy siddhi sakhi Gaurisa.'],
      meaning: 'Whoever reads this Hanuman Chalisa attains perfection — Lord Gaurisha (Shiva) himself is witness.'
    },
    {
      dev: ['तुलसीदास सदा हरि चेरा।', 'कीजै नाथ हृदय महँ डेरा॥ ४०॥'],
      translit: ['Tulsidas sada Hari chera.', 'Kijai nath hriday mah dera.'],
      meaning: 'Tulsidas is ever the servant of Hari — O Lord, make Your dwelling in my heart.'
    },
    {
      dev: ['पवन तनय संकट हरन, मंगल मूरति रूप।', 'राम लखन सीता सहित, हृदय बसहु सुर भूप॥'],
      translit: ['Pavan tanay sankat haran, mangal moorati roop.', 'Ram Lakhan Sita sahit, hriday basahu sur bhoop.'],
      meaning: 'Closing doha: O son of the Wind, remover of troubles, embodiment of auspiciousness — dwell in my heart together with Ram, Lakshman and Sita, O king of the gods.'
    }
  ]
},

{
  id: 'om-jai-shiv-omkara',
  title: 'Om Jai Shiv Omkara',
  titleDev: 'ॐ जय शिव ओंकारा',
  deity: 'Shiv',
  deityDev: 'शिव',
  type: 'Aarti',
  lang: 'hi',
  about: 'The most widely sung aarti of Lord Shiva, from the tradition of Swami Shivanand. It praises Shiva as the primordial Omkara in whom Brahma, Vishnu and Sadashiv are one — the ash-smeared, moon-crowned, trident-bearing lord of Kailash.',
  keywords: ['shiv', 'shiva', 'aarti', 'omkara', 'mahadev', 'bholenath', 'kailash', 'shivratri', 'trishul', 'ganga'],
  stanzas: [
    {
      dev: ['ॐ जय शिव ओंकारा, स्वामी जय शिव ओंकारा।', 'ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धरा॥ ॐ जय शिव ओंकारा॥'],
      translit: ['Om jai Shiv Omkara, swami jai Shiv Omkara.', 'Brahma Vishnu Sadashiv, arddhangi dhara. Om jai Shiv Omkara.'],
      meaning: 'Glory to You, O Shiv, the embodiment of Omkar. Brahma, Vishnu and Sadashiv are all Your forms, and You bear Parvati as half of Your own body. (Refrain.)'
    },
    {
      dev: ['एकानन चतुरानन पंचानन राजे।', 'हंसासन गरुड़ासन वृषवाहन साजे॥'],
      translit: ['Ekanan chaturanan panchanan raje.', 'Hansasan Garudasan vrishavahan saje.'],
      meaning: 'You shine as the one-faced, the four-faced (Brahma) and the five-faced (Sadashiv); seated on the swan, on Garuda, and riding the bull Nandi, You are resplendent.'
    },
    {
      dev: ['दो भुज चार चतुर्भुज दस भुज अति सोहे।', 'तीनों रूप निरखता त्रिभुवन जन मोहे॥'],
      translit: ['Do bhuj char chaturbhuj das bhuj ati sohe.', 'Teenon roop nirakhta tribhuvan jan mohe.'],
      meaning: 'Two-armed, four-armed and ten-armed — all Your forms are exceedingly beautiful; beholding them, the people of the three worlds are enchanted.'
    },
    {
      dev: ['अक्षमाला वनमाला मुण्डमाला धारी।', 'चंदन मृगमद सोहे भाले शशिधारी॥'],
      translit: ['Akshmala vanmala mundmala dhari.', 'Chandan mrigamad sohe bhale shashidhari.'],
      meaning: 'You wear the rudraksha rosary, the garland of forest flowers and the garland of skulls; sandal-paste and musk adorn You, and the crescent moon shines on Your brow.'
    },
    {
      dev: ['श्वेताम्बर पीताम्बर बाघम्बर अंगे।', 'सनकादिक गरुणादिक भूतादिक संगे॥'],
      translit: ['Shwetambar peetambar baghambar ange.', 'Sanakadik Garunadik bhootadik sange.'],
      meaning: 'White silk, yellow silk and the tiger\'s hide adorn Your limbs; sages like Sanaka, Garuda and the host of spirit-attendants keep Your company.'
    },
    {
      dev: ['कर के मध्य कमंडलु चक्र त्रिशूल धरता।', 'जगकर्ता जगभर्ता जग संहार करता॥'],
      translit: ['Kar ke madhya kamandalu chakra trishul dharta.', 'Jagkarta jagbharta jag sanhar karta.'],
      meaning: 'In Your hands You hold the water-pot, the discus and the trident. You are the creator, the sustainer and the dissolver of the world.'
    },
    {
      dev: ['ब्रह्मा विष्णु सदाशिव जानत अविवेका।', 'प्रणवाक्षर मध्ये ये तीनों एका॥'],
      translit: ['Brahma Vishnu Sadashiv janat aviveka.', 'Pranavakshar madhye ye teenon eka.'],
      meaning: 'To see Brahma, Vishnu and Sadashiv as separate is ignorance; within the sacred syllable Om, these three are one.'
    },
    {
      dev: ['पर्वत सोहैं पार्वती, शंकर कैलासा।', 'भांग धतूरे का भोजन, भस्मी में वासा॥'],
      translit: ['Parvat sohai Parvati, Shankar Kailasa.', 'Bhaang dhatoore ka bhojan, bhasmi mein vasa.'],
      meaning: 'Parvati graces the mountain and Shankar dwells on Kailash; bhang and dhatura are Your fare, and You abide in sacred ash.'
    },
    {
      dev: ['जटा में गंग बहत है, गल मुंडन माला।', 'शेष नाग लिपटावत, ओढ़त मृगछाला॥'],
      translit: ['Jata mein Gang bahat hai, gal mundan mala.', 'Shesh naag liptavat, odhat mrigchhala.'],
      meaning: 'The Ganga flows through Your matted locks, a garland of skulls rests on Your chest, the serpent Shesh coils about You, and You drape Yourself in a deerskin.'
    },
    {
      dev: ['काशी में विराजत विश्वनाथ, नंदी ब्रह्मचारी।', 'नित उठ दर्शन पावत, महिमा अति भारी॥'],
      translit: ['Kashi mein virajat Vishwanath, Nandi brahmachari.', 'Nit uth darshan pavat, mahima ati bhari.'],
      meaning: 'In Kashi You reign as Vishwanath with the celibate Nandi at Your side; rising each day, devotees receive Your darshan — Your glory is boundless.'
    },
    {
      dev: ['त्रिगुण स्वामी जी की आरती जो कोई नर गावे।', 'कहत शिवानंद स्वामी मनवांछित फल पावे॥'],
      translit: ['Trigun swami ji ki aarti jo koi nar gave.', 'Kahat Shivanand Swami manvanchhit phal pave.'],
      meaning: 'Whoever sings this aarti of the Lord of the three gunas — so says Swami Shivanand — attains the desire of their heart.'
    }
  ]
},

{
  id: 'lingashtakam',
  title: 'Lingashtakam',
  titleDev: 'लिङ्गाष्टकम्',
  deity: 'Shiv',
  deityDev: 'शिव',
  type: 'Stotram',
  lang: 'sa',
  about: 'Eight Sanskrit verses in praise of the Shiva Linga — the formless symbol of Shiva worshipped by Brahma, Vishnu and the gods. Each verse closes with the refrain "tat pranamami sadashiva lingam": I bow to that Linga which is the eternal Shiva.',
  keywords: ['shiv', 'shiva', 'linga', 'lingashtakam', 'stotram', 'shivling', 'mahadev', 'sadashiv'],
  stanzas: [
    {
      dev: ['ब्रह्ममुरारिसुरार्चितलिङ्गं निर्मलभासितशोभितलिङ्गम्।', 'जन्मजदुःखविनाशकलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ १॥'],
      translit: ['Brahma-murari-surarchita lingam, nirmala-bhasita-shobhita lingam.', 'Janmaja-dukha-vinashaka lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — worshipped by Brahma, Vishnu and the gods, pure and radiant, the destroyer of the sorrows of birth.'
    },
    {
      dev: ['देवमुनिप्रवरार्चितलिङ्गं कामदहं करुणाकरलिङ्गम्।', 'रावणदर्पविनाशनलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ २॥'],
      translit: ['Deva-muni-pravararchita lingam, kama-daham karunakara lingam.', 'Ravana-darpa-vinashana lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — worshipped by the best of gods and sages, which burned up Kama (desire), which is compassionate, and which destroyed the pride of Ravana.'
    },
    {
      dev: ['सर्वसुगन्धिसुलेपितलिङ्गं बुद्धिविवर्धनकारणलिङ्गम्।', 'सिद्धसुरासुरवन्दितलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ३॥'],
      translit: ['Sarva-sugandhi-sulepita lingam, buddhi-vivardhana-karana lingam.', 'Siddha-surasura-vandita lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — anointed with every fragrant paste, the very cause of the growth of wisdom, and bowed to by siddhas, gods and demons alike.'
    },
    {
      dev: ['कनकमहामणिभूषितलिङ्गं फणिपतिवेष्टितशोभितलिङ्गम्।', 'दक्षसुयज्ञविनाशनलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ४॥'],
      translit: ['Kanaka-mahamani-bhushita lingam, phanipati-veshtita-shobhita lingam.', 'Daksha-suyagya-vinashana lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — adorned with gold and great jewels, radiant with the serpent-king coiled around it, and the destroyer of Daksha\'s sacrifice.'
    },
    {
      dev: ['कुङ्कुमचन्दनलेपितलिङ्गं पङ्कजहारसुशोभितलिङ्गम्।', 'सञ्चितपापविनाशनलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ५॥'],
      translit: ['Kumkuma-chandana-lepita lingam, pankaja-hara-sushobhita lingam.', 'Sanchita-papa-vinashana lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — anointed with kumkum and sandal-paste, resplendent with garlands of lotus, the destroyer of all accumulated sins.'
    },
    {
      dev: ['देवगणार्चितसेवितलिङ्गं भावैर्भक्तिभिरेव च लिङ्गम्।', 'दिनकरकोटिप्रभाकरलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ६॥'],
      translit: ['Devaganarchita-sevita lingam, bhavair bhaktibhireva cha lingam.', 'Dinakara-koti-prabhakara lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — served and worshipped by the hosts of gods with true feeling and devotion, shining like crores of suns.'
    },
    {
      dev: ['अष्टदलोपरिवेष्टितलिङ्गं सर्वसमुद्भवकारणलिङ्गम्।', 'अष्टदरीद्रविनाशितलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ७॥'],
      translit: ['Ashtadalopari-veshtita lingam, sarva-samudbhava-karana lingam.', 'Ashta-daridra-vinashita lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — enthroned upon an eight-petalled lotus, the cause of all creation, and the destroyer of the eightfold poverty.'
    },
    {
      dev: ['सुरगुरुसुरवरपूजितलिङ्गं सुरवनपुष्पसदार्चितलिङ्गम्।', 'परात्परं परमात्मकलिङ्गं तत्प्रणमामि सदाशिवलिङ्गम्॥ ८॥'],
      translit: ['Suraguru-suravara-pujita lingam, suravana-pushpa-sadarchita lingam.', 'Paratparam paramatmaka lingam, tat pranamami Sadashiva lingam.'],
      meaning: 'I bow to that Linga which is the eternal Shiva — worshipped by the guru of the gods (Brihaspati) and the best of gods, ever adorned with flowers from the gardens of heaven, the supreme beyond the supreme, the very form of the Paramatma.'
    },
    {
      dev: ['लिङ्गाष्टकमिदं पुण्यं यः पठेच्छिवसन्निधौ।', 'शिवलोकमवाप्नोति शिवेन सह मोदते॥'],
      translit: ['Lingashtakam idam punyam yah pathet shiva-sannidhau.', 'Shivalokam avapnoti shivena saha modate.'],
      meaning: 'Phalashruti: Whoever recites this holy Lingashtakam in the presence of Shiva attains the world of Shiva and rejoices in His company.'
    }
  ]
},

{
  id: 'shiva-tandava-stotram',
  title: 'Shiva Tandava Stotram',
  titleDev: 'शिवताण्डवस्तोत्रम्',
  deity: 'Shiv',
  deityDev: 'शिव',
  type: 'Stotram',
  lang: 'sa',
  about: 'Composed by Ravana, the great devotee of Shiva, this seventeen-verse Sanskrit stotram describes the beauty and power of Shiva\'s cosmic dance — the Ganga streaming through his matted locks, the crescent moon on his brow, the drumbeat of creation and dissolution. Its thundering rhythm mirrors the dance it praises.',
  keywords: ['shiv', 'shiva', 'tandava', 'stotram', 'ravana', 'nataraja', 'dance', 'cosmic', 'mahadev', 'sanskrit'],
  stanzas: [
    {
      dev: ['जटाटवीगलज्जलप्रवाहपावितस्थले', 'गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्।', 'डमड्डमड्डमड्डमन्निनादवड्डमर्वयं', 'चकार चण्डताण्डवं तनोतु नः शिवः शिवम्॥ १॥'],
      translit: ['Jatatavi-galaj-jala-pravaha-pavita-sthale,', 'gale avalambya lambitam bhujanga-tunga-malikam.', 'Damad-damad-damad-daman-ninada-vadda-marvayam,', 'chakara chanda-tandavam tanotu nah Shivah shivam.'],
      meaning: 'With his matted forest of hair drenched by the streaming Ganga, with a great serpent garland hanging about his neck, with the damaru drum sounding damad-damad-damad — Shiva performed his fierce Tandava dance. May that Shiva shower auspiciousness upon us.'
    },
    {
      dev: ['जटाकटाहसम्भ्रमभ्रमन्निलिम्पनिर्झरी-', 'विलोलवीचिवल्लरीविराजमानमूर्धनि।', 'धगद्धगद्धगज्ज्वलल्ललाटपट्टपावके', 'किशोरचन्द्रशेखरे रतिः प्रतिक्षणं मम॥ २॥'],
      translit: ['Jata-kataha-sambhrama-bhraman-nilimpa-nirjhari-', 'vilola-vichi-vallari-viraja-mana-moordhani.', 'Dhagad-dhagad-dhagaj-jvalal-lalata-patta-pavake,', 'kishora-chandra-shekhare ratih pratikshanam mama.'],
      meaning: 'My delight is every moment in Shiva — on whose head the waves of the celestial river Ganga frolic through the maze of his hair, on whose forehead the fire blazes dhagad-dhagad, and who wears the young crescent moon as his crest.'
    },
    {
      dev: ['धराधरेन्द्रनन्दिनीविलासबन्धुबन्धुर', 'स्फुरद्दिगन्तसन्ततिप्रमोदमानमानसे।', 'कृपाकटाक्षधोरणीनिरुद्धदुर्धरापदि', 'क्वचिद्दिगम्बरे मनो विनोदमेतु वस्तुनि॥ ३॥'],
      translit: ['Dhara-dharendra-nandini-vilasa-bandhu-bandhura,', 'sphurad-diganta-santati-pramoda-mana-manase.', 'Kripa-kataksha-dhorani-niruddha-durdharapadi,', 'kvachid-digambare mano vinodametu vastuni.'],
      meaning: 'May my mind find its joy in Shiva — the companion of Parvati, daughter of the mountain-king; in whose gracious mind all beings delight; whose sidelong glance of compassion steadies us through unbearable hardships; who wears the very sky as his garment.'
    },
    {
      dev: ['जटाभुजङ्गपिङ्गलस्फुरत्फणामणिप्रभा', 'कदम्बकुङ्कुमद्रवप्रलिप्तदिग्वधूमुखे।', 'मदान्धसिन्धुरस्फुरत्त्वगुत्तरीयमेदुरे', 'मनो विनोदमद्भुतं बिभर्तु भूतभर्तरि॥ ४॥'],
      translit: ['Jata-bhujanga-pingala-sphurat-phana-mani-prabha,', 'kadamba-kunkuma-drava-pralipta-digvadhu-mukhe.', 'Madandha-sindhura-sphurat-tvag-uttariya-medure,', 'mano vinodam adbhutam bibhartu bhoota-bhartari.'],
      meaning: 'May my mind revel in the wondrous Lord of all beings — in whose hair shines the tawny glow of serpent-hood jewels, whose directions-faces are smeared with the kumkum of the kadamba, and who is draped in the glistening hide of a maddened elephant.'
    },
    {
      dev: ['सहस्रलोचनप्रभृत्यशेषलेखशेखर', 'प्रसूनधूलिधोरणी विधूसराङ्घ्रिपीठभूः।', 'भुजङ्गराजमालया निबद्धजाटजूटक', 'श्रियै चिराय जायतां चकोरबन्धुशेखरः॥ ५॥'],
      translit: ['Sahasra-lochana-prabhritya-shesha-lekha-shekhara,', 'prasoona-dhooli-dhorani vidhoosaranghri-peethabhooh.', 'Bhujanga-raja-malaya nibaddha-jata-jootaka,', 'shriyai chiraya jayatam chakora-bandhu-shekharah.'],
      meaning: 'May Shiva, who wears the moon (the friend of the chakora bird) as his crest, grant us lasting prosperity — Shiva whose footstool of ashes is powdered by the pollen from the garlands on the heads of Indra and all the gods, and whose dreadlocks are bound by the serpent-king as a garland.'
    },
    {
      dev: ['ललाटचतुरज्ज्वलद्धनञ्जयस्फुलिङ्गभा', 'निपीतपञ्चसायकं नमन्निलिम्पनायकम्।', 'सुधामयूखलेखया विराजमानशेखरं', 'महाकपालिसम्पदेशिरोजटालमस्तु नः॥ ६॥'],
      translit: ['Lalata-chatura-jvalad-dhananjaya-sphulingabha,', 'nipeeta-pancha-sayakam naman-nilimpa-nayakam.', 'Sudha-mayukha-lekhaya virajamana-shekharam,', 'maha-kapali-sampade shiro-jatalam astu nah.'],
      meaning: 'May we be blessed by Shiva — who burned proud Kamadeva (the five-arrowed one) with the sparks of fire blazing from the four quarters of his forehead; who is bowed to by the lords of heaven; whose crest shines with the crescent of the nectar-rayed moon.'
    },
    {
      dev: ['करालभालपट्टिकाधगद्धगद्धगज्ज्वल', 'द्धनञ्जयाहुतीकृतप्रचण्डपञ्चसायके।', 'धराधरेन्द्रनन्दिनीकुचाग्रचित्रपत्रक', 'प्रकल्पनैकशिल्पिनि त्रिलोचने रतिर्मम॥ ७॥'],
      translit: ['Karala-bhala-pattika-dhagad-dhagad-dhagaj-jvala,', 'ddhananjay-ahuti-krita-prachanda-pancha-sayake.', 'Dhara-dharendra-nandini-kuchagra-chitra-patraka,', 'prakalpanaika-shilpini trilochane ratir mama.'],
      meaning: 'My delight is in the three-eyed One — who offered Kamadeva as an oblation into the blaze burning dhagad-dhagad upon his fearsome forehead; the sole artist who traces the decorative lines upon the breast of Parvati, daughter of the mountain-king.'
    },
    {
      dev: ['नवीनमेघमण्डली निरुद्धदुर्धरस्फुरत्', 'कुहूनिशीथिनीतमः प्रबन्धबद्धकन्धरः।', 'निलिम्पनिर्झरीधरस्तनोतु कृत्तिसिन्धुरः', 'कलानिधानबन्धुरः श्रियं जगद्धुरन्धरः॥ ८॥'],
      translit: ['Navina-megha-mandali niruddha-durdhara-sphurat,', 'kuhoo-nishithini-tamah prabandha-baddha-kandharah.', 'Nilimpa-nirjhari-dharas tanotu kritti-sindhurah,', 'kala-nidhana-bandhurah shriyam jagad-dhurandharah.'],
      meaning: 'May Shiva, the bearer of the burden of the worlds, grant us prosperity — his neck dark as layers of new rain-clouds on a moonless night, the celestial Ganga resting on his head, clad in an elephant\'s hide, the moon-crested one.'
    },
    {
      dev: ['प्रफुल्लनीलपङ्कजप्रपञ्चकालिमप्रभा', 'वलम्बिकण्ठकन्दलीरुचिप्रबद्धकन्धरम्।', 'स्मरच्छिदं पुरच्छिदं भवच्छिदं मखच्छिदं', 'गजच्छिदान्धकच्छिदं तमन्तकच्छिदं भजे॥ ९॥'],
      translit: ['Praphulla-neela-pankaja-prapancha-kalima-prabha,', 'valambi-kantha-kandali-ruchi-prabaddha-kandharam.', 'Smarach-chhidam purach-chhidam bhavach-chhidam makhach-chhidam,', 'gajach-chhidandhakach-chhidam tam antakach-chhidam bhaje.'],
      meaning: 'I worship Shiva — his neck radiant with the dark bloom of a fully opened blue lotus garland — the destroyer of Kama, of the Tripura cities, of worldly bondage, of Daksha\'s sacrifice, of the elephant-demon Gajasura, of Andhaka, and of Yama (death) himself.'
    },
    {
      dev: ['अखर्वसर्वमङ्गलाकलाकदम्बमञ्जरी', 'रसप्रवाहमाधुरी विजृम्भणामधुव्रतम्।', 'स्मरान्तकं पुरान्तकं भवान्तकं मखान्तकं', 'गजान्तकान्धकान्तकं तमन्तकान्तकं भजे॥ १०॥'],
      translit: ['Akharva-sarva-mangala-kala-kadamba-manjari,', 'rasa-pravaha-madhuri vijrmbhana-madhuvratam.', 'Smarantakam purantakam bhavantakam makhantakam,', 'gajantakandhakantakam tam antakantakam bhaje.'],
      meaning: 'I worship Shiva — the swarm of bees revelling in the honeyed flow of the auspicious kadamba garland — the destroyer of Kama, of Tripura, of worldly existence, of sacrifice, of Gajasura, of Andhaka, and of death itself.'
    },
    {
      dev: ['जयत्वदभ्रविभ्रमभ्रमद्भुजङ्गमश्वस', 'द्विनिर्गमत्क्रमस्फुरत्करालभालहव्यवाट्।', 'धिमिद्धिमिद्धिमिध्वनन्मृदङ्गतुङ्गमङ्गल', 'ध्वनिक्रमप्रवर्तित प्रचण्डताण्डवः शिवः॥ ११॥'],
      translit: ['Jayatvadabhra-vibhrama-bhramad-bhujanga-mashvasa,', 'dvinirgamat-krama-sphurat-karala-bhala-havyavat.', 'Dhimid-dhimid-dhimi-dhvanan-mridanga-tunga-mangala,', 'dhvani-krama-pravartita prachanda-tandavah Shivah.'],
      meaning: 'Victory to Shiva, whose fierce Tandava unfolds to the rising, auspicious drumbeat of dhimi-dhimi-dhimi on the mridanga — the fire on his dreadful forehead flaring with every hiss of his whirling serpents.'
    },
    {
      dev: ['दृषद्विचित्रतल्पयोर्भुजङ्गमौक्तिकस्रजोर्', 'गरिष्ठरत्नलोष्ठयोः सुहृद्विपक्षपक्षयोः।', 'तृणारविन्दचक्षुषोः प्रजामहीमहेन्द्रयोः', 'समं प्रवर्तयन्मनः कदा सदाशिवं भजे॥ १२॥'],
      translit: ['Drishad-vichitra-talpayor bhujanga-mauktika-srajor,', 'garishtha-ratna-loshthayoh suhrid-vipaksha-pakshayoh.', 'Trinaravinda-chakshushoh praja-mahi-mahendrayoh,', 'samam pravartayan manah kada Sadashivam bhaje.'],
      meaning: 'When will I worship the eternal Sadashiva — who holds alike a rough stone bed and a jewelled couch, a serpent and a pearl garland, the most precious gem and a lump of clay, a friend and a foe, a blade of grass and a lotus-eyed one, the common folk and the king of gods?'
    },
    {
      dev: ['कदा निलिम्पनिर्झरीनिकुञ्जकोटरे वसन्', 'विमुक्तदुर्मतिः सदा शिरः स्थमञ्जलिं वहन्।', 'विमुक्तलोललोचनो ललामभाललग्नकः', 'शिवेति मन्त्रमुच्चरन् कदा सुखी भवाम्यहम्॥ १३॥'],
      translit: ['Kada nilimpa-nirjhari-nikunja-kotare vasan,', 'vimukta-durmatih sada shirah stha-manjalim vahan.', 'Vimukta-lola-lochano lalama-bhala-lagnakah,', 'shiveti mantram uchcharan kada sukhi bhavamyaham.'],
      meaning: 'When will I be truly happy — dwelling in a cave by the celestial river Ganga, all wickedness gone from me, hands folded above my head, my restless eyes stilled, my mind fixed on the divine brow, ever chanting the mantra "Shiva"?'
    },
    {
      dev: ['निलिम्पनाथनागरीकदम्बमौलमल्लिका', 'निगुम्फनिर्भरक्षरन्मधूष्णिकामनोहरः।', 'तनोतु नो मनोमुदं विनोदिनीमहर्निशं', 'परश्रियः परं पदं तदङ्गजत्विषां चयः॥ १४॥'],
      translit: ['Nilimpa-natha-nagari-kadamba-maula-mallika,', 'nigumpha-nirbhara-ksharan-madhooshnika-manoharah.', 'Tanotu no mano-mudam vinodim ahar-nisham,', 'parashriyah param padam tad-angaja-tvisham chayah.'],
      meaning: 'May the sweet, enchanting shower of divine beauty — streaming like honey from the kadamba and jasmine garlands upon the heavenly ones — gladden our minds day and night and lead us toward the supreme state, the highest radiance.'
    },
    {
      dev: ['प्रचण्डवाडवानलप्रभाशुभप्रचारणी', 'महाष्टसिद्धिकामिनी जनावहूतजल्पना।', 'विमुक्तवामलोचना विवाहकालिकध्वनिः', 'शिवेति मन्त्रभूषणा जगज्जयाय जायताम्॥ १५॥'],
      translit: ['Prachanda-vadavanala-prabha-shubha-pracharani,', 'mahashta-siddhi-kamini janavahoota-jalpana.', 'Vimukta-vama-lochana vivaha-kalika-dhvanih,', 'shiveti mantra-bhooshana jagaj-jayaya jayatam.'],
      meaning: 'May this hymn — radiant with the blaze of the great fire, itself a bearer of the eight great siddhis — resound for the victory of the universe: the sacred chant of "Shiva", recited at the time of his auspicious union, by those whose gaze is set free.'
    },
    {
      dev: ['इमं हि नित्यमेवमुक्तमुत्तमोत्तमं स्तवं', 'पठन्स्मरन्ब्रुवन्नरो विशुद्धिमेतिसन्ततम्।', 'हरे गुरौ सुभक्तिमाशु याति नान्यथा गतिं', 'विमोहनं हि देहिनां सुशङ्करस्य चिन्तनम्॥ १६॥'],
      translit: ['Imam hi nityam evam uktam uttamottamam stavam,', 'pathan smaran bruvan naro vishuddhim eti santatam.', 'Hare gurau subhaktim ashu yati nanyatha gatim,', 'vimohanam hi dehinam Sushankarasya chintanam.'],
      meaning: 'Whoever recites, remembers and speaks this best of hymns, ever-pure, gains at once deep devotion to Shiva, the Guru — there is no other path. Contemplation of the gracious Shankara frees embodied souls from delusion.'
    },
    {
      dev: ['पूजावसानसमये दशवक्त्रगीतं', 'यः शम्भूपूजनपरं पठति प्रदोषे।', 'तस्य स्थिरां रथगजेन्द्रतुरङ्गयुक्तां', 'लक्ष्मीं सदैव सुमुखिं प्रददाति शम्भुः॥ १७॥'],
      translit: ['Pooja-vasana-samaye dasha-vaktra-gitam,', 'yah Shambhoo-poojana-param pathati pradoshe.', 'Tasya sthiram ratha-gajendra-turanga-yuktam,', 'lakshmim sadaiva sumukhim pradadati Shambhuh.'],
      meaning: 'Whoever, devoted to the worship of Shambhu, recites at dusk this hymn sung by the ten-headed Ravana at the close of his puja — to that one Shambhu ever grants lasting Lakshmi (prosperity), attended by chariots, elephants and horses, and ever gracious of face.'
    }
  ]
},

{
  id: 'om-jai-lakshmi-mata',
  title: 'Om Jai Lakshmi Mata',
  titleDev: 'ॐ जय लक्ष्मी माता',
  deity: 'Lakshmi',
  deityDev: 'लक्ष्मी',
  type: 'Aarti',
  lang: 'hi',
  about: 'The universal aarti of Goddess Lakshmi — the divine mother of wealth, fortune and auspiciousness who rose from the churning of the Ocean of Milk. It is the heart of Diwali Lakshmi Puja and of Friday evening worship in countless homes.',
  keywords: ['lakshmi', 'laxmi', 'aarti', 'diwali', 'wealth', 'prosperity', 'mahalakshmi', 'dhanteras', 'kamala'],
  stanzas: [
    {
      dev: ['ॐ जय लक्ष्मी माता, मैया जय लक्ष्मी माता।', 'तुमको निशदिन सेवत, हरि विष्णु विधाता॥ ॐ जय लक्ष्मी माता॥'],
      translit: ['Om jai Lakshmi Mata, maiya jai Lakshmi Mata.', 'Tumko nishdin sewat, Hari Vishnu vidhata. Om jai Lakshmi Mata.'],
      meaning: 'Victory to You, Mother Lakshmi. Lord Hari Vishnu and Brahma the creator serve You day and night. (Refrain.)'
    },
    {
      dev: ['उमा रमा ब्रह्माणी, तुम ही जग माता।', 'सूर्य चन्द्रमा ध्यावत, नारद ऋषि गाता॥'],
      translit: ['Uma Rama Brahmani, tum hi jag mata.', 'Surya chandrama dhyavat, Narad rishi gata.'],
      meaning: 'You are Uma (Parvati), Rama and Brahmani — You alone are the mother of the world. The sun and the moon meditate upon You, and the sage Narad sings Your glory.'
    },
    {
      dev: ['दुर्गा रूप निरंजनि, सुख सम्पत्ति दाता।', 'जो कोई तुमको ध्याता, ऋद्धि सिद्धि धन पाता॥'],
      translit: ['Durga roop niranjani, sukh sampatti data.', 'Jo koi tumko dhyata, riddhi siddhi dhan pata.'],
      meaning: 'You are the pure, stainless form of Durga, the giver of happiness and prosperity. Whoever meditates on You attains abundance, spiritual power and wealth.'
    },
    {
      dev: ['तुम पाताल निवासिनि, तुम ही शुभदाता।', 'कर्म प्रभाव प्रकाशिनी, भवनिधि की त्राता॥'],
      translit: ['Tum patal nivasini, tum hi shubhdata.', 'Karm prabhav prakashini, bhavnidhi ki trata.'],
      meaning: 'You dwell even in the netherworld — You pervade all realms. You alone bestow all that is auspicious, You reveal the fruit of karma, and You carry us across the ocean of worldly existence.'
    },
    {
      dev: ['जिस घर में तुम रहतीं, सब सद्गुण आता।', 'सब सम्भव हो जाता, मन नहीं घबराता॥'],
      translit: ['Jis ghar mein tum rehti, sab sadgun aata.', 'Sab sambhav ho jata, man nahi ghabrata.'],
      meaning: 'In whatever home You dwell, every virtue arrives of its own accord; everything becomes possible, and the mind knows no fear.'
    },
    {
      dev: ['तुम बिन यज्ञ न होते, वस्त्र न कोई पाता।', 'खान पान का वैभव, सब तुमसे आता॥'],
      translit: ['Tum bin yagya na hote, vastra na koi pata.', 'Khan pan ka vaibhav, sab tumse aata.'],
      meaning: 'Without You no sacred rite can be performed and no one obtains clothing; all the splendour of food and sustenance comes from You alone.'
    },
    {
      dev: ['शुभ गुण मन्दिर सुन्दर, क्षीरोदधि जाता।', 'रतन चतुर्दश तुम बिन, कोई नहीं पाता॥'],
      translit: ['Shubh gun mandir sundar, kshirodadhi jata.', 'Ratan chaturdash tum bin, koi nahi pata.'],
      meaning: 'You are the beautiful temple of all auspicious virtues, born of the Ocean of Milk; without You none can obtain the fourteen jewels that rose from its churning.'
    },
    {
      dev: ['महालक्ष्मीजी की आरती, जो कोई जन गाता।', 'उर आनंद समाता, पाप उतर जाता॥'],
      translit: ['Mahalakshmiji ki aarti, jo koi jan gata.', 'Ur anand samata, paap utar jata.'],
      meaning: 'Whoever sings this aarti of Mahalakshmi — bliss fills their heart, and their sins fall away.'
    },
    {
      dev: ['महालक्ष्मि नमस्तुभ्यं, नमस्तुभ्यं सुरेश्वरि।', 'हरिप्रिये नमस्तुभ्यं, नमस्तुभ्यं दयानिधे॥'],
      translit: ['Mahalakshmi namastubhyam, namastubhyam Sureshwari.', 'Haripriye namastubhyam, namastubhyam dayanidhe.'],
      meaning: 'Closing doha: O Mahalakshmi, salutations to You; O queen of the gods, salutations to You; O beloved of Hari, O treasure-house of compassion, salutations to You again and again.'
    }
  ]
},

{
  id: 'mahalakshmi-ashtakam',
  title: 'Mahalakshmi Ashtakam',
  titleDev: 'महालक्ष्म्यष्टकम्',
  deity: 'Lakshmi',
  deityDev: 'लक्ष्मी',
  type: 'Stotram',
  lang: 'sa',
  about: 'From the Padma Purana, these eight Sanskrit verses were chanted by Indra, king of the gods, in praise of Mahalakshmi after the churning of the ocean. Each verse closes with "Mahalakshmi namostute" — O Great Lakshmi, salutations to You.',
  keywords: ['lakshmi', 'mahalakshmi', 'ashtakam', 'stotram', 'indra', 'padma purana', 'wealth', 'namastestu mahamaye'],
  stanzas: [
    {
      dev: ['नमस्तेऽस्तु महामाये श्रीपीठे सुरपूजिते।', 'शङ्खचक्रगदाहस्ते महालक्ष्मि नमोऽस्तुते॥ १॥'],
      translit: ['Namastestu Mahamaye Shri-peethe sura-poojite.', 'Shankha-chakra-gada-haste Mahalakshmi namostute.'],
      meaning: 'Salutations to You, O Great Enchantress, enthroned in the sacred seat of Sri, worshipped by the gods, holding the conch, the discus and the mace — O Mahalakshmi, salutations to You.'
    },
    {
      dev: ['नमस्ते गरुडारूढे कोलासुरभयङ्करि।', 'सर्वपापहरे देवि महालक्ष्मि नमोऽस्तुते॥ २॥'],
      translit: ['Namaste Garudaroodhe Kolasura-bhayankari.', 'Sarva-papa-hare devi Mahalakshmi namostute.'],
      meaning: 'Salutations to You who ride upon Garuda, who struck terror into the demon Kolasura, who removes every sin — O Devi Mahalakshmi, salutations to You.'
    },
    {
      dev: ['सर्वज्ञे सर्ववरदे सर्वदुष्टभयङ्करि।', 'सर्वदुःखहरे देवि महालक्ष्मि नमोऽस्तुते॥ ३॥'],
      translit: ['Sarvagye sarva-varade sarva-dushta-bhayankari.', 'Sarva-dukha-hare devi Mahalakshmi namostute.'],
      meaning: 'Salutations to You, the all-knowing, the giver of every boon, terrible to all the wicked, the remover of every sorrow — O Devi Mahalakshmi, salutations to You.'
    },
    {
      dev: ['सिद्धिबुद्धिप्रदे देवि भुक्तिमुक्तिप्रदायिनि।', 'मन्त्रमूर्ते सदा देवि महालक्ष्मि नमोऽस्तुते॥ ४॥'],
      translit: ['Siddhi-buddhi-prade devi bhukti-mukti-pradayini.', 'Mantra-moorte sada devi Mahalakshmi namostute.'],
      meaning: 'Salutations to You who grant powers and wisdom, who bestow both worldly joy and final liberation, who are the very embodiment of mantra — O Devi Mahalakshmi, salutations to You.'
    },
    {
      dev: ['आद्यन्तरहिते देवि आदिशक्ति महेश्वरि।', 'योगजे योगसम्भूते महालक्ष्मि नमोऽस्तुते॥ ५॥'],
      translit: ['Adyanta-rahite devi Adi-shakti Maheshwari.', 'Yogaje yoga-sambhoote Mahalakshmi namostute.'],
      meaning: 'Salutations to You who are without beginning or end, the primordial Power, the Great Goddess, born of yoga and the very source of yoga\'s strength — O Mahalakshmi, salutations to You.'
    },
    {
      dev: ['स्थूलसूक्ष्ममहारौद्रे महाशक्ति महोदरे।', 'महापापहरे देवि महालक्ष्मि नमोऽस्तुते॥ ६॥'],
      translit: ['Sthula-sukshma-maha-raudre maha-shakti mahodare.', 'Maha-papa-hare devi Mahalakshmi namostute.'],
      meaning: 'Salutations to You who are gross and subtle and most terrible to the evil, the great Power of boundless bounty, the destroyer of the greatest sins — O Devi Mahalakshmi, salutations to You.'
    },
    {
      dev: ['पद्मासनस्थिते देवि परब्रह्मस्वरूपिणि।', 'परमेशि जगन्मातर्महालक्ष्मि नमोऽस्तुते॥ ७॥'],
      translit: ['Padmasana-sthite devi para-brahma-swaroopini.', 'Parameshi jaganmatar Mahalakshmi namostute.'],
      meaning: 'Salutations to You seated upon the lotus, whose very form is the Supreme Brahman, the highest Goddess, the mother of the universe — O Mahalakshmi, salutations to You.'
    },
    {
      dev: ['श्वेताम्बरधरे देवि नानालङ्कारभूषिते।', 'जगत्स्थिते जगन्मातर्महालक्ष्मि नमोऽस्तुते॥ ८॥'],
      translit: ['Shwetambara-dhare devi nanalankara-bhooshite.', 'Jagat-sthite jaganmatar Mahalakshmi namostute.'],
      meaning: 'Salutations to You robed in white, adorned with every jewel, omnipresent, the mother of the world — O Mahalakshmi, salutations to You.'
    },
    {
      dev: ['महालक्ष्म्यष्टकं स्तोत्रं यः पठेद्भक्तिमान्नरः।', 'सर्वसिद्धिमवाप्नोति राज्यं प्राप्नोति सर्वदा॥'],
      translit: ['Mahalakshmyashtakam stotram yah pathed bhaktiman narah.', 'Sarva-siddhim avapnoti rajyam prapnoti sarvada.'],
      meaning: 'Phalashruti: The devoted one who recites this Mahalakshmi Ashtakam attains every perfection and ever finds prosperity. Recited daily, it destroys great sins and brings abundance of wealth and grain; recited thrice daily, it conquers even powerful enemies and wins the lasting grace of Mahalakshmi.'
    }
  ]
},

{
  id: 'om-jai-jagdish-hare',
  title: 'Om Jai Jagdish Hare',
  titleDev: 'ॐ जय जगदीश हरे',
  deity: 'Vishnu',
  deityDev: 'विष्णु',
  type: 'Aarti',
  lang: 'hi',
  about: 'The most universally sung aarti in Hindu homes, composed in the 19th century and dedicated to Vishnu as Jagdish, the Lord of the Universe. It is sung at the close of nearly every puja, a prayer of complete surrender: "You are my mother and my father — in whom else shall I take refuge?"',
  keywords: ['vishnu', 'jagdish', 'aarti', 'universal', 'puja', 'hari', 'narayan', 'surrender', 'evening aarti'],
  stanzas: [
    {
      dev: ['ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे।', 'भक्त जनों के संकट, क्षण में दूर करे॥ ॐ जय जगदीश हरे॥'],
      translit: ['Om jai Jagdish Hare, swami jai Jagdish Hare.', 'Bhakt janon ke sankat, kshan mein door kare. Om jai Jagdish Hare.'],
      meaning: 'Victory to You, O Lord of the Universe; O Master, victory to You. The troubles of Your devotees You remove in an instant. (Refrain.)'
    },
    {
      dev: ['जो ध्यावे फल पावे, दुख विनसे मन का।', 'सुख सम्पत्ति घर आवे, कष्ट मिटे तन का॥'],
      translit: ['Jo dhyave phal pave, dukh vinse man ka.', 'Sukh sampatti ghar aave, kasht mite tan ka.'],
      meaning: 'Whoever meditates on You receives the fruit: the sorrows of the mind vanish, happiness and prosperity enter the home, and the body\'s afflictions are erased.'
    },
    {
      dev: ['मात पिता तुम मेरे, शरण गहूँ मैं किसकी।', 'तुम बिन और न दूजा, आस करूँ जिसकी॥'],
      translit: ['Mat pita tum mere, sharan gahoon main kiski.', 'Tum bin aur na dooja, aas karoon jiski.'],
      meaning: 'You are my mother and my father — whose shelter shall I take but Yours? Without You there is no other on whom I may rest my hope.'
    },
    {
      dev: ['तुम पूरण परमात्मा, तुम अन्तर्यामी।', 'परब्रह्म परमेश्वर, तुम सबके स्वामी॥'],
      translit: ['Tum pooran Paramatma, tum antaryami.', 'Parbrahm Parmeshwar, tum sabke swami.'],
      meaning: 'You are the complete Supreme Soul, the indweller of every heart; You are the highest Brahman, the Lord of all.'
    },
    {
      dev: ['तुम करुणा के सागर, तुम पालनकर्ता।', 'मैं सेवक तुम स्वामी, कृपा करो भर्ता॥'],
      translit: ['Tum karuna ke sagar, tum palankarta.', 'Main sewak tum swami, kripa karo bharta.'],
      meaning: 'You are an ocean of compassion, the sustainer of all. I am Your servant and You are my master — show Your grace, O Lord.'
    },
    {
      dev: ['तुम हो एक अगोचर, सबके प्राणपति।', 'किस विधि मिलूँ दयामय, तुमको मैं कुमति॥'],
      translit: ['Tum ho ek agochar, sabke pranpati.', 'Kis vidhi miloon dayamay, tumko main kumati.'],
      meaning: 'You alone are beyond the reach of the senses, the Lord of every living breath. How may I, of poor understanding, come to You, O merciful One?'
    },
    {
      dev: ['दीनबन्धु दुखहर्ता, तुम ठाकुर मेरे।', 'अपने हाथ बढ़ाओ, द्वार पड़ा तेरे॥'],
      translit: ['Deenbandhu dukhharta, tum Thakur mere.', 'Apne haath badhao, dwar pada tere.'],
      meaning: 'Friend of the humble, remover of sorrow, You are my Lord. Stretch out Your hand to me — I lie fallen at Your door.'
    },
    {
      dev: ['विषय विकार मिटाओ, पाप हरो देवा।', 'श्रद्धा भक्ति बढ़ाओ, सन्तन की सेवा॥'],
      translit: ['Vishay vikar mitao, paap haro deva.', 'Shraddha bhakti badhao, santan ki seva.'],
      meaning: 'Remove my cravings and corruptions, take away my sins, O Lord; increase my faith and devotion, and grant me the service of the saints.'
    },
    {
      dev: ['श्री जगदीशजी की आरती, जो कोई नर गावे।', 'कहत शिवानंद स्वामी, मनवांछित फल पावे॥'],
      translit: ['Shri Jagdishji ki aarti, jo koi nar gave.', 'Kahat Shivanand Swami, manvanchhit phal pave.'],
      meaning: 'Whoever sings this aarti of Shri Jagdish — so says Swami Shivanand — attains the desire of their heart.'
    }
  ]
},

{
  id: 'aarti-kunj-bihari-ki',
  title: 'Aarti Kunj Bihari Ki',
  titleDev: 'आरती कुंज बिहारी की',
  deity: 'Krishna',
  deityDev: 'कृष्ण',
  type: 'Aarti',
  lang: 'hi',
  about: 'The beloved aarti of Shri Krishna as Kunj Bihari — the one who wanders the groves of Vrindavan, flute in hand, the peacock crown upon his head, Radha radiant beside him. Sung in Krishna temples and homes, especially on Janmashtami.',
  keywords: ['krishna', 'aarti', 'kunj bihari', 'vrindavan', 'janmashtami', 'radha', 'giridhar', 'murari', 'bansuri', 'flute'],
  stanzas: [
    {
      dev: ['आरती कुंज बिहारी की, श्री गिरिधर कृष्ण मुरारी की॥'],
      translit: ['Aarti Kunj Bihari ki, Shri Giridhar Krishna Murari ki.'],
      meaning: 'We sing the aarti of Krishna who roams the bowers of Vrindavan — of Giridhar who lifted Mount Govardhan, of Murari who slew the demon Mura. (Refrain.)'
    },
    {
      dev: ['गले में बैजंती माला, बजावत बंसी मधुर बाला।', 'श्रवण में कुण्डल झलकाला, नंद के आनंद नंदलाला।', 'गगन सम अंग कांति काली, राधिका चमक रही आली।', 'लतन में थाड़े बनमाली।', 'भ्रमर सी अलक, कस्तूरी तिलक, चन्द्र सी झलक।', 'ललित छवि श्यामा प्यारी की॥ आरती कुंज बिहारी की॥'],
      translit: ['Gale mein Baijanti mala, bajavat bansī madhur bala.', 'Shravan mein kundal jhalkala, Nand ke anand Nandlala.', 'Gagan sam ang kanti kali, Radhika chamak rahi aali.', 'Latan mein thaade banmali.', 'Bhramar si alak, kasturi tilak, chandra si jhalak.', 'Lalit chhavi Shyama pyari ki. Aarti Kunj Bihari ki.'],
      meaning: 'The Vaijayanti garland rests on his neck as he plays his sweet flute; earrings glimmer in his ears — Nandlala, the very joy of Nanda. The lustre of his limbs is dark as the rain cloud, and Radhika shines beside him. He stands amid the flowering bowers, his curls dark as bees, a musk tilak on his forehead, his face glowing like the moon — such is the enchanting image of Krishna with his beloved Radha.'
    },
    {
      dev: ['कनकमय मोर मुकुट बिलसै, देवता दर्शन को तरसै।', 'गगन सो सुमन रासि बरसै, बजे मुरचंग, मधुर मृदंग, ग्वालिन संग।', 'अतुल रति गोप कुमारी की॥ आरती कुंज बिहारी की॥'],
      translit: ['Kanakamay mor mukut bilsai, devta darshan ko tarsai.', 'Gagan so suman rasi barsai, baje murchang, madhur mridang, gwalin sang.', 'Atul rati gop kumari ki. Aarti Kunj Bihari ki.'],
      meaning: 'His golden peacock-feather crown gleams so brightly that even the gods ache for a glimpse of him; flowers rain from the heavens, the jaw-harp and sweet mridang resound, and the cowherd maidens are at his side — the love of the gopis for him is beyond compare.'
    },
    {
      dev: ['जहाँ ते प्रकट भई गंगा, सकल मन हारिनी श्री गंगा।', 'स्मरण ते होत मोह भंगा।', 'बसी शिव सीस, जटा के बीस, हरे जगदीस, पातक जारी की॥', 'आरती कुंज बिहारी की॥'],
      translit: ['Jahan te prakat bhayi Ganga, sakal man harini Shri Ganga.', 'Smaran te hot moh bhanga.', 'Basi Shiv sheesh, jata ke bees, Hare Jagdeesh, patak jari ki.', 'Aarti Kunj Bihari ki.'],
      meaning: 'From his feet the holy Ganga sprang forth — the Ganga who captivates every heart, by whose remembrance delusion is shattered, who dwells upon Shiva\'s head amid his matted locks. That Lord of the universe burns away the gathered sins of his devotees.'
    },
    {
      dev: ['चमकती उज्ज्वल तट रेनू, बज रही वृन्दावन बेनू।', 'चहुँ दिसि गोप ग्वाल धेनू।', 'हंसत मृदु मंद, चाँदनी चंद, कटत भव फंद।', 'टेर सुन श्यामा प्यारी की॥ आरती कुंज बिहारी की॥', 'आरती कुंज बिहारी की, श्री गिरिधर कृष्ण मुरारी की॥'],
      translit: ['Chamakti ujjwal tat renu, baj rahi Vrindavan benu.', 'Chahun disi gop gwal dhenu.', 'Hansat mridu mand, chandni chand, katat bhav fand.', 'Ter sun Shyama pyari ki. Aarti Kunj Bihari ki.', 'Aarti Kunj Bihari ki, Shri Giridhar Krishna Murari ki.'],
      meaning: 'The sands of the Yamuna\'s bank glisten bright, the flute sings through Vrindavan, and on every side are the cowherds and their cows. Krishna smiles soft and gentle beneath the moonlight, cutting the snares of worldly bondage. Listen, O beloved Radha — this is the aarti of Kunj Bihari, of Shri Giridhar Krishna Murari.'
    }
  ]
},

{
  id: 'jai-ambe-gauri',
  title: 'Jai Ambe Gauri',
  titleDev: 'जय अम्बे गौरी',
  deity: 'Durga',
  deityDev: 'दुर्गा',
  type: 'Aarti',
  lang: 'hi',
  about: 'The great aarti of the Divine Mother, sung through Navratri and Durga Puja. It praises Ambe Gauri — the golden Mother whose four arms bear the sword and the blessing-gesture, who destroyed Shumbh, Nishumbh, Mahishasur, Chand, Mund, Shonit Beej, Madhu and Kaitabh, and in whom Hari, Brahma and Shiva ever meditate.',
  keywords: ['durga', 'ambe', 'gauri', 'aarti', 'navratri', 'devi', 'maa', 'shakti', 'mahishasur', 'mother'],
  stanzas: [
    {
      dev: ['जय अम्बे गौरी, मैया जय श्यामा गौरी।', 'तुमको निशदिन ध्यावत, हरि ब्रह्म शिवरी॥ जय अम्बे गौरी॥'],
      translit: ['Jai Ambe Gauri, maiya jai Shyama Gauri.', 'Tumko nishdin dhyavat, Hari Brahma Shivri. Jai Ambe Gauri.'],
      meaning: 'Victory to Ambe Gauri; O Mother, victory to Shyama Gauri. Hari, Brahma and Shiva meditate on You day and night. (Refrain.)'
    },
    {
      dev: ['मांग सिंदूर विराजत, टीको मृगमद को।', 'उज्ज्वल से दोउ नैना, चन्द्रवदन नीको॥'],
      translit: ['Maang sindoor virajat, teeko mrigamad ko.', 'Ujjwal se dou naina, chandravadan neeko.'],
      meaning: 'Vermilion glows in the parting of Your hair, a musk tilak upon Your forehead; Your two eyes shine bright, and Your face is lovely as the moon.'
    },
    {
      dev: ['कनक समान कलेवर, रक्ताम्बर राजे।', 'रक्तपुष्प गल माला, कंठन पर साजे॥'],
      translit: ['Kanak saman kalevar, raktambar raje.', 'Rakt pushp gal mala, kanthan par saje.'],
      meaning: 'Your body gleams like gold, red garments grace You, and a garland of red flowers adorns Your neck.'
    },
    {
      dev: ['केहरि वाहन राजत, खड्ग खप्पर धारि।', 'सुर नर मुनिजन सेवत, तिनके दुखहारी॥'],
      translit: ['Kehari vahan rajat, khadag khappar dhari.', 'Sur nar munijan sewat, tinke dukhhari.'],
      meaning: 'You ride majestic upon the lion, bearing the sword and the skull-cup; gods, men and sages serve You, the remover of their sorrows.'
    },
    {
      dev: ['कानन कुण्डल शोभित, नासाग्रे मोती।', 'कोटिक चन्द्र दिवाकर, राजत सम ज्योति॥'],
      translit: ['Kanan kundal shobhit, nasagre moti.', 'Kotik chandra divakar, rajat sam jyoti.'],
      meaning: 'Earrings adorn Your ears, a pearl gleams at the tip of Your nose; Your radiance rivals crores of moons and suns.'
    },
    {
      dev: ['शुम्भ निशुम्भ बिदारे, महिषासुर घाती।', 'धूम्र विलोचन नैना, निशदिन मदमाती॥'],
      translit: ['Shumbh Nishumbh bidare, Mahishasur ghati.', 'Dhoomra vilochan naina, nishdin madmati.'],
      meaning: 'You tore apart Shumbh and Nishumbh and slew Mahishasur; Your smoke-dark eyes are ever intoxicated with the fury of righteousness.'
    },
    {
      dev: ['चण्ड मुण्ड संहारे, शोणित बीज हरे।', 'मधु कैटभ दोउ मारे, सुर भय दूर करे॥'],
      translit: ['Chand Mund sanhare, Shonit Beej hare.', 'Madhu Kaitabh dou mare, sur bhay door kare.'],
      meaning: 'You destroyed Chand and Mund, annihilated Shonit Beej, slew Madhu and Kaitabh, and drove all fear from the gods.'
    },
    {
      dev: ['ब्राह्माणी रुद्राणी, तुम कमला रानी।', 'आगम निगम बखानी, तुम शिव पटरानी॥'],
      translit: ['Brahmani Rudrani, tum Kamala rani.', 'Aagam nigam bakhani, tum Shiv patrani.'],
      meaning: 'You are Brahmani and Rudrani; You are Kamala, the queen. The Vedas and the Agamas all sing of You — You are the consort of Shiva.'
    },
    {
      dev: ['चौंसठ योगिनी गावत, नृत्य करत भैरों।', 'बाजत ताल मृदंगा, और बाजत डमरू॥'],
      translit: ['Chausath yogini gavat, nritya karat Bhairon.', 'Bajat taal mridanga, aur bajat damru.'],
      meaning: 'The sixty-four yoginis sing Your praise while Bhairav dances; the cymbals and mridang play, and the damaru resounds.'
    },
    {
      dev: ['तुम ही जग की माता, तुम ही हो भरता।', 'भक्तन की दुख हरता, सुख सम्पत्ति करता॥'],
      translit: ['Tum hi jag ki mata, tum hi ho bharta.', 'Bhaktan ki dukh harta, sukh sampatti karta.'],
      meaning: 'You alone are the mother of the world, You alone its sustainer; You take away the sorrows of Your devotees and bestow happiness and prosperity.'
    },
    {
      dev: ['भुजा चार अति शोभित, वर मुद्रा धारी।', 'मनवांछित फल पावत, सेवत नर नारी॥'],
      translit: ['Bhuja char ati shobhit, var mudra dhari.', 'Manvanchhit phal pavat, sewat nar nari.'],
      meaning: 'Your four arms are most beautiful, one raised in the blessing-gesture; men and women who serve You receive the desire of their hearts.'
    },
    {
      dev: ['कंचन थाल विराजत, अगर कपूर बाती।', 'श्री मालकेतु में राजत, कोटि रतन ज्योती॥'],
      translit: ['Kanchan thaal virajat, agar kapoor bati.', 'Shri Malketu mein rajat, koti ratan jyoti.'],
      meaning: 'On a golden plate the camphor and agar flames shine; in Shri Malketu (the Vindhyas) You reign, radiant as the light of a crore of jewels.'
    },
    {
      dev: ['श्री अम्बेजी की आरती, जो कोई नर गावे।', 'कहत शिवानंद स्वामी, सुख सम्पत्ति पावे॥'],
      translit: ['Shri Ambeji ki aarti, jo koi nar gave.', 'Kahat Shivanand Swami, sukh sampatti pave.'],
      meaning: 'Whoever sings this aarti of Shri Ambe — so says Swami Shivanand — attains happiness and prosperity.'
    }
  ]
},

{
  id: 'saraswati-vandana',
  title: 'Saraswati Vandana',
  titleDev: 'सरस्वती वन्दना',
  deity: 'Saraswati',
  deityDev: 'सरस्वती',
  type: 'Vandana',
  lang: 'sa',
  about: 'The classical Sanskrit salutation to Goddess Saraswati — she who is white as the jasmine and the moon, veena in hand, seated on the white lotus, worshipped by Brahma, Vishnu and Shiva. Students and artists recite it before learning, music and every pursuit of knowledge.',
  keywords: ['saraswati', 'vandana', 'ya kundendu', 'knowledge', 'wisdom', 'learning', 'music', 'veena', 'sharada', 'vasant panchami'],
  stanzas: [
    {
      dev: ['या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता।', 'या वीणावरदण्डमण्डितकरा या श्वेतपद्मासना॥', 'या ब्रह्माच्युतशङ्करप्रभृतिभिर्देवैः सदा वन्दिता।', 'सा मां पातु सरस्वती भगवती निःशेषजाड्यापहा॥ १॥'],
      translit: ['Ya kundendu-tushara-hara-dhavala, ya shubhra-vastravrita.', 'Ya veena-vara-danda-mandita-kara, ya shweta-padmasana.', 'Ya Brahmachyuta-Shankara-prabhritibhir devaih sada vandita.', 'Sa mam patu Saraswati Bhagavati nihshesha-jadyapaha.'],
      meaning: 'May Goddess Saraswati protect me — she who is pure white as the jasmine, the moon, the snow and the pearl; who is robed in white; whose hands are graced by the noble veena; who sits upon the white lotus; who is ever worshipped by Brahma, Vishnu, Shiva and all the gods; and who removes every trace of dullness and ignorance.'
    },
    {
      dev: ['शुक्लां ब्रह्मविचारसारपरमामाद्यां जगद्व्यापिनीं', 'वीणापुस्तकधारिणीमभयदां जाड्यान्धकारापहाम्।', 'हस्ते स्फाटिकमालिकां विदधतीं पद्मासने संस्थिताम्', 'वन्दे तां परमेश्वरीं भगवतीं बुद्धिप्रदां शारदाम्॥ २॥'],
      translit: ['Shuklam brahma-vichara-sara-paramam adyam jagad-vyapinim,', 'veena-pustaka-dharinim abhayadam jadyandhakarapaham.', 'Haste sphatika-malikam vidadhatim padmasane samsthitam,', 'vande tam Parameshwarim Bhagavatim buddhi-pradam Sharadam.'],
      meaning: 'I bow to Sharada, the Supreme Goddess, the giver of wisdom — pure white, the essence and crown of all sacred enquiry, the primordial one who pervades the universe; bearing the veena and the book, granting fearlessness, dispelling the darkness of ignorance; a crystal rosary in her hand, seated upon the lotus.'
    }
  ]
}

];

// Deity knowledge base for the guide
const DEITIES = {
  'Ganesh': {
    dev: 'गणेश',
    aliases: ['ganesh', 'ganesha', 'ganpati', 'vinayaka', 'vighnaharta', 'bappa', 'gajanan', 'ekadanta'],
    blurb: 'Lord Ganesh, the elephant-headed son of Shiva and Parvati, is the remover of obstacles (Vighnaharta) and the lord of beginnings, wisdom and learning. He is worshipped first in every puja and before any new venture. His mount is the mouse, his offering the modak, and his festival Ganesh Chaturthi.'
  },
  'Hanuman': {
    dev: 'हनुमान',
    aliases: ['hanuman', 'bajrangbali', 'maruti', 'anjaneya', 'pavanputra', 'sankat mochan', 'monkey god', 'kesarinandan'],
    blurb: 'Hanuman, son of Anjani and the wind-god Vayu, is the supreme devotee of Shri Ram — the embodiment of strength, courage, selfless service and devotion. He leapt across the ocean, burned Lanka, and carried the Sanjeevani mountain to save Lakshman. Tuesdays and Saturdays are especially dear to him.'
  },
  'Shiv': {
    dev: 'शिव',
    aliases: ['shiv', 'shiva', 'mahadev', 'bholenath', 'shankar', 'shambhu', 'nataraja', 'rudra', 'mahesh'],
    blurb: 'Lord Shiva, the third of the Trimurti, is the great yogi and the power of dissolution and transformation — the ash-smeared, moon-crested, trident-bearing lord of Kailash, with the Ganga flowing through his matted locks. As Nataraja he dances the cosmic dance of creation and destruction. Mahashivratri is his great night; Mondays and the month of Shravan are his own.'
  },
  'Lakshmi': {
    dev: 'लक्ष्मी',
    aliases: ['lakshmi', 'laxmi', 'mahalakshmi', 'kamala', 'shri', 'padma'],
    blurb: 'Goddess Lakshmi, consort of Vishnu, is the divine mother of wealth, fortune, beauty and auspiciousness. She rose radiant from the churning of the Ocean of Milk, seated on a lotus and attended by elephants. She is worshipped at Diwali, on Dhanteras, and every Friday — and her eight forms, the Ashta Lakshmi, cover every kind of abundance.'
  },
  'Vishnu': {
    dev: 'विष्णु',
    aliases: ['vishnu', 'narayan', 'hari', 'jagdish', 'vasudev', 'madhav'],
    blurb: 'Lord Vishnu is the preserver of the universe, resting on the serpent Shesha in the Ocean of Milk, with Lakshmi at his side. Whenever dharma decays he descends as an avatar — Matsya, Kurma, Varaha, Narasimha, Vamana, Parashuram, Ram, Krishna, Buddha and the awaited Kalki. His aarti Om Jai Jagdish Hare closes pujas in homes across India.'
  },
  'Krishna': {
    dev: 'कृष्ण',
    aliases: ['krishna', 'kanha', 'krishn', 'madhav', 'gopal', 'nandlal', 'murari', 'giridhar', 'shyam', 'kunj bihari'],
    blurb: 'Shri Krishna, the eighth avatar of Vishnu, is the flute-playing cowherd of Vrindavan, the lifter of Govardhan, the charioteer who spoke the Bhagavad Gita to Arjun. His birth is celebrated at Janmashtami, his love with Radha is the very emblem of devotion, and his childhood leelas fill the Bhagavata Purana.'
  },
  'Durga': {
    dev: 'दुर्गा',
    aliases: ['durga', 'ambe', 'gauri', 'devi', 'maa', 'shakti', 'bhavani', 'parvati', 'jagdamba', 'sherawali', 'vaishno'],
    blurb: 'Maa Durga, the Divine Mother and the supreme Shakti, was formed from the combined radiance of all the gods to destroy the buffalo-demon Mahishasur. Riding her lion, weapons in her many arms, she is both fierce protector and tender mother. Navratri — nine nights, twice a year — is her great festival, crowned by Durga Puja.'
  },
  'Saraswati': {
    dev: 'सरस्वती',
    aliases: ['saraswati', 'sarasvati', 'sharada', 'vani', 'bharati'],
    blurb: 'Goddess Saraswati, consort of Brahma, is the mother of knowledge, wisdom, learning, music and the arts. White-clad and seated on a white lotus, she holds the veena, the book and the crystal rosary. Students seek her blessing before exams and artists before performances; Vasant Panchami is her day.'
  }
};

const CHAT_SUGGESTIONS = [
  'Which aarti is for Diwali?',
  'Hanuman Chalisa meaning',
  'Tell me about Lord Shiva',
  'Prayer for strength and courage',
  'What is the Shiva Tandava Stotram?'
];
