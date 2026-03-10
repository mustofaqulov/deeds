import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LastTenDays.css';

/* ─── Static data ──────────────────────────────────────────────── */

const CATEGORIES = [
  {
    id: 'nightly',
    icon: 'Night',
    title: 'Qiyom va Namoz',
    subtitle: 'Har kecha asosiy amal',
    daily: true,
    color: 'blue',
    items: [
      "Isha va bomdod namozlarini imkon qadar jamoat bilan o'qish",
      "Tarovih yoki qiyomda imom bilan oxirigacha turish",
      "Kechada qo'shimcha nafl qiyom (kamida 2 rakaat) o'qish",
      "Uy ahlini ibodatga rag'batlantirish va uyg'otish",
    ],
  },
  {
    id: 'qadr',
    icon: 'Qadr',
    title: 'Qadr kechasini izlash',
    subtitle: '21, 23, 25, 27, 29 kechalar',
    daily: false,
    color: 'gold',
    items: [
      "Har toq kechaga oldindan reja va duo ro'yxati tayyorlash",
      "Allohumma innaka Afuwwun duosini ko'p takrorlash",
      "Gunohlardan tavba qilish va istig'forni ko'paytirish",
      "O'zi, oila va ummat uchun uzoq, ixlosli duo qilish",
    ],
  },
  {
    id: 'quran-zikr',
    icon: 'Quran',
    title: "Qur'on va Zikr",
    subtitle: 'Kechalik ruhiy dastur',
    daily: false,
    color: 'purple',
    items: [
      "Qur'on tilovatini odatdagi kundan ko'proq qilish",
      "O'qilgan oyatlar ma'nosi ustida tafakkur qilish",
      "Subhanallah, Alhamdulillah, La ilaha illallah, Allohu akbar zikrlarini ko'paytirish",
      "Keraksiz gap, bahs va telefondagi ortiqcha mashg'ulotlarni kamaytirish",
    ],
  },
  {
    id: 'itikof',
    icon: 'Itikof',
    title: "I'tikof",
    subtitle: "Sunnat amali (imkon bo'lsa)",
    daily: false,
    color: 'green',
    items: [
      "Oxirgi 10 kun i'tikof niyati bilan masjidda qolish",
      "I'tikof vaqtini namoz, Qur'on va zikrga ajratish",
      "Faqat zarur ehtiyojlar uchun chiqish",
      "Ixtilof va keraksiz munozaralardan uzoq bo'lish",
    ],
  },
  {
    id: 'sadaqa',
    icon: 'Sadaqa',
    title: 'Sadaqa va Yaxshilik',
    subtitle: "Qadr kechalarida savobni ko'paytirish",
    daily: false,
    color: 'amber',
    items: [
      "Imkon qadar har kecha oz bo'lsa ham sadaqa qilish",
      "Muhtojlarga iftorlik va yordam ulashish",
      "Ota-ona va yaqinlarga yaxshilik qilish",
      "Ko'ngil og'ritmaslik va silai-rahmni mustahkamlash",
    ],
  },
];

const LAST_TEN_DAYS = Array.from({ length: 10 }, (_, i) => i + 21);
const QADR_NIGHTS = LAST_TEN_DAYS.filter((day) => day % 2 !== 0);

const QADR_NIGHT_FLOW = [
  {
    id: 'niyat',
    time: 'Iftordan oldin',
    task: "Niyatni yangilang, gunohlardan tavba qiling va bugungi duo ro'yxatini tayyorlab oling.",
  },
  {
    id: 'isha',
    time: 'Isha-Tarovihdan keyin',
    task: "Isha va tarovih/qiyomni imom bilan oxirigacha o'qib, kechani kuchli boshlang.",
  },
  {
    id: 'midnight',
    time: "Kechaning o'rtasi",
    task: "Qur'on, zikr, istig'for va nafl namozni navbat bilan davom ettiring.",
  },
  {
    id: 'sahar',
    time: 'Saharlik oldi',
    task: "Allohumma innaka Afuwwun duosi va samimiy iltijolar bilan yakunlab, bomdodga tayyor turing.",
  },
];

