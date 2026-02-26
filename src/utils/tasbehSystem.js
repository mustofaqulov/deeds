const WEEKDAY_LABELS = ['Yak', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const TASBEH_HISTORY_DAYS = 90;
export const TASBEH_MIN_CUSTOM_TARGET = 11;
export const TASBEH_MAX_CUSTOM_TARGET = 999;

export const TASBEH_MODES = [
  {
    key: '33',
    label: '33x',
    target: 33,
    zikr: 'Subhanalloh',
    arabic: 'Subhanalloh',
  },
  {
    key: '99',
    label: '99x',
    target: 99,
    zikr: 'Alhamdulillah',
    arabic: 'Alhamdulillah',
  },
  {
    key: '100',
    label: '100x',
    target: 100,
    zikr: 'Allohu Akbar',
    arabic: 'Allohu Akbar',
  },
  {
    key: 'custom',
    label: 'Custom',
    target: null,
    zikr: 'Shaxsiy Zikr',
    arabic: 'Shaxsiy Zikr',
  },
];

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeInt(value, fallback = 0) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseDateKey(dateKey) {
  if (!DATE_KEY_RE.test(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeHistory(rawHistory = {}) {
  const history = {};

  Object.entries(safeObject(rawHistory)).forEach(([dateKey, rawItem]) => {
    if (!DATE_KEY_RE.test(dateKey)) return;

    const count = safeInt(rawItem?.count);
    const sessions = safeInt(rawItem?.sessions);
    if (count <= 0 && sessions <= 0) return;

    history[dateKey] = { count, sessions };
  });

  return pruneTasbehHistory(history);
}

function normalizeRewardItem(rawReward) {
  if (!rawReward || typeof rawReward !== 'object') return null;

  const id = typeof rawReward.id === 'string' && rawReward.id.trim()
    ? rawReward.id
    : `reward_${Date.now()}`;

  return {
    id,
    xp: safeInt(rawReward.xp),
    target: safeInt(rawReward.target, 33),
    modeKey: typeof rawReward.modeKey === 'string' ? rawReward.modeKey : '33',
    at: typeof rawReward.at === 'string' ? rawReward.at : new Date().toISOString(),
    dayKey: typeof rawReward.dayKey === 'string' ? rawReward.dayKey : getLocalDateKey(),
    reverted: Boolean(rawReward.reverted),
    revertedAt: typeof rawReward.revertedAt === 'string' ? rawReward.revertedAt : null,
  };
}

export function getLocalDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function clampTasbehTarget(value) {
  const parsed = safeInt(value, 120);
  return clamp(parsed, TASBEH_MIN_CUSTOM_TARGET, TASBEH_MAX_CUSTOM_TARGET);
}

export function getTasbehTarget(modeKey, customTarget) {
  const mode = TASBEH_MODES.find((item) => item.key === modeKey) || TASBEH_MODES[0];
  if (mode.key === 'custom') return clampTasbehTarget(customTarget);
  return mode.target;
}

export function getTasbehDefaultData(soundEnabled = true) {
  return {
    activeMode: '33',
    customTarget: 120,
    soundEnabled: Boolean(soundEnabled),
    totalCount: 0,
    totalSessions: 0,
    history: {},
    rewardLog: [],
    lastReward: null,
  };
}

export function normalizeTasbehData(rawData, soundEnabled = true) {
  const data = safeObject(rawData);
  const defaults = getTasbehDefaultData(soundEnabled);
  const activeMode = TASBEH_MODES.some((item) => item.key === data.activeMode) ? data.activeMode : defaults.activeMode;
  const normalizedRewardLog = Array.isArray(data.rewardLog)
    ? data.rewardLog
      .map(normalizeRewardItem)
      .filter(Boolean)
      .slice(0, 12)
    : [];
  const normalizedLastReward = normalizeRewardItem(data.lastReward);

  return {
    activeMode,
    customTarget: clampTasbehTarget(data.customTarget ?? defaults.customTarget),
    soundEnabled: data.soundEnabled === undefined ? defaults.soundEnabled : Boolean(data.soundEnabled),
    totalCount: safeInt(data.totalCount, defaults.totalCount),
    totalSessions: safeInt(data.totalSessions, defaults.totalSessions),
    history: normalizeHistory(data.history),
    rewardLog: normalizedRewardLog,
    lastReward: normalizedLastReward,
  };
}

export function pruneTasbehHistory(history, keepDays = TASBEH_HISTORY_DAYS) {
  const entries = Object.entries(safeObject(history))
    .filter(([dateKey, item]) => DATE_KEY_RE.test(dateKey) && (safeInt(item?.count) > 0 || safeInt(item?.sessions) > 0))
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length <= keepDays) {
    return Object.fromEntries(entries);
  }

  return Object.fromEntries(entries.slice(entries.length - keepDays));
}

export function computeTasbehStreak(history, fromDate = new Date()) {
  let streak = 0;
  const map = safeObject(history);
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = getLocalDateKey(cursor);
    const sessions = safeInt(map[key]?.sessions);
    if (sessions > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

export function computeTasbehBestStreak(history) {
  const keys = Object.keys(safeObject(history))
    .filter((key) => safeInt(history[key]?.sessions) > 0)
    .sort();

  if (keys.length === 0) return 0;

  let current = 0;
  let best = 0;
  let prevDate = null;

  keys.forEach((key) => {
    const currentDate = parseDateKey(key);
    if (!currentDate) return;

    if (!prevDate) {
      current = 1;
      best = 1;
      prevDate = currentDate;
      return;
    }

    const diff = Math.round((currentDate - prevDate) / 86400000);
    if (diff === 1) current += 1;
    else current = 1;

    best = Math.max(best, current);
    prevDate = currentDate;
  });

  return best;
}

export function getTasbehXpForSession(target, streakDays = 0) {
  const safeTarget = safeInt(target, 33);

  let baseXp = 8;
  if (safeTarget >= 50 && safeTarget < 100) baseXp = 14;
  if (safeTarget >= 100 && safeTarget < 200) baseXp = 22;
  if (safeTarget >= 200) baseXp = 30;

  let streakMult = 1;
  if (streakDays >= 10) streakMult = 1.35;
  else if (streakDays >= 7) streakMult = 1.25;
  else if (streakDays >= 3) streakMult = 1.1;

  return Math.max(1, Math.round(baseXp * streakMult));
}

export function buildTasbehSeries(history, totalDays = 7) {
  const map = safeObject(history);
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = totalDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = getLocalDateKey(date);
    const item = map[key];

    result.push({
      key,
      day: WEEKDAY_LABELS[date.getDay()],
      dateNumber: date.getDate(),
      count: safeInt(item?.count),
      sessions: safeInt(item?.sessions),
      isToday: offset === 0,
    });
  }

  return result;
}
