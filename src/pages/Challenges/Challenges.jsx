import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PRESET_CHALLENGES } from '../../utils/constants';
import './Challenges.css';

const DIFFICULTY_CLASS = {
  Oson: 'diff-easy',
  "O'rta": 'diff-mid',
  Qiyin: 'diff-hard',
};

const DIFFICULTY_ORDER = {
  Oson: 1,
  "O'rta": 2,
  Qiyin: 3,
};

const CATEGORIES = [
  { id: 'all', label: 'Hammasi', icon: '✨' },
  { id: 'ibodot', label: 'Ibodot', icon: '🕌' },
  { id: 'zikr', label: 'Zikr', icon: '📿' },
  { id: 'sadaqa', label: 'Sadaqa', icon: '🤲' },
  { id: 'ilm', label: 'Ilm', icon: '📚' },
  { id: 'axloq', label: 'Axloq', icon: '💎' },
  { id: 'sogliq', label: "Sog'liq", icon: '🌱' },
];

const ICONS = ['⭐', '📚', '🕌', '🤲', '🌙', '📿', '💫', '🕊️', '🌿', '🎯', '💝', '🌺'];
const CATEGORY_LABEL_BY_ID = Object.fromEntries(
  CATEGORIES.filter((item) => item.id !== 'all').map((item) => [item.id, item.label]),
);
const CATEGORY_DETAIL_TIPS = {
  ibodot: "Vaqtni oldindan rejalang va ibodat oldidan niyatni yangilang.",
  zikr: "Zikr sonini sanadash uchun tasbeh yoki counterdan foydalaning.",
  sadaqa: "Sadaqa faqat pul emas, yaxshi muomala va yordam ham sadaqadir.",
  ilm: "Qisqa bo'lsa ham har kuni davomiy o'rganish natija beradi.",
  axloq: "Kichik odatlarni doimiy nazorat qilish axloqiy o'sishni tezlashtiradi.",
  sogliq: "Barqarorlik muhim: kamroq, lekin muntazam bajarish samaraliroq.",
  default: "Topshiriqni kichik bosqichlarga bo'lib, har bosqichni ketma-ket bajaring.",
};

const FREQUENCY_TARGETS = {
  Kunlik: { target: 30, label: '30 kunlik' },
  Haftalik: { target: 4, label: '4 haftalik' },
  'Har 3 kunda': { target: 10, label: '10 martalik' },
};

const DEFAULT_CUSTOM = {
  title: '',
  description: '',
  icon: '⭐',
  frequency: 'Kunlik',
  xpPerTask: 20,
  category: 'ibodot',
};

function getChallengeStreak(completedDays, challengeId) {
  const today = new Date().toISOString().slice(0, 10);
  const todayDone = completedDays?.[today]?.includes(challengeId);
  let streak = todayDone ? 1 : 0;
  const start = todayDone ? 1 : 0;

  for (let i = start + 1; i < 60; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (completedDays?.[key]?.includes(challengeId)) streak += 1;
    else break;
  }

  return streak;
}

function getFrequencyMeta(frequency) {
  return FREQUENCY_TARGETS[frequency] || FREQUENCY_TARGETS.Kunlik;
}

function normalizeText(value = '') {
  return String(value).toLowerCase();
}

function getDifficultyByXp(xpPerTask) {
  if (xpPerTask >= 40) return 'Qiyin';
  if (xpPerTask >= 25) return "O'rta";
  return 'Oson';
}

