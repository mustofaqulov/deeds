export const PRAYER_ITEMS = [
  { id: 'fajr', label: 'Bomdod' },
  { id: 'dhuhr', label: 'Peshin' },
  { id: 'asr', label: 'Asr' },
  { id: 'maghrib', label: 'Shom' },
  { id: 'isha', label: 'Xufton' },
];

export const PRAYER_STATUS_OPTIONS = [
  {
    id: 'on_time',
    label: 'Vaqtida',
    short: 'V',
    tone: 'good',
    points: 2,
    xp: 4,
  },
  {
    id: 'jamaat',
    label: 'Jamoat',
    short: 'J',
    tone: 'excellent',
    points: 3,
    xp: 5,
  },
  {
    id: 'qaza',
    label: 'Qazo',
    short: 'Q',
    tone: 'warn',
    points: 1,
    xp: 2,
  },
  {
    id: 'missed',
    label: "O'qilmadi",
    short: 'X',
    tone: 'danger',
    points: 0,
    xp: 0,
  },
];

export const PRAYER_STATUS_MAP = Object.fromEntries(
  PRAYER_STATUS_OPTIONS.map((option) => [option.id, option]),
);

export const PRAYER_MAX_SCORE = PRAYER_ITEMS.length * 3;
export const PRAYER_MAX_XP = PRAYER_ITEMS.reduce(
  (sum) => sum + (PRAYER_STATUS_MAP.jamaat?.xp || 0),
  0,
);

export const EMPTY_PRAYER_RECORD = Object.freeze({
  fajr: null,
  dhuhr: null,
  asr: null,
  maghrib: null,
  isha: null,
});

export const EMPTY_PRAYER_DEBT = Object.freeze({
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
});

const POSITIVE_STATUSES = new Set(['on_time', 'jamaat']);

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || '')
    .split('-')
    .map((value) => Number(value));

  if (!year || !month || !day) return null;
  const result = new Date(year, month - 1, day);
  result.setHours(0, 0, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
}

function diffByDay(fromDate, toDate) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const left = new Date(fromDate);
  const right = new Date(toDate);
  left.setHours(0, 0, 0, 0);
  right.setHours(0, 0, 0, 0);
  return Math.round((right.getTime() - left.getTime()) / DAY_MS);
}

function isSuccessfulDay(dayItem, minScorePercent = 70) {
  if (!dayItem) return false;
  if ((dayItem.prayerTrackedCount || 0) < PRAYER_ITEMS.length - 1) return false;
  return (dayItem.prayerScorePercent || 0) >= minScorePercent;
}

function statusDebtPoints(status) {
  return status === 'missed' ? 1 : 0;
}

function ensureInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export function toDateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function ensurePrayerRecord(rawRecord) {
  const source = rawRecord && typeof rawRecord === 'object' ? rawRecord : {};

  return {
    ...source,
    fajr: source.fajr || null,
    dhuhr: source.dhuhr || null,
    asr: source.asr || null,
    maghrib: source.maghrib || null,
    isha: source.isha || null,
  };
}

export function ensurePrayerDebt(rawDebt) {
  const source = rawDebt && typeof rawDebt === 'object' ? rawDebt : {};

  return {
    fajr: ensureInteger(source.fajr),
    dhuhr: ensureInteger(source.dhuhr),
    asr: ensureInteger(source.asr),
    maghrib: ensureInteger(source.maghrib),
    isha: ensureInteger(source.isha),
  };
}

export function getPrayerXP(status) {
  return PRAYER_STATUS_MAP[status]?.xp || 0;
}

export function getPrayerStatusXPDelta(prevStatus, nextStatus) {
  return getPrayerXP(nextStatus) - getPrayerXP(prevStatus);
}

export function getPrayerDebtDelta(prevStatus, nextStatus) {
  return statusDebtPoints(nextStatus) - statusDebtPoints(prevStatus);
}

export function getPrayerCounts(prayerRecord) {
  const values = PRAYER_ITEMS.map((item) => prayerRecord[item.id]);
  const score = values.reduce((sum, value) => sum + (PRAYER_STATUS_MAP[value]?.points || 0), 0);
  const xp = values.reduce((sum, value) => sum + getPrayerXP(value), 0);

  return {
    tracked: values.filter(Boolean).length,
    positive: values.filter((value) => POSITIVE_STATUSES.has(value)).length,
    qaza: values.filter((value) => value === 'qaza').length,
    missed: values.filter((value) => value === 'missed').length,
    score,
    xp,
  };
}

export function getPrayerToneLabel(scorePercent) {
  if (scorePercent >= 85) return "A'lo";
  if (scorePercent >= 60) return 'Barqaror';
  if (scorePercent >= 35) return "O'rtacha";
  if (scorePercent > 0) return 'Past';
  return 'Boshlanmagan';
}

export function getStatusOptionsByMode(mode = 'standard') {
  if (mode === 'masjid') {
    return [
      PRAYER_STATUS_MAP.jamaat,
      PRAYER_STATUS_MAP.on_time,
      PRAYER_STATUS_MAP.qaza,
      PRAYER_STATUS_MAP.missed,
    ].filter(Boolean);
  }

  return [
    PRAYER_STATUS_MAP.on_time,
    PRAYER_STATUS_MAP.jamaat,
    PRAYER_STATUS_MAP.qaza,
    PRAYER_STATUS_MAP.missed,
  ].filter(Boolean);
}

