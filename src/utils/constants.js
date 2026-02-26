export const LEVELS = [
  { level: 1, name: 'Murid',  minXP: 0,    icon: '🌱' },
  { level: 2, name: 'Tolib',  minXP: 150,  icon: '📚' },
  { level: 3, name: 'Solik',  minXP: 400,  icon: '🕌' },
  { level: 4, name: 'Orif',   minXP: 900,  icon: '⭐' },
  { level: 5, name: 'Abdol',  minXP: 1800, icon: '🌟' },
  { level: 6, name: 'Vali',   minXP: 3500, icon: '✨' },
  { level: 7, name: 'Qutb',   minXP: 6000, icon: '👑' },
];

export const PRESET_CHALLENGES = [
  {
    id: 'quran',
    title: "Qur'on o'qish",
    titleAr: '\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0642\u0631\u0622\u0646',
    description: "Har kuni belgilangan miqdorda Qur'on o'qing",
    icon: '📖',
    xpPerTask: 25,
    difficulty: 'Oson',
    frequency: 'Kunlik',
    users: 1420,
  },
  {
    id: 'namoz',
    title: '5 Vaqt Namoz',
    titleAr: '\u0627\u0644\u0635\u0644\u0648\u0627\u062a \u0627\u0644\u062e\u0645\u0633',
    description: "Har kungi 5 vaqt namozni o'z vaqtida ado eting",
    icon: '🕌',
    xpPerTask: 30,
    difficulty: "O'rta",
    frequency: 'Kunlik',
    users: 2310,
  },
  {
    id: 'zikr',
    title: 'Zikr Challenge',
    titleAr: '\u0627\u0644\u0630\u0643\u0631',
    description: 'Har kuni 100x SubhanAllah, Alhamdulillah, AllahuAkbar',
    icon: '📿',
    xpPerTask: 20,
    difficulty: 'Oson',
    frequency: 'Kunlik',
    users: 987,
  },
  {
    id: 'sadaqa',
    title: 'Sadaqa Challenge',
    titleAr: '\u0627\u0644\u0635\u062f\u0642\u0629',
    description: 'Har kuni biror narsani sadaqa qiling',
    icon: '🤲',
    xpPerTask: 60,
    difficulty: "O'rta",
    frequency: 'Haftalik',
    users: 654,
  },
  {
    id: 'tahajjud',
    title: 'Tahajjud Challenge',
    titleAr: '\u0627\u0644\u062a\u0647\u062c\u062f',
    description: "Saharlik oldidan tahajjud namozini o'qing",
    icon: '🌙',
    xpPerTask: 60,
    difficulty: 'Qiyin',
    frequency: 'Kunlik',
    users: 432,
  },
];

export const IFTOR_DUA = {
  arabic:
    '\u0627\u0644\u0644\u0651\u064e\u0647\u064f\u0645\u0651\u064e \u0625\u0650\u0646\u0651\u0650\u064a \u0644\u064e\u0643\u064e \u0635\u064f\u0645\u0652\u062a\u064f \u0648\u064e\u0628\u0650\u0643\u064e \u0622\u0645\u064e\u0646\u0652\u062a\u064f \u0648\u064e\u0639\u064e\u0644\u064e\u064a\u0652\u0643\u064e \u062a\u064e\u0648\u064e\u0643\u0651\u064e\u0644\u0652\u062a\u064f \u0648\u064e\u0639\u064e\u0644\u064e\u0649 \u0631\u0650\u0632\u0652\u0642\u0650\u0643\u064e \u0623\u064e\u0641\u0652\u0637\u064e\u0631\u0652\u062a\u064f',
  uzbek:
    "Allohim, Men Sen uchun ro'za tuttim, Senga ishondim, Senga tavakkal qildim va Sening rizqing bilan iftorlik qildim",
  transliteration:
    'Allohumma inni laka sumtu, wa bika aamantu, wa alayka tawakkaltu, wa ala rizqika aftartu',
  source: 'Abu Dovud',
};

