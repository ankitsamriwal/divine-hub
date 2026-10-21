/* Divine Hub — sung versions of each prayer.
   Each entry points to an official upload by the label or rights holder on YouTube,
   played through YouTube's privacy-enhanced embed (youtube-nocookie.com) only when the
   user taps play. Nothing is downloaded or re-hosted. Verified via YouTube oEmbed.
   Prayers without an entry show a "find a sung version" link instead. */
const AUDIO_SOURCES = {
  "aarti-kunj-bihari-ki": {
    "youtube": "FEMR5alT7CY",
    "channel": "T-Series Bhakti Sagar",
    "title": "जन्माष्टमी आरती: आरती कुंज बिहारी की, Aarti Kunj Bihari Ki, Krishna Ji Ki Aarti, ANURADHA PAUDWAL"
  },
  "ambe-tu-hai-jagdambe-kali": {
    "youtube": "VyuTWta6d20",
    "channel": "T-Series Bhakti Sagar",
    "title": "Ambe Tu Hai Jagdambe Kali [Full Song] - Aarti Sangrah"
  },
  "devi-aparajita-stotram": {
    "youtube": "daFLVbshBP0",
    "channel": "Times Music Spiritual",
    "title": "Ya Devi Sarva Bhuteshu | Sooryagayathri | Devi Stuti | Durga Mantra|Mata Rani Songs|Navratri Special"
  },
  "durga-chalisa": {
    "youtube": "AXvmt88JLWg",
    "channel": "T-Series Bhakti Sagar",
    "title": "Durga Chalisa with Lyrics By Anuradha Paudwal [Full Song] I DURGA CHALISA DURGA KAWACH"
  },
  "durga-saptashloki": {
    "youtube": "e7y0p8d3MHM",
    "channel": "Times Music Spiritual",
    "title": "Sampoorna Durga Saptashloki | Seven Durga Shlokas | Anuradha Paudwal | Durga Mantra | Navratri 2026"
  },
  "ganapati-atharvashirsha-core": {
    "youtube": "0UKhI2nSVtY",
    "channel": "Times Music Spiritual",
    "title": "Shree Ganapati Atharvashirsha | Ajay Atul | Vishwa Vinayaka | Ganpati Stotram | Ganesh Mantra"
  },
  "ganesh-mantras": {
    "youtube": "LPFfB2GIA9Y",
    "channel": "Times Music Spiritual",
    "title": "Vakratunda Mahakaya Suryakoti Samaprabha | Jagjit Singh | Ganesh Mantra & Bhajan | Ganesh Vandana"
  },
  "gayatri-mantra": {
    "youtube": "nwRoHC83wx0",
    "channel": "T-Series Bhakti Sagar",
    "title": "Gayatri Mantra 108 times Anuradha Paudwal I Full Audio Song I T-Series Bhakti Sagar"
  },
  "hanuman-aarti": {
    "youtube": "KYohNbOV8ow",
    "channel": "T-Series Bhakti Sagar",
    "title": "शनिवार Special आरती कीजै हनुमान लला की Aarti Keejei Hanuman Lala Ki I Hanuman Aarti, HARIHARAN"
  },
  "hanuman-chalisa": {
    "youtube": "AETFvQonfV8",
    "channel": "T-Series Bhakti Sagar",
    "title": "श्री हनुमान चालीसा 🌺🙏| Shree Hanuman Chalisa Original Video |🙏🌺| GULSHAN KUMAR | HARIHARAN | 8K"
  },
  "hare-krishna-mahamantra": {
    "youtube": "XLefWPet0wQ",
    "channel": "T-Series Bhakti Sagar",
    "title": "HARE RAMA HARE KRISHNA MAHAMANTRA SPIRITUAL DHUN BY GAURAV VATS I AUDIO SONG ART TRACK"
  },
  "jai-ambe-gauri": {
    "youtube": "-rKAOaS7Q3I",
    "channel": "T-Series Bhakti Sagar",
    "title": "नवरात्रि विशेष आरती: जय अम्बे गौरी Jai Ambe Gauri Aarti,🙏Durga Ji Aarti🙏,ANURADHA PAUDWAL,Devi Aarti"
  },
  "jai-ganesh-deva": {
    "youtube": "Yuex2EnsGiY",
    "channel": "T-Series Bhakti Sagar",
    "title": "Ganesh Aarti, JAI GANESH DEVA by Anuradha Paudwal with Hindi, English LyricsI I Full Video Song"
  },
  "kalabhairava-ashtakam": {
    "youtube": "wQK9GYwnhMk",
    "channel": "T-Series Bhakti Sagar",
    "title": "Kaal Bhairav Ashtakam With Lyrics | कालभैरव अष्टकम् स्तोत्र |Rajalakshmi Sanjay | T-Series Spiritual"
  },
  "krishna-chalisa": {
    "youtube": "fgYjYixZUtA",
    "channel": "T-Series Bhakti Sagar",
    "title": "Shri Krishna Chalisa [Full Song] I Shri Krishna Chalisa"
  },
  "lingashtakam": {
    "youtube": "3G3e1UCK-5w",
    "channel": "T-Series Bhakti Sagar",
    "title": "Lingashtakam By S.P. Balasubrahmaniam [Full Song] - Shiva Roopa Darshan"
  },
  "maha-mrityunjaya-mantra": {
    "youtube": "EyDxxGXkxVk",
    "channel": "T-Series Bhakti Sagar",
    "title": "महामृत्युंजय मंत्र Mahamrityunjay Mantra I ANURADHA PAUDWAL I Mahamrityunjaya Mantra I Shiv Mantra"
  },
  "mahalakshmi-ashtakam": {
    "youtube": "AFj9OkU7CGE",
    "channel": "Times Music Spiritual",
    "title": "Mahalakshmi Ashtakam | Anuradha Paudwal Bhakti Song| Laxmi Mantra | Hindu Devotional Songs & Bhajan"
  },
  "navarna-mantra": {
    "youtube": "cdlS1XC3Gus",
    "channel": "T-Series Bhakti Sagar",
    "title": "Om Aim Hrim Klim Chamundaye Vichche...Durga Mantra 108 times By Anuradha Paudwal I Art Track"
  },
  "om-jai-jagdish-hare": {
    "youtube": "3ucCEjXS9n8",
    "channel": "T-Series Bhakti Sagar",
    "title": "ॐ जय जगदीश हरे आरती Om Jai Jagdish Hare Aarti I ANURADHA PAUDWAL I Vishnu Aarti I Video SongAartiyan"
  },
  "om-jai-lakshmi-mata": {
    "youtube": "5ttUSe1Jp-Q",
    "channel": "T-Series Bhakti Sagar",
    "title": "Om Jai Lakshmi Mata Aarti By Anuradha Paudwal [Full Song] I Bhakti Sagar Vol.1"
  },
  "om-jai-saraswati-mata": {
    "youtube": "2kNaBgkBboU",
    "channel": "T-Series Bhakti Sagar",
    "title": "बसंत पंचमी Special I ॐ जय सरस्वती माता I Om Jai Saraswati Mata I ANURADHA PAUDWAL I Saraswati Aarti"
  },
  "om-jai-shiv-omkara": {
    "youtube": "AHQrgIz0WGg",
    "channel": "T-Series Bhakti Sagar",
    "title": "Om Jai Shiv Omkara Shiv Aarti By Anuradha Paudwal [Full Song] - Aartiyan"
  },
  "ram-taraka-mantra": {
    "youtube": "kScxvPdCT4w",
    "channel": "Rajshri Soul",
    "title": "Shri Ram Jai Ram Jai Jai Ram Dhun 108 Times | Ram Navami Special | Peaceful Mantra | Rajshri Soul"
  },
  "ramayan-aarti": {
    "youtube": "YpON101glHQ",
    "channel": "T-Series Bhakti Sagar",
    "title": "Aarti Shri Ramayan Ji Ki By Anuradha Paudwal I Full Video Song I Shri Mehndipur Balaji Ki Aartiyaan"
  },
  "sai-baba-aarti": {
    "youtube": "0f3UOj6n8Qs",
    "channel": "Times Music Spiritual",
    "title": "आरती साईं बाबा - Aarti Sai Baba - Saukhya Datar Jeeva - Shankar Mahadevan - Shirdi Sai Baba"
  },
  "sankatmochan-ashtak": {
    "youtube": "x-BqlfpQ-Wo",
    "channel": "T-Series Bhakti Sagar",
    "title": "संकटमोचन हनुमान अष्टक, Hanuman Ashtak I Hindi English Lyrics I NARENDRA CHANCHAL I Full HD Video"
  },
  "santoshi-mata-aarti": {
    "youtube": "lhyEQhFPPtU",
    "channel": "T-Series Bhakti Sagar",
    "title": "शुक्रवार Special जय संतोषी माता Jai Santoshi Mata Aarti I ANURADHA PAUDWAL | Aarti Vol.6 | HD"
  },
  "saraswati-vandana": {
    "youtube": "7zs9I4lSM20",
    "channel": "T-Series Bhakti Sagar",
    "title": "Ya Kundendu Tusharahara Dhavala | या कुंदेन्दु | Saraswati Mantra | SHARAYU DATE |T-SERIES SPIRITUAL"
  },
  "satyanarayan-aarti": {
    "youtube": "9ExsHIU7MY8",
    "channel": "T-Series Bhakti Sagar",
    "title": "Satyanarayan Aarti, Jai Lakshmi Ramna By ANURADHA PAUDWAL I Full Audio"
  },
  "sheetla-mata-aarti": {
    "youtube": "WAKr_PU7rL0",
    "channel": "Shemaroo Bhakti",
    "title": "Shitala Mata Ki Aarti | Sheetla Mata Ki Aarti | Shitala Mata Aarti | शीतला माता की आरती"
  },
  "shiv-chalisa": {
    "youtube": "Og_SivYZiQw",
    "channel": "T-Series Bhakti Sagar",
    "title": "Shiv Chalisa with Lyrics By Anuradha Paudwal  I Full Video Song"
  },
  "shiva-tandava-stotram": {
    "youtube": "ZIKzQJYKJV0",
    "channel": "Times Music Spiritual",
    "title": "Shiv Tandav Stotram (Official) | Shankar Mahadevan| Bholenath Song 2026| Shiva Song | Mahadev Bhajan"
  },
  "shri-ramchandra-kripalu-bhajman": {
    "youtube": "xSm89S6tK18",
    "channel": "T-Series Bhakti Sagar",
    "title": "श्री राम चंद्र कृपालु भजमन Shree Ram Chandra Kripalu Bhajman with Lyrics, Ram Stuti,ANURADHA PAUDWAL"
  },
  "sukhakarta-dukhharta": {
    "youtube": "-37TCiyKLX4",
    "channel": "T-Series Marathi",
    "title": "SUKHKARTA DUKHHARTA I AARTI SANGRAH I ANURADHA PAUDWAL"
  },
  "surya-aarti": {
    "youtube": "F9uURnkc8iA",
    "channel": "T-Series Bhakti Sagar",
    "title": "Surya Aarti, Om Jai Surya Bhagwan  Aarti with Hindi English Lyrics By Anuradha Paudwal"
  }
};