const RESEARCH_ACTIONS = [
  {
    id: 'odd-nights',
    title: 'Toq kechalarni qidiring',
    detail: 'Qadr kechasini oxirgi 10 kechaning toq kechalarida izlash buyurilgan.',
    source: 'Sahih al-Bukhari 2017',
  },
  {
    id: 'qiyam',
    title: 'Qiyom bilan tiriltiring',
    detail: "Qadr kechasini imon va savob umidida qiyom bilan o'tkazgan kishining gunohlari kechiriladi.",
    source: 'Sahih al-Bukhari 2014',
  },
  {
    id: 'effort',
    title: 'Oxirgi 10 kunda kuchaytiring',
    detail: "Nabiy alayhissalom oxirgi 10 kunda ibodatni kuchaytirar va oilani uyg'otardilar.",
    source: 'Sahih al-Bukhari 2024, Sahih Muslim 1174',
  },
  {
    id: 'dua',
    title: "Qadr duosini ko'paytiring",
    detail: 'Oyisha roziyallohu anho rivoyatidagi maxsus duo: Allohumma innaka Afuwwun...',
    source: 'Sunan Ibn Majah 3850',
  },
  {
    id: 'imam',
    title: 'Imom bilan oxirigacha',
    detail: "Kim imom bilan namozni oxirigacha ado etsa, unga butun kecha qiyom savobi yoziladi.",
    source: 'Jami at-Tirmidhi 806',
  },
  {
    id: 'itikof',
    title: "I'tikof (imkon bo'lsa)",
    detail: "Nabiy alayhissalom oxirgi o'n kun i'tikof qilganlar.",
    source: 'Sahih al-Bukhari 2025',
  },
  {
    id: 'adab',
    title: "Bahs va ixtilofdan uzoq bo'ling",
    detail: "Ixtilof sabab Qadr kechasi aniq vaqti bildirilmagan; adabni saqlash muhim.",
    source: 'Sahih al-Bukhari 2023',
  },
];

const QADR_DUA_TEXT = "Allohumma innaka Afuwwun tuhibbul afwa fa'fu anni";
const DEFAULT_DUA_TARGETS = [
  "O'zim va oilam uchun hidayat, afv va baraka",
  "Ota-onam salomatligi va uzoq umr",
  "Ummat birligi va mazlumlarga yordam",
];

/* ─── Helpers ──────────────────────────────────────────────────── */

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getCheckKey(catId, daily, idx) {
  return daily ? `${catId}_${getTodayKey()}_${idx}` : `${catId}_${idx}`;
}

function getActiveRamadanStartDate() {
  // Approximate Ramadan start dates (local calendar can vary by moon sighting).
  const knownStarts = ['2025-03-01', '2026-02-18', '2027-02-08'];
  const now = new Date();
  let activeStart = new Date(`${knownStarts[0]}T00:00:00`);

  knownStarts.forEach((date) => {
    const candidate = new Date(`${date}T00:00:00`);
    if (candidate <= now) {
      activeStart = candidate;
    }
  });

  return activeStart;
}

