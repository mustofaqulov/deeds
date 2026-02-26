/* ============================================================
   XP SYSTEM — Streak multipliers, time bonuses, combo, achievements
   ============================================================ */

// ── Streak multiplier ──────────────────────────────────────
export function getStreakMultiplier(streak) {
  if (streak >= 21) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

export function getStreakMultiplierLabel(streak) {
  if (streak >= 21) return '×2.0';
  if (streak >= 14) return '×1.75';
  if (streak >= 7) return '×1.5';
  if (streak >= 3) return '×1.25';
  return null;
}

// ── Ramadan time-of-day bonus ──────────────────────────────
export function getRamadanTimeBonus() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // Tahajjud 01:00–02:59
  if (h >= 1 && h <= 2)
    return { mult: 1.75, label: 'Tahajjud vaqti', icon: '⭐', id: 'tahajjud_time' };

  // Saharlik 03:00–05:29
  if (h === 3 || h === 4 || (h === 5 && m < 30))
    return { mult: 1.5, label: 'Saharlik vaqti', icon: '🌙', id: 'saharlik_time' };

  // Fajr 05:30–06:59
  if ((h === 5 && m >= 30) || h === 6)
    return { mult: 1.25, label: 'Fajr vaqti', icon: '🌅', id: null };

  // Iftor 18:00–20:00
  if (h >= 18 && h <= 20) return { mult: 1.25, label: 'Iftor vaqti', icon: '🌇', id: null };

  return { mult: 1.0, label: null, icon: null, id: null };
}

// ── Ramadan season bonus (3 phases) ───────────────────────
// Hijri kalendardan foydalanadi — har yilgi Ramazon avtomatik aniqlanadi
function getRamadanDayNumber() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'numeric', year: 'numeric',
    }).formatToParts(today);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day   = Number(parts.find((p) => p.type === 'day')?.value);
    if (month === 9 && Number.isFinite(day)) return Math.min(Math.max(day, 1), 30);
  } catch {
    // silent fallback
  }
  return 0; // Ramazon emasa
}

export function getRamadanSeasonBonus() {
  const ramadanDay = getRamadanDayNumber();
  if (ramadanDay === 0) return { mult: 1.0, label: null, icon: null, id: null };

  const h = new Date().getHours();
  const isNight  = h >= 20 || h <= 6;
  const isOddDay = ramadanDay % 2 === 1;

  // So'nggi 10 kecha (days 21-30)
  if (ramadanDay >= 21) {
    if (isOddDay && isNight) {
      return { mult: 1.5, label: 'Qadr kechasi ehtimoli', icon: '✨', id: 'qadr_night' };
    }
    return { mult: 1.25, label: "So'nggi 10 kecha", icon: '🌙', id: 'last_10' };
  }

  // Mag'fira kunlari (days 11-20)
  if (ramadanDay >= 11) {
    return { mult: 1.1, label: "Mag'fira kunlari", icon: '🤲', id: 'maghfira' };
  }

  // Rahma kunlari (days 1-10)
  return { mult: 1.0, label: 'Rahma kunlari', icon: '🌱', id: 'rahma' };
}

// ── Juma (Friday) bonus ────────────────────────────────────
export function getJumaBonus() {
  if (new Date().getDay() === 5) {
    return { mult: 1.25, label: 'Juma barakasi', icon: '🕌', id: 'juma' };
  }
  return { mult: 1.0, label: null, icon: null, id: null };
}

// ── Weekly first-task boost (every Monday) ─────────────────
export function getWeeklyFirstBonus(lastTaskAt) {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 1=Mon...
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  if (!lastTaskAt || lastTaskAt < weekStart.getTime()) {
    return { active: true, label: 'Hafta boshi ×2', icon: '⚡', id: 'weekly_first' };
  }
  return { active: false, label: null, icon: null, id: null };
}

