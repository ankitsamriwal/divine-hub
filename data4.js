// Divine Hub — weekly sacred text batch (2026-09-14)
// Same shape as data.js. Text cross-checked against Sanskrit Documents,
// Green Message, and Shlokam editions (source ledger in repository history).

const PRAYERS4 = [
{
  id: 'ganapati-atharvashirsha-core',
  title: 'Ganapati Atharvashirsha — Core Recitation',
  titleDev: 'श्री गणपत्यथर्वशीर्ष — मूल पाठ',
  deity: 'Ganesh',
  deityDev: 'गणेश',
  type: 'Upanishad',
  lang: 'sa',
  about: 'The core recitation of the Ganapati Atharvashirsha (Ganapati Upanishad), a revered Sanskrit text that identifies Ganapati with the visible Absolute, the Self, consciousness and the whole universe. This reading follows the Upanishadic body from “Om Namaste Ganapataye” through its closing salutations; the longer opening and closing peace chants and phalashruti are not included.',
  keywords: ['ganesh', 'ganapati', 'atharvashirsha', 'atharvasirsha', 'ganapati upanishad', 'upanishad', 'om gam ganapataye', 'ganesh chaturthi', 'japa', 'path'],
  stanzas: [
    {
      dev: ['ॐ नमस्ते गणपतये।', 'त्वमेव प्रत्यक्षं तत्त्वमसि। त्वमेव केवलं कर्ताऽसि।', 'त्वमेव केवलं धर्ताऽसि। त्वमेव केवलं हर्ताऽसि।', 'त्वमेव सर्वं खल्विदं ब्रह्मासि। त्वं साक्षादात्माऽसि नित्यम्॥ १॥'],
      translit: ['Om namaste Ganapataye.', 'Tvameva pratyaksham tattvamasi. Tvameva kevalam kartaasi.', 'Tvameva kevalam dhartaasi. Tvameva kevalam hartaasi.', 'Tvameva sarvam khalvidam brahmaasi. Tvam saakshaadaatmaasi nityam.'],
      meaning: 'Om, salutations to You, Ganapati. You alone are the directly evident Reality. You alone create, sustain and dissolve. You alone are all this as Brahman; You are the eternal Self made manifest.'
    },
    {
      dev: ['ऋतं वच्मि। सत्यं वच्मि॥ २॥'],
      translit: ['Ritam vachmi. Satyam vachmi.'],
      meaning: 'I speak what accords with sacred order. I speak the truth.'
    },
    {
      dev: ['अव त्वं माम्। अव वक्तारम्। अव श्रोतारम्। अव दातारम्। अव धातारम्।', 'अवानूचानमव शिष्यम्। अव पश्चात्तात्। अव पुरस्तात्।', 'अवोत्तरात्तात्। अव दक्षिणात्तात्। अव चोर्ध्वात्तात्। अवाधरात्तात्।', 'सर्वतो मां पाहि पाहि समन्तात्॥ ३॥'],
      translit: ['Ava tvam maam. Ava vaktaaram. Ava shrotaaram. Ava daataaram. Ava dhaataaram.', 'Avaanuchaanam ava shishyam. Ava pashchaattaat. Ava purastaat.', 'Avottaraattaat. Ava dakshinaattaat. Ava chordhvaattaat. Avaadharaattaat.', 'Sarvato maam paahi paahi samantaat.'],
      meaning: 'Protect me, the speaker, the listener, the giver, the supporter, the teacher and the student. Protect from behind and before, from north and south, from above and below. Guard me completely, on every side.'
    },
    {
      dev: ['त्वं वाङ्मयस्त्वं चिन्मयः। त्वमानन्दमयस्त्वं ब्रह्ममयः।', 'त्वं सच्चिदानन्दाद्वितीयोऽसि। त्वं प्रत्यक्षं ब्रह्मासि।', 'त्वं ज्ञानमयो विज्ञानमयोऽसि॥ ४॥'],
      translit: ['Tvam vaangmayas tvam chinmayah. Tvam aanandamayas tvam brahmamayah.', 'Tvam sachchidaanandaadvitiyosi. Tvam pratyaksham brahmaasi.', 'Tvam jnaanamayo vijnaanamayo si.'],
      meaning: 'You are the essence of speech and consciousness, of bliss and Brahman. You are non-dual existence-consciousness-bliss, the directly evident Absolute, the fullness of knowledge and realised wisdom.'
    },
    {
      dev: ['सर्वं जगदिदं त्वत्तो जायते। सर्वं जगदिदं त्वत्तस्तिष्ठति।', 'सर्वं जगदिदं त्वयि लयमेष्यति। सर्वं जगदिदं त्वयि प्रत्येति।', 'त्वं भूमिरापोऽनलोऽनिलो नभः। त्वं चत्वारि वाक्पदानि॥ ५॥'],
      translit: ['Sarvam jagadidam tvatto jaayate. Sarvam jagadidam tvattas tishthati.', 'Sarvam jagadidam tvayi layameshyati. Sarvam jagadidam tvayi pratyeti.', 'Tvam bhumir aapo nalo nilo nabhah. Tvam chatvaari vaakpadaani.'],
      meaning: 'This entire universe arises from You, rests in You, dissolves in You and returns to You. You are earth, water, fire, air and space. You are the four levels of speech.'
    },
    {
      dev: ['त्वं गुणत्रयातीतः। त्वमवस्थात्रयातीतः। त्वं देहत्रयातीतः।', 'त्वं कालत्रयातीतः। त्वं मूलाधारस्थितोऽसि नित्यम्।', 'त्वं शक्तित्रयात्मकः। त्वां योगिनो ध्यायन्ति नित्यम्।', 'त्वं ब्रह्मा त्वं विष्णुस्त्वं रुद्रस्त्वमिन्द्रस्त्वमग्निस्त्वं वायुस्त्वं सूर्यस्त्वं चन्द्रमास्त्वं ब्रह्म भूर्भुवः स्वरोम्॥ ६॥'],
      translit: ['Tvam gunatraya atitah. Tvam avasthaatraya atitah. Tvam dehatraya atitah.', 'Tvam kaalatraya atitah. Tvam mulaadhaara sthitosi nityam.', 'Tvam shaktitrayaatmakah. Tvaam yogino dhyaayanti nityam.', 'Tvam Brahma tvam Vishnus tvam Rudras tvam Indras tvam Agnis tvam Vaayus tvam Suryas tvam Chandramaas tvam Brahma bhur bhuvah svar Om.'],
      meaning: 'You are beyond the three qualities, states, bodies and divisions of time. You abide eternally at the muladhara, embody the three powers, and are ever contemplated by yogis. You are Brahma, Vishnu, Rudra, Indra, fire, wind, sun and moon; You are Brahman and the worlds of Om.'
    },
    {
      dev: ['गणादिं पूर्वमुच्चार्य वर्णादिं तदनन्तरम्। अनुस्वारः परतरः।', 'अर्धेन्दुलसितम्। तारेण ऋद्धम्। एतत्तव मनुस्वरूपम्।', 'गकारः पूर्वरूपम्। अकारो मध्यमरूपम्। अनुस्वारश्चान्त्यरूपम्।', 'बिन्दुरुत्तररूपम्। नादः सन्धानम्। संहिता सन्धिः।', 'सैषा गणेशविद्या। गणक ऋषिः। निचृद्गायत्री छन्दः। गणपतिर्देवता।', 'ॐ गं गणपतये नमः॥ ७॥'],
      translit: ['Ganaadim purvam uchchaarya varnaadim tadanantaram. Anusvaarah paratarah.', 'Ardhendulasitam. Taarena riddham. Etat tava manusvarupam.', 'Gakaarah purvarupam. Akaaro madhyamarupam. Anusvaarash chaantyarupam.', 'Bindur uttararupam. Naadah sandhaanam. Samhitaa sandhih.', 'Saishaa Ganeshavidyaa. Ganaka rishih. Nichrid Gayatri chhandah. Ganapatir devataa.', 'Om gam Ganapataye namah.'],
      meaning: 'This section unfolds Ganapati’s seed-syllable: “ga,” followed by “a,” completed by the nasal sound and bindu, joined by resonance and preceded by Om. This is Ganesh Vidya; Ganaka is its seer, the metre is Nichrid Gayatri, and Ganapati its deity. Om, salutations to Ganapati.'
    },
    {
      dev: ['एकदन्ताय विद्महे वक्रतुण्डाय धीमहि।', 'तन्नो दन्तिः प्रचोदयात्॥ ८॥'],
      translit: ['Ekadantaaya vidmahe vakratundaaya dhimahi.', 'Tanno dantih prachodayaat.'],
      meaning: 'We seek to know the One-Tusked Lord and meditate on the Curved-Trunk One. May that Tusked One awaken and guide our understanding.'
    },
    {
      dev: ['एकदन्तं चतुर्हस्तं पाशमङ्कुशधारिणम्।', 'रदं च वरदं हस्तैर्बिभ्राणं मूषकध्वजम्।', 'रक्तं लम्बोदरं शूर्पकर्णकं रक्तवाससम्।', 'रक्तगन्धानुलिप्ताङ्गं रक्तपुष्पैः सुपूजितम्।', 'भक्तानुकम्पिनं देवं जगत्कारणमच्युतम्।', 'आविर्भूतं च सृष्ट्यादौ प्रकृतेः पुरुषात्परम्।', 'एवं ध्यायति यो नित्यं स योगी योगिनां वरः॥ ९॥'],
      translit: ['Ekadantam chaturhastam paasham ankusha dhaarinam.', 'Radam cha varadam hastair bibhraanam mushakadhvajam.', 'Raktam lambodaram shurpakarnakam raktavaasasam.', 'Raktagandhaanuliptaangam raktapushpaih supujitam.', 'Bhaktaanukampinam devam jagatkaaranam achyutam.', 'Aavirbhootam cha srishtyaadau prakriteh purushaat param.', 'Evam dhyaayati yo nityam sa yogi yoginaam varah.'],
      meaning: 'Meditate on the one-tusked, four-armed Lord holding noose and goad, tusk and boon-giving gesture, with the mouse on His banner. Red-hued, large-bellied and broad-eared, clothed in red, anointed with red fragrance and worshipped with red flowers, He is compassionate to devotees, the unfailing cause of the universe, manifest before creation and beyond primordial nature and the individual spirit. One who meditates thus becomes foremost among yogis.'
    },
    {
      dev: ['नमो व्रातपतये। नमो गणपतये। नमः प्रमथपतये।', 'नमस्तेऽस्तु लम्बोदरायैकदन्ताय विघ्ननाशिने शिवसुताय।', 'श्रीवरदमूर्तये नमो नमः॥ १०॥'],
      translit: ['Namo vraatapataye. Namo Ganapataye. Namah pramathapataye.', 'Namastes tu lambodaraayaikadantaaya vighnanaashine Shivasutaaya.', 'Shri varadamurtaye namo namah.'],
      meaning: 'Salutations to the Lord of hosts, to Ganapati, Lord of Shiva’s attendants. Salutations to the large-bellied, one-tusked destroyer of obstacles, the son of Shiva. Again and again, salutations to the auspicious form that grants blessings.'
    }
  ]
},
{
  id: 'durga-saptashloki',
  title: 'Durga Saptashloki',
  titleDev: 'श्री दुर्गा सप्तश्लोकी',
  deity: 'Durga',
  deityDev: 'दुर्गा',
  type: 'Stotram',
  lang: 'sa',
  about: 'Seven celebrated verses drawn from the Devi Mahatmyam and recited together as a compact prayer to Durga. The hymn moves from Mahamaya’s power over every mind to refuge, protection, healing and the peace of all three worlds. A fitting short daily path in the weeks leading to Sharad Navratri.',
  keywords: ['durga', 'saptashloki', 'sapta shloki', 'devi', 'navratri', 'devi mahatmyam', 'durga saptashati', 'narayani', 'mahamaya', 'protection', 'healing'],
  stanzas: [
    {
      dev: ['ज्ञानिनामपि चेतांसि देवी भगवती हि सा।', 'बलादाकृष्य मोहाय महामाया प्रयच्छति॥ १॥'],
      translit: ['Jnaninam api chetamsi Devi Bhagavati hi sa.', 'Balad akrishya mohaya Mahamaya prayachchhati.'],
      meaning: 'That blessed Goddess is Mahamaya herself: by her power, she can draw even the minds of the wise toward delusion.'
    },
    {
      dev: ['दुर्गे स्मृता हरसि भीतिमशेषजन्तोः', 'स्वस्थैः स्मृता मतिमतीव शुभां ददासि।', 'दारिद्र्यदुःखभयहारिणि का त्वदन्या', 'सर्वोपकारकरणाय सदाऽऽर्द्रचित्ता॥ २॥'],
      translit: ['Durge smrita harasi bhitim ashesha-jantoh,', 'Svasthaih smrita matim ativa shubham dadasi.', 'Daridrya-duhkha-bhaya-harini ka tvad anya,', 'Sarvopakara-karanaya sadardra-chitta.'],
      meaning: 'O Durga, remembered in distress, you remove the fear of every being; remembered in peace, you grant the most auspicious understanding. Who but you removes poverty, sorrow and fear, your heart ever tender in service of all?'
    },
    {
      dev: ['सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके।', 'शरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते॥ ३॥'],
      translit: ['Sarva-mangala-mangalye, Shive, sarvartha-sadhike.', 'Sharanye Tryambake Gauri, Narayani namostu te.'],
      meaning: 'O auspiciousness within all that is auspicious, benevolent fulfiller of every worthy aim; O refuge, three-eyed Gauri, Narayani, salutations to you.'
    },
    {
      dev: ['शरणागतदीनार्तपरित्राणपरायणे।', 'सर्वस्यार्तिहरे देवि नारायणि नमोऽस्तु ते॥ ४॥'],
      translit: ['Sharanagata-dinarta-paritrana-parayane.', 'Sarvasyarti-hare Devi, Narayani namostu te.'],
      meaning: 'Devoted to protecting the helpless and afflicted who seek your refuge, remover of every being’s suffering, O Devi Narayani, salutations to you.'
    },
    {
      dev: ['सर्वस्वरूपे सर्वेशे सर्वशक्तिसमन्विते।', 'भयेभ्यस्त्राहि नो देवि दुर्गे देवि नमोऽस्तु ते॥ ५॥'],
      translit: ['Sarva-svarupe, Sarveshe, sarva-shakti-samanvite.', 'Bhayebhyas trahi no Devi, Durge Devi namostu te.'],
      meaning: 'You embody every form, rule over all, and hold every power. Protect us from all fear, O Devi Durga; salutations to you.'
    },
    {
      dev: ['रोगानशेषानपहंसि तुष्टा', 'रुष्टा तु कामान् सकलानभीष्टान्।', 'त्वामाश्रितानां न विपन्नराणां', 'त्वामाश्रिता ह्याश्रयतां प्रयान्ति॥ ६॥'],
      translit: ['Rogan asheshan apahamsi tushta,', 'Rushta tu kaman sakalan abhishtan.', 'Tvam ashritanam na vipannaranam,', 'Tvam ashrita hy ashrayatam prayanti.'],
      meaning: 'When pleased, you remove illness without remainder; when displeased, you frustrate every cherished desire. Those who take refuge in you do not fall into ruin; sheltered by you, they become a shelter for others.'
    },
    {
      dev: ['सर्वाबाधाप्रशमनं त्रैलोक्यस्याखिलेश्वरि।', 'एवमेव त्वया कार्यमस्मद्वैरिविनाशनम्॥ ७॥'],
      translit: ['Sarva-badha-prashamanam trailokyasyakhileshvari.', 'Evam eva tvaya karyam asmad-vairi-vinashanam.'],
      meaning: 'O sovereign of all, bring peace to every affliction throughout the three worlds. In the same way, destroy the forces of hostility that oppose us.'
    }
  ]
}
];

if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS4);
