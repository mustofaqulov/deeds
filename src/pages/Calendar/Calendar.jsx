import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRamadanDay } from '../../utils/helpers';
import { CITIES, PRESET_CHALLENGES } from '../../utils/constants';
import { getDailyQuest, getQuestProgress } from '../../utils/dailyQuests';
import {
  computePrayerStreak,
  ensurePrayerDebt,
  ensurePrayerRecord,
  getPrayerCounts,
  getPrayerDebtDelta,
  getPrayerDebtTotal,
  getPrayerStatusXPDelta,
  getPrayerToneLabel,
  getPrayerWeeklyReport,
  getSmartPrayerInsight,
  getStatusOptionsByMode,
  PRAYER_ITEMS,
  PRAYER_MAX_SCORE,
  PRAYER_MAX_XP,
  PRAYER_STATUS_MAP,
  toDateKey,
} from '../../utils/prayerSystem';
import {
  IconBarChart,
  IconBell,
  IconBolt,
  IconCalendar,
  IconCheckCircle,
  IconFire,
  IconMosque,
  IconRefresh,
  IconSun,
  IconSunrise,
  IconSunset,
  IconTarget,
  IconWarning,
} from '../../components/Icons/RamadanIcons';
import './Calendar.css';

const DAY_COUNT = 30;
const WEEKDAY_MON_FIRST = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Yak'];
const QAZO_RESOLVE_XP = 3;

const QUICK_PRAYER_ACTIONS = [
  { id: 'all_jamaat', label: '5x Jamoat', status: 'jamaat' },
  { id: 'all_on_time', label: '5x Vaqtida', status: 'on_time' },
  { id: 'all_qaza', label: '5x Qazo', status: 'qaza' },
  { id: 'clear_all', label: 'Tozalash', status: null },
];

const DETAIL_TABS = [
  { id: 'prayer', label: 'Namoz boshqaruvi' },
  { id: 'insight', label: 'Hisobot va eslatma' },
  { id: 'tasks', label: 'Quest va amallar' },
];

const DAY_FILTERS = [
  { id: 'all', label: 'Hammasi' },
  { id: 'task', label: 'Amal bor' },
  { id: 'goal', label: 'Goal hit' },
  { id: 'prayer_strong', label: 'Namoz yaxshi' },
  { id: 'prayer_risk', label: 'Xavf kunlar' },
];

const STATUS_ICON_BY_ID = {
  on_time: IconSun,
  jamaat: IconMosque,
  qaza: IconRefresh,
  missed: IconWarning,
};

const IFTOR_BASE = [
  '18:42', '18:43', '18:44', '18:46', '18:47', '18:48', '18:50', '18:51', '18:52', '18:54',
  '18:55', '18:56', '18:58', '18:59', '19:00', '19:02', '19:03', '19:04', '19:06', '19:07',
  '19:08', '19:10', '19:11', '19:12', '19:13', '19:15', '19:16', '19:17', '19:18', '19:20',
];

const SAHARLIK_BASE = [
  '05:12', '05:11', '05:10', '05:09', '05:08', '05:07', '05:06', '05:05', '05:04', '05:03',
  '05:02', '05:01', '05:00', '04:59', '04:58', '04:57', '04:56', '04:55', '04:54', '04:53',
  '04:52', '04:51', '04:50', '04:49', '04:48', '04:47', '04:46', '04:45', '04:44', '04:43',
];

const CITY_OFFSETS_MIN = {
  Toshkent: 0,
  Samarqand: 6,
  Buxoro: 11,
  Namangan: -5,
  Andijon: -6,
  "Farg'ona": -4,
  Qarshi: 8,
  Nukus: 18,
  Jizzax: 2,
  Urganch: 14,
  Termiz: 7,
  Navoiy: 9,
  Guliston: -1,
  Muborak: 8,
  Denov: 5,
};

const CITY_API_ALIAS = {
  Toshkent: 'Tashkent',
  Samarqand: 'Samarkand',
  Buxoro: 'Bukhara',
  Namangan: 'Namangan',
  Andijon: 'Andijan',
  "Farg'ona": 'Fergana',
  Qarshi: 'Karshi',
  Nukus: 'Nukus',
  Jizzax: 'Jizzakh',
  Urganch: 'Urgench',
  Termiz: 'Termez',
  Navoiy: 'Navoi',
  Guliston: 'Gulistan',
  Muborak: 'Muborak',
  Denov: 'Denau',
};

const PRESET_BY_ID = Object.fromEntries(PRESET_CHALLENGES.map((item) => [item.id, item]));
const DATE_FORMATTER = new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short' });
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' });
const TIME_FORMATTER = new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit' });

const toMondayIndex = (jsDay) => (jsDay === 0 ? 6 : jsDay - 1);
const pad2 = (value) => String(value).padStart(2, '0');

function buildDayDate(startDate, dayNum) {
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + dayNum - 1);
  return date;
}

