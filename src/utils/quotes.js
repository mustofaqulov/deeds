export const MOTIVATIONAL_QUOTES = [
  { text: "Sabr — yarmisi imondir.", source: "Hadis" },
  { text: "Alloh taoloning rahmatidan noumid bo'lmang.", source: "Az-Zumar, 53" },
  { text: "Kim Allohga tavakkal qilsa, Alloh unga yetarli bo'lur.", source: "At-Taloq, 3" },
  { text: "Eng yaxshi sadaqa — Ramazon oyidagi sadaqadir.", source: "Tirmiziy" },
  { text: "Ro'zakor uchun ikkita shodlik bor: iftori va Alloh bilan yuzlashuvi.", source: "Buxoriy" },
  { text: "Namoz — dinning ustuni.", source: "Hadis" },
  { text: "Til yaxshi so'z so'zlagan holda yoki jim bo'lsin.", source: "Buxoriy" },
  { text: "Qo'shningga xayrixoh bo'l — haqiqiy mo'min bo'lasan.", source: "Buxoriy" },
  { text: "Kichik amal — muntazam bo'lsa — Allohga eng sevimlidir.", source: "Buxoriy" },
  { text: "Islom besh narsaga qurilgan...", source: "Buxoriy" },
  { text: "Duoning kaliti — tahorat, namozning kaliti — takbir.", source: "Tirmiziy" },
  { text: "Alloh qalbga qaraydi, ko'rinishga emas.", source: "Muslim" },
  { text: "Ramazon — mag'firat, rahmat va jahannamdan najot oyi.", source: "Bayhaqiy" },
  { text: "Yaxshi xulq — imoning kamolotidir.", source: "Abu Dovud" },
  { text: "Qur'on — qalblar shifosi.", source: "Yunus, 57" },
  { text: "Zikr — qalblarning xotirjamligidir.", source: "Ar-Ra'd, 28" },
  { text: "Haqiqiy boy — qalban boy bo'lgandir.", source: "Buxoriy" },
  { text: "Imon — so'z va amal birlashuvidir.", source: "Salaflar" },
  { text: "Gunohdan keyin tavba — gunohni o'chiradi.", source: "Hadis" },
  { text: "Alloh mehribon bandalariga mehr ko'rsatadi.", source: "Tirmiziy" },
  { text: "Har qiynalish ortida yengillik bor.", source: "Ash-Sharh, 5-6" },
  { text: "Siz — Alloh aytganidek bo'ling, Alloh sizi xohlagan holda qiladi.", source: "Hikmat" },
  { text: "Yaxshi niyat — amalni yaxshi qiladi.", source: "Hadis" },
  { text: "Dunyoning qadri Alloh nazarida chivinning qanotidayman emas.", source: "Tirmiziy" },
  { text: "Faqat Alloh uchun sev va Alloh uchun yomon ko'r.", source: "Abu Dovud" },
  { text: "Tavba eshigi — quyosh g'arbdan chiqmaguncha ochiqdir.", source: "Muslim" },
  { text: "Ilm — ibodatning afzali.", source: "Hadis" },
  { text: "Odamlarning eng yaxshisi — ularga eng foydali bo'lganidir.", source: "Tabaroniy" },
  { text: "Ramazon kechalarini ibodat bilan o'tkazgan kishi — past gunohlari kechiriladi.", source: "Buxoriy" },
  { text: "Alloh — eng yaxshi himoyachi, eng mehribon rahmdil.", source: "Yusuf, 64" },
];

export function getDailyQuote() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
}
