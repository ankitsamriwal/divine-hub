// Divine Hub weekly content (2026-10-20). Maha Mrityunjaya compared across Drik Panchang and GreenMesg (Rig Veda 7.59.12); Gayatri across VedKosh and GreenMesg.
const PRAYERS8 = [
{
  id: 'maha-mrityunjaya-mantra',
  title: 'Maha Mrityunjaya Mantra', titleDev: 'महामृत्युंजय मन्त्र',
  deity: 'Shiva', deityDev: 'शिव', type: 'Mantra', lang: 'sa',
  about: 'The Rig Veda verse (7.59.12) to Tryambaka, the three-eyed Shiva. It is chanted for health, protection and release from fear, and often 108 times on a mala, especially on Mondays and for someone who is unwell.',
  keywords: ['mrityunjaya', 'maha mrityunjaya', 'tryambakam', 'shiva', 'rudra', 'health', 'healing', 'protection', 'japa', 'mala', 'monday', 'mantra'],
  stanzas: [{ dev: ['ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।', 'उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्॥'],
    translit: ['Om tryambakam yajaamahe sugandhim pushtivardhanam.', 'Urvaarukamiva bandhanaan mrityormukshiya maamritaat.'],
    meaning: 'We worship the three-eyed Lord, fragrant and the nourisher of all. As a ripe cucumber is freed from its stalk, may he free us from death, not from immortality.' }]
},
{
  id: 'gayatri-mantra',
  title: 'Gayatri Mantra', titleDev: 'गायत्री मन्त्र',
  deity: 'Surya', deityDev: 'सूर्य', type: 'Mantra', lang: 'sa',
  about: 'The Rig Veda verse (3.62.10) to Savitr, the sun as the giver of light. It is a prayer for clear understanding, chanted at dawn, noon and dusk, and 108 times on a mala.',
  keywords: ['gayatri', 'savitri', 'savitur', 'bhur bhuvah svah', 'surya', 'sun', 'sandhya', 'wisdom', 'japa', 'mala', 'mantra', 'veda'],
  stanzas: [{ dev: ['ॐ भूर्भुवः स्वः।', 'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि।', 'धियो यो नः प्रचोदयात्॥'],
    translit: ['Om bhoor bhuvah svah.', 'Tat savitur varenyam bhargo devasya dheemahi.', 'Dhiyo yo nah prachodayaat.'],
    meaning: 'Om. Earth, space and heaven. We meditate on the radiance of the divine sun, the one most worthy of choice. May he inspire our minds.' }]
}
];
if (typeof PRAYERS !== 'undefined') PRAYERS.push(...PRAYERS8);