function getRamadanDayLocal() {
  const start = getActiveRamadanStartDate();
  const diff = Date.now() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getNightStartDate(day, ramadanStartDate) {
  const date = new Date(ramadanStartDate);
  date.setDate(date.getDate() + day - 1);
  date.setHours(20, 0, 0, 0);
  return date;
}

function formatCountdown(ms) {
  if (ms <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const HERO_STARS = Array.from({ length: 50 }).map((_, i) => {
  const seed = i + 1;
  return {
    left: `${(pseudoRandom(seed) * 100).toFixed(2)}%`,
    top: `${(pseudoRandom(seed + 50) * 100).toFixed(2)}%`,
    delay: `${(pseudoRandom(seed + 100) * 4).toFixed(2)}s`,
    size: `${(pseudoRandom(seed + 150) * 2.5 + 1).toFixed(1)}px`,
    opacity: (pseudoRandom(seed + 200) * 0.6 + 0.3).toFixed(2),
  };
});

const DUA_STARS = Array.from({ length: 20 }).map((_, i) => {
  const seed = i + 301;
  return {
    left: `${(pseudoRandom(seed) * 100).toFixed(2)}%`,
    top: `${(pseudoRandom(seed + 20) * 100).toFixed(2)}%`,
    animationDelay: `${(pseudoRandom(seed + 40) * 3).toFixed(2)}s`,
  };
});

/* ─── Component ────────────────────────────────────────────────── */

export default function LastTenDays() {
  const ramadanDay = getRamadanDayLocal();
  const autoDayInLast10 = ramadanDay >= 21 && ramadanDay <= 30 ? ramadanDay : null;

  const [followAutoDay, setFollowAutoDay] = useState(() => {
    try {
      const raw = localStorage.getItem('rmd_lt_follow_auto_day');
      if (raw === null) {
        return autoDayInLast10 !== null;
      }
      return raw === '1';
    } catch {
      return autoDayInLast10 !== null;
    }
  });

  const [manualDay, setManualDay] = useState(() => {
    try {
      const raw = Number(localStorage.getItem('rmd_lt_manual_day'));
      return LAST_TEN_DAYS.includes(raw) ? raw : 27;
    } catch {
      return 27;
    }
  });

  const todayInLast10 = followAutoDay ? autoDayInLast10 : manualDay;
  const isManualMode = !followAutoDay;

  const [checks, setChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rmd_lt_checks') || '{}');
    } catch {
      return {};
    }
  });

  const [qadrNightChecks, setQadrNightChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rmd_lt_qadr_nights') || '{}');
    } catch {
      return {};
    }
  });
  const [duaTargets, setDuaTargets] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('rmd_lt_dua_targets') || '[]');
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    } catch {
      // ignore bad storage and fallback to defaults
    }

    return DEFAULT_DUA_TARGETS.map((text, idx) => ({ id: `default_${idx}`, text, done: false }));
  });
  const [duaInput, setDuaInput] = useState('');
  const [duaCopied, setDuaCopied] = useState(false);
  const [duaTransferNote, setDuaTransferNote] = useState('');
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleQadrNight = (day) => {
    setQadrNightChecks((prev) => {
      const next = { ...prev, [day]: !prev[day] };
      localStorage.setItem('rmd_lt_qadr_nights', JSON.stringify(next));
      return next;
    });
  };

  const setAutoMode = () => {
    setFollowAutoDay(true);
    localStorage.setItem('rmd_lt_follow_auto_day', '1');
  };

  const setManualModeDay = (day) => {
    setManualDay(day);
    setFollowAutoDay(false);
    localStorage.setItem('rmd_lt_manual_day', String(day));
    localStorage.setItem('rmd_lt_follow_auto_day', '0');
  };

  const persistDuaTargets = (next) => {
    setDuaTargets(next);
    localStorage.setItem('rmd_lt_dua_targets', JSON.stringify(next));
  };

  const addDuaTarget = () => {
    const text = duaInput.trim();
    if (!text) {
      return;
    }

    const next = [...duaTargets, { id: `${Date.now()}`, text, done: false }];
    persistDuaTargets(next);
    setDuaInput('');
  };

  const toggleDuaTarget = (id) => {
    const next = duaTargets.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    persistDuaTargets(next);
  };

  const removeDuaTarget = (id) => {
    const next = duaTargets.filter((item) => item.id !== id);
    persistDuaTargets(next);
  };

  const copyQadrDua = async () => {
    try {
      await navigator.clipboard.writeText(QADR_DUA_TEXT);
      setDuaCopied(true);
      setTimeout(() => setDuaCopied(false), 1400);
    } catch {
      setDuaCopied(false);
    }
  };

  const exportDuaTargets = () => {
    const payload = {
      type: 'ramadan_dua_targets_v1',
      exportedAt: new Date().toISOString(),
      items: duaTargets.map((item) => ({ text: item.text, done: item.done })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dua-targets.json';
    a.click();
    URL.revokeObjectURL(url);
    setDuaTransferNote("Duo ro'yxati export qilindi");
    setTimeout(() => setDuaTransferNote(''), 2000);
  };

  const importDuaTargets = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const sourceItems = Array.isArray(parsed) ? parsed : parsed.items;

      if (!Array.isArray(sourceItems)) {
        throw new Error('Invalid import shape');
      }

      const normalized = sourceItems
        .map((item, idx) => {
          const rawText = typeof item === 'string' ? item : item?.text;
          const done = typeof item?.done === 'boolean' ? item.done : false;
          const cleanText = typeof rawText === 'string' ? rawText.trim() : '';

          if (!cleanText) {
            return null;
          }

          return { id: `imp_${Date.now()}_${idx}`, text: cleanText, done };
        })
        .filter(Boolean);

      if (!normalized.length) {
        throw new Error('No valid items');
      }

      persistDuaTargets(normalized);
      setDuaTransferNote(`${normalized.length} ta duo import qilindi`);
    } catch {
      setDuaTransferNote("Import fayli noto'g'ri formatda");
    } finally {
      // allow selecting same file again
      event.target.value = '';
      setTimeout(() => setDuaTransferNote(''), 2400);
    }
  };

  const toggle = (key) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('rmd_lt_checks', JSON.stringify(next));
      return next;
    });
  };

  const getProgress = (cat) => {
    const total = cat.items.length;
    const done = cat.items.filter((_, i) => checks[getCheckKey(cat.id, cat.daily, i)]).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const totalAll = CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const doneAll = CATEGORIES.reduce(
    (s, c) => s + c.items.filter((_, i) => checks[getCheckKey(c.id, c.daily, i)]).length,
    0,
  );
  const overallPct = Math.round((doneAll / totalAll) * 100);
  const qadrDoneCount = QADR_NIGHTS.filter((day) => qadrNightChecks[day]).length;
  const qadrRemainingCount = QADR_NIGHTS.length - qadrDoneCount;
  const qadrPct = Math.round((qadrDoneCount / QADR_NIGHTS.length) * 100);
  const duaDoneCount = duaTargets.filter((item) => item.done).length;
  const duaPct = duaTargets.length ? Math.round((duaDoneCount / duaTargets.length) * 100) : 0;

  const nextQadrNight =
    QADR_NIGHTS.find((day) => {
      if (todayInLast10) {
        return day >= todayInLast10 && !qadrNightChecks[day];
      }
      return !qadrNightChecks[day];
    }) ?? null;

  const ramadanStartDate = getActiveRamadanStartDate();
  const countdownTargetDay =
    todayInLast10 && todayInLast10 % 2 !== 0 && !qadrNightChecks[todayInLast10]
      ? todayInLast10
      : nextQadrNight;
  const countdownTargetDate = countdownTargetDay
    ? getNightStartDate(countdownTargetDay, ramadanStartDate)
    : null;
  const countdownText = countdownTargetDate
    ? formatCountdown(Math.max(0, countdownTargetDate.getTime() - nowTs))
    : '00:00:00';

  const smartFocus = [];

  if (countdownTargetDay) {
    smartFocus.push({
      id: `focus_qadr_${countdownTargetDay}`,
      title: `${countdownTargetDay}-kecha fokus`,
      detail: "Qadr duosi, Qur'on va istig'forni bugungi asosiy blok sifatida bajaring.",
    });
  }

  const incompleteDua = duaTargets.find((item) => !item.done);
  if (incompleteDua) {
    smartFocus.push({
      id: `focus_dua_${incompleteDua.id}`,
      title: 'Shaxsiy duo niyati',
      detail: incompleteDua.text,
    });
  }

  CATEGORIES.forEach((cat) => {
    if (smartFocus.length >= 3) {
      return;
    }
    const idx = cat.items.findIndex((_, i) => !checks[getCheckKey(cat.id, cat.daily, i)]);
    if (idx === -1) {
      return;
    }

    smartFocus.push({
      id: `focus_${cat.id}_${idx}`,
      title: cat.title,
      detail: cat.items[idx],
    });
  });

  const ramadanPhase = todayInLast10 ? 'active' : ramadanDay < 21 ? 'before' : 'after';
  const phaseMessage =
    ramadanPhase === 'active'
      ? `${todayInLast10}-kun ${isManualMode ? "(qo'lda tanlangan)" : ''}. Bugungi kecha uchun kuchli ibodat rejasi tuzing va toq kechalarni alohida belgilang.`
      : ramadanPhase === 'before'
        ? "Oxirgi 10 kun hali boshlanmadi. Hozirdan duo ro'yxati va tungi ibodat rejasini tayyorlab qo'ying."
        : "Oxirgi 10 kun yakunlangan. Keyingi Ramazon uchun reja va odatlarni saqlab qoling.";

  const circumference = 2 * Math.PI * 28;

  return (
    <div className="lt-page">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="lt-hero">
        <div className="lt-hero-bg" />
        <div className="lt-stars-layer" aria-hidden>
          {HERO_STARS.map((s, i) => (
            <span
              key={i}
              className="lt-star"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>

        <div className="lt-hero-inner">
          <div className="lt-moon-wrap">
            <div className="lt-moon">☪</div>
            <div className="lt-moon-glow" />
          </div>
          <h1 className="lt-hero-title">Oxirgi 10 Kun</h1>
          <p className="lt-hero-sub">
            Ramazonning eng muborak kunlari — Qadr kechasini izlab ibodat qiling
          </p>

          {/* Overall progress ring */}
          <div className="lt-hero-ring-wrap">
            <svg className="lt-hero-ring" viewBox="0 0 72 72" width="120" height="120">
              <circle cx="36" cy="36" r="28" strokeWidth="5" className="lt-ring-track" />
              <circle
                cx="36"
                cy="36"
                r="28"
                strokeWidth="5"
                className="lt-ring-fill"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - overallPct / 100)}
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div className="lt-hero-ring-label">
              <span className="lt-ring-pct">{overallPct}%</span>
              <span className="lt-ring-sub">Bajarildi</span>
            </div>
          </div>

          <div className="lt-hero-stats">
            <div className="lt-hero-stat">
              <span className="lt-stat-num">{doneAll}</span>
              <span className="lt-stat-lbl">Amal</span>
            </div>
            <div className="lt-stat-sep" />
            <div className="lt-hero-stat">
              <span className="lt-stat-num">{totalAll - doneAll}</span>
              <span className="lt-stat-lbl">Qoldi</span>
            </div>
            <div className="lt-stat-sep" />
            <div className="lt-hero-stat">
              <span className="lt-stat-num">{CATEGORIES.length}</span>
              <span className="lt-stat-lbl">Bo'lim</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="lt-content">

        {/* Days strip */}
        <section className="lt-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">✨</span>
            <div>
              <h2 className="lt-section-title">Qadr kechalari</h2>
              <p className="lt-section-desc">Toq kunlar — Qadr kechasi ehtimoli yuqori</p>
            </div>
          </div>
          <div className="lt-day-mode-row">
            <button
              type="button"
              className={`lt-day-mode-btn${followAutoDay ? ' active' : ''}`}
              onClick={setAutoMode}
            >
              Auto kun
              <span className="lt-day-mode-note">
                {autoDayInLast10 ? `${autoDayInLast10}-kun` : "Hozir 10 kun ichida emas"}
              </span>
            </button>
            <button
              type="button"
              className={`lt-day-mode-btn${isManualMode ? ' active' : ''}`}
              onClick={() => setManualModeDay(manualDay)}
            >
              Qo'lda tanlash
              <span className="lt-day-mode-note">{manualDay}-kun fokus</span>
            </button>
          </div>
          <div className="lt-day-pick-row">
            {LAST_TEN_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={`lt-day-pick-btn${todayInLast10 === day ? ' active' : ''}`}
                onClick={() => setManualModeDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="lt-days-grid">
            {LAST_TEN_DAYS.map((day) => {
              const isQadr = day % 2 !== 0;
              const isToday = day === todayInLast10;
              return (
                <div
                  key={day}
                  className={`lt-day-card${isQadr ? ' qadr' : ''}${isToday ? ' today' : ''}`}
                >
                  {isQadr && <div className="lt-day-glow" />}
                  <span className="lt-day-num">{day}</span>
                  <span className="lt-day-lbl">-kun</span>
                  {isQadr && <span className="lt-qadr-badge">⭐</span>}
                  {isToday && <span className="lt-today-badge">Bugun</span>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="lt-section lt-focus-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Plan</span>
            <div>
              <h2 className="lt-section-title">10 kechalik amaliy reja</h2>
              <p className="lt-section-desc">Har kecha nima qilish kerakligi aniq ketma-ketlikda</p>
            </div>
          </div>
          <div className="lt-focus-layout">
            <div className="lt-focus-plan">
              <p className="lt-focus-kicker">
                {todayInLast10 ? `${todayInLast10}-kecha fokus` : 'Qadr kechasi rejimi'}
              </p>
              <p className="lt-focus-message">{phaseMessage}</p>
              <div className="lt-focus-steps">
                {QADR_NIGHT_FLOW.map((step) => (
                  <div key={step.id} className="lt-focus-step">
                    <span className="lt-focus-time">{step.time}</span>
                    <p className="lt-focus-task">{step.task}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lt-focus-track">
              <div className="lt-focus-metrics">
                <div className="lt-focus-metric">
                  <span className="lt-focus-value">{nextQadrNight ? `${nextQadrNight}-kun` : 'Yakun'}</span>
                  <span className="lt-focus-label">Keyingi toq kecha</span>
                </div>
                <div className="lt-focus-metric">
                  <span className="lt-focus-value">{qadrDoneCount}/5</span>
                  <span className="lt-focus-label">Belgilangan kechalar</span>
                </div>
                <div className="lt-focus-metric">
                  <span className="lt-focus-value">{qadrRemainingCount}</span>
                  <span className="lt-focus-label">Qolgan toq kecha</span>
                </div>
              </div>

              <div className="lt-progress-bar lt-focus-progress">
                <div
                  className="lt-progress-fill lt-focus-progress-fill"
                  style={{ width: `${qadrPct}%` }}
                />
              </div>

              <div className="lt-qadr-pills">
                {QADR_NIGHTS.map((day) => {
                  const isDone = !!qadrNightChecks[day];
                  const isToday = day === todayInLast10;
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`lt-qadr-pill${isDone ? ' done' : ''}${isToday ? ' today' : ''}`}
                      onClick={() => toggleQadrNight(day)}
                    >
                      <span className="lt-qadr-pill-day">{day}-kecha</span>
                      <span className="lt-qadr-pill-state">{isDone ? 'Bajarildi' : 'Belgila'}</span>
                    </button>
                  );
                })}
              </div>
              <p className="lt-focus-note">Toq kecha tugagach belgilang, keyingi reja avtomatik ko'rinadi.</p>
            </div>
          </div>
        </section>

        <section className="lt-section lt-research-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Dalil</span>
            <div>
              <h2 className="lt-section-title">Sunnat asosidagi aniq amallar</h2>
              <p className="lt-section-desc">Qadr kechasi uchun tekshirilgan dalillarga tayangan yo'l-yo'riq</p>
            </div>
          </div>

          <div className="lt-research-grid">
            {RESEARCH_ACTIONS.map((item) => (
              <article key={item.id} className="lt-research-card">
                <h3 className="lt-research-title">{item.title}</h3>
                <p className="lt-research-detail">{item.detail}</p>
                <span className="lt-research-source">{item.source}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="lt-section lt-smart-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Focus</span>
            <div>
              <h2 className="lt-section-title">Bugungi 3 ta eng muhim amal</h2>
              <p className="lt-section-desc">Chalg'imasdan eng kerakli amallarga e'tibor qarating</p>
            </div>
          </div>

          <div className="lt-smart-layout">
            <div className="lt-countdown-card">
              <span className="lt-countdown-label">
                {countdownTargetDay ? `${countdownTargetDay}-kecha boshlanishiga` : 'Kutilayotgan kecha'}
              </span>
              <span className="lt-countdown-time">{countdownText}</span>
              <p className="lt-countdown-note">
                {countdownTargetDay
                  ? "Kechani oldindan rejalashtiring va amallar ro'yxatini tayyorlab qo'ying."
                  : "Barcha toq kechalar belgilangan. Endi odatlarni barqaror saqlang."}
              </p>
            </div>

            <div className="lt-smart-cards">
              {smartFocus.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="lt-smart-card">
                  <span className="lt-smart-rank">#{idx + 1}</span>
                  <h3 className="lt-smart-title">{item.title}</h3>
                  <p className="lt-smart-detail">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lt-section lt-dua-plan-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Dua</span>
            <div>
              <h2 className="lt-section-title">Shaxsiy duo reja</h2>
              <p className="lt-section-desc">Qadr kechasi uchun aniq duo niyatlaringizni yozib boring</p>
            </div>
          </div>

          <div className="lt-dua-plan-top">
            <div className="lt-dua-plan-stat">
              <span className="lt-dua-plan-value">{duaDoneCount}/{duaTargets.length}</span>
              <span className="lt-dua-plan-label">Bajarilgan duo niyat</span>
            </div>
            <div className="lt-progress-bar lt-dua-plan-progress">
              <div
                className="lt-progress-fill lt-dua-plan-fill"
                style={{ width: `${duaPct}%` }}
              />
            </div>
          </div>

          <div className="lt-dua-transfer-row">
            <button type="button" className="lt-dua-transfer-btn" onClick={exportDuaTargets}>
              Export
            </button>
            <label className="lt-dua-transfer-btn lt-dua-transfer-import">
              Import
              <input
                type="file"
                accept=".json,application/json"
                className="lt-dua-transfer-input"
                onChange={importDuaTargets}
              />
            </label>
            {duaTransferNote && <span className="lt-dua-transfer-note">{duaTransferNote}</span>}
          </div>

          <div className="lt-dua-plan-input-row">
            <input
              value={duaInput}
              onChange={(e) => setDuaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addDuaTarget();
                }
              }}
              className="lt-dua-plan-input"
              type="text"
              placeholder="Masalan: farzandlarimga ilm va odob ber"
            />
            <button type="button" className="lt-dua-plan-add" onClick={addDuaTarget}>
              Qo'shish
            </button>
          </div>

          <div className="lt-dua-targets">
            {duaTargets.length === 0 && (
              <p className="lt-dua-empty">Hali duo niyat qo'shilmagan. Yuqoridan yangi niyat yozing.</p>
            )}
            {duaTargets.map((item) => (
              <div key={item.id} className={`lt-dua-target${item.done ? ' done' : ''}`}>
                <button
                  type="button"
                  className={`lt-dua-target-check${item.done ? ' done' : ''}`}
                  onClick={() => toggleDuaTarget(item.id)}
                >
                  {item.done ? 'v' : ''}
                </button>
                <p className="lt-dua-target-text">{item.text}</p>
                <button
                  type="button"
                  className="lt-dua-target-remove"
                  onClick={() => removeDuaTarget(item.id)}
                >
                  O'chirish
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="lt-section lt-hadith-cta-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Hadis</span>
            <div>
              <h2 className="lt-section-title">Hadis va oyatlar alohida sahifada</h2>
              <p className="lt-section-desc">Qadr mavzusidagi barcha hadislarni alohida, qulay ko'rinishda oching</p>
            </div>
          </div>
          <div className="lt-hadith-cta">
            <p className="lt-hadith-cta-text">
              Filter va batafsil o'qish funksiyalari Hadislar sahifasiga ko'chirildi.
              Bu sahifada esa faqat amaliy checklist va ibodat fokus qoldi.
            </p>
            <Link to="/hadislar" className="lt-hadith-cta-btn">
              Hadislar sahifasiga o'tish
            </Link>
          </div>
        </section>

        <section className="lt-section lt-sunnah-cta-section">
          <div className="lt-section-head">
            <span className="lt-section-icon-wrap">Sunnat</span>
            <div>
              <h2 className="lt-section-title">Sunnatlar alohida sahifada</h2>
              <p className="lt-section-desc">Sunnat amallarni alohida kuzatish uchun maxsus sahifaga o'ting</p>
            </div>
          </div>
          <div className="lt-sunnah-cta">
            <p className="lt-sunnah-cta-text">
              Kecha, saharlik, zikr, i&apos;tikof va iftor sunnatlari endi alohida sahifada.
              Bu yerda esa faqat Qadr 10 kechalikka fokus qoladi.
            </p>
            <Link to="/sunnatlar" className="lt-sunnah-cta-btn">
              Sunnatlar sahifasiga o'tish
            </Link>
          </div>
        </section>

        {/* Checklist sections */}
        {CATEGORIES.map((cat) => {
          const { done, total, pct } = getProgress(cat);
          const circ = 2 * Math.PI * 16;
          return (
            <section key={cat.id} className={`lt-section lt-cl-section lt-cl-${cat.color}`}>
              <div className="lt-cl-header">
                <div className="lt-cl-header-left">
                  <span className="lt-cl-icon">{cat.icon}</span>
                  <div>
                    <h2 className="lt-cl-title">{cat.title}</h2>
                    <p className="lt-cl-subtitle">{cat.subtitle}</p>
                  </div>
                </div>
                <div className="lt-cl-ring-wrap">
                  <svg viewBox="0 0 40 40" width="48" height="48">
                    <circle cx="20" cy="20" r="16" strokeWidth="3" className="lt-cl-track" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      strokeWidth="3"
                      className="lt-cl-fill"
                      strokeDasharray={circ}
                      strokeDashoffset={circ * (1 - pct / 100)}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                  <span className="lt-cl-ring-label">{done}/{total}</span>
                </div>
              </div>

              <div className="lt-progress-bar">
                <div className="lt-progress-fill" style={{ width: `${pct}%` }} />
              </div>

              <div className="lt-checklist">
                {cat.items.map((item, i) => {
                  const key = getCheckKey(cat.id, cat.daily, i);
                  const isDone = !!checks[key];
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`lt-check-item${isDone ? ' done' : ''}`}
                      onClick={() => toggle(key)}
                    >
                      <span className="lt-checkbox" aria-hidden>
                        {isDone && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="lt-check-text">{item}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Laylatul Qadr special dua */}
        <section className="lt-dua-wrap">
          <div className="lt-dua-card">
            <div className="lt-dua-stars" aria-hidden>
              {DUA_STARS.map((star, i) => (
                <span
                  key={i}
                  className="lt-dua-star"
                  style={{
                    left: star.left,
                    top: star.top,
                    animationDelay: star.animationDelay,
                  }}
                />
              ))}
            </div>
            <div className="lt-dua-hands">🤲</div>
            <h3 className="lt-dua-title">Qadr kechasi duosi</h3>
            <p className="lt-dua-arabic">
              اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي
            </p>
            <p className="lt-dua-transliteration">
              Allohumma innaka Afuwwun Tuhibbul afwa fa'fu anni
            </p>
            <p className="lt-dua-meaning">
              "Allohim, Sen kechiruvchisan, kechimni yaxshi ko'rasan — meni kechir!"
            </p>
            <button type="button" className="lt-dua-copy-btn" onClick={copyQadrDua}>
              {duaCopied ? 'Nusxa olindi' : 'Duoni nusxalash'}
            </button>
            <span className="lt-dua-source">Oyisha (r.a.) rivoyati — Tirmiziy</span>
          </div>
        </section>

      </div>
    </div>
  );
}
