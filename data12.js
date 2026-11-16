// Divine Hub weekly content (2026-11-17). Kartik month (Damodara vrat) runs through Kartik Purnima on 24 Nov 2026; Dev Uthani Ekadashi was 20 Nov.
// Damodarashtakam: widely sung eight-verse form, compared across dailybhakti.app, vaidhikadharma.org (Padma Purana header) and kksongs.org (ISKCON). Notes: the sanskritdocuments Padma Purana edition has seven verses and omits verse 3; verse 3 reads "tadiyeshita-jnyeshu" with kksongs/bhaktibharat (stotranidhi/vaidhikadharma read -ajnyeshu); verse 4 reads "vareshad" with dailybhakti/ISKCON Roman (some print "vareshad" as "vareṣad"). Om Namo Narayanaya per Wikipedia (Ashtakshara).
const PRAYERS12 = [
{
  id: 'damodarashtakam',
  title: 'Damodarashtakam', titleDev: 'दामोदराष्टकम्',
  deity: 'Krishna', deityDev: 'कृष्ण', type: 'Stotram', lang: 'sa',
  about: 'Eight verses on the child Krishna bound to the grinding mortar by mother Yashoda, sung by the sage Satyavrata in the Padma Purana. This is the hymn of Kartik, the Damodara month, sung every evening by lamp-light through the vrat. This is the widely sung eight-verse form.',
  keywords: ['damodar', 'damodarashtakam', 'kartik', 'damodara month', 'krishna', 'yashoda', 'ulukhal', 'mortar', 'satyavrata', 'padma purana', 'stotram', 'deepdaan'],
  stanzas: [
    {
      dev: ['नमामीश्वरं सच्चिदानन्दरूपं लसत्कुण्डलं गोकुले भ्राजमानम्।', 'यशोदाभियोलूखलाद्धावमानं परामृष्टमत्यन्ततो द्रुत्य गोप्या॥ १॥'],
      translit: ['Namaameeshvaram sachchidaananda-roopam lasat-kundalam gokule bhraajamaanam,', 'yashodaabhiyolookhalaad-dhaavamaanam paraamrishtam-atyantato drutya gopyaa.'],
      meaning: 'I bow to the Lord who is being, consciousness and bliss, his earrings swinging as he shines in Gokul. Afraid of Yashoda, he leaps from the mortar and runs, and she races after him and catches him from behind.'
    },
    {
      dev: ['रुदन्तं मुहुर्नेत्रयुग्मं मृजन्तं कराम्भोजयुग्मेन सातङ्कनेत्रम्।', 'मुहुः श्वासकम्पत्रिरेखाङ्ककण्ठ-स्थितग्रैवं दामोदरं भक्तिबद्धम्॥ २॥'],
      translit: ['Rudantam muhur-netra-yugmam mrijantam karaambhoja-yugmena saatanka-netram,', 'muhuh shvaasa-kampa-trirekhaanka-kantha-sthita-graivam Daamodaram bhakti-baddham.'],
      meaning: 'I bow to Damodara, weeping and rubbing his eyes again and again with his two lotus hands, his eyes full of fear. Each sob shakes the necklace resting on his three-lined neck. A rope is tied around his belly, yet it is love that truly binds him.'
    },
    {
      dev: ['इतीदृक् स्वलीलाभिरानन्दकुण्डे स्वघोषं निमज्जन्तमाख्यापयन्तम्।', 'तदीयेषितज्ञेषु भक्तैर्जितत्वं पुनः प्रेमतस्तं शतावृत्ति वन्दे॥ ३॥'],
      translit: ['Iteedrik sva-leelaabhir-aananda-kunde sva-ghosham nimajjantam-aakhyaapayantam,', 'tadeeyeshita-jnyeshu bhaktair-jitatvam punah prematas-tam shataavritti vande.'],
      meaning: 'With pastimes like these he drowns his own village of Gokul in a lake of bliss, revealing himself to all. Among the servants who know him as Lord, he lets his devotees conquer him. With love, I bow to him a hundred times over.'
    },
    {
      dev: ['वरं देव मोक्षं न मोक्षावधिं वा न चान्यं वृणेऽहं वरेशादपीह।', 'इदं ते वपुर्नाथ गोपालबालं सदा मे मनस्याविरास्तां किमन्यैः॥ ४॥'],
      translit: ['Varam deva moksham na mokshaavadhim vaa na chaanyam vrineham vareshaad-apeeha,', 'idam te vapur-naatha gopaala-baalam sadaa me manasyaaviraastaam kim-anyaih.'],
      meaning: 'O God, I ask no boon from you, the Lord of boons: not liberation, not even the highest state beyond it, nothing at all. O Lord, let only this form of yours, the cowherd child, live forever in my mind. What use have I for anything else?'
    },
    {
      dev: ['इदं ते मुखाम्भोजमत्यन्तनीलैर्वृतं कुन्तलैः स्निग्धरक्तैश्च गोप्या।', 'मुहुश्चुम्बितं बिम्बरक्ताधरं मे मनस्याविरास्तामलं लक्षलाभैः॥ ५॥'],
      translit: ['Idam te mukhaambhojam-atyanta-neelair-vritam kuntalaih snigdha-raktaish-cha gopyaa,', 'muhush-chumbitam bimba-raktaadharam me manasyaaviraastaam-alam laksha-laabhaih.'],
      meaning: 'Let this lotus face of yours, ringed by glossy black curls and kissed over and over by Yashoda, your lips red as the bimba fruit, live forever in my mind. A million other gains are nothing to me.'
    },
    {
      dev: ['नमो देव दामोदरानन्त विष्णो प्रसीद प्रभो दुःखजालाब्धिमग्नम्।', 'कृपादृष्टिवृष्ट्यातिदीनं बतानुगृहाणेश मां अज्ञमेध्यक्षिदृश्यः॥ ६॥'],
      translit: ['Namo deva Daamodaraananta Vishno praseeda prabho duhkha-jaalaabdhi-magnam,', 'kripaa-drishti-vrishtyaa-ati-deenam bataanu-grihaaneesha maam agyam-edhyaakshi-drishyah.'],
      meaning: 'O God, O Damodara, O infinite Vishnu, be pleased with me, O Lord, for I am drowning in an ocean of sorrow. Rain down your glance of mercy and lift up this foolish, wretched soul; let me become an object of your sight.'
    },
    {
      dev: ['कुवेरात्मजौ बद्धमूर्त्यैव यद्वत्त्वया मोचितौ भक्तिभाजौ कृतौ च।', 'तथा प्रेमभक्तिं स्वकां मे प्रयच्छ न मोक्षे ग्रहो मेऽस्ति दामोदरेह॥ ७॥'],
      translit: ['Kuveraatmajau baddha-moortyaiva yadvat-tvayaa mochitau bhakti-bhaajau kritau cha,', 'tathaa prema-bhaktim svakaam me prayachchha na mokshe graho measti Daamodareha.'],
      meaning: 'Just as, while still bound, you freed the two sons of Kuvera and made them your devotees, in the same way grant me your own loving devotion. I have no desire even for liberation, O Damodara, here in this world.'
    },
    {
      dev: ['नमस्तेऽस्तु दाम्ने स्फुरद्दीप्तिधाम्ने त्वदीयोदरायाथ विश्वस्य धाम्ने।', 'नमो राधिकायै त्वदीयप्रियायै नमोऽनन्तलीलाय देवाय तुभ्यम्॥ ८॥'],
      translit: ['Namasteastu daamne sphurad-deepti-dhaamne tvadeeyodaraayaatha vishvasya dhaamne,', 'namo Raadhikaayai tvadeeya-priyaayai namoananta-leelaaya devaaya tubhyam.'],
      meaning: 'Obeisance to the rope about your belly, the abode of blazing light, and to your belly itself, the home of the whole universe. Obeisance to Radha, your dearest beloved, and obeisance to you, O God of endless pastimes.'
    }
  ]
},
{
  id: 'om-namo-narayanaya',
  title: 'Om Namo Narayanaya (Ashtakshara Mantra)', titleDev: 'ॐ नमो नारायणाय',
  deity: 'Vishnu', deityDev: 'विष्णु', type: 'Mantra', lang: 'sa',
  about: 'The Ashtakshara, the eight-syllable mantra of Vishnu as Narayana, the refuge of all beings. It is chanted on Ekadashi, on Thursdays and through the month of Kartik, usually 108 times on a tulsi mala.',
  keywords: ['vishnu', 'narayana', 'om namo narayanaya', 'ashtakshara', 'eight syllable', 'ekadashi', 'thursday', 'kartik', 'japa', 'mantra', 'tulsi mala'],
  stanzas: [{
    dev: ['ॐ नमो नारायणाय॥'],
    translit: ['Om namo Naaraayanaaya.'],
    meaning: 'Om. Salutations to Narayana, Vishnu, the refuge and resting place of all beings.'
  }]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS12);