function getDescriptionSteps(description = '') {
  return String(description)
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildChallengeSteps(challenge) {
  if (!challenge) return [];

  const steps = [];
  const fromDescription = getDescriptionSteps(challenge.description);

  if (fromDescription.length) {
    fromDescription.forEach((item) => steps.push(item));
  } else {
    steps.push("Topshiriqni aniq niyat bilan boshlang.");
  }

  if (challenge.frequency === 'Kunlik') {
    steps.push("Har kuni kamida bir marta bajaring va kun yakunida tekshirib chiqing.");
  } else if (challenge.frequency === 'Haftalik') {
    steps.push("Hafta boshida kunlarni rejalang va kamida bir marta to'liq bajaring.");
  } else {
    steps.push("Har 3 kunda bir marta bajarish uchun aniq jadval belgilang.");
  }

  steps.push("Bajarganingizdan keyin Dashboard dagi faol topshiriqdan belgilab boring.");

  return Array.from(new Set(steps)).slice(0, 5);
}

export default function Challenges() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('active');
  const [category, setCategory] = useState('all');
  const [modal, setModal] = useState(false);
  const [detailChallenge, setDetailChallenge] = useState(null);
  const [custom, setCustom] = useState(DEFAULT_CUSTOM);
  const [customError, setCustomError] = useState('');

  const [activeQuery, setActiveQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('smart');

  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverFrequency, setDiscoverFrequency] = useState('all');
  const [discoverSort, setDiscoverSort] = useState('popular');
  const [discoverOnlyAvailable, setDiscoverOnlyAvailable] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const activeChallenges = useMemo(() => user?.activeChallenges || [], [user?.activeChallenges]);
  const completedDays = useMemo(() => user?.completedDays || {}, [user?.completedDays]);

  const activeIds = useMemo(
    () => activeChallenges.map((challenge) => challenge.id),
    [activeChallenges],
  );

  const todayDoneIds = useMemo(
    () => completedDays?.[today] || [],
    [completedDays, today],
  );

  const completionCountById = useMemo(() => {
    const counts = {};
    Object.values(completedDays).forEach((dayList) => {
      (dayList || []).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [completedDays]);

  const todayDoneCount = useMemo(
    () => activeIds.filter((id) => todayDoneIds.includes(id)).length,
    [activeIds, todayDoneIds],
  );

  const totalCompletions = useMemo(
    () => Object.values(completedDays).flat().length,
    [completedDays],
  );

  const completionRate = activeIds.length > 0
    ? Math.round((todayDoneCount / activeIds.length) * 100)
    : 0;

  const remainingToday = Math.max(0, activeIds.length - todayDoneCount);

  const todayPotentialXP = useMemo(() => {
    return activeChallenges.reduce((sum, challenge) => {
      if (todayDoneIds.includes(challenge.id)) return sum;
      return sum + (Number(challenge?.xpPerTask) || 20);
    }, 0);
  }, [activeChallenges, todayDoneIds]);

  const activeCards = useMemo(() => {
    return activeChallenges.map((challenge) => {
      const doneToday = todayDoneIds.includes(challenge.id);
      const totalDone = completionCountById[challenge.id] || 0;
      const streak = getChallengeStreak(completedDays, challenge.id);
      const xpPerTask = Number(challenge?.xpPerTask) || 20;
      const totalXP = totalDone * xpPerTask;
      const frequencyMeta = getFrequencyMeta(challenge.frequency);
      const pct = Math.min((totalDone / frequencyMeta.target) * 100, 100);

      return {
        ...challenge,
        doneToday,
        totalDone,
        streak,
        xpPerTask,
        totalXP,
        target: frequencyMeta.target,
        targetLabel: frequencyMeta.label,
        pct,
      };
    });
  }, [activeChallenges, completedDays, completionCountById, todayDoneIds]);

  const visibleActiveCards = useMemo(() => {
    const query = normalizeText(activeQuery.trim());

    const filtered = activeCards.filter((challenge) => {
      if (activeFilter === 'done' && !challenge.doneToday) return false;
      if (activeFilter === 'pending' && challenge.doneToday) return false;
      if (!query) return true;

      const haystack = normalizeText(
        `${challenge.title} ${challenge.description || ''} ${challenge.category || ''} ${challenge.frequency || ''}`,
      );
      return haystack.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const titleCmp = (a.title || '').localeCompare(b.title || '', 'uz', { sensitivity: 'base' });

      if (activeSort === 'streak') {
        if (b.streak !== a.streak) return b.streak - a.streak;
        return titleCmp;
      }

      if (activeSort === 'xp') {
        if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
        return titleCmp;
      }

      if (activeSort === 'progress') {
        if (b.pct !== a.pct) return b.pct - a.pct;
        return titleCmp;
      }

      if (activeSort === 'title') return titleCmp;

      if (a.doneToday !== b.doneToday) return Number(a.doneToday) - Number(b.doneToday);
      if (b.streak !== a.streak) return b.streak - a.streak;
      if (b.xpPerTask !== a.xpPerTask) return b.xpPerTask - a.xpPerTask;
      return titleCmp;
    });
  }, [activeCards, activeFilter, activeQuery, activeSort]);

  const visibleDiscoverCards = useMemo(() => {
    const query = normalizeText(discoverQuery.trim());

    const byCategory = category === 'all'
      ? PRESET_CHALLENGES
      : PRESET_CHALLENGES.filter((challenge) => challenge.category === category);

    const byFrequency = discoverFrequency === 'all'
      ? byCategory
      : byCategory.filter((challenge) => challenge.frequency === discoverFrequency);

    const byAvailability = discoverOnlyAvailable
      ? byFrequency.filter((challenge) => !activeIds.includes(challenge.id))
      : byFrequency;

    const byQuery = query
      ? byAvailability.filter((challenge) => {
        const haystack = normalizeText(
          `${challenge.title} ${challenge.description} ${challenge.category} ${challenge.difficulty} ${challenge.frequency}`,
        );
        return haystack.includes(query);
      })
      : byAvailability;

    return [...byQuery].sort((a, b) => {
      const titleCmp = (a.title || '').localeCompare(b.title || '', 'uz', { sensitivity: 'base' });

      if (discoverSort === 'xp') {
        if (b.xpPerTask !== a.xpPerTask) return b.xpPerTask - a.xpPerTask;
        if ((b.users || 0) !== (a.users || 0)) return (b.users || 0) - (a.users || 0);
        return titleCmp;
      }

      if (discoverSort === 'easy') {
        const diffA = DIFFICULTY_ORDER[a.difficulty] || 99;
        const diffB = DIFFICULTY_ORDER[b.difficulty] || 99;
        if (diffA !== diffB) return diffA - diffB;
        return titleCmp;
      }

      if (discoverSort === 'name') return titleCmp;

      if ((b.users || 0) !== (a.users || 0)) return (b.users || 0) - (a.users || 0);
      if (b.xpPerTask !== a.xpPerTask) return b.xpPerTask - a.xpPerTask;
      return titleCmp;
    });
  }, [activeIds, category, discoverFrequency, discoverOnlyAvailable, discoverQuery, discoverSort]);

  const detailData = useMemo(() => {
    if (!detailChallenge) return null;

    return {
      ...detailChallenge,
      steps: buildChallengeSteps(detailChallenge),
      difficulty: detailChallenge.difficulty || getDifficultyByXp(detailChallenge.xpPerTask),
      categoryLabel: CATEGORY_LABEL_BY_ID[detailChallenge.category] || 'Umumiy',
      tip: CATEGORY_DETAIL_TIPS[detailChallenge.category] || CATEGORY_DETAIL_TIPS.default,
    };
  }, [detailChallenge]);

  const join = (challenge) => {
    if (activeIds.includes(challenge.id)) return;
    updateUser({ activeChallenges: [...activeChallenges, challenge] });
  };

  const leave = (id) => {
    updateUser({ activeChallenges: activeChallenges.filter((challenge) => challenge.id !== id) });
  };

  const addCustom = () => {
    const title = custom.title.trim();
    if (!title) {
      setCustomError('Topshiriq nomini kiriting.');
      return;
    }

    const titleTaken = activeChallenges.some(
      (challenge) => normalizeText(challenge.title.trim()) === normalizeText(title),
    );

    if (titleTaken) {
      setCustomError('Bu nomdagi topshiriq allaqachon mavjud.');
      return;
    }

    const nextSeq = (user?.customChallengeSeq || 0) + 1;
    const xpPerTask = Number(custom.xpPerTask) || 20;

    const challenge = {
      ...custom,
      title,
      id: `custom_${nextSeq}`,
      users: 1,
      xpPerTask,
      difficulty: getDifficultyByXp(xpPerTask),
    };

    updateUser({
      activeChallenges: [...activeChallenges, challenge],
      customChallengeSeq: nextSeq,
    });

    setModal(false);
    setCustom(DEFAULT_CUSTOM);
    setCustomError('');
    setTab('active');
  };

  return (
    <div className="page-wrapper ch-page">
      <div className="ch-page-header card">
        <div className="ch-page-header-left">
          <h1 className="ch-page-title">Topshiriqlar</h1>
          <p className="ch-page-sub">Ramadan ibodatlarini challengega aylantiring</p>
        </div>
        <div className="ch-page-stats">
          <div className="ch-page-stat">
            <span className="cps-val">{activeIds.length}</span>
            <span className="cps-label">Faol</span>
          </div>
          <div className="ch-page-stat">
            <span className="cps-val">{todayDoneCount}</span>
            <span className="cps-label">Bugun</span>
          </div>
          <div className="ch-page-stat">
            <span className="cps-val">{completionRate}%</span>
            <span className="cps-label">Bajarilish</span>
          </div>
          <div className="ch-page-stat">
            <span className="cps-val">{totalCompletions}</span>
            <span className="cps-label">Jami</span>
          </div>
        </div>
      </div>

      <div className="ch-tabs">
        <button
          className={`ch-tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          ⚡ Faol
          {activeIds.length > 0 && <span className="ch-tab-badge">{activeIds.length}</span>}
        </button>
        <button
          className={`ch-tab ${tab === 'discover' ? 'active' : ''}`}
          onClick={() => setTab('discover')}
        >
          🔍 Kashf qilish
        </button>
        <button
          className="btn btn-primary ch-new-btn"
          onClick={() => {
            setTab('discover');
            setModal(true);
          }}
        >
          + Yangi
        </button>
      </div>

      {tab === 'active' && (
        <div className="ch-active-list fade-in">
          {activeChallenges.length === 0 ? (
            <div className="ch-empty card">
              <div className="ch-empty-icon">🎯</div>
              <h3>Hali topshiriqlar yo'q</h3>
              <p>Birinchi Ramadan challengeingizni qo'shing va XP to'plashni boshlang!</p>
              <button className="btn btn-primary" onClick={() => setTab('discover')}>
                Topshiriqlarni ko'rish
              </button>
            </div>
          ) : (
            <>
              <div className="ch-tools card">
                <div className="ch-tools-row">
                  <input
                    className="input-field ch-search"
                    placeholder="Faol topshiriqni qidiring..."
                    value={activeQuery}
                    onChange={(event) => setActiveQuery(event.target.value)}
                  />
                  <select
                    className="input-field ch-select"
                    value={activeSort}
                    onChange={(event) => setActiveSort(event.target.value)}
                  >
                    <option value="smart">Saralash: Aqlli</option>
                    <option value="streak">Saralash: Streak</option>
                    <option value="xp">Saralash: XP</option>
                    <option value="progress">Saralash: Progress</option>
                    <option value="title">Saralash: Nom</option>
                  </select>
                </div>

                <div className="ch-tools-row compact">
                  <div className="ch-filter-group">
                    <button
                      className={`ch-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      Barchasi
                    </button>
                    <button
                      className={`ch-filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('pending')}
                    >
                      Kutilmoqda
                    </button>
                    <button
                      className={`ch-filter-btn ${activeFilter === 'done' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('done')}
                    >
                      Bajarilgan
                    </button>
                  </div>

                  <div className="ch-tools-note">
                    Qolgan: {remainingToday} ta, potensial: +{todayPotentialXP} XP
                  </div>
                </div>
              </div>

              {visibleActiveCards.length === 0 ? (
                <div className="ch-list-empty card">Filter bo'yicha faol topshiriq topilmadi.</div>
              ) : (
                visibleActiveCards.map((challenge) => {
                  return (
                    <div key={challenge.id} className={`ch-active-card card ${challenge.doneToday ? 'done-today' : ''}`}>
                    <div className="ch-active-main">
                      <div className="ch-active-icon-wrap">
                        <span className="ch-active-icon">{challenge.icon}</span>
                      </div>
                        <div className="ch-active-body">
                          <div className="ch-active-top-row">
                            <span className="ch-active-title">{challenge.title}</span>
                            {challenge.doneToday
                              ? <span className="ch-status-badge done">✓ Bajarildi</span>
                              : <span className="ch-status-badge pending">Kutilmoqda</span>}
                          </div>
                          <div className="ch-active-meta">
                            <span>{challenge.frequency}</span>
                            <span className="ch-meta-dot">·</span>
                            <span>+{challenge.xpPerTask} XP / bajarish</span>
                            <span className="ch-meta-dot">·</span>
                            <span>{challenge.targetLabel}</span>
                          </div>
                        </div>
                        <div className="ch-active-actions">
                          <button
                            className="btn btn-ghost ch-detail-btn"
                            onClick={() => setDetailChallenge(challenge)}
                          >
                            Batafsil
                          </button>
                          <button
                            className="ch-leave-btn"
                            title="Tark etish"
                            onClick={() => leave(challenge.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="ch-active-progress-row">
                        <div className="progress-bar ch-progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${challenge.pct}%` }} />
                        </div>
                        <span className="ch-progress-label">{challenge.totalDone}/{challenge.target}</span>
                      </div>

                      <div className="ch-active-stats">
                        <div className="ch-active-stat">
                          <span className="cas-icon">✅</span>
                          <div className="cas-body">
                            <span className="cas-val">{challenge.totalDone}</span>
                            <span className="cas-label">bajarildi</span>
                          </div>
                        </div>
                        <div className="ch-active-stat">
                          <span className="cas-icon">🔥</span>
                          <div className="cas-body">
                            <span className="cas-val">{challenge.streak}</span>
                            <span className="cas-label">streak</span>
                          </div>
                        </div>
                        <div className="ch-active-stat">
                          <span className="cas-icon">⚡</span>
                          <div className="cas-body">
                            <span className="cas-val">{challenge.totalXP}</span>
                            <span className="cas-label">XP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {tab === 'discover' && (
        <div className="ch-discover fade-in">
          <div className="ch-tools card ch-discover-tools">
            <div className="ch-tools-row">
              <input
                className="input-field ch-search"
                placeholder="Challenge qidiring..."
                value={discoverQuery}
                onChange={(event) => setDiscoverQuery(event.target.value)}
              />
              <select
                className="input-field ch-select"
                value={discoverSort}
                onChange={(event) => setDiscoverSort(event.target.value)}
              >
                <option value="popular">Saralash: Ommabop</option>
                <option value="xp">Saralash: XP</option>
                <option value="easy">Saralash: Osondan qiyinga</option>
                <option value="name">Saralash: Nom</option>
              </select>
            </div>

            <div className="ch-tools-row compact">
              <select
                className="input-field ch-select"
                value={discoverFrequency}
                onChange={(event) => setDiscoverFrequency(event.target.value)}
              >
                <option value="all">Barcha chastota</option>
                <option value="Kunlik">Kunlik</option>
                <option value="Haftalik">Haftalik</option>
                <option value="Har 3 kunda">Har 3 kunda</option>
              </select>

              <button
                className={`ch-toggle-btn ${discoverOnlyAvailable ? 'active' : ''}`}
                onClick={() => setDiscoverOnlyAvailable((prev) => !prev)}
              >
                Faqat qo'shilmaganlar
              </button>
            </div>
          </div>

          <div className="ch-cat-filter">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`ch-cat-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="ch-discover-summary">
            Natija: {visibleDiscoverCards.length} ta challenge
          </div>

          <div className="ch-preset-grid">
            {visibleDiscoverCards.map((challenge) => {
              const joined = activeIds.includes(challenge.id);
              return (
                <div key={challenge.id} className={`ch-preset-card card ${joined ? 'joined' : ''}`}>
                  <div className="ch-preset-top">
                    <div className="ch-preset-icon-wrap">
                      <span>{challenge.icon}</span>
                    </div>
                    <div className="ch-preset-head">
                      <span className="ch-preset-title">{challenge.title}</span>
                      <span className={`ch-difficulty ${DIFFICULTY_CLASS[challenge.difficulty]}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    {joined && <span className="ch-joined-check">✓</span>}
                  </div>

                  <p className="ch-desc">{challenge.description}</p>

                  <div className="ch-preset-footer">
                    <div className="ch-preset-meta">
                      <span className="ch-meta-chip">👥 {challenge.users.toLocaleString()}</span>
                      <span className="ch-meta-chip">⚡ +{challenge.xpPerTask} XP</span>
                      <span className="ch-meta-chip">📅 {challenge.frequency}</span>
                    </div>
                    <div className="ch-preset-actions">
                      <button
                        className="btn btn-ghost ch-detail-btn"
                        onClick={() => setDetailChallenge(challenge)}
                      >
                        Batafsil
                      </button>
                      <button
                        className={`btn ch-join-btn ${joined ? 'btn-ghost ch-leave-btn-disc' : 'btn-primary'}`}
                        onClick={() => (joined ? leave(challenge.id) : join(challenge))}
                      >
                        {joined ? 'Tark etish' : "Qo'shilish"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="ch-preset-card ch-custom-card card" onClick={() => setModal(true)}>
              <div className="ch-custom-plus">+</div>
              <span className="ch-custom-title">O'z topshirig'ingiz</span>
              <p className="ch-desc">Shaxsiy ibodat rejasini qo'shing</p>
            </div>
          </div>

          {visibleDiscoverCards.length === 0 && (
            <div className="ch-discover-empty card">
              Filter bo'yicha challenge topilmadi.
            </div>
          )}
        </div>
      )}

      {detailData && (
        <div className="modal-overlay" onClick={() => setDetailChallenge(null)}>
          <div className="modal-box card ch-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{detailData.icon} {detailData.title}</h3>
              <p className="modal-sub">Topshiriq bo'yicha batafsil yo'riqnoma</p>
              <button className="modal-close" onClick={() => setDetailChallenge(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-chips">
                <span className="ch-meta-chip">📂 {detailData.categoryLabel}</span>
                <span className={`ch-difficulty ${DIFFICULTY_CLASS[detailData.difficulty]}`}>
                  {detailData.difficulty}
                </span>
                <span className="ch-meta-chip">📅 {detailData.frequency}</span>
                <span className="ch-meta-chip">⚡ +{detailData.xpPerTask} XP</span>
              </div>

              {detailData.description && (
                <div className="detail-block">
                  <h4>Nima uchun bu topshiriq muhim?</h4>
                  <p>{detailData.description}</p>
                </div>
              )}

              <div className="detail-block">
                <h4>Nima qilish kerak?</h4>
                <div className="detail-steps">
                  {detailData.steps.map((step, index) => (
                    <div key={`${detailData.id}-${step}`} className="detail-step">
                      <span className="detail-step-no">{index + 1}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-tip">
                <strong>Maslahat:</strong> {detailData.tip}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setDetailChallenge(null)}>
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Yangi topshiriq</h3>
              <p className="modal-sub">Shaxsiy Ramadan challengeingizni yarating</p>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Topshiriq nomi *</label>
                <input
                  className="input-field"
                  placeholder="Masalan: Bomdod namozi"
                  value={custom.title}
                  onChange={(event) => {
                    setCustomError('');
                    setCustom((prev) => ({ ...prev, title: event.target.value }));
                  }}
                />
              </div>

              <div className="form-group">
                <label>Tavsif</label>
                <input
                  className="input-field"
                  placeholder="Qisqacha tavsif (ixtiyoriy)"
                  value={custom.description}
                  onChange={(event) => setCustom((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Icon tanlang</label>
                <div className="icon-picker">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      className={`icon-opt ${custom.icon === icon ? 'selected' : ''}`}
                      onClick={() => setCustom((prev) => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-row">
                <div className="form-group">
                  <label>Kategoriya</label>
                  <select
                    className="input-field"
                    value={custom.category}
                    onChange={(event) => setCustom((prev) => ({ ...prev, category: event.target.value }))}
                  >
                    {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chastota</label>
                  <select
                    className="input-field"
                    value={custom.frequency}
                    onChange={(event) => setCustom((prev) => ({ ...prev, frequency: event.target.value }))}
                  >
                    <option>Kunlik</option>
                    <option>Haftalik</option>
                    <option>Har 3 kunda</option>
                  </select>
                </div>
              </div>

              <div className="modal-row">
                <div className="form-group">
                  <label>XP / bajarish</label>
                  <select
                    className="input-field"
                    value={custom.xpPerTask}
                    onChange={(event) => setCustom((prev) => ({ ...prev, xpPerTask: Number(event.target.value) }))}
                  >
                    <option value={10}>10 XP</option>
                    <option value={15}>15 XP</option>
                    <option value={20}>20 XP</option>
                    <option value={25}>25 XP</option>
                    <option value={30}>30 XP</option>
                    <option value={50}>50 XP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Qiyinlik</label>
                  <input
                    className="input-field"
                    value={getDifficultyByXp(custom.xpPerTask)}
                    readOnly
                  />
                </div>
              </div>

              {customError && <div className="custom-error">{customError}</div>}

              <div className="custom-preview card">
                <div className="custom-preview-top">
                  <span className="custom-preview-icon">{custom.icon}</span>
                  <div>
                    <div className="custom-preview-title">{custom.title.trim() || 'Yangi topshiriq'}</div>
                    <div className="custom-preview-meta">
                      {custom.frequency} · +{custom.xpPerTask} XP · {getDifficultyByXp(custom.xpPerTask)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor</button>
              <button
                className="btn btn-primary"
                onClick={addCustom}
                disabled={!custom.title.trim()}
              >
                Topshiriq qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
