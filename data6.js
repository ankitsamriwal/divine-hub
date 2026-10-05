// Divine Hub weekly content (2026-10-05). Sharad Navratri begins 11 Oct 2026.
// Aarti text compared across Dharmsaar and BhaktiBharat; Navarna mantra across VandanaBhakti, AstroBhava and Hindu Calculator.
const PRAYERS6 = [
{
  id: 'ambe-tu-hai-jagdambe-kali',
  title: 'Ambe Tu Hai Jagdambe Kali (Durga Aarti)', titleDev: 'अम्बे तू है जगदम्बे काली',
  deity: 'Durga', deityDev: 'दुर्गा', type: 'Aarti', lang: 'hi',
  about: 'One of the most sung aartis of the Divine Mother, heard on Fridays, through both Navratris, on Ashtami and at jagrans. It calls Durga the Mother of the world who rides the lion, and asks only for a small corner in her heart. This is the common four-verse form; some editions leave out the last verse.',
  keywords: ['durga', 'ambe', 'jagdambe', 'kali', 'khappar wali', 'aarti', 'navratri', 'devi', 'maa', 'shakti', 'mata', 'ashtami'],
  stanzas: [
    { dev: ['अम्बे तू है जगदम्बे काली, जय दुर्गे खप्पर वाली।', 'तेरे ही गुण गाएँ भारती, ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Ambe tu hai Jagdambe Kali, jai Durge khappar wali.', 'Tere hi gun gaayen Bharati, o Maiya hum sab utaaren teri aarti.'],
      meaning: 'O Ambe, you are the Mother of the world, Kali. Victory to Durga, bearer of the skull-bowl. Your devotees sing only your praises. O Mother, we all offer you the aarti. (Refrain.)' },
    { dev: ['तेरे भक्त जनों पर, भीर पड़ी है भारी माँ।', 'दानव दल पर टूट पड़ो, माँ करके सिंह सवारी॥', 'सौ-सौ सिंहों से बलशाली, अष्ट भुजाओं वाली,', 'दुष्टों को पल में संहारती। ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Tere bhakt janon par, bheer padi hai bhaari Maa.', 'Daanav dal par toot pado, Maa karke sinh savaari.', 'Sau-sau sinhon se balshaali, asht bhujaaon wali,', 'dushton ko pal mein sanhaarti. O Maiya hum sab utaaren teri aarti.'],
      meaning: 'A heavy trouble has come upon your devotees, Mother. Ride your lion and fall upon the army of demons. You are stronger than a hundred lions, O eight-armed one, and you destroy the wicked in a moment. We offer you the aarti.' },
    { dev: ['अम्बे तू है जगदम्बे काली, जय दुर्गे खप्पर वाली।', 'तेरे ही गुण गाएँ भारती, ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Ambe tu hai Jagdambe Kali, jai Durge khappar wali.', 'Tere hi gun gaayen Bharati, o Maiya hum sab utaaren teri aarti.'],
      meaning: '(Refrain.)' },
    { dev: ['माँ बेटे का है इस जग में, बड़ा ही निर्मल नाता।', 'पूत कपूत सुने हैं पर ना, माता सुनी कुमाता॥', 'सब पे करुणा दरसाने वाली, अमृत बरसाने वाली,', 'दुखियों के दुखड़े निवारती। ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Maa-bete ka hai is jag mein, bada hi nirmal naata.', 'Poot kapoot sune hain par na, Maata suni kumaata.', 'Sab pe karuna darsaane wali, amrit barsaane wali,', 'dukhiyon ke dukhde nivaarti. O Maiya hum sab utaaren teri aarti.'],
      meaning: 'The bond of mother and child is the purest in this world. We have heard of bad sons, but never of a bad mother. You show kindness to all and rain nectar, and you remove the sorrows of the suffering. We offer you the aarti.' },
    { dev: ['अम्बे तू है जगदम्बे काली, जय दुर्गे खप्पर वाली।', 'तेरे ही गुण गाएँ भारती, ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Ambe tu hai Jagdambe Kali, jai Durge khappar wali.', 'Tere hi gun gaayen Bharati, o Maiya hum sab utaaren teri aarti.'],
      meaning: '(Refrain.)' },
    { dev: ['नहीं माँगते धन और दौलत, न चाँदी न सोना माँ।', 'हम तो माँगें माँ तेरे मन में, इक छोटा सा कोना॥', 'सबकी बिगड़ी बनाने वाली, लाज बचाने वाली,', 'सतियों के सत को सँवारती। ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Nahin maangte dhan aur daulat, na chaandi na sona Maa.', 'Hum to maangen Maa tere man mein, ik chhota sa kona.', 'Sabki bigdi banaane wali, laaj bachaane wali,', 'satiyon ke sat ko sanwaarti. O Maiya hum sab utaaren teri aarti.'],
      meaning: 'We do not ask for wealth, silver or gold, Mother. We ask for one small corner in your heart. You mend what is broken for everyone, you protect honour, and you strengthen the truth of the faithful. We offer you the aarti.' },
    { dev: ['अम्बे तू है जगदम्बे काली, जय दुर्गे खप्पर वाली।', 'तेरे ही गुण गाएँ भारती, ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Ambe tu hai Jagdambe Kali, jai Durge khappar wali.', 'Tere hi gun gaayen Bharati, o Maiya hum sab utaaren teri aarti.'],
      meaning: '(Refrain.)' },
    { dev: ['चरण शरण में खड़े तुम्हारी, ले पूजा की थाली।', 'वरद हस्त सर पर रख दो, माँ संकट हरने वाली॥', 'माँ भर दो भक्ति रस प्याली, अष्ट भुजाओं वाली,', 'भक्तों के कारज तू ही सारती। ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Charan sharan mein khade tumhaari, le pooja ki thaali.', 'Varad hast sar par rakh do, Maa sankat harne wali.', 'Maa bhar do bhakti ras pyaali, asht bhujaaon wali,', 'bhakton ke kaaraj tu hi saarti. O Maiya hum sab utaaren teri aarti.'],
      meaning: 'We stand at your feet with the puja plate. Place your blessing hand on our heads, O remover of troubles. Fill the cup with the nectar of devotion, O eight-armed one. You alone complete the work of your devotees. We offer you the aarti.' },
    { dev: ['अम्बे तू है जगदम्बे काली, जय दुर्गे खप्पर वाली।', 'तेरे ही गुण गाएँ भारती, ओ मैया हम सब उतारें तेरी आरती॥'],
      translit: ['Ambe tu hai Jagdambe Kali, jai Durge khappar wali.', 'Tere hi gun gaayen Bharati, o Maiya hum sab utaaren teri aarti.'],
      meaning: '(Refrain.)' }
  ]
},
{
  id: 'navarna-mantra',
  title: 'Navarna Mantra (Chamunda Mantra)', titleDev: 'नवार्ण मन्त्र',
  deity: 'Durga', deityDev: 'दुर्गा', type: 'Mantra', lang: 'sa',
  about: 'The nine-syllable heart mantra of the Devi Mahatmya (Durga Saptashati), chanted by japa through Navratri. Its syllables are Ai, Hrim, Klim, Chamundayai and Vichche, counted with Om as the opening. Traditional teachers explain Ai as the seed of Saraswati, Hrim of Mahalakshmi and Klim of Mahakali. A steady 108 repetitions on a mala is the usual practice.',
  keywords: ['navarna', 'navakshari', 'chamunda', 'chamundayai', 'vichche', 'aim hreem kleem', 'durga', 'saptashati', 'chandi', 'navratri', 'mantra', 'japa', 'mala'],
  stanzas: [{ dev: ['ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे॥'],
    translit: ['Om aim hreem kleem Chamundayai vichche.'],
    meaning: 'Om. Ai, Hrim and Klim are seed sounds of the Goddess as wisdom, abundance and power. Salutation to Chamunda. “Vichche” is the closing formula of the mantra and is explained in several ways, so it is not translated word for word here.' }]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS6);
