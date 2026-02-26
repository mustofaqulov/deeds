import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IFTOR_DUA, SAHARLIK_DUA } from '../../utils/constants';
import {
  IconBell,
  IconMapPin,
  IconRefresh,
  IconSunrise,
  IconSunset,
} from '../../components/Icons/RamadanIcons';
import './IftorSaharlik.css';

const COUNTRY = 'Uzbekistan';
const API_METHOD = 2;
const REMINDER_OFFSET_MIN = 10;
const FORCED_CITY = 'Qarshi';

const BASE_TIMES = {
  saharlik: '05:08',
  iftor: '18:47',
};

const CITY_OFFSETS_MIN = {
  Toshkent: 0,
  Samarqand: -6,
  Buxoro: -14,
  Namangan: 5,
  Andijon: 7,
  "Farg'ona": 6,
  Qarshi: -10,
  Nukus: -33,
  Jizzax: -4,
  Urganch: -24,
  Termiz: -13,
  Navoiy: -12,
  Guliston: -2,
  Muborak: -9,
  Denov: -11,
};

function useNowTick() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  return now;
}

function parseClock(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;

  return { h, m };
}

function formatClock(clock) {
  return `${String(clock.h).padStart(2, '0')}:${String(clock.m).padStart(2, '0')}`;
}

function shiftClock(time, offsetMinutes) {
  const clock = parseClock(time);
  if (!clock) return time;

  const minutesInDay = 24 * 60;
  const base = (clock.h * 60) + clock.m;
  const shifted = ((base + offsetMinutes) % minutesInDay + minutesInDay) % minutesInDay;

  return formatClock({ h: Math.floor(shifted / 60), m: shifted % 60 });
}

function getFallbackTimings(city) {
  const offset = CITY_OFFSETS_MIN[city] || 0;
  const now = new Date();

  return {
    saharlik: shiftClock(BASE_TIMES.saharlik, offset),
    iftor: shiftClock(BASE_TIMES.iftor, offset),
    source: 'fallback',
    dateLabel: now.toLocaleDateString('uz-UZ'),
    hijriLabel: '',
  };
}

function getNextOccurrence(nowMs, clock) {
  const date = new Date(nowMs);
  date.setHours(clock.h, clock.m, 0, 0);
  if (date.getTime() <= nowMs) date.setDate(date.getDate() + 1);
  return date;
}

function getCountdown(nowMs, clock) {
  const target = getNextOccurrence(nowMs, clock);
  const diff = target.getTime() - nowMs;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return { h, m, s, targetAt: target };
}

function getAutoTab(nowMs, saharlikClock, iftorClock) {
  const now = new Date(nowMs);
  const mins = (now.getHours() * 60) + now.getMinutes();
  const saharlikMins = (saharlikClock.h * 60) + saharlikClock.m;
  const iftorMins = (iftorClock.h * 60) + iftorClock.m;

  if (mins < saharlikMins || mins >= iftorMins) return 'saharlik';
  return 'iftor';
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function Countdown({ countdown }) {
  return (
    <div className="iftor-countdown" aria-live="polite">
      <div className="iftor-count-item">
        <strong>{pad(countdown.h)}</strong>
        <span>soat</span>
      </div>
      <span className="iftor-count-sep">:</span>
      <div className="iftor-count-item">
        <strong>{pad(countdown.m)}</strong>
        <span>daqiqa</span>
      </div>
      <span className="iftor-count-sep">:</span>
      <div className="iftor-count-item">
        <strong>{pad(countdown.s)}</strong>
        <span>soniya</span>
      </div>
    </div>
  );
}

function DuaCard({ title, dua, tone = 'iftor' }) {
  const [showTranslit, setShowTranslit] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyText = useCallback(async () => {
    const payload = [title, dua.arabic, dua.uzbek, dua.transliteration].filter(Boolean).join('\n\n');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }
    } catch (err) {
      void err;
    }
  }, [dua.arabic, dua.transliteration, dua.uzbek, title]);

  return (
    <article className={`iftor-dua card ${tone}`}>
      <header className="iftor-dua-head">
        <h3>{title}</h3>
        <span className="badge badge-gold">{dua.source}</span>
      </header>

      <p className="arabic iftor-dua-arabic">{dua.arabic}</p>
      <p className="iftor-dua-uz">{dua.uzbek}</p>

      {dua.transliteration && (
        <div className="iftor-dua-translit-wrap">
          <button className="btn btn-ghost" onClick={() => setShowTranslit((prev) => !prev)}>
            {showTranslit ? 'Transliterani yashirish' : "Transliterani ko'rsatish"}
          </button>
          {showTranslit && <p className="iftor-dua-translit">{dua.transliteration}</p>}
        </div>
      )}

      <button className="btn btn-outline" onClick={copyText}>
        {copied ? 'Nusxalandi' : 'Duo matnini nusxalash'}
      </button>
    </article>
  );
}