function parseTime(value = '') {
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function toMinutes(value = '') {
  const parsed = parseTime(value);
  if (!parsed) return null;
  return (parsed.h * 60) + parsed.m;
}

function shiftTime(hhmm, minuteOffset = 0) {
  const parsed = parseTime(hhmm);
  if (!parsed) return hhmm;
  const absolute = (parsed.h * 60) + parsed.m + minuteOffset;
  const day = 24 * 60;
  const normalized = ((absolute % day) + day) % day;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

function getFallbackTimes(city, dayIndex) {
  const offset = CITY_OFFSETS_MIN[city] || 0;
  const saharlik = shiftTime(SAHARLIK_BASE[dayIndex], offset);
  const iftor = shiftTime(IFTOR_BASE[dayIndex], offset);

  return {
    saharlik,
    iftor,
    prayers: {
      fajr: saharlik,
      dhuhr: shiftTime('12:35', offset),
      asr: shiftTime('16:30', offset),
      maghrib: iftor,
      isha: shiftTime(iftor, 85),
    },
  };
}

function getHijriFallback(date) {
  try {
    return new Intl.DateTimeFormat('uz-UZ-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

function getStatusLabel(status) {
  if (status === 'today') return 'Bugun';
  if (status === 'past') return "O'tdi";
  return 'Kutilmoqda';
}

function getMonthRequests(startDate, dayCount = DAY_COUNT) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + dayCount - 1);

  const result = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= endCursor) {
    result.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

function getNextPrayerInfo(prayerTimes, nowDate = new Date()) {
  if (!prayerTimes) return null;

  const nowMinutes = (nowDate.getHours() * 60) + nowDate.getMinutes();
  const ordered = PRAYER_ITEMS
    .map((item) => ({
      ...item,
      time: prayerTimes[item.id],
      minutes: toMinutes(prayerTimes[item.id]),
    }))
    .filter((item) => item.minutes !== null);

  if (ordered.length === 0) return null;

  const next = ordered.find((item) => item.minutes > nowMinutes);
  if (next) {
    return {
      ...next,
      inMinutes: next.minutes - nowMinutes,
      tomorrow: false,
    };
  }

  const first = ordered[0];
  return {
    ...first,
    inMinutes: (24 * 60) - nowMinutes + first.minutes,
    tomorrow: true,
  };
}

function formatMinutesLeft(totalMinutes) {
  const safe = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours === 0) return `${minutes} daqiqa`;
  if (minutes === 0) return `${hours} soat`;
  return `${hours} soat ${minutes} daqiqa`;
}

export default function Calendar() {
  const { user, updateUser } = useAuth();
  const {
    day: ramadanDay,
    started,
    ended,
    daysLeft,
    startDate: ramadanStartISO,
  } = getRamadanDay();

  const ramadanStartDate = useMemo(() => {
    const base = ramadanStartISO ? new Date(ramadanStartISO) : new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, [ramadanStartISO]);

  const ramadanEndDate = useMemo(() => {
    const end = new Date(ramadanStartDate);
    end.setDate(ramadanStartDate.getDate() + DAY_COUNT - 1);
    return end;
  }, [ramadanStartDate]);

  const safeCurrentDay = started ? Math.min(Math.max(ramadanDay, 1), DAY_COUNT) : 1;
  const [selectedDay, setSelectedDay] = useState(safeCurrentDay);
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Toshkent');
  const [cityApiTimings, setCityApiTimings] = useState({});
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [timingsError, setTimingsError] = useState('');
  const [liveNow, setLiveNow] = useState(Date.now());
  const [prayerHint, setPrayerHint] = useState(null);
  const [dayFilter, setDayFilter] = useState('all');
  const [prayerCheckMode, setPrayerCheckMode] = useState('on_time');
  const [activeDetailTab, setActiveDetailTab] = useState('prayer');
  const [activeDetailAccordion, setActiveDetailAccordion] = useState('prayer');

  const dailyGoal = user?.dailyGoal || 3;
  const completedDays = user?.completedDays;
  const questBonusDates = user?.dailyQuestBonusDates;
  const prayerLog = user?.prayerLog;
  const prayerMode = user?.prayerMode || 'standard';
  const prayerDebt = useMemo(() => ensurePrayerDebt(user?.prayerDebt), [user?.prayerDebt]);
  const prayerDebtTotal = useMemo(() => getPrayerDebtTotal(prayerDebt), [prayerDebt]);

  const cityOptions = useMemo(() => {
    const options = [...CITIES];
    if (selectedCity && !options.includes(selectedCity)) {
      options.unshift(selectedCity);
    }
    return [...new Set(options)];
  }, [selectedCity]);

  useEffect(() => {
    const timer = setInterval(() => setLiveNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedDay((prev) => {
      if (prev < 1 || prev > DAY_COUNT) return safeCurrentDay;
      return prev;
    });
  }, [safeCurrentDay]);

  useEffect(() => {
    let cancelled = false;

    async function loadCityTimings() {
      setTimingsLoading(true);
      setTimingsError('');
      try {
        const apiCity = CITY_API_ALIAS[selectedCity] || selectedCity;
        const monthRequests = getMonthRequests(ramadanStartDate, DAY_COUNT);
        const nextMap = {};

        for (const req of monthRequests) {
          const url = `https://api.aladhan.com/v1/calendarByCity/${req.year}/${req.month}?city=${encodeURIComponent(apiCity)}&country=Uzbekistan&method=2`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const payload = await response.json();
          if (payload?.code !== 200 || !Array.isArray(payload?.data)) {
            throw new Error('Invalid payload');
          }

          payload.data.forEach((entry) => {
            const gDate = entry?.date?.gregorian?.date;
            if (!gDate) return;
            const [dd, mm, yyyy] = gDate.split('-');
            if (!dd || !mm || !yyyy) return;
            const key = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;

            const fajr = parseTime(entry?.timings?.Fajr);
            const dhuhr = parseTime(entry?.timings?.Dhuhr);
            const asr = parseTime(entry?.timings?.Asr);
            const maghrib = parseTime(entry?.timings?.Maghrib);
            const isha = parseTime(entry?.timings?.Isha);
            if (!fajr || !maghrib) return;

            const keyDate = new Date(`${key}T00:00:00`);
            if (Number.isNaN(keyDate.getTime())) return;
            if (keyDate < ramadanStartDate || keyDate > ramadanEndDate) return;

            const hijri = entry?.date?.hijri;
            const hijriMonth = hijri?.month?.en || '';
            nextMap[key] = {
              saharlik: `${pad2(fajr.h)}:${pad2(fajr.m)}`,
              iftor: `${pad2(maghrib.h)}:${pad2(maghrib.m)}`,
              prayers: {
                fajr: `${pad2(fajr.h)}:${pad2(fajr.m)}`,
                dhuhr: dhuhr ? `${pad2(dhuhr.h)}:${pad2(dhuhr.m)}` : '',
                asr: asr ? `${pad2(asr.h)}:${pad2(asr.m)}` : '',
                maghrib: `${pad2(maghrib.h)}:${pad2(maghrib.m)}`,
                isha: isha ? `${pad2(isha.h)}:${pad2(isha.m)}` : '',
              },
              hijriLabel: hijri
                ? `${hijri.day} ${hijriMonth} ${hijri.year} AH`
                : '',
            };
          });
        }

        if (!cancelled) {
          setCityApiTimings(nextMap);
          setTimingsLoading(false);
          if (Object.keys(nextMap).length === 0) setTimingsError("Shahar bo'yicha vaqt topilmadi.");
        }
      } catch {
        if (!cancelled) {
          setCityApiTimings({});
          setTimingsLoading(false);
          setTimingsError('API ulanmagan, offline vaqtlar ishlatilmoqda.');
        }
      }
    }

    loadCityTimings();
    return () => {
      cancelled = true;
    };
  }, [ramadanEndDate, ramadanStartDate, selectedCity]);

  const days = useMemo(() => {
    const safeCompletedDays = completedDays && typeof completedDays === 'object' ? completedDays : {};
    const safeQuestBonusDates = questBonusDates && typeof questBonusDates === 'object' ? questBonusDates : {};
    const safePrayerLog = prayerLog && typeof prayerLog === 'object' ? prayerLog : {};

    return Array.from({ length: DAY_COUNT }, (_, idx) => {
      const day = idx + 1;
      const date = buildDayDate(ramadanStartDate, day);
      const dateKey = toDateKey(date);
      const doneIds = Array.isArray(safeCompletedDays[dateKey]) ? safeCompletedDays[dateKey] : [];
      const fallbackTimes = getFallbackTimes(selectedCity, idx);
      const apiTimes = cityApiTimings[dateKey];
      const prayerRecord = ensurePrayerRecord(safePrayerLog[dateKey]);
      const prayerCounts = getPrayerCounts(prayerRecord);

      const taskXP = doneIds.reduce((sum, challengeId) => (
        sum + (PRESET_BY_ID[challengeId]?.xpPerTask || 20)
      ), 0);

      const quest = getDailyQuest(date);
      const questProgress = getQuestProgress(quest, doneIds);
      const questClaimed = safeQuestBonusDates[dateKey] === quest.id;
      const questXP = questClaimed ? (quest.bonusXP || 0) : 0;

      let status = 'future';
      if (started && day < safeCurrentDay) status = 'past';
      if (started && day === safeCurrentDay) status = 'today';

      const prayerScorePercent = Math.round((prayerCounts.score / PRAYER_MAX_SCORE) * 100);
      const prayerTimes = apiTimes?.prayers || fallbackTimes.prayers;

      return {
        day,
        dateKey,
        dateLabel: DATE_FORMATTER.format(date),
        weekdayLabel: WEEKDAY_FORMATTER.format(date),
        hijriLabel: apiTimes?.hijriLabel || getHijriFallback(date),
        saharlik: apiTimes?.saharlik || fallbackTimes.saharlik,
        iftor: apiTimes?.iftor || fallbackTimes.iftor,
        prayerTimes,
        timingSource: apiTimes ? 'api' : 'fallback',
        status,
        doneIds,
        doneTitles: doneIds.map((id) => PRESET_BY_ID[id]?.title || id),
        taskCount: doneIds.length,
        prayerRecord,
        prayerTrackedCount: prayerCounts.tracked,
        prayerPositiveCount: prayerCounts.positive,
        prayerQazaCount: prayerCounts.qaza,
        prayerMissedCount: prayerCounts.missed,
        prayerScore: prayerCounts.score,
        prayerXP: prayerCounts.xp,
        prayerScorePercent,
        prayerTone: getPrayerToneLabel(prayerScorePercent),
        goalHit: doneIds.length >= dailyGoal,
        prayerStrong: prayerScorePercent >= 70 && prayerCounts.tracked >= 4,
        prayerRisk: prayerCounts.missed > 0 || prayerCounts.qaza >= 2,
        taskXP,
        quest,
        questProgress,
        questClaimed,
        questXP,
        totalXP: taskXP + questXP + prayerCounts.xp,
        intensity: Math.min(4, doneIds.length),
      };
    });
  }, [cityApiTimings, completedDays, dailyGoal, prayerLog, questBonusDates, ramadanStartDate, safeCurrentDay, selectedCity, started]);

  const selected = days.find((item) => item.day === selectedDay) || days[0];
  const prayerStatusOptions = useMemo(() => getStatusOptionsByMode(prayerMode), [prayerMode]);

  const dayMatchesFilter = (dayItem, filterId) => {
    if (!dayItem) return false;
    if (filterId === 'task') return dayItem.taskCount > 0;
    if (filterId === 'goal') return dayItem.goalHit;
    if (filterId === 'prayer_strong') return dayItem.prayerStrong;
    if (filterId === 'prayer_risk') return dayItem.prayerRisk;
    return true;
  };

  const filterCounts = useMemo(
    () => ({
      all: days.length,
      task: days.filter((item) => dayMatchesFilter(item, 'task')).length,
      goal: days.filter((item) => dayMatchesFilter(item, 'goal')).length,
      prayer_strong: days.filter((item) => dayMatchesFilter(item, 'prayer_strong')).length,
      prayer_risk: days.filter((item) => dayMatchesFilter(item, 'prayer_risk')).length,
    }),
    [days],
  );

  const summary = useMemo(() => {
    const completedDayCount = days.filter((item) => item.taskCount > 0).length;
    const totalTasks = days.reduce((sum, item) => sum + item.taskCount, 0);
    const totalXP = days.reduce((sum, item) => sum + item.totalXP, 0);
    const taskXP = days.reduce((sum, item) => sum + item.taskXP, 0);
    const prayerXP = days.reduce((sum, item) => sum + item.prayerXP, 0);
    const goalHitDays = days.filter((item) => item.taskCount >= dailyGoal).length;
    const prayerTrackedTotal = days.reduce((sum, item) => sum + item.prayerTrackedCount, 0);
    const prayerPositiveTotal = days.reduce((sum, item) => sum + item.prayerPositiveCount, 0);
    const prayerQazaTotal = days.reduce((sum, item) => sum + item.prayerQazaCount, 0);
    const prayerMissedTotal = days.reduce((sum, item) => sum + item.prayerMissedCount, 0);
    const prayerScoreTotal = days.reduce((sum, item) => sum + item.prayerScore, 0);
    const prayerPerfectDays = days.filter((item) => item.prayerPositiveCount === PRAYER_ITEMS.length).length;

    let bestTaskStreak = 0;
    let currentTaskStreak = 0;
    days.forEach((item) => {
      if (item.taskCount > 0) {
        currentTaskStreak += 1;
        bestTaskStreak = Math.max(bestTaskStreak, currentTaskStreak);
      } else {
        currentTaskStreak = 0;
      }
    });

    const activeWindowDays = started ? (ended ? DAY_COUNT : safeCurrentDay) : (ended ? DAY_COUNT : 0);
    const prayerExpectedTotal = activeWindowDays * PRAYER_ITEMS.length;
    const prayerExpectedScore = activeWindowDays * PRAYER_MAX_SCORE;

    return {
      completedDayCount,
      totalTasks,
      totalXP,
      taskXP,
      prayerXP,
      bestTaskStreak,
      goalHitDays,
      prayerTrackedTotal,
      prayerPositiveTotal,
      prayerQazaTotal,
      prayerMissedTotal,
      prayerExpectedTotal,
      prayerExpectedScore,
      prayerScoreTotal,
      prayerPerfectDays,
    };
  }, [dailyGoal, days, ended, safeCurrentDay, started]);

  const prayerStreak = useMemo(
    () => computePrayerStreak(days, 70),
    [days],
  );

  const weeklyPrayer = useMemo(
    () => getPrayerWeeklyReport(days, selected?.dateKey || toDateKey()),
    [days, selected?.dateKey],
  );

  const prayerInsight = useMemo(
    () => getSmartPrayerInsight(days, selected?.dateKey || toDateKey()),
    [days, selected?.dateKey],
  );

  const calendarCells = useMemo(() => {
    const lead = toMondayIndex(ramadanStartDate.getDay());
    const list = [...Array.from({ length: lead }, () => null), ...days];
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [days, ramadanStartDate]);

  const maxTaskCount = Math.max(1, ...days.map((item) => item.taskCount));
  const ramadanStartLabel = DATE_FORMATTER.format(ramadanStartDate);
  const ramadanEndLabel = DATE_FORMATTER.format(ramadanEndDate);
  const ramadanPhaseLabel = started
    ? `${safeCurrentDay}-kun faol`
    : ended
      ? `Keyingi Ramazongacha ${daysLeft} kun`
      : `Ramazongacha ${daysLeft} kun`;

  const sourceLabel = timingsLoading
    ? 'Vaqtlar yuklanmoqda...'
    : timingsError
      ? timingsError
      : "Shahar bo'yicha real vaqtlar ishlatilmoqda.";

  const prayerDisciplinePercent = summary.prayerExpectedScore > 0
    ? Math.round((summary.prayerScoreTotal / summary.prayerExpectedScore) * 100)
    : 0;

  const selectedPrayerQuestPercent = Math.round((selected.prayerScore / PRAYER_MAX_SCORE) * 100);
  const selectedPrayerTone = getPrayerToneLabel(selectedPrayerQuestPercent);
  const nextPrayer = selected?.status === 'today'
    ? getNextPrayerInfo(selected.prayerTimes, new Date(liveNow))
    : null;

  const pushHint = (text, tone = 'neutral') => {
    const id = `${Date.now()}_${Math.random()}`;
    setPrayerHint({ id, text, tone });
    setTimeout(() => {
      setPrayerHint((prev) => (prev?.id === id ? null : prev));
    }, 2400);
  };

  const commitPrayerMutation = ({ dayItem, nextRecord, nextDebt, statusXpDelta, debtResolved }) => {
    const safePrayerLog = prayerLog && typeof prayerLog === 'object' ? prayerLog : {};
    const nextPrayerLog = { ...safePrayerLog };
    const hasAnyValue = PRAYER_ITEMS.some((item) => Boolean(nextRecord[item.id]));

    if (hasAnyValue) nextPrayerLog[dayItem.dateKey] = nextRecord;
    else delete nextPrayerLog[dayItem.dateKey];

    const resolvedBonus = Math.max(0, debtResolved) * QAZO_RESOLVE_XP;
    const totalXpDelta = statusXpDelta + resolvedBonus;

    const updates = {
      prayerLog: nextPrayerLog,
      prayerDebt: nextDebt,
    };

    if (totalXpDelta !== 0) {
      updates.xp = Math.max(0, (user?.xp || 0) + totalXpDelta);
    }

    updateUser(updates);

    if (totalXpDelta > 0) pushHint(`+${totalXpDelta} XP`, 'positive');
    if (totalXpDelta < 0) pushHint(`${totalXpDelta} XP`, 'negative');
    if (debtResolved > 0 && totalXpDelta <= 0) pushHint(`Qazo -${debtResolved}`, 'positive');
  };

  const updatePrayerStatus = (dayItem, prayerId, nextStatus) => {
    if (!dayItem || dayItem.status === 'future') return;

    const safePrayerLog = prayerLog && typeof prayerLog === 'object' ? prayerLog : {};
    const safeDebt = ensurePrayerDebt(user?.prayerDebt);
    const currentDayRecord = ensurePrayerRecord(safePrayerLog[dayItem.dateKey]);

    const prevStatus = currentDayRecord[prayerId];
    const normalizedStatus = nextStatus && prevStatus === nextStatus
      ? null
      : (nextStatus || null);

    if (prevStatus === normalizedStatus) return;

    const nextDayRecord = {
      ...currentDayRecord,
      [prayerId]: normalizedStatus,
      updatedAt: new Date().toISOString(),
    };

    const currentDebtValue = safeDebt[prayerId] || 0;
    const debtDelta = getPrayerDebtDelta(prevStatus, normalizedStatus);
    const nextDebtValue = Math.max(0, currentDebtValue + debtDelta);

    const nextDebt = {
      ...safeDebt,
      [prayerId]: nextDebtValue,
      updatedAt: new Date().toISOString(),
    };

    commitPrayerMutation({
      dayItem,
      nextRecord: nextDayRecord,
      nextDebt,
      statusXpDelta: getPrayerStatusXPDelta(prevStatus, normalizedStatus),
      debtResolved: Math.max(0, currentDebtValue - nextDebtValue),
    });
  };

  const applyPrayerQuickAction = (dayItem, action) => {
    if (!dayItem || dayItem.status === 'future') return;

    const safePrayerLog = prayerLog && typeof prayerLog === 'object' ? prayerLog : {};
    const safeDebt = ensurePrayerDebt(user?.prayerDebt);
    const currentDayRecord = ensurePrayerRecord(safePrayerLog[dayItem.dateKey]);
    const nextDayRecord = { ...currentDayRecord };
    const nextDebt = { ...safeDebt };

    let statusXpDelta = 0;
    let resolvedDebt = 0;
    let hasChange = false;

    PRAYER_ITEMS.forEach((prayer) => {
      const prevStatus = currentDayRecord[prayer.id];
      const nextStatus = action.status;
      if (prevStatus === nextStatus) return;

      hasChange = true;
      nextDayRecord[prayer.id] = nextStatus;
      statusXpDelta += getPrayerStatusXPDelta(prevStatus, nextStatus);

      const beforeDebt = nextDebt[prayer.id] || 0;
      const debtDelta = getPrayerDebtDelta(prevStatus, nextStatus);
      const afterDebt = Math.max(0, beforeDebt + debtDelta);
      nextDebt[prayer.id] = afterDebt;
      resolvedDebt += Math.max(0, beforeDebt - afterDebt);
    });

    if (!hasChange) return;

    nextDayRecord.updatedAt = new Date().toISOString();
    nextDebt.updatedAt = new Date().toISOString();

    commitPrayerMutation({
      dayItem,
      nextRecord: nextDayRecord,
      nextDebt,
      statusXpDelta,
      debtResolved: resolvedDebt,
    });

    pushHint(action.status ? `${action.label} belgilandi` : 'Kun holati tozalandi');
  };

  const adjustPrayerDebt = (prayerId, delta) => {
    const safeDebt = ensurePrayerDebt(user?.prayerDebt);
    const current = safeDebt[prayerId] || 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;

    const nextDebt = {
      ...safeDebt,
      [prayerId]: next,
      updatedAt: new Date().toISOString(),
    };

    const updates = { prayerDebt: nextDebt };
    const reducedBy = Math.max(0, current - next);
    const debtResolveXP = reducedBy * QAZO_RESOLVE_XP;

    if (debtResolveXP > 0) {
      updates.xp = Math.max(0, (user?.xp || 0) + debtResolveXP);
      pushHint(`Qazo yopildi: +${debtResolveXP} XP`, 'positive');
    } else {
      pushHint('Qazo daftari yangilandi');
    }

    updateUser(updates);
  };

  const handleCityChange = (nextCity) => {
    setSelectedCity(nextCity);
    if (nextCity !== user?.city) {
      updateUser({ city: nextCity });
    }
  };

  const togglePrayerMode = () => {
    const next = prayerMode === 'masjid' ? 'standard' : 'masjid';
    updateUser({ prayerMode: next });
    pushHint(next === 'masjid' ? 'Masjid mode yoqildi' : 'Standard mode yoqildi');
  };

  const toggleDetailAccordion = (panelId) => {
    setActiveDetailAccordion((prev) => (prev === panelId ? null : panelId));
  };

  const jumpToNextFilteredDay = () => {
    if (dayFilter === 'all') return;
    const ordered = [...days].sort((a, b) => a.day - b.day);
    const ahead = ordered.find((item) => item.day > selectedDay && dayMatchesFilter(item, dayFilter));
    const fallback = ordered.find((item) => dayMatchesFilter(item, dayFilter));
    const target = ahead || fallback;
    if (target) setSelectedDay(target.day);
  };

  return (
    <div className="page-wrapper cal-page">
      <section className="cal-hero card fade-in-up">
        <div className="cal-hero-main">
          <span className="ui-kicker"><IconCalendar size={14} /> Ramazon Taqvimi</span>
          <h1>30 kunlik ibodat ritmini aniq kuzating</h1>
          <p>
            Har kunning saharlik-iftor vaqti, amallar, namoz holati, haftalik hisobot va
            qazo daftari bitta joyda.
          </p>
          <div className="cal-hero-badges">
            <span className="badge badge-gold">Boshlanish: {ramadanStartLabel}</span>
            <span className="badge badge-gold">Yakun: {ramadanEndLabel}</span>
            <span className="badge badge-accent">{selectedCity}</span>
            <span className="badge badge-success">{ramadanPhaseLabel}</span>
            <span className="badge badge-accent">Hozir: {TIME_FORMATTER.format(new Date(liveNow))}</span>
            <span className={`badge ${prayerMode === 'masjid' ? 'badge-success' : 'badge-gold'}`}>
              {prayerMode === 'masjid' ? 'Masjid mode' : 'Standard mode'}
            </span>
          </div>
        </div>

        <div className="cal-stat-grid">
          <article className="cal-stat card">
            <span>Faol kunlar</span>
            <strong>{summary.completedDayCount}/{DAY_COUNT}</strong>
          </article>
          <article className="cal-stat card">
            <span>Jami amallar</span>
            <strong>{summary.totalTasks} ta</strong>
          </article>
          <article className="cal-stat card">
            <span>Taqvim XP</span>
            <strong>{summary.totalXP} XP</strong>
          </article>
          <article className="cal-stat card">
            <span>Namoz streak</span>
            <strong>{prayerStreak.current} kun</strong>
          </article>
          <article className="cal-stat card">
            <span>Namoz intizomi</span>
            <strong>{prayerDisciplinePercent}%</strong>
          </article>
          <article className="cal-stat card">
            <span>Qazo qarzi</span>
            <strong>{prayerDebtTotal} ta</strong>
          </article>
        </div>
      </section>

      <section className="cal-main-grid">
        <article className="cal-month card">
          <header className="cal-month-head">
            <div>
              <h2>Ramazon Taqvimi: {ramadanStartLabel} - {ramadanEndLabel}</h2>
              <p>Kun ustiga bosib to'liq tafsilotni ko'ring</p>
            </div>
            <div className="cal-month-controls">
              <label className="cal-city-control">
                <span>Shahar</span>
                <select
                  className="input-field"
                  value={selectedCity}
                  onChange={(event) => handleCityChange(event.target.value)}
                >
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
              <button
                className={`btn btn-outline cal-mode-btn ${prayerMode === 'masjid' ? 'active' : ''}`}
                onClick={togglePrayerMode}
              >
                <IconMosque size={14} />
                {prayerMode === 'masjid' ? 'Masjid mode ON' : 'Masjid mode'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedDay(safeCurrentDay)}
                disabled={!started}
              >
                Bugunga qaytish
              </button>
            </div>
          </header>

          <div className="cal-source-note">{sourceLabel}</div>

          <div className="cal-month-toolbar">
            <div className="cal-filter-pills">
              {DAY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`cal-filter-pill ${dayFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setDayFilter(filter.id)}
                >
                  {filter.label}
                  <small>{filterCounts[filter.id] || 0}</small>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline cal-jump-btn"
              onClick={jumpToNextFilteredDay}
              disabled={dayFilter === 'all' || (filterCounts[dayFilter] || 0) === 0}
            >
              Keyingisi
            </button>
          </div>

          <div className="cal-week-head">
            {WEEKDAY_MON_FIRST.map((dayName) => (
              <span key={dayName}>{dayName}</span>
            ))}
          </div>

          <div className="cal-grid">
            {calendarCells.map((item, idx) => {
              if (!item) return <span key={`empty_${idx}`} className="cal-cell-empty" />;

              const selectedCls = selected.day === item.day ? 'selected' : '';
              const intensityCls = `intensity-${item.intensity}`;
              const mutedCls = dayFilter !== 'all' && !dayMatchesFilter(item, dayFilter) ? 'muted' : '';
              return (
                <button
                  key={item.day}
                  type="button"
                  className={`cal-cell ${item.status} ${selectedCls} ${intensityCls} ${mutedCls}`}
                  onClick={() => setSelectedDay(item.day)}
                >
                  <span className="cal-cell-day">{item.day}</span>
                  <span className="cal-cell-date">{item.dateLabel}</span>
                  <span className="cal-cell-meta">
                    <span className="cal-cell-dot" />
                    <small>{item.taskCount}</small>
                  </span>
                  <span className="cal-cell-badges">
                    {item.goalHit && <em className="goal">G</em>}
                    {item.prayerStrong && <em className="good">N+</em>}
                    {item.prayerRisk && <em className="risk">!</em>}
                  </span>
                  <small className="cal-cell-prayer">N:{item.prayerPositiveCount}/{PRAYER_ITEMS.length}</small>
                </button>
              );
            })}
          </div>

          <footer className="cal-legend">
            <span><em className="tone done" /> Bajarilgan kun</span>
            <span><em className="tone today" /> Bugun</span>
            <span><em className="tone future" /> Kelasi kun</span>
            <span><em className="tone goal" /> Maqsad bajarilgan ({dailyGoal}+)</span>
          </footer>
        </article>

        <aside className="cal-detail card">
          <header className="cal-detail-head">
            <span className={`badge ${selected.status === 'today' ? 'badge-gold' : 'badge-accent'}`}>
              {getStatusLabel(selected.status)}
            </span>
            <h2>{selected.day}-kun tafsiloti</h2>
            <p>{selected.weekdayLabel}, {selected.dateLabel}</p>
            <small className="cal-hijri-line">{selected.hijriLabel}</small>
            <small className="cal-detail-source">
              {selected.timingSource === 'api'
                ? "Vaqt manbasi: shahar API"
                : 'Vaqt manbasi: offline hisob-kitob'}
            </small>
          </header>

          <div className="cal-time-box">
            <div className="cal-time-row">
              <span><IconSunrise size={14} /> Saharlik</span>
              <strong>{selected.saharlik}</strong>
            </div>
            <div className="cal-time-row">
              <span><IconSunset size={14} /> Iftor</span>
              <strong>{selected.iftor}</strong>
            </div>
            {nextPrayer && (
              <div className="cal-next-prayer">
                <span><IconBell size={13} /> Keyingi namoz: {nextPrayer.label} ({nextPrayer.time})</span>
                <strong>{formatMinutesLeft(nextPrayer.inMinutes)}</strong>
              </div>
            )}
          </div>

          <div className="cal-kpi-row">
            <article className="cal-kpi">
              <span><IconBolt size={13} /> XP</span>
              <strong>{selected.totalXP}</strong>
            </article>
            <article className="cal-kpi">
              <span><IconTarget size={13} /> Vazifa</span>
              <strong>{selected.taskCount}</strong>
            </article>
            <article className="cal-kpi">
              <span><IconFire size={13} /> Namoz XP</span>
              <strong>{selected.prayerXP}/{PRAYER_MAX_XP}</strong>
            </article>
          </div>

          <div className="cal-detail-tabs" role="tablist" aria-label="Tafsilot bo'limlari">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeDetailTab === tab.id}
                className={`cal-detail-tab ${activeDetailTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveDetailTab(tab.id);
                  setActiveDetailAccordion(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cal-detail-panels">
            <section
              className={`cal-detail-panel ${activeDetailTab === 'prayer' ? 'active' : ''} ${activeDetailAccordion === 'prayer' ? 'open' : ''}`}
            >
              <button
                type="button"
                className="cal-panel-toggle"
                onClick={() => toggleDetailAccordion('prayer')}
                aria-expanded={activeDetailAccordion === 'prayer'}
              >
                <span>Namoz boshqaruvi</span>
                <small>{selectedPrayerTone}</small>
              </button>

              <div className="cal-panel-body cal-panel-body-prayer">
                <div className={`cal-prayers ${prayerMode === 'masjid' ? 'masjid' : ''}`}>
                  <div className="cal-prayers-head">
                    <h3>Namoz Daily Deeds</h3>
                    <span>{selectedPrayerTone}</span>
                  </div>
                  <p className="cal-prayers-meta">
                    Holatni tanlang: Vaqtida, Jamoat, Qazo yoki O'qilmadi. Qazo yopilganda bonus XP qo'shiladi.
                  </p>
                  <div className="cal-prayer-quick">
                    {QUICK_PRAYER_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className={`btn btn-outline btn-sm ${action.id === 'all_jamaat' ? 'is-primary' : ''}`}
                        onClick={() => applyPrayerQuickAction(selected, action)}
                        disabled={selected.status === 'future'}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                  <div className="cal-prayer-quest">
                    <div className="cal-prayer-quest-head">
                      <strong>Kundalik namoz quest</strong>
                      <span>{selected.prayerScore}/{PRAYER_MAX_SCORE}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${selectedPrayerQuestPercent}%` }} />
                    </div>
                    <small>
                      Ijobiy: {selected.prayerPositiveCount}/{PRAYER_ITEMS.length} |
                      Qazo: {selected.prayerQazaCount} |
                      O'qilmadi: {selected.prayerMissedCount}
                    </small>
                  </div>
                  {prayerHint && (
                    <div className={`cal-prayer-hint ${prayerHint.tone}`}>
                      {prayerHint.text}
                    </div>
                  )}
                  <div className="cal-check-mode">
                    {prayerStatusOptions.map((option) => {
                      const StatusIcon = STATUS_ICON_BY_ID[option.id] || IconCheckCircle;
                      return (
                        <button
                          key={`mode_${option.id}`}
                          type="button"
                          className={`cal-check-mode-btn ${option.tone} ${prayerCheckMode === option.id ? 'active' : ''}`}
                          onClick={() => setPrayerCheckMode(option.id)}
                          title={option.label}
                        >
                          <span className="cal-check-mode-icon">
                            <StatusIcon size={12} />
                          </span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="cal-deeds-list">
                    {PRAYER_ITEMS.map((prayer, index) => {
                      const currentStatus = selected.prayerRecord[prayer.id];
                      const currentMeta = PRAYER_STATUS_MAP[currentStatus];
                      const activeTone = currentMeta?.tone || 'idle';
                      const CurrentIcon = STATUS_ICON_BY_ID[currentStatus];
                      const ApplyIcon = STATUS_ICON_BY_ID[prayerCheckMode] || IconCheckCircle;

                      return (
                        <article key={prayer.id} className={`cal-deed-item ${currentStatus ? `checked tone-${activeTone}` : ''}`}>
                          <div className="cal-deed-main">
                            <span className="cal-deed-index">{index + 1}</span>
                            <div>
                              <strong className="cal-deed-title">{prayer.label}</strong>
                              <small className="cal-deed-status">
                                {CurrentIcon && (
                                  <span className={`cal-deed-status-icon ${activeTone}`}>
                                    <CurrentIcon size={11} />
                                  </span>
                                )}
                                {currentMeta?.label || 'Belgilanmagan'}
                              </small>
                            </div>
                          </div>
                          <div className="cal-deed-actions">
                            <button
                              type="button"
                              className={`cal-deed-check ${currentStatus ? 'checked' : ''} tone-${PRAYER_STATUS_MAP[prayerCheckMode]?.tone || 'good'}`}
                              onClick={() => updatePrayerStatus(selected, prayer.id, prayerCheckMode)}
                              disabled={selected.status === 'future'}
                              title={`${PRAYER_STATUS_MAP[prayerCheckMode]?.label || 'Holat'} bilan belgilash`}
                            >
                              {currentStatus ? '✓' : <ApplyIcon size={12} />}
                            </button>
                            <button
                              type="button"
                              className="cal-deed-clear"
                              onClick={() => updatePrayerStatus(selected, prayer.id, '')}
                              disabled={selected.status === 'future' || !currentStatus}
                              title="Tozalash"
                            >
                              ↺
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div className="cal-prayer-summary">
                    <small>Ijobiy: {selected.prayerPositiveCount}</small>
                    <small>Qazo: {selected.prayerQazaCount}</small>
                    <small>O'qilmadi: {selected.prayerMissedCount}</small>
                    <small>Qayd: {selected.prayerTrackedCount}/{PRAYER_ITEMS.length}</small>
                  </div>
                  {selected.status === 'future' && (
                    <p className="cal-prayer-disabled">Kelasi kunlar uchun belgilash o'chirilgan.</p>
                  )}
                </div>

                <div className="cal-debt">
                  <div className="cal-debt-head">
                    <h3>Qazo daftari</h3>
                    <span>{prayerDebtTotal} ta qarz</span>
                  </div>
                  <p>Qazo qarzini kamaytirganingizda har bir namoz uchun +{QAZO_RESOLVE_XP} XP.</p>
                  <div className="cal-debt-grid">
                    {PRAYER_ITEMS.map((prayer) => (
                      <div key={`debt_${prayer.id}`} className="cal-debt-row">
                        <span>{prayer.label}</span>
                        <div className="cal-debt-controls">
                          <button type="button" onClick={() => adjustPrayerDebt(prayer.id, -1)}>-</button>
                          <strong>{prayerDebt[prayer.id] || 0}</strong>
                          <button type="button" onClick={() => adjustPrayerDebt(prayer.id, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`cal-detail-panel ${activeDetailTab === 'insight' ? 'active' : ''} ${activeDetailAccordion === 'insight' ? 'open' : ''}`}
            >
              <button
                type="button"
                className="cal-panel-toggle"
                onClick={() => toggleDetailAccordion('insight')}
                aria-expanded={activeDetailAccordion === 'insight'}
              >
                <span>Hisobot va eslatma</span>
                <small>{weeklyPrayer.disciplinePercent}%</small>
              </button>

              <div className="cal-panel-body cal-panel-body-insight">
                <div className="cal-reminder">
                  <div className="cal-reminder-head">
                    <h3><IconBell size={13} /> Aqlli eslatma</h3>
                    {prayerInsight.severity === 'high' && <span className="warn">Yuqori</span>}
                    {prayerInsight.severity === 'medium' && <span className="medium">O'rta</span>}
                    {prayerInsight.severity === 'low' && <span className="ok">Yaxshi</span>}
                  </div>
                  <p className="title">{prayerInsight.title}</p>
                  <p>{prayerInsight.note}</p>
                  {prayerInsight.action && <small>{prayerInsight.action}</small>}
                </div>

                <div className="cal-weekly">
                  <div className="cal-weekly-head">
                    <h3>Haftalik namoz hisobot</h3>
                    <span>{weeklyPrayer.disciplinePercent}%</span>
                  </div>
                  <div className="cal-weekly-grid">
                    <small>Kunlar: {weeklyPrayer.totalDays}</small>
                    <small>Perfect: {weeklyPrayer.perfectDays}</small>
                    <small>Ijobiy: {weeklyPrayer.positiveTotal}</small>
                    <small>Qazo: {weeklyPrayer.qazaTotal}</small>
                    <small>O'qilmadi: {weeklyPrayer.missedTotal}</small>
                    <small>Qayd: {weeklyPrayer.trackedTotal}</small>
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`cal-detail-panel ${activeDetailTab === 'tasks' ? 'active' : ''} ${activeDetailAccordion === 'tasks' ? 'open' : ''}`}
            >
              <button
                type="button"
                className="cal-panel-toggle"
                onClick={() => toggleDetailAccordion('tasks')}
                aria-expanded={activeDetailAccordion === 'tasks'}
              >
                <span>Quest va amallar</span>
                <small>{selected.taskCount} ta</small>
              </button>

              <div className="cal-panel-body cal-panel-body-tasks">
                <div className="cal-quest">
                  <div className="cal-quest-head">
                    <h3>Kunlik quest</h3>
                    <span>{selected.questProgress.done}/{selected.questProgress.total}</span>
                  </div>
                  <p>{selected.quest.title}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, (selected.questProgress.done / selected.questProgress.total) * 100)}%` }}
                    />
                  </div>
                  <small>
                    {selected.questClaimed
                      ? `Quest bonusi olingan (+${selected.questXP} XP)`
                      : `Bonus: +${selected.quest.bonusXP} XP`}
                  </small>
                </div>

                <div className="cal-task-list">
                  <h3>Bajarilgan amallar</h3>
                  {selected.doneTitles.length ? (
                    <ul>
                      {selected.doneTitles.map((title, idx) => (
                        <li key={`${selected.day}_task_${idx}`}>
                          <IconCheckCircle size={14} />
                          <span>{title}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cal-task-empty">Bu kun uchun hali amallar qayd etilmagan.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </aside>
      </section>

      <section className="cal-activity card">
        <div className="cal-section-head">
          <h2><IconBarChart size={16} /> 30 kunlik faollik paneli</h2>
          <p>
            Maqsad urilgan kunlar: {summary.goalHitDays} |
            Namoz streak: {prayerStreak.current} (best {prayerStreak.best})
          </p>
        </div>

        <div className="cal-activity-grid">
          <div className="cal-bars-block">
            <div className="cal-bars-head">
              <strong>Topshiriqlar</strong>
              <small>kunlik amal soni</small>
            </div>
            <div className="cal-bars">
              {days.map((item) => {
                const height = item.taskCount > 0
                  ? Math.max(10, Math.round((item.taskCount / maxTaskCount) * 86))
                  : 5;
                return (
                  <button
                    key={`bar_tasks_${item.day}`}
                    type="button"
                    className={`cal-bar-col ${selected.day === item.day ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    <span className={`cal-bar ${item.taskCount > 0 ? 'active' : ''}`} style={{ height: `${height}px` }} />
                    <small>{item.day}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cal-bars-block">
            <div className="cal-bars-head">
              <strong>Namoz Daily Deeds</strong>
              <small>kunlik intizom skori</small>
            </div>
            <div className="cal-bars prayer">
              {days.map((item) => {
                const height = item.prayerScore > 0
                  ? Math.max(10, Math.round((item.prayerScore / PRAYER_MAX_SCORE) * 86))
                  : 5;
                return (
                  <button
                    key={`bar_prayer_${item.day}`}
                    type="button"
                    className={`cal-bar-col ${selected.day === item.day ? 'selected' : ''}`}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    <span className={`cal-bar ${item.prayerScore > 0 ? 'active' : ''}`} style={{ height: `${height}px` }} />
                    <small>{item.day}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="cal-footer-stats">
          <span>Task XP: {summary.taskXP}</span>
          <span>Namoz XP: {summary.prayerXP}</span>
          <span>Perfect namoz kunlari: {summary.prayerPerfectDays}</span>
          <span>Qazo + o'tkazib yuborilgan: {summary.prayerQazaTotal + summary.prayerMissedTotal}</span>
        </div>
      </section>

      {prayerInsight.severity === 'high' && (
        <section className="cal-alert card fade-in-up">
          <IconWarning size={18} />
          <div>
            <strong>Bugungi fokus: {prayerInsight.prayerLabel}</strong>
            <p>{prayerInsight.note}</p>
          </div>
        </section>
      )}
    </div>
  );
}
