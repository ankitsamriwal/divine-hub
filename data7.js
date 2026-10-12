// Divine Hub weekly content (2026-10-13). Navratri is under way; Vijayadashami (Dussehra) follows.
// Ram Stuti compared across Hindukosh and Pujasthan; Ram Taraka mantra across Divya Panchangam, VandanaBhakti, BhaktiArohan and VedicVani.
const PRAYERS7 = [
{
  id: 'shri-ramchandra-kripalu-bhajman',
  title: 'Shri Ramchandra Kripalu Bhajman (Ram Stuti)', titleDev: 'श्री रामचन्द्र कृपालु भजु मन',
  deity: 'Ram', deityDev: 'राम', type: 'Aarti', lang: 'hi',
  about: 'Tulsidas\'s hymn to Ram from the Vinaya Patrika, sung as an aarti in many homes and temples, on Ram Navami, around Diwali and at Dussehra. This is the six-verse form: five verses praising Ram, then the verse where Sita\'s friends hear Gauri\'s blessing. The short doha that follows it in some editions is not included. After each verse the first line is sung again as the refrain.',
  keywords: ['ram', 'ramchandra', 'kripalu', 'bhajman', 'stuti', 'aarti', 'tulsidas', 'vinaya patrika', 'dussehra', 'vijayadashami', 'ram navami', 'diwali', 'sita', 'raghunandan'],
  stanzas: [
    { dev: ['श्री रामचन्द्र कृपालु भजु मन, हरण भवभय दारुणम्।', 'नव कंज लोचन, कंज मुख, कर कंज, पद कंजारुणम्॥'],
      translit: ['Shri Ramchandra kripalu bhaju man, haran bhavbhay daarunam.', 'Nav kanj lochan, kanj mukh, kar kanj, pad kanjaarunam.'],
      meaning: 'O mind, worship the merciful Shri Ramchandra, who removes the terrible fear of worldly life. His eyes are fresh lotuses, his face a lotus, his hands and feet lotuses tinged with dawn red.' },
    { dev: ['कन्दर्प अगणित अमित छवि, नव नील नीरद सुन्दरम्।', 'पट पीत मानहुँ तड़ित रुचि शुचि, नौमि जनक सुतावरम्॥'],
      translit: ['Kandarp aganit amit chhavi, nav neel neerad sundaram.', 'Pat peet maanahu tadit ruchi shuchi, naumi Janak sutaavaram.'],
      meaning: 'His beauty is beyond counting, more than countless gods of love. He is lovely as a fresh dark rain cloud, and his yellow garment shines like pure lightning. I bow to the husband of Janak\'s daughter, Sita.' },
    { dev: ['भजु दीनबन्धु दिनेश दानव, दैत्य वंश निकन्दनम्।', 'रघुनन्द आनन्दकन्द कौशलचन्द दशरथ नन्दनम्॥'],
      translit: ['Bhaju deenbandhu dinesh daanav, daitya vansh nikandanam.', 'Raghunand aanandkand Kaushalchand Dasharath nandanam.'],
      meaning: 'Worship the friend of the lowly, bright as the sun, destroyer of the clans of demons. Delight of the Raghus, source of bliss, moon of Kaushalya, son of Dasharath.' },
    { dev: ['सिर मुकुट कुण्डल तिलक चारु, उदारु अङ्ग विभूषणम्।', 'आजानुभुज शर चाप धर, सङ्ग्राम जित खर दूषणम्॥'],
      translit: ['Sir mukut kundal tilak chaaru, udaaru ang vibhooshanam.', 'Aajaanubhuj shar chaap dhar, sangraam jit Khar Dooshanam.'],
      meaning: 'He wears a crown, earrings and a graceful tilak, and ornaments adorn his noble limbs. His arms reach his knees. He holds bow and arrow, and he won the battle against Khara and Dushana.' },
    { dev: ['इति वदति तुलसीदास शंकर, शेष मुनि मन रञ्जनम्।', 'मम हृदय कंज निवास कुरु, कामादि खल दल गञ्जनम्॥'],
      translit: ['Iti vadati Tulsidas Shankar, Shesh muni man ranjanam.', 'Mam hriday kanj nivaas kuru, kaamaadi khal dal ganjanam.'],
      meaning: 'So says Tulsidas: delight of Shiva, Shesha and the sages, make your home in the lotus of my heart, and destroy the band of wicked foes that begins with desire.' },
    { dev: ['मनु जाहि राचेउ मिलहि सो बरु, सहज सुन्दर साँवरो।', 'करुना निधान सुजान सीलु, सनेहु जानत रावरो॥', 'एहि भाँति गौरि असीस सुनि सिय, सहित हियँ हरषीं अली।', 'तुलसी भवानिहि पूजि पुनि पुनि, मुदित मन मन्दिर चली॥'],
      translit: ['Manu jaahi raacheu milahi so baru, sahaj sundar saanvaro.', 'Karuna nidhaan sujaan seelu, sanehu jaanat raavaro.', 'Ehi bhaanti Gauri aseesa suni Siya, sahit hiyan harsheen ali.', 'Tulsi Bhavaanihi pooji puni puni, mudit man mandir chali.'],
      meaning: 'Gauri said: the one on whom your heart is set, the naturally beautiful dark-complexioned Lord, will be your husband. He is an ocean of mercy, wise and good, and he knows your love. Hearing this blessing, Sita and her friends were glad at heart. Tulsidas says they worshipped Bhavani again and again and went home joyfully.' }
  ]
},
{
  id: 'ram-taraka-mantra',
  title: 'Shri Ram Jai Ram Jai Jai Ram (Ram Taraka Mantra)', titleDev: 'श्री राम जय राम जय जय राम',
  deity: 'Ram', deityDev: 'राम', type: 'Mantra', lang: 'sa',
  about: 'The thirteen-syllable chant of Ram\'s name, known as the Taraka mantra, the one that carries across. It is simple enough to repeat anywhere, on a mala of 108 or just through the day. Samarth Ramdas made it widely known.',
  keywords: ['ram', 'taraka', 'tarak', 'jai ram', 'shri ram', 'ram naam', 'japa', 'mala', 'mantra', 'thirteen syllable', 'trayodashakshari', 'dussehra', 'ramdas'],
  stanzas: [{ dev: ['श्री राम जय राम जय जय राम॥'],
    translit: ['Shri Ram jai Ram jai jai Ram.'],
    meaning: 'Shri Ram. Victory to Ram. Victory, victory to Ram. Repeat it steadily, 108 times on a mala if you can.' }]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS7);
