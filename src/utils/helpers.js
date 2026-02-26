import { LEVELS } from './constants';

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100) };
}

export function getRamadanDay() {
  const DAY_MS = 24 * 60 * 60 * 1000;

  const toStartOfDay = (input) => {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getHijriParts = (date) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const parts = formatter.formatToParts(date);
      const day = Number(parts.find((part) => part.type === 'day')?.value);
      const month = Number(parts.find((part) => part.type === 'month')?.value);
      const year = Number(parts.find((part) => part.type === 'year')?.value);
      if (![day, month, year].every(Number.isFinite)) return null;
      return { day, month, year };
    } catch {
      return null;
    }
  };

  const findHijriDate = (baseDate, predicate, direction = 1, limit = 460) => {
    const origin = toStartOfDay(baseDate);
    for (let step = 0; step <= limit; step += 1) {
      const candidate = new Date(origin);
      candidate.setDate(origin.getDate() + (step * direction));
      const hijri = getHijriParts(candidate);
      if (hijri && predicate(hijri)) return candidate;
    }
    return null;
  };

  const today = toStartOfDay(new Date());
  const todayHijri = getHijriParts(today);

  if (todayHijri) {
    if (todayHijri.month === 9) {
      const day = Math.min(Math.max(todayHijri.day, 1), 30);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (day - 1));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 29);
      return {
        day,
        started: true,
        ended: false,
        daysLeft: 0,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    }

    const nextStart = findHijriDate(today, (parts) => parts.month === 9 && parts.day === 1, 1);
    if (nextStart) {
      const daysLeft = Math.max(0, Math.round((toStartOfDay(nextStart) - today) / DAY_MS));
      const endDate = new Date(nextStart);
      endDate.setDate(nextStart.getDate() + 29);
      return {
        day: 0,
        started: false,
        ended: todayHijri.month > 9,
        daysLeft,
        startDate: nextStart.toISOString(),
        endDate: endDate.toISOString(),
      };
    }
  }

  const fallbackYear = today.getFullYear();
  const fallbackStart = new Date(`${fallbackYear}-03-01T00:00:00`);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setDate(fallbackStart.getDate() + 29);

  if (today < fallbackStart) {
    const daysLeft = Math.round((fallbackStart - today) / DAY_MS);
    return {
      day: 0,
      started: false,
      ended: false,
      daysLeft,
      startDate: fallbackStart.toISOString(),
      endDate: fallbackEnd.toISOString(),
    };
  }

  if (today > fallbackEnd) {
    const nextFallbackStart = new Date(`${fallbackYear + 1}-03-01T00:00:00`);
    const daysLeft = Math.round((nextFallbackStart - today) / DAY_MS);
    const nextFallbackEnd = new Date(nextFallbackStart);
    nextFallbackEnd.setDate(nextFallbackStart.getDate() + 29);
    return {
      day: 0,
      started: false,
      ended: true,
      daysLeft,
      startDate: nextFallbackStart.toISOString(),
      endDate: nextFallbackEnd.toISOString(),
    };
  }

  const day = Math.round((today - fallbackStart) / DAY_MS) + 1;
  return {
    day,
    started: true,
    ended: false,
    daysLeft: 0,
    startDate: fallbackStart.toISOString(),
    endDate: fallbackEnd.toISOString(),
  };
}

export function formatTime(date) {
  return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

export function getTimeUntil(targetHour, targetMinute) {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, targetMinute, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  const diff = target - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, diff };
}

export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