export default function IftorSaharlik() {
  const { user, updateUser } = useAuth();
  const nowMs = useNowTick();
  const reminderRef = useRef(null);
  const requestIdRef = useRef(0);

  const [timings, setTimings] = useState(() => getFallbackTimings(FORCED_CITY));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualTab, setManualTab] = useState(null);
  const [reminderText, setReminderText] = useState('');

  const loadCityTimes = useCallback(async (city) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const fallback = getFallbackTimings(city);

    try {
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(COUNTRY)}&method=${API_METHOD}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('api_http_error');
      const payload = await response.json();

      const data = payload?.data;
      const fajr = parseClock(data?.timings?.Fajr);
      const maghrib = parseClock(data?.timings?.Maghrib);

      if (!fajr || !maghrib) throw new Error('api_parse_error');

      const hijri = data?.date?.hijri;
      const greg = data?.date?.gregorian;

      const nextTimings = {
        saharlik: formatClock(fajr),
        iftor: formatClock(maghrib),
        source: 'api',
        dateLabel: greg?.date || fallback.dateLabel,
        hijriLabel: hijri
          ? `${hijri.day} ${hijri.month?.en || ''} ${hijri.year}`.trim()
          : '',
      };

      if (requestId !== requestIdRef.current) return;
      setTimings(nextTimings);
      setError('');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setTimings(fallback);
      setError('Internet yoki API cheklovi sabab fallback vaqtlar ko\'rsatildi.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.city !== FORCED_CITY) {
      updateUser({ city: FORCED_CITY });
    }
    loadCityTimes(FORCED_CITY);
  }, [loadCityTimes, updateUser, user?.city]);

  useEffect(() => {
    return () => {
      if (reminderRef.current) window.clearTimeout(reminderRef.current);
    };
  }, []);

  const saharlikClock = useMemo(() => parseClock(timings.saharlik) || parseClock(BASE_TIMES.saharlik), [timings.saharlik]);
  const iftorClock = useMemo(() => parseClock(timings.iftor) || parseClock(BASE_TIMES.iftor), [timings.iftor]);

  const autoTab = useMemo(() => getAutoTab(nowMs, saharlikClock, iftorClock), [iftorClock, nowMs, saharlikClock]);
  const activeTab = manualTab || autoTab;

  const activeClock = activeTab === 'iftor' ? iftorClock : saharlikClock;
  const activeTimeLabel = activeTab === 'iftor' ? timings.iftor : timings.saharlik;
  const countdown = useMemo(() => getCountdown(nowMs, activeClock), [activeClock, nowMs]);

  const statusLabel = loading
    ? 'Yangilanmoqda...'
    : timings.source === 'api'
      ? 'Aniq vaqtlar (API)'
      : 'Taxminiy fallback vaqtlar';

  const setReminder = useCallback(async () => {
    if (!('Notification' in window)) {
      setReminderText("Brauzeringizda Notification qo'llab-quvvatlanmaydi.");
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      setReminderText('Eslatma uchun Notification ruxsati kerak.');
      return;
    }

    const targetAt = getNextOccurrence(Date.now(), activeClock);
    const remindAt = new Date(targetAt.getTime() - (REMINDER_OFFSET_MIN * 60000));
    const delayMs = Math.max(1200, remindAt.getTime() - Date.now());

    if (reminderRef.current) window.clearTimeout(reminderRef.current);

    reminderRef.current = window.setTimeout(() => {
      new Notification(`${activeTab === 'iftor' ? 'Iftor' : 'Saharlik'} vaqti yaqin`, {
        body: `${activeTimeLabel} da ${activeTab === 'iftor' ? 'iftor' : 'saharlik'} vaqti kiradi.`,
        icon: '/vite.svg',
      });
    }, delayMs);

    setReminderText(`Eslatma ${remindAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} ga o'rnatildi.`);
  }, [activeClock, activeTab, activeTimeLabel]);

  return (
    <div className="page-wrapper iftor-page">
      <section className="iftor-hero card">
        <div className="iftor-hero-head">
          <div>
            <p className="ui-kicker"><IconSunset size={13} /> Ramazon vaqtlari</p>
            <h1 className="ui-title">Iftor va Saharlik</h1>
            <p className="ui-subtle">Qarshi shahri bo'yicha iftorlik va saharlik vaqtlarida ishlaydi.</p>
          </div>

          <div className="iftor-city-select fixed">
            <span><IconMapPin size={14} /> Shahar</span>
            <strong>{FORCED_CITY}</strong>
          </div>
        </div>

        <div className="iftor-hero-meta">
          <span className="badge badge-accent">{statusLabel}</span>
          {timings.dateLabel && <span className="badge badge-gold">Sana: {timings.dateLabel}</span>}
          {timings.hijriLabel && <span className="badge badge-success">Hijriy: {timings.hijriLabel}</span>}
        </div>
      </section>

      <section className="iftor-layout">
        <article className="iftor-main card">
          <div className="iftor-time-grid">
            <button
              className={`iftor-time-chip ${activeTab === 'saharlik' ? 'active' : ''}`}
              onClick={() => setManualTab('saharlik')}
            >
              <span className="iftor-chip-icon"><IconSunrise size={16} /></span>
              <span className="iftor-chip-body">
                <small>Saharlik</small>
                <strong>{timings.saharlik}</strong>
              </span>
            </button>

            <button
              className={`iftor-time-chip ${activeTab === 'iftor' ? 'active' : ''}`}
              onClick={() => setManualTab('iftor')}
            >
              <span className="iftor-chip-icon"><IconSunset size={16} /></span>
              <span className="iftor-chip-body">
                <small>Iftor</small>
                <strong>{timings.iftor}</strong>
              </span>
            </button>
          </div>

          <div className={`iftor-count-wrap ${activeTab}`}>
            <p className="iftor-count-kicker">{activeTab === 'iftor' ? 'Iftorgacha qoldi' : 'Saharlikkacha qoldi'}</p>
            <h2>{activeTimeLabel}</h2>
            <Countdown countdown={countdown} />
            <small>
              Keyingi vaqt: {countdown.targetAt.toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </small>
          </div>

          <div className="iftor-main-actions">
            <button className="btn btn-outline" onClick={setReminder}>
              <IconBell size={15} /> {REMINDER_OFFSET_MIN} daqiqa oldin eslatma
            </button>
            <button className="btn btn-ghost" onClick={() => { setLoading(true); loadCityTimes(FORCED_CITY); }}>
              <IconRefresh size={15} /> Qayta yangilash
            </button>
          </div>

          {reminderText && <p className="iftor-info success">{reminderText}</p>}
          {error && <p className="iftor-info warning">{error}</p>}
        </article>

        <aside className="iftor-side card">
          <h3>Bugungi qisqa rejim</h3>
          <ul>
            <li>
              <span>Saharlik vaqti</span>
              <strong>{timings.saharlik}</strong>
            </li>
            <li>
              <span>Iftor vaqti</span>
              <strong>{timings.iftor}</strong>
            </li>
            <li>
              <span>Faol hisob</span>
              <strong>{activeTab === 'iftor' ? 'Iftor' : 'Saharlik'}</strong>
            </li>
            <li>
              <span>Manba</span>
              <strong>{timings.source === 'api' ? 'API' : 'Fallback'}</strong>
            </li>
          </ul>
        </aside>
      </section>

      <section className="iftor-dua-grid">
        <DuaCard title="Saharlik (Ro'za) niyati" dua={SAHARLIK_DUA} tone="saharlik" />
        <DuaCard title="Iftor duosi" dua={IFTOR_DUA} tone="iftor" />
      </section>
    </div>
  );
}