// ── Comeback / Tawba bonus (return after 2+ day gap) ───────
export function getComebackBonus(lastTaskAt) {
  if (!lastTaskAt) return { active: false, days: 0 };
  const daysDiff = (Date.now() - lastTaskAt) / (1000 * 60 * 60 * 24);
  if (daysDiff >= 2) return { active: true, days: Math.floor(daysDiff) };
  return { active: false, days: 0 };
}

// ── Baraka random crit (10% chance +50% bonus) ─────────────
export function rollBaraka(baseXP) {
  if (Math.random() > 0.1) return 0;
  return Math.round(baseXP * 0.5);
}

// ── Combo bonus (same-session tasks) ──────────────────────
export const COMBO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function getComboBonus(comboCount, baseXP) {
  if (comboCount < 2) return 0;
  const pct = Math.min((comboCount - 1) * 0.25, 0.75);
  return Math.round(baseXP * pct);
}

export function getComboLabel(comboCount) {
  if (comboCount >= 4) return '⚡ Kombo x4!';
  if (comboCount === 3) return '⚡ Kombo x3!';
  if (comboCount === 2) return '⚡ Kombo x2!';
  return null;
}

// ── Final XP calculation ───────────────────────────────────
// seasonMult and jumaMult are optional extra multipliers
export function calcFinalXP(baseXP, streakMult, timeMult, comboBonus = 0, seasonMult = 1.0, jumaMult = 1.0) {
  return Math.round(baseXP * streakMult * timeMult * seasonMult * jumaMult) + comboBonus;
}

// ── Achievements ──────────────────────────────────────────
export const ACHIEVEMENTS = [
  // Streak
  { id: 'streak_3',        label: '3 Kunlik Streak',      icon: '🔥', xpBonus: 30,  desc: '3 kun ketma-ket ibodat' },
  { id: 'streak_7',        label: 'Haftalik Sodiq',        icon: '💪', xpBonus: 75,  desc: '7 kun streak' },
  { id: 'streak_14',       label: 'Ikki Haftalik',         icon: '💫', xpBonus: 150, desc: '14 kun streak' },
  { id: 'streak_21',       label: "Ramazon Askariy",       icon: '⭐', xpBonus: 250, desc: '21 kun streak' },
  { id: 'streak_30',       label: 'Ramazon Qahramoni',     icon: '👑', xpBonus: 500, desc: "To'liq Ramazon" },
  // Task count
  { id: 'tasks_10',        label: '10 Topshiriq',          icon: '✅', xpBonus: 50,  desc: 'Jami 10 ta ibodat' },
  { id: 'tasks_50',        label: '50 Topshiriq',          icon: '🌟', xpBonus: 100, desc: 'Jami 50 ta ibodat' },
  { id: 'tasks_100',       label: '100 Topshiriq',         icon: '💎', xpBonus: 200, desc: 'Jami 100 ta ibodat' },
  // First-time events
  { id: 'first_tahajjud',  label: 'Birinchi Tahajjud',     icon: '🌙', xpBonus: 80,  desc: 'Tahajjud bajarildi' },
  { id: 'first_sadaqa',    label: 'Saxiy Yurak',            icon: '🤲', xpBonus: 60,  desc: 'Birinchi sadaqa' },
  { id: 'goal_first',      label: 'Birinchi Maqsad',       icon: '🎯', xpBonus: 40,  desc: 'Kunlik maqsad bajarildi' },
  // Time bonuses
  { id: 'saharlik_hero',   label: 'Saharlik Qahramoni',    icon: '🌅', xpBonus: 60,  desc: 'Saharlik vaqtida ibodat' },
  { id: 'tahajjud_hero',   label: 'Kecha Qahramoni',       icon: '⭐', xpBonus: 80,  desc: 'Tahajjud vaqtida ibodat' },
  // Level milestones
  { id: 'level_3',         label: 'Solik Darajasi',        icon: '🕌', xpBonus: 50,  desc: '3-daraja: Solik' },
  { id: 'level_5',         label: 'Abdol Darajasi',        icon: '✨', xpBonus: 100, desc: '5-daraja: Abdol' },
  { id: 'level_7',         label: 'Qutb Darajasi',         icon: '👑', xpBonus: 300, desc: '7-daraja: Qutb' },
  // New: Special events
  { id: 'juma_hero',       label: 'Juma Qahramoni',        icon: '🕌', xpBonus: 50,  desc: 'Juma kuni ibodat qilindi' },
  { id: 'qadr_night_hero', label: 'Qadr Kechasi',          icon: '✨', xpBonus: 300, desc: 'Qadr kechasida ibodat qilindi' },
  { id: 'comeback',        label: 'Tawba Bonusi',          icon: '💚', xpBonus: 30,  desc: "2+ kundan so'ng qaytish" },
  { id: 'perfect_day',     label: 'Mukammal Kun',          icon: '🌟', xpBonus: 80,  desc: 'Barcha kunlik maqsadlar bajarildi' },
  { id: 'weekly_warrior',  label: 'Hafta Jangchisi',       icon: '⚡', xpBonus: 60,  desc: 'Hafta boshi birinchi ibodati' },
  { id: 'last_10_nights',  label: "So'nggi 10 Kecha",      icon: '🌙', xpBonus: 120, desc: "Ramazonning so'nggi 10 kechasida ibodat" },
];

