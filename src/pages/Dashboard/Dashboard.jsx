import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import HeartWidget from '../../components/Heart/HeartWidget';
import XPBar from '../../components/XPBar/XPBar';
import Confetti from '../../components/Confetti/Confetti';
import WeeklyChart from '../../components/WeeklyChart/WeeklyChart';
import { getRamadanDay, getLevelInfo } from '../../utils/helpers';
import { getDailyAyah, getDailyHadith } from '../../utils/dailyContent';
import { getDailyQuote } from '../../utils/quotes';
import { PRESET_CHALLENGES } from '../../utils/constants';
import { getDailyQuest, getQuestProgress } from '../../utils/dailyQuests';
import {
  computePrayerStreak,
  ensurePrayerDebt,
  ensurePrayerRecord,
  getPrayerCounts,
  getPrayerDebtTotal,
  PRAYER_MAX_SCORE,
  toDateKey,
} from '../../utils/prayerSystem';
import {
  ACHIEVEMENTS,
  COMBO_WINDOW_MS,
  calcFinalXP,
  getComboBonus,
  getComboLabel,
  getComebackBonus,
  getJumaBonus,
  getRamadanSeasonBonus,
  getRamadanTimeBonus,
  getStreakMultiplier,
  getStreakMultiplierLabel,
  getWeeklyFirstBonus,
  rollBaraka,
} from '../../utils/xpSystem';
import { LEVELS } from '../../utils/constants';
import LevelUpModal from '../../components/LevelUpModal/LevelUpModal';
import AchievementToast from '../../components/AchievementToast/AchievementToast';
import { playComplete, playUndo, playLevelUp } from '../../utils/sound';
import {
  IconFire, IconBolt, IconCheckCircle,
  IconBarChart, IconWarning, IconTarget, IconEdit,
  IconChallenge, IconTasbeh,
} from '../../components/Icons/RamadanIcons';
import './Dashboard.css';

const UNDO_DURATION = 8000;
const XP_FLOAT_DURATION = 1200;
const QARSHI_CITY = 'Qarshi';
const PRAYER_API_METHOD = 2;
const QARSHI_FALLBACK_TIMES = {
  fajr: '05:08',
  dhuhr: '12:34',
  asr: '16:07',
  maghrib: '18:47',
  isha: '20:02',
};
const PRESET_BY_ID = Object.fromEntries(PRESET_CHALLENGES.map((item) => [item.id, item]));

