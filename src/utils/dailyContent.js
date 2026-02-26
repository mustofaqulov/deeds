import quranData from '../../quran.json';

const DAY_MS = 24 * 60 * 60 * 1000;

const AYAH_LIST = (() => {
  const list = [];
  for (const surah of quranData) {
    const translations = surah.translation || [];
    for (let i = 0; i < translations.length; i += 1) {
      list.push({
        uzbek: translations[i],
        reference: `${surah.surahName} ${surah.surahNo}:${i + 1}`,
      });
    }
  }
  return list;
})();

const getDayIndex = (date = new Date()) => {
  const time = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return Math.floor(time / DAY_MS);
};

export const HADITHS = [
  {
    arabic: '',
    uzbek: "Kim Ramazon oyini imon va savob kutib ro'za tutsa, uning o'tgan gunohlari kechiriladi.",
    source: 'Buxoriy, Muslim',
  },
  {
    arabic: '',
    uzbek: "Amallar niyatlarga bog'liq.",
    source: 'Buxoriy',
  },
  {
    arabic: '',
    uzbek: "Musulmon - boshqa musulmonlar uning tili va qo'lidan salomat bo'lgan kishidir.",
    source: 'Buxoriy, Muslim',
  },
  {
    arabic: '',
    uzbek: "Sizlarning eng yaxshingiz - Qur'onni o'rganib, boshqalarga o'rgatadigandir.",
    source: 'Buxoriy',
  },
];

export const getDailyAyah = (date = new Date()) => {
  if (!AYAH_LIST.length) {
    return { arabic: '', uzbek: '', reference: '' };
  }
  const idx = getDayIndex(date) % AYAH_LIST.length;
  const ayah = AYAH_LIST[idx];
  return {
    arabic: '',
    uzbek: ayah.uzbek,
    reference: ayah.reference,
  };
};

export const getDailyAyahList = (count = 10, date = new Date()) => {
  if (!AYAH_LIST.length || count <= 0) return [];
  const start = getDayIndex(date) % AYAH_LIST.length;
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const ayah = AYAH_LIST[(start + i) % AYAH_LIST.length];
    list.push({ arabic: '', uzbek: ayah.uzbek, ref: ayah.reference });
  }
  return list;
};

export const getDailyHadith = (date = new Date()) => {
  if (!HADITHS.length) {
    return { arabic: '', uzbek: '', source: '' };
  }
  const idx = getDayIndex(date) % HADITHS.length;
  return HADITHS[idx];
};
