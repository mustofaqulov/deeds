/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { getLevelInfo } from '../utils/helpers';
import { checkAchievements, getAchievementXP } from '../utils/xpSystem';
import { normalizeTasbehData } from '../utils/tasbehSystem';
import {
  apiRegister, apiLogin, apiLogout,
  apiGetFullData, apiSyncProfile,
  apiCompleteDay, apiUndoDay,
  apiAddChallenge, apiDeleteChallengeByFid,
  apiSyncAchievements, apiSyncPrayerDay,
  setTokens, clearTokens, getToken,
} from '../lib/api';

const AuthContext = createContext();
const USER_SCHEMA_VERSION = 4;

const getDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const hasDoneInDay = (completedDays = {}, dayKey) => {
  const dayItems = completedDays?.[dayKey];
  return Array.isArray(dayItems) && dayItems.length > 0;
};

function calcStreakDetailed(completedDays = {}, streakFreezes = 0) {
  let streak = 0;
  let freezesLeft = Math.max(0, Number(streakFreezes) || 0);
  let freezesUsed = 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = getDateKey(cursor);

    if (hasDoneInDay(completedDays, key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (freezesLeft > 0) {
      freezesLeft -= 1;
      freezesUsed += 1;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return { streak, freezesLeft, freezesUsed };
}

function migrateUserSchema(user) {
  if (!user) return user;

  const migrated = { ...user };
  if (!migrated.schemaVersion || migrated.schemaVersion < USER_SCHEMA_VERSION) {
    migrated.watchedVideos = migrated.watchedVideos || {};
    migrated.watchedToday = migrated.watchedToday || {};
    migrated.videoNotes = migrated.videoNotes || {};
    migrated.videoProgress = migrated.videoProgress || {};
    migrated.prayerLog = migrated.prayerLog || {};
    migrated.prayerDebt = migrated.prayerDebt || {};
    migrated.prayerMode = migrated.prayerMode || 'standard';
    migrated.tasbehData = migrated.tasbehData || {};
  }
  migrated.schemaVersion = USER_SCHEMA_VERSION;
  return migrated;
}

function normalizeUserFields(user) {
  if (!user) return user;
  const next = migrateUserSchema(user);
  const globalSoundEnabled = next.soundEnabled !== false;
  const tasbehData = normalizeTasbehData(next.tasbehData, globalSoundEnabled);

  // completedDays'dan to'g'ridan-to'g'ri hisoblash (manba haqiqati)
  const completedDays = next.completedDays || {};
  const totalTasksCompleted = Object.values(completedDays).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0,
  );
  // heartPercent = har bir bajarilgan topshiriq uchun 3%, max 100%
  const heartPercent = Math.min(totalTasksCompleted * 3, 100);

  return {
    ...next,
    schemaVersion: USER_SCHEMA_VERSION,
    xp: next.xp || 0,
    heartPercent,
    activeChallenges: next.activeChallenges || [],
    completedDays,
    streak: next.streak || 0,
    longestStreak: next.longestStreak || 0,
    dailyGoal: next.dailyGoal || 3,
    soundEnabled: next.soundEnabled !== false,
    achievements: next.achievements || [],
    streakFreezes: next.streakFreezes || 0,
    totalTasksCompleted,
    dailyQuestBonusDates: next.dailyQuestBonusDates || {},
    comboCount: next.comboCount || 1,
    lastTaskAt: next.lastTaskAt || 0,
    watchedVideos: next.watchedVideos || {},
    watchedToday: next.watchedToday || {},
    videoNotes: next.videoNotes || {},
    videoProgress: next.videoProgress || {},
    prayerLog: next.prayerLog || {},
    prayerDebt: next.prayerDebt || {},
    prayerMode: next.prayerMode || 'standard',
    tasbehData,
  };
}

function stripTransientFields(user) {
  if (!user) return user;
  const clean = { ...user };
  delete clean._levelUp;
  delete clean._newAchievements;
  delete clean._freezeUsed;
  delete clean._freezeAwarded;
  delete clean._clearTransient;
  return clean;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ramadan_user');
    return saved ? normalizeUserFields(JSON.parse(saved)) : null;
  });

  const persist = (nextUser) => {
    const normalized = normalizeUserFields(nextUser);
    const storageUser = stripTransientFields(normalized);

    setUser(normalized);
    localStorage.setItem('ramadan_user', JSON.stringify(storageUser));

    const stored = JSON.parse(localStorage.getItem('ramadan_users') || '[]');
    const idx = stored.findIndex((item) => item.id === storageUser.id);
    if (idx !== -1) {
      stored[idx] = storageUser;
      localStorage.setItem('ramadan_users', JSON.stringify(stored));
    }
  };

  // Background refresh: app ochilganda (F5) token bo'lsa API dan yangi ma'lumot olish
  useEffect(() => {
    if (!user || !getToken()) return;

    apiGetFullData().then((fullData) => {
      if (!fullData?.profile) return;

      const completedDays = {};
      for (const day of (fullData.completed_days || [])) {
        completedDays[day.date] = day.challenge_ids ?? [];
      }

      const activeChallenges = (fullData.challenges || []).map((c) => ({
        id:        c.frontend_id || c.id,
        _apiId:    c.id,
        title:     c.title,
        category:  c.category,
        xpPerTask: c.base_xp,
        icon:      c.icon,
        frequency: 'Kunlik',
      }));

      const achievements = (fullData.achievements || []).map((a) => a.achievement_id);

      const prayerLog = {};
      for (const row of (fullData.prayer_log || [])) {
        prayerLog[row.date] = {
          fajr:    row.fajr    !== 'pending' ? row.fajr    : null,
          dhuhr:   row.dhuhr   !== 'pending' ? row.dhuhr   : null,
          asr:     row.asr     !== 'pending' ? row.asr     : null,
          maghrib: row.maghrib !== 'pending' ? row.maghrib : null,
          isha:    row.isha    !== 'pending' ? row.isha    : null,
        };
      }

      const todayKey = getDateKey();
      const streakInfo = calcStreakDetailed(completedDays, user.streakFreezes || 0);
      const todayDone = hasDoneInDay(completedDays, todayKey);
      const streak = todayDone ? streakInfo.streak + 1 : streakInfo.streak;

      persist({
        ...user,
        xp:            Math.max(user.xp || 0, fullData.profile.xp ?? 0),
        streak,
        longestStreak: Math.max(user.longestStreak || 0, streak),
        streakFreezes: streakInfo.freezesLeft,
        completedDays,
        activeChallenges,
        achievements,
        prayerLog: { ...(user.prayerLog || {}), ...prayerLog },
      });
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    try {
      const { access_token, refresh_token, user: apiUser } = await apiLogin(email, password);
      setTokens(access_token, refresh_token);

      const stored = JSON.parse(localStorage.getItem('ramadan_users') || '[]');
      const localUser = stored.find((u) => u.email === email) || {};

      // API dan barcha ma'lumotlarni yuklash
      let completedDays    = localUser.completedDays    || {};
      let activeChallenges = localUser.activeChallenges || [];
      let achievements     = localUser.achievements     || [];
      let prayerLog        = localUser.prayerLog        || {};
      let apiXP            = apiUser.xp || 0;

      try {
        const fullData = await apiGetFullData();

        // completed_days: { "YYYY-MM-DD": [frontend_ids] }
        completedDays = {};
        for (const day of fullData.completed_days) {
          completedDays[day.date] = day.challenge_ids ?? [];
        }

        // activeChallenges: API jadvaldan frontend formatga
        activeChallenges = fullData.challenges.map((c) => ({
          id:         c.frontend_id || c.id,
          _apiId:     c.id,
          title:      c.title,
          category:   c.category,
          xpPerTask:  c.base_xp,
          icon:       c.icon,
          frequency:  'Kunlik',
        }));

        // achievements: achievement_id massivi
        achievements = fullData.achievements.map((a) => a.achievement_id);

        // prayer_log: { "YYYY-MM-DD": { fajr, dhuhr, ... } }
        if (fullData.prayer_log?.length > 0) {
          const apiPrayerLog = {};
          for (const row of fullData.prayer_log) {
            apiPrayerLog[row.date] = {
              fajr:    row.fajr    !== 'pending' ? row.fajr    : null,
              dhuhr:   row.dhuhr   !== 'pending' ? row.dhuhr   : null,
              asr:     row.asr     !== 'pending' ? row.asr     : null,
              maghrib: row.maghrib !== 'pending' ? row.maghrib : null,
              isha:    row.isha    !== 'pending' ? row.isha    : null,
            };
          }
          // API ma'lumotlari bilan mahalliy ma'lumotlarni birlashtirish
          prayerLog = { ...(localUser.prayerLog || {}), ...apiPrayerLog };
        }

        // API dagi XP ni ishlatish (client hisoblagan bilan max)
        apiXP = fullData.profile?.xp ?? apiXP;
      } catch {
        // API dan yuklab bo'lmasa — localStorage dan davom et
      }

      const normalized = normalizeUserFields({
        ...localUser,
        id:             apiUser.id,
        name:           apiUser.name,
        email:          apiUser.email,
        city:           apiUser.city,
        xp:             Math.max(localUser.xp || 0, apiXP),
        completedDays,
        activeChallenges,
        achievements,
        prayerLog,
      });

      const todayKey = getDateKey();
      const streakInfo = calcStreakDetailed(normalized.completedDays, normalized.streakFreezes || 0);
      const todayDone = hasDoneInDay(normalized.completedDays, todayKey);
      const streak = todayDone ? streakInfo.streak + 1 : streakInfo.streak;

      const updated = {
        ...normalized,
        streak,
        longestStreak: Math.max(normalized.longestStreak || 0, streak),
        streakFreezes: streakInfo.freezesLeft,
        _freezeUsed: streakInfo.freezesUsed > 0 ? streakInfo.freezesUsed : undefined,
      };

      const idx = stored.findIndex((u) => u.email === email);
      const clean = stripTransientFields(updated);
      if (idx !== -1) stored[idx] = clean;
      else stored.push(clean);
      localStorage.setItem('ramadan_users', JSON.stringify(stored));

      persist(updated);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name, email, password, city) => {
    try {
      const { access_token, refresh_token, user: apiUser } = await apiRegister(name, email, password, city);
      setTokens(access_token, refresh_token);

      const newUser = normalizeUserFields({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        city: apiUser.city,
        xp: apiUser.xp || 50,
        activeChallenges: [],
        completedDays: {},
        streak: 0,
        longestStreak: 0,
        dailyGoal: 3,
        soundEnabled: true,
        onboardingDone: false,
        joinedAt: new Date().toISOString(),
        achievements: [],
        streakFreezes: 0,
        totalTasksCompleted: 0,
        dailyQuestBonusDates: {},
        comboCount: 1,
        lastTaskAt: 0,
      });

      const stored = JSON.parse(localStorage.getItem('ramadan_users') || '[]');
      stored.push(stripTransientFields(newUser));
      localStorage.setItem('ramadan_users', JSON.stringify(stored));
      persist(newUser);
      return true;
    } catch (err) {
      if (err.status === 409) return { error: 'email_taken' };
      return false;
    }
  };

  const updateUser = (updates) => {
    if (!user) return;

    const base = normalizeUserFields({ ...user, ...updates });

    if (updates._clearTransient) {
      delete base._levelUp;
      delete base._newAchievements;
      delete base._freezeUsed;
      delete base._freezeAwarded;
      delete base._clearTransient;
      persist(base);
      return;
    }

    if (updates.completedDays) {
      const todayKey = getDateKey();
      const streakInfo = calcStreakDetailed(base.completedDays, base.streakFreezes || 0);
      const todayDone = hasDoneInDay(base.completedDays, todayKey);
      const streak = todayDone ? streakInfo.streak + 1 : streakInfo.streak;

      const oldStreak = user.streak || 0;
      let freezeAwarded = 0;
      if (streak >= 7 && oldStreak < 7) freezeAwarded += 1;
      if (streak >= 14 && oldStreak < 14) freezeAwarded += 1;
      if (streak >= 21 && oldStreak < 21) freezeAwarded += 2;

      base.streak = streak;
      base.longestStreak = Math.max(base.longestStreak || 0, streak);
      base.streakFreezes = streakInfo.freezesLeft + freezeAwarded;

      if (streakInfo.freezesUsed > 0) base._freezeUsed = streakInfo.freezesUsed;
      else delete base._freezeUsed;
      if (freezeAwarded > 0) base._freezeAwarded = freezeAwarded;
      else delete base._freezeAwarded;
    }

    // totalTasksCompleted va heartPercent normalizeUserFields ichida
    // completedDays'dan avtomatik hisoblanadi — bu yerda qo'lda o'zgartirish kerak emas

    const oldLevel = getLevelInfo(user.xp || 0).current.level;
    const incomingLevel = getLevelInfo(base.xp || 0).current.level;

    let achievementXP = 0;
    if (updates._taskCompleted || updates.xp !== undefined) {
      const newAchievements = checkAchievements(user, {
        streak: base.streak,
        totalTasksCompleted: base.totalTasksCompleted,
        newLevel: incomingLevel,
        lastCompletedId: updates._lastCompletedId,
        timeBonusId: updates._timeBonusId,
        goalJustDone: updates._goalJustDone || false,
        seasonId: updates._seasonId || null,
        jumaId: updates._jumaId || null,
        comebackDays: updates._comebackDays || 0,
        weeklyFirst: updates._weeklyFirst || false,
      });

      if (newAchievements.length > 0) {
        base.achievements = [...new Set([...(base.achievements || []), ...newAchievements])];
        base._newAchievements = newAchievements;

        achievementXP = getAchievementXP(newAchievements);
        if (achievementXP > 0) {
          base.xp = (base.xp || 0) + achievementXP;
        }
      }
      else {
        delete base._newAchievements;
      }
    }

    if (updates.xp !== undefined || achievementXP > 0) {
      const newLevel = getLevelInfo(base.xp || 0).current.level;
      if (newLevel > oldLevel) {
        base._levelUp = { from: oldLevel, to: newLevel };
      }
      else {
        delete base._levelUp;
      }
    }

    if (updates.completedDays && updates._lastCompletedId) {
      const todayKey = getDateKey();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = getDateKey(yesterday);
      const challengeId = updates._lastCompletedId;

      base.activeChallenges = (base.activeChallenges || []).map((challenge) => {
        if (challenge.id !== challengeId) return challenge;
        const wasDoneYesterday = (updates.completedDays[yesterdayKey] || []).includes(challengeId);
        const challengeStreak = wasDoneYesterday ? (challenge.challengeStreak || 0) + 1 : 1;
        return { ...challenge, challengeStreak, lastDone: todayKey };
      });
    }

    delete base._clearTransient;
    persist(base);

    // Fire-and-forget API sync
    if (getToken()) {
      // 1. Profile (xp, streak, name, city)
      if (updates.xp !== undefined || updates.name || updates.city || updates.completedDays) {
        const syncData = { xp: base.xp, streak: base.streak };
        if (updates.name) syncData.name = base.name;
        if (updates.city) syncData.city = base.city;
        apiSyncProfile(syncData);
      }

      // 2. Tasbeh
      if (updates.tasbehData?.totalCount !== undefined) {
        apiSyncProfile({ tasbeh: updates.tasbehData.totalCount });
      }

      // 3. Task completion
      if (updates.completedDays && updates._lastCompletedId) {
        const todayKey = getDateKey();
        const todayIds = base.completedDays[todayKey] || [];
        apiCompleteDay(todayKey, todayIds, base.xp, base.streak);
      }

      // 4. Undo
      if (updates._undoDate !== undefined) {
        apiUndoDay(updates._undoDate, base.xp);
      }

      // 5. Challenge qo'shish / o'chirish
      if (updates.activeChallenges) {
        const oldIds = new Set((user.activeChallenges || []).map((c) => c.id));
        const newIds = new Set(updates.activeChallenges.map((c) => c.id));

        for (const c of updates.activeChallenges) {
          if (!oldIds.has(c.id)) {
            apiAddChallenge({
              title:       c.title,
              category:    c.category || 'ibadah',
              base_xp:     c.xpPerTask || 20,
              icon:        c.icon || '✨',
              frontend_id: c.id,
            });
          }
        }

        for (const c of (user.activeChallenges || [])) {
          if (!newIds.has(c.id)) {
            apiDeleteChallengeByFid(c.id);
          }
        }
      }

      // 6. prayerLog o'zgarishlarini sync qilish
      if (updates.prayerLog) {
        const oldLog = user.prayerLog || {};
        for (const [date, record] of Object.entries(updates.prayerLog)) {
          if (JSON.stringify(record) !== JSON.stringify(oldLog[date])) {
            apiSyncPrayerDay(date, {
              fajr:    record?.fajr    || 'pending',
              dhuhr:   record?.dhuhr   || 'pending',
              asr:     record?.asr     || 'pending',
              maghrib: record?.maghrib || 'pending',
              isha:    record?.isha    || 'pending',
            });
          }
        }
      }

      // 7. Yangi achievement'lar
      if (base._newAchievements?.length > 0) {
        const rows = base.achievements.map((id) => ({
          id,
          xp_reward: getAchievementXP([id]),
        }));
        apiSyncAchievements(rows);
      }
    }
  };

  const addXp = (amount) => {
    if (!user || !amount) return;
    updateUser({ xp: (user.xp || 0) + amount });
  };

  const removeXp = (amount) => {
    if (!user || !amount) return;
    updateUser({ xp: Math.max(0, (user.xp || 0) - amount) });
  };

  const logout = async () => {
    if (getToken()) await apiLogout();
    clearTokens();
    setUser(null);
    localStorage.removeItem('ramadan_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, addXp, removeXp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
