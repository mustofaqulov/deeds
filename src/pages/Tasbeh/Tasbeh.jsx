import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { playComplete, playTasbeh, playUndo } from '../../utils/sound';
import {
  buildTasbehSeries,
  clampTasbehTarget,
  computeTasbehBestStreak,
  computeTasbehStreak,
  getLocalDateKey,
  getTasbehDefaultData,
  getTasbehTarget,
  getTasbehXpForSession,
  normalizeTasbehData,
  pruneTasbehHistory,
  TASBEH_MODES,
} from '../../utils/tasbehSystem';
import {
  IconBarChart,
  IconBolt,
  IconFire,
  IconRefresh,
  IconTasbeh,
  IconVolumeOff,
  IconVolumeOn,
  IconXP,
} from '../../components/Icons/RamadanIcons';
import './Tasbeh.css';

const DRAFT_PREFIX = 'ramadan_tasbeh_draft_';

function isTypingField(event) {
  const tag = event.target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
}

function formatDateTime(isoDate) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('uz-UZ')} ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function Tasbeh() {
  const { user, updateUser } = useAuth();

  const globalSoundEnabled = user?.soundEnabled !== false;
  const draftKey = useMemo(() => `${DRAFT_PREFIX}${user?.id || 'guest'}`, [user?.id]);
  const draftSnapshot = useMemo(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch (err) {
      void err;
      return {};
    }
  }, [draftKey]);

  const [stats, setStats] = useState(() => normalizeTasbehData({
    ...(user?.tasbehData || {}),
    activeMode: draftSnapshot.activeMode || user?.tasbehData?.activeMode,
    customTarget: draftSnapshot.customTarget ?? user?.tasbehData?.customTarget,
  }, globalSoundEnabled));
  const [count, setCount] = useState(() => Math.max(0, Math.floor(Number(draftSnapshot.count) || 0)));
  const [ringDone, setRingDone] = useState(false);
  const [statusText, setStatusText] = useState('Har bir bosishda zikr soni oshadi.');
  const [xpBursts, setXpBursts] = useState([]);
  const xpRef = useRef(Number(user?.xp) || 0);
  const burstRef = useRef(0);

  useEffect(() => {
    xpRef.current = Number(user?.xp) || 0;
  }, [user?.xp]);

  useEffect(() => {
    const payload = {
      count,
      activeMode: stats.activeMode,
      customTarget: stats.customTarget,
    };
    localStorage.setItem(draftKey, JSON.stringify(payload));
  }, [count, draftKey, stats.activeMode, stats.customTarget]);

  const persistStats = useCallback((nextStats, extraUpdates = {}) => {
    updateUser({ tasbehData: nextStats, ...extraUpdates });
  }, [updateUser]);

  const activeMode = useMemo(
    () => TASBEH_MODES.find((item) => item.key === stats.activeMode) || TASBEH_MODES[0],
    [stats.activeMode],
  );
  const target = useMemo(
    () => getTasbehTarget(stats.activeMode, stats.customTarget),
    [stats.activeMode, stats.customTarget],
  );

  const todayKey = getLocalDateKey();
  const todayEntry = stats.history[todayKey] || { count: 0, sessions: 0 };
  const streakDays = useMemo(() => computeTasbehStreak(stats.history), [stats.history]);
  const bestStreakDays = useMemo(() => computeTasbehBestStreak(stats.history), [stats.history]);
  const weeklySeries = useMemo(() => buildTasbehSeries(stats.history, 7), [stats.history]);
  const maxWeeklyCount = useMemo(
    () => Math.max(1, ...weeklySeries.map((item) => item.count)),
    [weeklySeries],
  );

  const projectedStreak = useMemo(() => {
    if (todayEntry.sessions > 0) return streakDays;
    const predictedHistory = {
      ...stats.history,
      [todayKey]: {
        count: todayEntry.count + target,
        sessions: todayEntry.sessions + 1,
      },
    };
    return computeTasbehStreak(predictedHistory);
  }, [stats.history, streakDays, target, todayEntry.count, todayEntry.sessions, todayKey]);

  const nextSessionXp = useMemo(
    () => getTasbehXpForSession(target, projectedStreak),
    [projectedStreak, target],
  );

  const effectiveCount = Math.min(count, Math.max(0, target - 1));
  const percent = Math.min(100, Math.round((effectiveCount / target) * 100));
  const remaining = Math.max(0, target - effectiveCount);
  const radius = 98;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  const lastReward = stats.lastReward && !stats.lastReward.reverted ? stats.lastReward : null;

  const spawnXpBurst = useCallback((xpAmount) => {
    burstRef.current += 1;
    const id = `xp_${Date.now()}_${burstRef.current}`;
    setXpBursts((prev) => [...prev, { id, xpAmount }]);
    window.setTimeout(() => {
      setXpBursts((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  }, []);

  const completeSession = useCallback(() => {
    const dayEntry = stats.history[todayKey] || { count: 0, sessions: 0 };
    const nextHistoryRaw = {
      ...stats.history,
      [todayKey]: {
        count: dayEntry.count + target,
        sessions: dayEntry.sessions + 1,
      },
    };
    const nextHistory = pruneTasbehHistory(nextHistoryRaw);
    const nextStreak = computeTasbehStreak(nextHistory);
    const xpGain = getTasbehXpForSession(target, nextStreak);
    const reward = {
      id: `reward_${Date.now()}`,
      xp: xpGain,
      target,
      modeKey: stats.activeMode,
      at: new Date().toISOString(),
      dayKey: todayKey,
      reverted: false,
      revertedAt: null,
    };

    const nextStats = normalizeTasbehData({
      ...stats,
      totalCount: stats.totalCount + target,
      totalSessions: stats.totalSessions + 1,
      history: nextHistory,
      lastReward: reward,
      rewardLog: [reward, ...stats.rewardLog].slice(0, 12),
    }, globalSoundEnabled);

    xpRef.current += xpGain;
    setStats(nextStats);
    setCount(0);
    setRingDone(true);
    setStatusText(`${target} zikr yakunlandi. +${xpGain} XP`);
    spawnXpBurst(xpGain);

    if (globalSoundEnabled && nextStats.soundEnabled) playComplete();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([32, 24, 32]);

    persistStats(nextStats, {
      xp: xpRef.current,
      _taskCompleted: true,
      _lastCompletedId: 'zikr',
    });

    window.setTimeout(() => setRingDone(false), 700);
  }, [
    globalSoundEnabled,
    persistStats,
    spawnXpBurst,
    stats,
    target,
    todayKey,
  ]);

  const handleTap = useCallback(() => {
    if (globalSoundEnabled && stats.soundEnabled) playTasbeh();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(18);

    const next = effectiveCount + 1;
    if (next >= target) {
      completeSession();
      return;
    }
    setCount(next);
  }, [completeSession, effectiveCount, globalSoundEnabled, stats.soundEnabled, target]);

  const handleDecrement = useCallback(() => {
    if (effectiveCount <= 0) return;
    setCount((prev) => Math.max(0, Math.min(prev, target - 1) - 1));
    setStatusText("Sanoq 1 taga kamaytirildi.");
  }, [effectiveCount, target]);

  const handleResetCount = useCallback(() => {
    setCount(0);
    setStatusText('Joriy sanash qayta boshlatildi.');
  }, []);

  const handleModeChange = useCallback((modeKey) => {
    const nextStats = normalizeTasbehData({
      ...stats,
      activeMode: modeKey,
    }, globalSoundEnabled);
    setStats(nextStats);
    setCount(0);
    setStatusText(`Rejim: ${TASBEH_MODES.find((item) => item.key === modeKey)?.label || modeKey}`);
    persistStats(nextStats);
  }, [globalSoundEnabled, persistStats, stats]);

  const handleCustomTargetChange = useCallback((event) => {
    const cleaned = event.target.value.replace(/[^\d]/g, '');
    const nextValue = clampTasbehTarget(cleaned || 0);
    const nextStats = normalizeTasbehData({
      ...stats,
      customTarget: nextValue,
    }, globalSoundEnabled);
    setStats(nextStats);
    setCount((prev) => Math.min(prev, Math.max(0, nextValue - 1)));
    setStatusText(`Custom maqsad: ${nextValue} ta`);
    persistStats(nextStats);
  }, [globalSoundEnabled, persistStats, stats]);

  const toggleSound = useCallback(() => {
    const nextStats = normalizeTasbehData({
      ...stats,
      soundEnabled: !stats.soundEnabled,
    }, globalSoundEnabled);
    setStats(nextStats);
    setStatusText(nextStats.soundEnabled ? 'Tasbeh ovozi yoqildi.' : "Tasbeh ovozi o'chirildi.");
    persistStats(nextStats);
  }, [globalSoundEnabled, persistStats, stats]);

  const undoLastReward = useCallback(() => {
    const reward = stats.lastReward;
    if (!reward || reward.reverted) return;

    const rewardDayKey = reward.dayKey || getLocalDateKey(new Date(reward.at));
    const dayEntry = stats.history[rewardDayKey] || { count: 0, sessions: 0 };
    const nextDayCount = Math.max(0, dayEntry.count - reward.target);
    const nextDaySessions = Math.max(0, dayEntry.sessions - 1);
    const nextHistory = { ...stats.history };

    if (nextDayCount <= 0 && nextDaySessions <= 0) delete nextHistory[rewardDayKey];
    else nextHistory[rewardDayKey] = { count: nextDayCount, sessions: nextDaySessions };

    const revertedReward = {
      ...reward,
      reverted: true,
      revertedAt: new Date().toISOString(),
    };

    const nextRewardLog = stats.rewardLog.map((item) => (
      item.id === reward.id ? revertedReward : item
    ));

    const nextStats = normalizeTasbehData({
      ...stats,
      totalCount: Math.max(0, stats.totalCount - reward.target),
      totalSessions: Math.max(0, stats.totalSessions - 1),
      history: pruneTasbehHistory(nextHistory),
      lastReward: revertedReward,
      rewardLog: nextRewardLog,
    }, globalSoundEnabled);

    xpRef.current = Math.max(0, xpRef.current - reward.xp);
    setStats(nextStats);
    setStatusText(`Oxirgi sessiya qaytarildi. -${reward.xp} XP`);
    if (globalSoundEnabled && stats.soundEnabled) playUndo();
    persistStats(nextStats, { xp: xpRef.current });
  }, [globalSoundEnabled, persistStats, stats]);

  const clearTasbehStats = useCallback(() => {
    const confirmed = window.confirm("Tasbeh statistikasi tozalanadimi?");
    if (!confirmed) return;

    const baseStats = getTasbehDefaultData(globalSoundEnabled);
    const nextStats = normalizeTasbehData({
      ...baseStats,
      activeMode: stats.activeMode,
      customTarget: stats.customTarget,
      soundEnabled: stats.soundEnabled,
    }, globalSoundEnabled);

    setStats(nextStats);
    setCount(0);
    setStatusText('Tasbeh statistikasi tozalandi.');
    persistStats(nextStats);
  }, [globalSoundEnabled, persistStats, stats.activeMode, stats.customTarget, stats.soundEnabled]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isTypingField(event)) return;

      if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        handleTap();
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        handleDecrement();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDecrement, handleTap]);

  return (
    <div className="page-wrapper tasbeh-page">
      <section className="tasbeh-hero card">
        <div className="tasbeh-hero-main">
          <div>
            <p className="ui-kicker"><IconTasbeh size={13} /> Zikr markazi</p>
            <h1 className="ui-title">Raqamli Tasbeh</h1>
            <p className="ui-subtle">Space/Enter bosib sanash mumkin. Backspace bilan 1 taga kamayadi.</p>
          </div>
          <div className="tasbeh-hero-badges">
            <span className="badge badge-gold"><IconFire size={11} /> Streak: {streakDays} kun</span>
            <span className="badge badge-accent"><IconXP size={11} /> Keyingi sessiya: +{nextSessionXp} XP</span>
          </div>
        </div>

        <div className="tasbeh-mode-tabs">
          {TASBEH_MODES.map((mode) => (
            <button
              key={mode.key}
              className={`tasbeh-mode-btn ${stats.activeMode === mode.key ? 'active' : ''}`}
              onClick={() => handleModeChange(mode.key)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {stats.activeMode === 'custom' && (
          <label className="tasbeh-custom-target">
            Custom maqsad:
            <input
              className="input-field"
              type="number"
              min={11}
              max={999}
              value={stats.customTarget}
              onChange={handleCustomTargetChange}
            />
          </label>
        )}
      </section>

      <section className="tasbeh-layout">
        <article className="tasbeh-counter-card card">
          <div className="tasbeh-zikr-head">
            <p className="tasbeh-zikr-label">Faol zikr</p>
            <h2>{activeMode.zikr}</h2>
            <p className="tasbeh-zikr-arabic">{activeMode.arabic}</p>
          </div>

          <button
            className={`tasbeh-ring-btn ${ringDone ? 'done' : ''}`}
            onClick={handleTap}
            aria-label="Tasbeh sonini oshirish"
          >
            <svg className="tasbeh-ring" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={radius} fill="none" stroke="var(--border)" strokeWidth="14" />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="url(#tasbehProgress)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 120 120)"
              />
              <defs>
                <linearGradient id="tasbehProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f1d777" />
                  <stop offset="100%" stopColor="#0d5b4a" />
                </linearGradient>
              </defs>
            </svg>

            <span className="tasbeh-ring-content">
              <strong className="tasbeh-count">{effectiveCount}</strong>
              <span className="tasbeh-target">/ {target}</span>
              <span className="tasbeh-remain">Qolgan: {remaining}</span>
              <span className="tasbeh-progress">{percent}%</span>
            </span>

            {xpBursts.map((burst) => (
              <span key={burst.id} className="tasbeh-xp-burst">+{burst.xpAmount} XP</span>
            ))}
          </button>

          <div className="tasbeh-actions">
            <button className="btn btn-outline" onClick={handleDecrement} disabled={effectiveCount <= 0}>-1</button>
            <button className="btn btn-outline" onClick={handleResetCount} disabled={effectiveCount <= 0}>
              <IconRefresh size={15} /> Qayta
            </button>
            <button
              className={`btn ${stats.soundEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={toggleSound}
            >
              {stats.soundEnabled ? <IconVolumeOn size={16} /> : <IconVolumeOff size={16} />}
              Ovoz
            </button>
          </div>

          <div className="tasbeh-status-row">
            <span className="badge badge-accent"><IconBolt size={11} /> Keyingisi +{nextSessionXp} XP</span>
            <p>{statusText}</p>
          </div>
        </article>

        <aside className="tasbeh-side-grid">
          <div className="tasbeh-stat-grid">
            <article className="tasbeh-stat card">
              <span>Bugungi zikr</span>
              <strong>{todayEntry.count}</strong>
              <small>{todayEntry.sessions} sessiya</small>
            </article>

            <article className="tasbeh-stat card">
              <span>Jami zikr</span>
              <strong>{stats.totalCount}</strong>
              <small>{stats.totalSessions} sessiya</small>
            </article>

            <article className="tasbeh-stat card">
              <span>Joriy streak</span>
              <strong>{streakDays}</strong>
              <small>kun</small>
            </article>

            <article className="tasbeh-stat card">
              <span>Eng yaxshi streak</span>
              <strong>{bestStreakDays}</strong>
              <small>kun</small>
            </article>
          </div>

          <article className="tasbeh-weekly card">
            <div className="tasbeh-card-head">
              <h3><IconBarChart size={14} /> 7 kunlik faoliyat</h3>
              <span>{weeklySeries.reduce((sum, item) => sum + item.sessions, 0)} sessiya</span>
            </div>
            <div className="tasbeh-week-bars">
              {weeklySeries.map((day) => {
                const barHeight = day.count > 0 ? Math.max(12, Math.round((day.count / maxWeeklyCount) * 78)) : 8;
                return (
                  <div key={day.key} className={`tasbeh-week-col ${day.isToday ? 'today' : ''}`}>
                    <span className="tasbeh-week-count">{day.sessions}</span>
                    <div className="tasbeh-week-bar-wrap">
                      <span className={`tasbeh-week-bar ${day.count > 0 ? 'active' : ''}`} style={{ height: `${barHeight}px` }} />
                    </div>
                    <small>{day.day}</small>
                    <em>{day.dateNumber}</em>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="tasbeh-reward card">
            <div className="tasbeh-card-head">
              <h3><IconXP size={14} /> XP nazorati</h3>
              <span>{stats.rewardLog.length} tranzaksiya</span>
            </div>

            <div className="tasbeh-reward-top">
              <p>
                Oxirgi sessiya:
                {' '}
                <strong>{lastReward ? `+${lastReward.xp} XP` : '-'}</strong>
              </p>
              <small>{lastReward ? formatDateTime(lastReward.at) : 'Hali sessiya yakunlanmagan'}</small>
            </div>

            <div className="tasbeh-reward-actions">
              <button className="btn btn-outline" onClick={undoLastReward} disabled={!lastReward}>
                Oxirgi XP ni qaytarish
              </button>
              <button className="btn btn-ghost" onClick={clearTasbehStats}>
                Statistika reset
              </button>
            </div>

            {stats.rewardLog.length > 0 && (
              <ul className="tasbeh-reward-log">
                {stats.rewardLog.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <span>{item.target}x</span>
                    <strong className={item.reverted ? 'negative' : 'positive'}>
                      {item.reverted ? `-${item.xp}` : `+${item.xp}`} XP
                    </strong>
                    <small>{formatDateTime(item.at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