export function getPrayerDebtTotal(prayerDebt = EMPTY_PRAYER_DEBT) {
  return PRAYER_ITEMS.reduce((sum, item) => sum + (ensureInteger(prayerDebt[item.id]) || 0), 0);
}

export function computePrayerStreak(dayItems = [], minScorePercent = 70) {
  const rows = [...dayItems]
    .filter((item) => item && item.dateKey && item.status !== 'future')
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  let best = 0;
  let chain = 0;
  let lastDate = null;

  rows.forEach((item) => {
    const currentDate = parseDateKey(item.dateKey);
    if (!currentDate || !isSuccessfulDay(item, minScorePercent)) {
      chain = 0;
      lastDate = currentDate;
      return;
    }

    if (!lastDate) {
      chain = 1;
      best = Math.max(best, chain);
      lastDate = currentDate;
      return;
    }

    const distance = diffByDay(lastDate, currentDate);
    chain = distance === 1 ? chain + 1 : 1;
    best = Math.max(best, chain);
    lastDate = currentDate;
  });

  const byDateKey = new Map(rows.map((item) => [item.dateKey, item]));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let current = 0;
  while (true) {
    const dayKey = toDateKey(cursor);
    const item = byDateKey.get(dayKey);
    if (!isSuccessfulDay(item, minScorePercent)) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best };
}

export function getPrayerWeeklyReport(dayItems = [], referenceDateKey = toDateKey()) {
  const rows = [...dayItems]
    .filter((item) => item && item.dateKey && item.dateKey <= referenceDateKey && item.status !== 'future')
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  const weekly = rows.slice(-7);
  const totalDays = weekly.length;
  const scoreTotal = weekly.reduce((sum, item) => sum + (item.prayerScore || 0), 0);
  const maxScoreTotal = totalDays * PRAYER_MAX_SCORE;
  const disciplinePercent = maxScoreTotal > 0 ? Math.round((scoreTotal / maxScoreTotal) * 100) : 0;

  return {
    totalDays,
    scoreTotal,
    maxScoreTotal,
    disciplinePercent,
    trackedTotal: weekly.reduce((sum, item) => sum + (item.prayerTrackedCount || 0), 0),
    positiveTotal: weekly.reduce((sum, item) => sum + (item.prayerPositiveCount || 0), 0),
    qazaTotal: weekly.reduce((sum, item) => sum + (item.prayerQazaCount || 0), 0),
    missedTotal: weekly.reduce((sum, item) => sum + (item.prayerMissedCount || 0), 0),
    perfectDays: weekly.filter((item) => item.prayerPositiveCount === PRAYER_ITEMS.length).length,
  };
}

export function getSmartPrayerInsight(dayItems = [], referenceDateKey = toDateKey()) {
  const rows = [...dayItems]
    .filter((item) => item && item.dateKey && item.dateKey <= referenceDateKey && item.status !== 'future')
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .slice(-7);

  if (rows.length === 0) {
    return {
      id: 'no_data',
      title: "Namoz ma'lumotlari hali kam",
      note: "Oxirgi kunlardan kamida 2 kunni to'ldiring, tizim avtomatik tavsiya beradi.",
      severity: 'low',
    };
  }

  let focusedPrayer = null;

  PRAYER_ITEMS.forEach((prayer) => {
    const values = rows.map((item) => item.prayerRecord?.[prayer.id]).filter(Boolean);
    if (values.length === 0) return;

    const weakCount = values.filter((value) => value === 'qaza' || value === 'missed').length;
    const weakRatio = weakCount / values.length;

    if (!focusedPrayer || weakRatio > focusedPrayer.weakRatio) {
      focusedPrayer = {
        ...prayer,
        weakCount,
        trackedCount: values.length,
        weakRatio,
      };
    }
  });

  if (!focusedPrayer || focusedPrayer.weakRatio < 0.2) {
    return {
      id: 'stable',
      title: 'Namoz intizomi barqaror',
      note: "So'nggi haftada yaxshi ketayapti. Shu ritmni saqlang.",
      severity: 'low',
    };
  }

  const ratioPercent = Math.round(focusedPrayer.weakRatio * 100);
  const severity = focusedPrayer.weakRatio >= 0.5 ? 'high' : 'medium';

  return {
    id: `focus_${focusedPrayer.id}`,
    title: `${focusedPrayer.label} uchun eslatma`,
    note: `So'nggi 7 kunda ${focusedPrayer.label} ${focusedPrayer.weakCount}/${focusedPrayer.trackedCount} marta qazo yoki o'tib ketgan (${ratioPercent}%).`,
    action: severity === 'high'
      ? "Ertaroq reja qo'ying va tezkor tugma bilan holatni qayd eting."
      : "Kichik eslatma qo'ying va kamida vaqtidani saqlang.",
    severity,
    prayerId: focusedPrayer.id,
    prayerLabel: focusedPrayer.label,
  };
}
