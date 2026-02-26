const BASE_URL = import.meta.env.VITE_API_URL || 'https://deeds-backend.vercel.app';

const ACCESS_KEY = 'rd_token';
const REFRESH_KEY = 'rd_refresh';

export const getToken    = () => localStorage.getItem(ACCESS_KEY);
export const getRefresh  = () => localStorage.getItem(REFRESH_KEY);
export const setTokens   = (access, refresh) => {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// Refresh token silently, returns true if successful
async function tryRefresh() {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const { access_token, refresh_token } = await res.json();
    setTokens(access_token, refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });

  // Auto-refresh on 401, retry once
  if (res.status === 401 && !opts._retry) {
    const ok = await tryRefresh();
    if (ok) return req(path, { ...opts, _retry: true });
    clearTokens();
    window.location.href = '/login';
    return {};
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || "Server xatosi");
    err.status = res.status;
    throw err;
  }
  return json;
}

// --- Auth ---
export const apiRegister = (name, email, password, city) =>
  req('/api/auth/register', { method: 'POST', body: { name, email, password, city } });

export const apiLogin = (email, password) =>
  req('/api/auth/login', { method: 'POST', body: { email, password } });

export const apiRefresh = (refresh_token) =>
  req('/api/auth/refresh', { method: 'POST', body: { refresh_token } });

export const apiLogout = () =>
  req('/api/auth/logout', { method: 'POST' }).catch(() => {});

// --- Profile ---
export const apiGetProfile = () => req('/api/profile');
export const apiSyncProfile = (data) =>
  req('/api/profile', { method: 'PUT', body: data }).catch(() => {});
export const apiResetProgress = () =>
  req('/api/profile/reset', { method: 'POST' });

// --- Challenges ---
export const apiGetChallenges = () => req('/api/challenges');
export const apiAddChallenge  = (c) =>
  req('/api/challenges', { method: 'POST', body: c });
export const apiDeleteChallenge = (id) =>
  req(`/api/challenges/${id}`, { method: 'DELETE' }).catch(() => {});
export const apiDeleteChallengeByFid = (frontend_id) =>
  req(`/api/challenges/fid/${encodeURIComponent(frontend_id)}`, { method: 'DELETE' }).catch(() => {});
export const apiCompleteDay = (date, challenge_ids, xp, streak) =>
  req('/api/challenges/complete', { method: 'POST', body: { date, challenge_ids, total_xp: xp, streak } }).catch(() => {});
export const apiUndoDay = (date, xp_after_undo) =>
  req('/api/challenges/undo', { method: 'POST', body: { date, xp_after_undo } }).catch(() => {});

// --- Full data ---
export const apiGetFullData = () => req('/api/data/full');

// --- Achievements ---
export const apiSyncAchievements = (achievements) =>
  req('/api/achievements/sync', { method: 'POST', body: { achievements } }).catch(() => {});

// --- Calendar ---
export const apiGetCalendar = () => req('/api/calendar');

// --- Nafs ---
export const apiSaveNafsStage = (stageId) =>
  req('/api/nafs/assess', { method: 'POST', body: { stage_id: stageId } }).catch(() => {});

// --- Prayer ---
export const apiGetPrayer = (date) => req(`/api/prayer/${date}`);
// Butun kunni sync qilish (bulk)
export const apiSyncPrayerDay = (date, record) =>
  req(`/api/prayer/${date}`, { method: 'PUT', body: record }).catch(() => {});
// Bitta namozni yangilash
export const apiUpdatePrayer = (date, prayer, status) =>
  req(`/api/prayer/${date}/${prayer}`, { method: 'PUT', body: { status } }).catch(() => {});