export const SAHARLIK_DUA = {
  arabic:
    '\u0646\u064e\u0648\u064e\u064a\u0652\u062a\u064f \u0635\u064e\u0648\u0652\u0645\u064e \u063a\u064e\u062f\u064d \u0639\u064e\u0646\u0652 \u0623\u064e\u062f\u064e\u0627\u0621\u0650 \u0641\u064e\u0631\u0652\u0636\u0650 \u0634\u064e\u0647\u0652\u0631\u0650 \u0631\u064e\u0645\u064e\u0636\u064e\u0627\u0646\u064e \u0647\u064e\u0630\u0650\u0647\u0650 \u0627\u0644\u0633\u0651\u064e\u0646\u064e\u0629\u0650 \u0644\u0650\u0644\u0651\u064e\u0647\u0650 \u062a\u064e\u0639\u064e\u0627\u0644\u064e\u0649',
  uzbek:
    "Men bu yilgi Ramazon oyining farzini ado etish uchun ertangi kunning ro'zasini niyat qildim, Alloh taolo uchun",
  transliteration:
    "Navaytu sawma ghadin 'an ada'i fardi shahri Ramadhana hadhihi as-sanati lillahi ta'ala",
  source: 'Fiqh manbalari',
};

export const DAILY_AYAH = {
  arabic:
    '\u064a\u064e\u0627 \u0623\u064e\u064a\u0651\u064f\u0647\u064e\u0627 \u0627\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u0622\u0645\u064e\u0646\u064f\u0648\u0627 \u0643\u064f\u062a\u0650\u0628\u064e \u0639\u064e\u0644\u064e\u064a\u0652\u0643\u064f\u0645\u064f \u0627\u0644\u0635\u0651\u0650\u064a\u064e\u0627\u0645\u064f \u0643\u064e\u0645\u064e\u0627 \u0643\u064f\u062a\u0650\u0628\u064e \u0639\u064e\u0644\u064e\u0649 \u0627\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u0645\u0650\u0646 \u0642\u064e\u0628\u0652\u0644\u0650\u0643\u064f\u0645\u0652 \u0644\u064e\u0639\u064e\u0644\u0651\u064e\u0643\u064f\u0645\u0652 \u062a\u064e\u062a\u0651\u064e\u0642\u064f\u0648\u0646\u064e',
  uzbek:
    "Ey iymon keltirganlar! Sizilardan avvalgilar uchun farz qilingani kabi, sizilar uchun ham ro'za tutish farz qilindi. Shoyad taqvodor bo'lsangiz!",
  reference: 'Al-Baqara, 2:183',
};

export const DAILY_HADITH = {
  arabic:
    '\u0645\u064e\u0646\u0652 \u0635\u064e\u0627\u0645\u064e \u0631\u064e\u0645\u064e\u0636\u064e\u0627\u0646\u064e \u0625\u0650\u064a\u0645\u064e\u0627\u0646\u064b\u0627 \u0648\u064e\u0627\u062d\u0652\u062a\u0650\u0633\u064e\u0627\u0628\u064b\u0627 \u063a\u064f\u0641\u0650\u0631\u064e \u0644\u064e\u0647\u064f \u0645\u064e\u0627 \u062a\u064e\u0642\u064e\u062f\u0651\u064e\u0645\u064e \u0645\u0650\u0646\u0652 \u0630\u064e\u0646\u0652\u0628\u0650\u0647\u0650',
  uzbek: "Kim Ramazon oyini imon va savob kutib ro'za tutsa, uning o'tgan gunohlari kechiriladi",
  source: 'Buxoriy, Muslim',
};

export const CITIES = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Namangan',
  'Andijon',
  "Farg'ona",
  'Qarshi',
  'Nukus',
  'Jizzax',
  'Urganch',
  'Termiz',
  'Navoiy',
  'Guliston',
  'Muborak',
  'Denov',
];