// ── Check which new achievements were earned ───────────────
export function checkAchievements(user, ctx) {
  const existing = user.achievements || [];
  const earned = [];

  const streak       = ctx.streak            ?? user.streak            ?? 0;
  const total        = ctx.totalTasksCompleted ?? user.totalTasksCompleted ?? 0;
  const newLevel     = ctx.newLevel           ?? null;
  const lastId       = ctx.lastCompletedId    ?? null;
  const timeBonusId  = ctx.timeBonusId        ?? null;
  const goalDone     = ctx.goalJustDone       ?? false;
  const seasonId     = ctx.seasonId           ?? null;
  const jumaId       = ctx.jumaId             ?? null;
  const comebackDays = ctx.comebackDays       ?? 0;
  const weeklyFirst  = ctx.weeklyFirst        ?? false;

  const add = (id) => { if (!existing.includes(id) && !earned.includes(id)) earned.push(id); };

  // Streak milestones
  if (streak >= 3)  add('streak_3');
  if (streak >= 7)  add('streak_7');
  if (streak >= 14) add('streak_14');
  if (streak >= 21) add('streak_21');
  if (streak >= 30) add('streak_30');

  // Task count milestones
  if (total >= 10)  add('tasks_10');
  if (total >= 50)  add('tasks_50');
  if (total >= 100) add('tasks_100');

  // First special tasks
  if (lastId === 'tahajjud') add('first_tahajjud');
  if (lastId === 'sadaqa')   add('first_sadaqa');

  // Goal completion
  if (goalDone) add('goal_first');
  if (goalDone) add('perfect_day');

  // Time-of-day
  if (timeBonusId === 'saharlik_time') add('saharlik_hero');
  if (timeBonusId === 'tahajjud_time') add('tahajjud_hero');

  // Level milestones
  if (newLevel >= 3) add('level_3');
  if (newLevel >= 5) add('level_5');
  if (newLevel >= 7) add('level_7');

  // New special events
  if (jumaId === 'juma')              add('juma_hero');
  if (seasonId === 'qadr_night')      add('qadr_night_hero');
  if (seasonId === 'last_10' || seasonId === 'qadr_night') add('last_10_nights');
  if (comebackDays >= 2)              add('comeback');
  if (weeklyFirst)                    add('weekly_warrior');

  return earned;
}

// ── Achievement XP total ───────────────────────────────────
export function getAchievementXP(achievementIds) {
  return achievementIds.reduce((sum, id) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    return sum + (ach?.xpBonus || 0);
  }, 0);
}