function parsePrayerClock(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function GoalRing({ pct, done, goal }) {
  const size = 80;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const isDone = pct >= 100;

  return (
    <div className="goal-ring-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="goal-ring-svg"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <defs>
          <linearGradient id="goal-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-light)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDone ? 'var(--success)' : 'url(#goal-ring-grad)'}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="goal-ring-center">
        <span className="goal-ring-num">{done}</span>
        <span className="goal-ring-sep">/{goal}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { day, started, daysLeft } = getRamadanDay();
  const [animating, setAnimating] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [undoItem, setUndoItem] = useState(null);
  const [undoProgress, setUndoProgress] = useState(100);
  const [goalInput, setGoalInput] = useState(false);
  const [goalVal, setGoalVal] = useState(user?.dailyGoal || 3);
  const [xpBursts, setXpBursts] = useState([]);
  const [comboHint, setComboHint] = useState(null);
  const [dismissedLevelKey, setDismissedLevelKey] = useState(null);
  const [dismissedAchKey, setDismissedAchKey] = useState(null);
  const [qarshiPrayerTimes, setQarshiPrayerTimes] = useState(() => ({
    ...QARSHI_FALLBACK_TIMES,
    source: 'fallback',
    dateLabel: new Date().toLocaleDateString('uz-UZ'),
  }));
  const [qarshiPrayerLoading, setQarshiPrayerLoading] = useState(true);
  const [qarshiPrayerError, setQarshiPrayerError] = useState('');
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const burstIdRef = useRef(0);

  const activeChallenges = user?.activeChallenges || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayDone = user?.completedDays?.[today] || [];
  const dailyGoal = user?.dailyGoal || 3;
  const goalPct = Math.min((todayDone.length / dailyGoal) * 100, 100);
  const quote = getDailyQuote();
  const dailyAyah = getDailyAyah();
  const dailyHadith = getDailyHadith();
  const dailyQuest = getDailyQuest();
  const dailyQuestProgress = getQuestProgress(dailyQuest, todayDone);
  const questBonusClaimedToday = user?.dailyQuestBonusDates?.[today] === dailyQuest?.id;
  const prayerLog = useMemo(() => {
    if (user?.prayerLog && typeof user.prayerLog === 'object') return user.prayerLog;
    return {};
  }, [user?.prayerLog]);
  const prayerDebt = ensurePrayerDebt(user?.prayerDebt);
  const prayerDebtTotal = getPrayerDebtTotal(prayerDebt);
  const todayPrayerKey = toDateKey();
  const todayPrayerRecord = ensurePrayerRecord(prayerLog[todayPrayerKey]);
  const todayPrayerCounts = getPrayerCounts(todayPrayerRecord);
  const todayPrayerPercent = Math.round((todayPrayerCounts.score / PRAYER_MAX_SCORE) * 100);

  const prayerStreak = useMemo(() => {
    const rows = Object.entries(prayerLog).map(([dateKey, rawRecord]) => {
      const rec = ensurePrayerRecord(rawRecord);
      const counts = getPrayerCounts(rec);
      return {
        dateKey,
        status: dateKey === todayPrayerKey ? 'today' : 'past',
        prayerScorePercent: Math.round((counts.score / PRAYER_MAX_SCORE) * 100),
        prayerTrackedCount: counts.tracked,
      };
    });

    if (!rows.some((item) => item.dateKey === todayPrayerKey)) {
      rows.push({
        dateKey: todayPrayerKey,
        status: 'today',
        prayerScorePercent: todayPrayerPercent,
        prayerTrackedCount: todayPrayerCounts.tracked,
      });
    }

    return computePrayerStreak(rows, 70);
  }, [prayerLog, todayPrayerCounts.tracked, todayPrayerKey, todayPrayerPercent]);
  const currentStreakLabel = getStreakMultiplierLabel(user?.streak || 0);
  const currentTimeBonus = getRamadanTimeBonus();
  const currentSeasonBonus = getRamadanSeasonBonus();
  const currentJumaBonus = getJumaBonus();
  const comboActive = user?.comboCount || 1;
  const levelInfo = getLevelInfo(user?.xp || 0).current;

  const clearUndo = () => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setUndoItem(null);
    setUndoProgress(100);
  };

  const spawnXpBurst = (event, amount, label = 'XP', type = 'xp') => {
    const target = event?.currentTarget;
    if (!target) return;

    burstIdRef.current += 1;
    const rect = target.getBoundingClientRect();
    const burst = {
      id: `xp_${burstIdRef.current}`,
      amount,
      label,
      type,
      x: rect.left + (rect.width / 2),
      y: rect.top + 10,
    };

    setXpBursts((prev) => [...prev, burst]);
    setTimeout(() => {
      setXpBursts((prev) => prev.filter((item) => item.id !== burst.id));
    }, XP_FLOAT_DURATION);
  };

  const completeTask = (challengeId, event) => {
    if (todayDone.includes(challengeId)) return;

    const challenge = activeChallenges.find((item) => item.id === challengeId) || PRESET_BY_ID[challengeId];
    const baseXP = Number(challenge?.xpPerTask) || 20;

    // ── Streak
    const projectedStreak = todayDone.length === 0 ? (user?.streak || 0) + 1 : (user?.streak || 0);
    const streakMult = getStreakMultiplier(projectedStreak);
    const streakLabel = getStreakMultiplierLabel(projectedStreak);

    // ── Time of day
    const timeBonus = getRamadanTimeBonus();

    // ── Season (Ramadan phase + Qadr nights)
    const seasonBonus = getRamadanSeasonBonus();

    // ── Juma (Friday)
    const jumaBonus = getJumaBonus();

    // ── Combo
    const nowTs = new Date().getTime();
    const prevTaskAt = user?.lastTaskAt || 0;
    const comboCount = prevTaskAt && nowTs - prevTaskAt <= COMBO_WINDOW_MS
      ? Math.min((user?.comboCount || 1) + 1, 4)
      : 1;
    const comboBonus = getComboBonus(comboCount, baseXP);
    const comboLabel = getComboLabel(comboCount);

    // ── Core XP (streak × time × season × juma + combo)
    const taskXP = calcFinalXP(baseXP, streakMult, timeBonus.mult, comboBonus, seasonBonus.mult, jumaBonus.mult);

    // ── Weekly first-task ×2 bonus
    const weeklyBonus = getWeeklyFirstBonus(prevTaskAt);
    const weeklyBonusXP = weeklyBonus.active ? taskXP : 0; // full copy = ×2 total

    // ── Comeback / Tawba bonus (+50% flat)
    const comebackCheck = getComebackBonus(prevTaskAt);
    const comebackBonusXP = comebackCheck.active ? Math.round(taskXP * 0.5) : 0;

    // ── Baraka (10% random crit, +50% of base)
    const barakaXP = rollBaraka(baseXP);

    const newTodayDone = [...todayDone, challengeId];
    const newCompleted = {
      ...(user?.completedDays || {}),
      [today]: newTodayDone,
    };

    // ── Daily quest
    const questAfterProgress = getQuestProgress(dailyQuest, newTodayDone);
    const alreadyClaimedQuest = user?.dailyQuestBonusDates?.[today] === dailyQuest?.id;
    const questBonusXP = dailyQuest && questAfterProgress.complete && !alreadyClaimedQuest
      ? dailyQuest.bonusXP
      : 0;
    const newQuestBonusDates = questBonusXP > 0
      ? { ...(user?.dailyQuestBonusDates || {}), [today]: dailyQuest.id }
      : (user?.dailyQuestBonusDates || {});

    // ── Perfect day bonus (+50 XP flat when daily goal just met)
    const goalJustDone = newTodayDone.length >= dailyGoal && todayDone.length < dailyGoal;
    const perfectDayXP = goalJustDone ? 50 : 0;

    const totalXpAdded = taskXP + weeklyBonusXP + comebackBonusXP + barakaXP + questBonusXP + perfectDayXP;
    const newXP = (user?.xp || 0) + totalXpAdded;

    const oldLevel = getLevelInfo(user?.xp || 0).current.level;
    const newLevel = getLevelInfo(newXP).current.level;
    const isLevelUp = newLevel > oldLevel;

    updateUser({
      xp: newXP,
      completedDays: newCompleted,
      comboCount,
      lastTaskAt: nowTs,
      dailyQuestBonusDates: newQuestBonusDates,
      _taskCompleted: true,
      _lastCompletedId: challengeId,
      _timeBonusId: timeBonus.id,
      _goalJustDone: goalJustDone,
      _seasonId: seasonBonus.id,
      _jumaId: jumaBonus.id,
      _comebackDays: comebackCheck.days,
      _weeklyFirst: weeklyBonus.active,
    });

    setAnimating(true);
    setTimeout(() => setAnimating(false), 700);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2500);

    if (user?.soundEnabled !== false) {
      isLevelUp ? playLevelUp() : playComplete();
    }

    if (comboLabel) {
      setComboHint(comboLabel);
      setTimeout(() => setComboHint(null), 2600);
    }

    spawnXpBurst(event, totalXpAdded, 'XP');
    if (questBonusXP > 0) spawnXpBurst(event, questBonusXP, 'QUEST', 'quest');
    if (barakaXP > 0)     spawnXpBurst(event, barakaXP, 'BARAKA', 'baraka');
    if (perfectDayXP > 0) spawnXpBurst(event, perfectDayXP, 'MUKAMMAL', 'perfect');

    clearUndo();
    setUndoItem({
      challengeId,
      title: challenge?.title || '',
      xpAdded: totalXpAdded,
      baseXP,
      streakLabel,
      timeLabel: timeBonus.label,
      seasonLabel: seasonBonus.label,
      jumaLabel: jumaBonus.label,
      weeklyBonusXP,
      comebackBonusXP,
      barakaXP,
      perfectDayXP,
      comboLabel,
      questBonusXP,
      questIdAwarded: questBonusXP > 0 ? dailyQuest?.id : null,
    });

    setUndoProgress(100);
    const tickStep = (100 * 50) / UNDO_DURATION;
    let prog = 100;
    progressRef.current = setInterval(() => {
      prog = Math.max(0, prog - tickStep);
      setUndoProgress(prog);
    }, 50);
    timerRef.current = setTimeout(clearUndo, UNDO_DURATION);
  };

  const undoTask = () => {
    if (!undoItem) return;

    const nextQuestBonusDates = { ...(user?.dailyQuestBonusDates || {}) };
    if (undoItem.questIdAwarded && nextQuestBonusDates[today] === undoItem.questIdAwarded) {
      delete nextQuestBonusDates[today];
    }

    const newCompleted = {
      ...(user?.completedDays || {}),
      [today]: todayDone.filter((id) => id !== undoItem.challengeId),
    };

    updateUser({
      xp: Math.max(0, (user?.xp || 0) - undoItem.xpAdded),
      completedDays: newCompleted,
      dailyQuestBonusDates: nextQuestBonusDates,
      comboCount: Math.max(1, (user?.comboCount || 1) - 1),
      lastTaskAt: user?.lastTaskAt || 0,
    });

    if (user?.soundEnabled !== false) playUndo();
    clearUndo();
  };

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearInterval(progressRef.current);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadQarshiPrayerTimes = async () => {
      setQarshiPrayerLoading(true);
      try {
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(QARSHI_CITY)}&country=Uzbekistan&method=${PRAYER_API_METHOD}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('http_error');
        const payload = await response.json();
        const data = payload?.data;

        const nextTimes = {
          fajr: parsePrayerClock(data?.timings?.Fajr),
          dhuhr: parsePrayerClock(data?.timings?.Dhuhr),
          asr: parsePrayerClock(data?.timings?.Asr),
          maghrib: parsePrayerClock(data?.timings?.Maghrib),
          isha: parsePrayerClock(data?.timings?.Isha),
        };

        const hasAllTimes = Object.values(nextTimes).every(Boolean);
        if (!hasAllTimes) throw new Error('parse_error');

        if (!cancelled) {
          setQarshiPrayerTimes({
            ...nextTimes,
            source: 'api',
            dateLabel: data?.date?.gregorian?.date || new Date().toLocaleDateString('uz-UZ'),
          });
          setQarshiPrayerError('');
        }
      } catch {
        if (!cancelled) {
          setQarshiPrayerTimes((prev) => ({
            ...QARSHI_FALLBACK_TIMES,
            source: 'fallback',
            dateLabel: prev?.dateLabel || new Date().toLocaleDateString('uz-UZ'),
          }));
          setQarshiPrayerError("Qarshi namoz vaqtlarida fallback jadval ishlatildi.");
        }
      } finally {
        if (!cancelled) setQarshiPrayerLoading(false);
      }
    };

    loadQarshiPrayerTimes();

    return () => {
      cancelled = true;
    };
  }, []);

  const levelEventKey = user?._levelUp
    ? `${user._levelUp.from}-${user._levelUp.to}`
    : null;

  let levelUpData = null;
  if (user?._levelUp && levelEventKey && dismissedLevelKey !== levelEventKey) {
    const levelDef = LEVELS.find((item) => item.level === user._levelUp.to);
    levelUpData = {
      from: user._levelUp.from,
      to: user._levelUp.to,
      toName: levelDef?.name || '',
      toIcon: levelDef?.icon || '*',
    };
  }

  const achEventKey = user?._newAchievements?.length
    ? user._newAchievements.join(',')
    : null;

  let achievementToShow = null;
  if (achEventKey && dismissedAchKey !== achEventKey) {
    const firstId = user?._newAchievements?.[0];
    achievementToShow = ACHIEVEMENTS.find((item) => item.id === firstId) || null;
  }

  const closeLevelUp = () => {
    if (levelEventKey) setDismissedLevelKey(levelEventKey);
    updateUser({ _clearTransient: true });
  };

  const dismissAch = () => {
    if (achEventKey) setDismissedAchKey(achEventKey);
    updateUser({ _clearTransient: true });
  };

  const showDecayWarning = todayDone.length === 0 && new Date().getHours() >= 20;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Xayrli tun';
    if (h < 12) return 'Xayrli tong';
    if (h < 17) return 'Xayrli kun';
    return 'Xayrli kech';
  };

  const saveGoal = () => {
    updateUser({ dailyGoal: Number(goalVal) });
    setGoalInput(false);
  };

  const userFirstName = user?.name?.split(' ')[0] || "Do'st";
  const todayRemaining = Math.max(0, dailyGoal - todayDone.length);
  const questStatusLabel = questBonusClaimedToday
    ? "Quest bonusi olindi"
    : dailyQuestProgress.complete
      ? "Quest tayyor"
      : `Quest ${dailyQuestProgress.done}/${dailyQuestProgress.total}`;
  const prayerToneLabel = todayPrayerPercent >= 70 ? 'Barqaror' : 'Diqqat kerak';
  const qarshiPrayerStatus = qarshiPrayerLoading
    ? 'Yangilanmoqda...'
    : qarshiPrayerTimes.source === 'api'
      ? 'Qarshi (API)'
      : 'Qarshi (Fallback)';

  return (
    <div className="page-wrapper dashboard">
      <Confetti active={confetti} />
      <LevelUpModal levelUp={levelUpData} onClose={closeLevelUp} />
      <AchievementToast achievement={achievementToShow} onDismiss={dismissAch} />

      <div className="xp-burst-layer" aria-hidden="true">
        {xpBursts.map((burst) => (
          <span
            key={burst.id}
            className={`xp-burst-item ${burst.type !== 'xp' ? burst.type : ''}`}
            style={{ left: burst.x, top: burst.y }}
          >
            +{burst.amount} {burst.label}
          </span>
        ))}
      </div>

      {showDecayWarning && (
        <div className="decay-warning fade-in">
          <IconWarning size={20} />
          Bugun hali birorta topshiriq bajarilmadi - qalb nuri kamayishi mumkin.
        </div>
      )}

      <div className="dash-greeting fade-in-up">
        <div className="dash-greeting-main">
          <h1>
            {greeting()}, {userFirstName}
          </h1>
          {started ? (
            <p className="ramadan-day">
              Ramazon <strong>{day}-kun</strong>
            </p>
          ) : (
            <p className="ramadan-countdown">
              Ramazonga <strong>{daysLeft}</strong> kun qoldi
            </p>
          )}
          <div className="dash-greeting-meta">
            <span className="badge badge-gold">Daraja: {levelInfo.level} - {levelInfo.name}</span>
            <span className="badge badge-accent">Maqsad: {todayDone.length}/{dailyGoal}</span>
            <span className={`badge ${todayPrayerPercent >= 70 ? 'badge-success' : 'badge-gold'}`}>
              Namoz: {todayPrayerPercent}% ({prayerToneLabel})
            </span>
            <span className="badge badge-gold">{questStatusLabel}</span>
          </div>
        </div>
        <div className="daily-quote-chip">
          <span className="dq-text">"{quote.text}"</span>
          <span className="dq-source">- {quote.source}</span>
        </div>
      </div>

      <div className="dash-main-row">
        <div className="dash-heart-card card fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="heart-title">Qalb nuri</h3>
          <HeartWidget percent={user?.heartPercent || 0} animating={animating} />
          <p className="heart-desc">Har kuni ibodatlaringiz bilan qalbingizni yoriting</p>
        </div>

        <div className="dash-right-col">
          <div className="dash-xp card fade-in-up" style={{ animationDelay: '0.2s' }}>
            <XPBar xp={user?.xp || 0} streak={user?.streak || 0} />
          </div>

          <div className="dash-goal-stats-row fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="daily-goal card">
              <div className="goal-header">
                <span className="goal-title">
                  <IconTarget size={16} />
                  Kunlik maqsad
                </span>
                <button
                  className="btn btn-ghost goal-edit"
                  onClick={() => setGoalInput((g) => !g)}
                  title="Maqsadni tahrirlash"
                >
                  <IconEdit size={15} />
                </button>
              </div>

              <div className="goal-body">
                <GoalRing pct={goalPct} done={todayDone.length} goal={dailyGoal} />
                <div className="goal-text-col">
                  <span className="goal-pct">{Math.round(goalPct)}% bajarildi</span>
                  {goalPct >= 100 ? (
                    <span className="goal-done-text">Maqsad bajarildi</span>
                  ) : (
                    <span className="goal-hint">
                      Yana {todayRemaining} ta topshiriq qoldi
                    </span>
                  )}
                </div>
              </div>

              {goalInput && (
                <div className="goal-input-row fade-in">
                  <input
                    className="input-field goal-input"
                    type="number"
                    min="1"
                    max="20"
                    value={goalVal}
                    onChange={(e) => setGoalVal(e.target.value)}
                  />
                  <button className="btn btn-primary goal-save" onClick={saveGoal}>
                    Saqlash
                  </button>
                </div>
              )}
            </div>

            <div className="dash-stats">
              <div className="stat-item card">
                <div className="stat-icon-wrap">
                  <IconFire size={20} />
                </div>
                <div className="stat-text">
                  <span className="stat-value">{user?.streak || 0}</span>
                  <span className="stat-label">Streak</span>
                </div>
                {(user?.streakFreezes || 0) > 0 && (
                  <span className="freeze-badge">Freeze {user.streakFreezes}</span>
                )}
              </div>
              <div className="stat-item card">
                <div className="stat-icon-wrap">
                  <IconBolt size={20} />
                </div>
                <div className="stat-text">
                  <span className="stat-value">{activeChallenges.length}</span>
                  <span className="stat-label">Faol</span>
                </div>
              </div>
              <div className="stat-item card">
                <div className="stat-icon-wrap">
                  <IconCheckCircle size={20} />
                </div>
                <div className="stat-text">
                  <span className="stat-value">{todayDone.length}</span>
                  <span className="stat-label">Bugun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-boost-grid fade-in-up" style={{ animationDelay: '0.38s' }}>
        <div className="dash-boosts card">
          <div className="boost-title">XP boosterlar</div>
          <div className="boost-chips">
            <span className="boost-chip">🔥 Streak: {currentStreakLabel || '×1.0'}</span>
            <span className={`boost-chip ${currentTimeBonus.mult > 1 ? 'active' : ''}`}>
              {currentTimeBonus.icon || '🕐'} {currentTimeBonus.label || 'Oddiy vaqt'}: ×{currentTimeBonus.mult}
            </span>
            {currentSeasonBonus.mult > 1 && (
              <span className="boost-chip season">
                {currentSeasonBonus.icon} {currentSeasonBonus.label}: ×{currentSeasonBonus.mult}
              </span>
            )}
            {currentJumaBonus.mult > 1 && (
              <span className="boost-chip juma">
                {currentJumaBonus.icon} {currentJumaBonus.label}: ×{currentJumaBonus.mult}
              </span>
            )}
            <span className={`boost-chip ${comboActive >= 2 ? 'active' : ''}`}>
              ⚡ Kombo: ×{comboActive}
            </span>
          </div>
          {comboHint && <div className="boost-note">{comboHint} faollashdi!</div>}
        </div>

        <div className={`dash-quest card ${questBonusClaimedToday ? 'done' : ''}`}>
          <div className="quest-top">
            <div>
              <div className="quest-title">{dailyQuest?.icon || '*'} Kunlik quest</div>
              <div className="quest-name">{dailyQuest?.title}</div>
            </div>
            <span className="badge badge-gold">+{dailyQuest?.bonusXP || 0} XP</span>
          </div>
          <p className="quest-desc">{dailyQuest?.desc}</p>
          <div className="quest-progress-row">
            <div className="progress-bar quest-progress">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min((dailyQuestProgress.done / dailyQuestProgress.total) * 100, 100)}%` }}
              />
            </div>
            <span className="quest-progress-text">
              {dailyQuestProgress.done}/{dailyQuestProgress.total}
            </span>
          </div>
          <div className="quest-status">
            {questBonusClaimedToday
              ? 'Bugungi quest bonusi olindi'
              : dailyQuestProgress.complete
                ? "Quest bajarildi, keyingi topshiriqda bonus qo'shiladi"
                : 'Questni tugating va bonus XP oling'}
          </div>
        </div>

        <div className="dash-prayer-snapshot card">
          <div className="prayer-snap-top">
            <div className="prayer-snap-title">Namoz snapshot</div>
            <span className={`badge ${todayPrayerPercent >= 70 ? 'badge-success' : 'badge-gold'}`}>
              {todayPrayerPercent}%
            </span>
          </div>
          <div className="progress-bar prayer-snap-progress">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, todayPrayerPercent)}%` }} />
          </div>
          <div className="prayer-snap-grid">
            <small>Bugun: {todayPrayerCounts.tracked}/5</small>
            <small>Ijobiy: {todayPrayerCounts.positive}</small>
            <small>Streak: {prayerStreak.current} kun</small>
            <small>Qazo qarz: {prayerDebtTotal}</small>
          </div>
          <a href="/calendar" className="btn btn-outline prayer-snap-btn">
            Taqvimda ochish
          </a>
        </div>
      </div>

      <div className="dash-section fade-in-up" style={{ animationDelay: '0.39s' }}>
        <div className="section-title-row">
          <span className="section-icon"><IconCheckCircle size={20} /></span>
          Qarshi namoz vaqtlari
        </div>
        <div className="dash-prayer-times card">
          <div className="dash-prayer-times-top">
            <span className="badge badge-accent">{qarshiPrayerStatus}</span>
            <span className="badge badge-gold">{qarshiPrayerTimes.dateLabel}</span>
          </div>

          <div className="dash-prayer-times-grid">
            <div className="dash-prayer-time-item">
              <small>Bomdod</small>
              <strong>{qarshiPrayerTimes.fajr}</strong>
            </div>
            <div className="dash-prayer-time-item">
              <small>Peshin</small>
              <strong>{qarshiPrayerTimes.dhuhr}</strong>
            </div>
            <div className="dash-prayer-time-item">
              <small>Asr</small>
              <strong>{qarshiPrayerTimes.asr}</strong>
            </div>
            <div className="dash-prayer-time-item">
              <small>Shom</small>
              <strong>{qarshiPrayerTimes.maghrib}</strong>
            </div>
            <div className="dash-prayer-time-item">
              <small>Xufton</small>
              <strong>{qarshiPrayerTimes.isha}</strong>
            </div>
          </div>

          {qarshiPrayerError && (
            <p className="dash-prayer-times-note">{qarshiPrayerError}</p>
          )}
        </div>
      </div>

      {activeChallenges.length > 0 && (
        <div className="dash-section fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="section-title-row">
            <span className="section-icon"><IconChallenge size={20} /></span>
            Faol topshiriqlar
          </div>
          <div className="challenge-list">
            {activeChallenges.map((ch) => {
              const done = todayDone.includes(ch.id);
              const chStreak = ch.challengeStreak || 0;
              return (
                <div key={ch.id} className={`challenge-item card ${done ? 'done' : ''}`}>
                  <span className="ch-icon">{ch.icon}</span>
                  <div className="ch-info">
                    <div className="ch-title">{ch.title}</div>
                    <div className="ch-meta-row">
                      <span className="ch-freq">{ch.frequency}</span>
                      <span className="badge badge-gold">+{ch.xpPerTask || 20} XP</span>
                      {chStreak > 0 && (
                        <span className="ch-streak">
                          <IconFire size={12} /> {chStreak} kun
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`ch-btn ${done ? 'done' : 'btn btn-primary'}`}
                    onClick={(event) => completeTask(ch.id, event)}
                    disabled={done}
                  >
                    {done ? 'Bajarildi' : 'Bajarish'}
                  </button>
                  {done && undoItem?.challengeId === ch.id && (
                    <button className="ch-undo-inline btn btn-ghost" onClick={undoTask}>
                      Bekor
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeChallenges.length === 0 && (
        <div
          className="dash-section fade-in-up empty-challenges card"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="empty-icon"><IconChallenge size={30} /></span>
          <p>Hali faol topshiriqlar yo'q</p>
          <a href="/challenges" className="btn btn-outline" style={{ marginTop: 12 }}>
            Topshiriq boshlash
          </a>
        </div>
      )}

      <div className="dash-section fade-in-up" style={{ animationDelay: '0.45s' }}>
        <div className="section-title-row">
          <span className="section-icon"><IconBarChart size={20} /></span>
          Haftalik faollik
        </div>
        <div className="card">
          <WeeklyChart completedDays={user?.completedDays || {}} />
        </div>
      </div>

      <div className="dash-section fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="section-title-row">
          <span className="section-icon"><IconTasbeh size={20} /></span>
          Bugungi zikr
        </div>
        <div className="daily-cards">
          <div className="daily-card card">
            <div className="daily-card-label">Oyati Karim</div>
            {dailyAyah.arabic && <p className="arabic daily-arabic">{dailyAyah.arabic}</p>}
            <p className="daily-uzbek">{dailyAyah.uzbek}</p>
            <span className="badge badge-gold daily-ref">{dailyAyah.reference}</span>
          </div>
          <div className="daily-card card">
            <div className="daily-card-label">Hadisi Sharif</div>
            {dailyHadith.arabic && <p className="arabic daily-arabic">{dailyHadith.arabic}</p>}
            <p className="daily-uzbek">{dailyHadith.uzbek}</p>
            <span className="badge badge-accent daily-ref">{dailyHadith.source}</span>
          </div>
        </div>
      </div>

      {undoItem && (
        <div className="undo-toast fade-in">
          <div className="undo-toast-progress" style={{ width: `${undoProgress}%` }} />
          <div className="undo-toast-body">
            <span className="undo-toast-text">
              <strong>{undoItem.title}</strong> bajarildi
              <span className="undo-xp-badge">+{undoItem.xpAdded} XP</span>
            </span>
            <button className="undo-toast-btn" onClick={undoTask}>
              Bekor qilish
            </button>
          </div>
          <div className="undo-toast-meta">
            <span>Base +{undoItem.baseXP}</span>
            {undoItem.streakLabel && <span>Streak {undoItem.streakLabel}</span>}
            {undoItem.timeLabel && <span>{undoItem.timeLabel}</span>}
            {undoItem.seasonLabel && <span>{undoItem.seasonLabel}</span>}
            {undoItem.jumaLabel && <span>{undoItem.jumaLabel}</span>}
            {undoItem.comboLabel && <span>{undoItem.comboLabel}</span>}
            {undoItem.weeklyBonusXP > 0 && <span>⚡ Hafta ×2 +{undoItem.weeklyBonusXP}</span>}
            {undoItem.comebackBonusXP > 0 && <span>💚 Tawba +{undoItem.comebackBonusXP}</span>}
            {undoItem.barakaXP > 0 && <span>✨ Baraka +{undoItem.barakaXP}</span>}
            {undoItem.perfectDayXP > 0 && <span>🌟 Mukammal +{undoItem.perfectDayXP}</span>}
            {undoItem.questBonusXP > 0 && <span>Quest +{undoItem.questBonusXP}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
