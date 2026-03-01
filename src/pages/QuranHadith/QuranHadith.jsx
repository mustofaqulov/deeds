import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IconBookmark } from '../../components/Icons/RamadanIcons';
import quranData from '../../../quran.json';
import './QuranHadith.css';

const SURAHS = [...quranData].sort((a, b) => Number(a.surahNo) - Number(b.surahNo));

const VIEW_MODES = [
  { id: 'comfortable', label: 'Oddiy' },
  { id: 'focus', label: 'Fokus' },
  { id: 'compact', label: 'Ixcham' },
];

const QURAN_XP = {
  verseStart: 2,
  verseComplete: 6,
  bookmark: 2,
  dailyTarget: 5,
  dailyBonus: 15,
};

const normalize = (value = '') => String(value).toLowerCase();
const getTodayKey = () => new Date().toISOString().slice(0, 10);

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
};

const normalizeQuranState = (raw = {}) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const xp = source.xp && typeof source.xp === 'object' ? source.xp : {};

  return {
    viewMode: source.viewMode || 'comfortable',
    lastRead: source.lastRead || null,
    resume: source.resume || null,
    xp: {
      started: xp.started && typeof xp.started === 'object' ? xp.started : {},
      completed: xp.completed && typeof xp.completed === 'object' ? xp.completed : {},
      bookmarked: xp.bookmarked && typeof xp.bookmarked === 'object' ? xp.bookmarked : {},
      daily: xp.daily && typeof xp.daily === 'object' ? xp.daily : {},
    },
  };
};

const cloneQuranState = (state) => ({
  viewMode: state.viewMode,
  lastRead: state.lastRead ? { ...state.lastRead } : null,
  resume: state.resume ? { ...state.resume } : null,
  xp: {
    started: { ...state.xp.started },
    completed: { ...state.xp.completed },
    bookmarked: { ...state.xp.bookmarked },
    daily: Object.fromEntries(
      Object.entries(state.xp.daily).map(([day, item]) => [
        day,
        {
          bonusClaimed: Boolean(item?.bonusClaimed),
          verses: item?.verses && typeof item.verses === 'object' ? { ...item.verses } : {},
        },
      ]),
    ),
  },
});

const getVerseKey = (surahNo, verseNumber) => `${Number(surahNo)}:${Number(verseNumber)}`;

export default function QuranHadith() {
  const { user, updateUser } = useAuth();
  const userRef = useRef(user);
  const pendingResumeRef = useRef(null);
  const verseAudioRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  const legacyLastRead = user?.quranLastRead || null;
  const persistedQuran = useMemo(
    () => normalizeQuranState(user?.appState?.quran),
    [user?.appState?.quran],
  );
  const lastRead = persistedQuran.lastRead || legacyLastRead || null;
  const savedResume = persistedQuran.resume || null;

  const [surahQuery, setSurahQuery] = useState('');
  const [verseQuery, setVerseQuery] = useState('');
  const [selectedSurahNo, setSelectedSurahNo] = useState(() => Number(lastRead?.surahNo) || 1);
  const [reciterId, setReciterId] = useState('1');
  const [playingVerse, setPlayingVerse] = useState(null);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const viewMode = persistedQuran.viewMode || 'comfortable';
  const [xpToast, setXpToast] = useState(null);

  useEffect(() => {
    if (!xpToast) return undefined;
    const timer = setTimeout(() => setXpToast(null), 2600);
    return () => clearTimeout(timer);
  }, [xpToast]);

  const commitQuranState = useCallback((producer) => {
    if (!updateUser) return;

    const currentUser = userRef.current || {};
    const currentAppState = (currentUser.appState && typeof currentUser.appState === 'object' && !Array.isArray(currentUser.appState))
      ? currentUser.appState
      : {};
    const currentQuran = normalizeQuranState(currentAppState.quran);
    const draft = cloneQuranState(currentQuran);
    const reward = producer(draft);

    const updates = {
      appState: {
        ...currentAppState,
        quran: draft,
      },
    };

    if (reward?.xp > 0) {
      updates.xp = (currentUser.xp || 0) + reward.xp;
      setXpToast({
        xp: reward.xp,
        lines: reward.lines || [reward.label || "Qur'on amali"],
      });
    }

    updateUser(updates);
  }, [updateUser]);

  const totalAyahCount = useMemo(
    () => SURAHS.reduce((sum, surah) => sum + (Number(surah.totalAyah) || 0), 0),
    [],
  );

  const filteredSurahs = useMemo(() => {
    const query = normalize(surahQuery).trim();
    if (!query) return SURAHS;

    return SURAHS.filter((surah) => {
      const fields = [
        surah.surahNo,
        surah.surahName,
        surah.surahNameArabic,
        surah.surahNameArabicLong,
        surah.surahNameTranslation,
      ];
      return fields.some((field) => normalize(field).includes(query));
    });
  }, [surahQuery]);

  const selectedSurah = useMemo(() => {
    const targetNo = Number(selectedSurahNo);
    return filteredSurahs.find((surah) => Number(surah.surahNo) === targetNo)
      || filteredSurahs[0]
      || SURAHS[0];
  }, [filteredSurahs, selectedSurahNo]);

  const reciters = useMemo(
    () => Object.entries(selectedSurah?.audio || {}).map(([id, item]) => ({
      id,
      name: item?.reciter || `Qori ${id}`,
      url: item?.url || item?.originalUrl || '',
    })),
    [selectedSurah],
  );

  const effectiveReciterId = reciters.some((item) => item.id === reciterId)
    ? reciterId
    : (reciters[0]?.id || '');
  const currentReciter = reciters.find((item) => item.id === effectiveReciterId) || reciters[0];
  const surahAudioUrl = currentReciter?.url || '';

  const verseAudios = useMemo(
    () => selectedSurah?.verseAudio?.[effectiveReciterId]?.audios || [],
    [selectedSurah, effectiveReciterId],
  );

  const allVerses = useMemo(
    () => (selectedSurah?.translation || []).map((text, index) => ({
      number: index + 1,
      text,
      audioUrl: verseAudios[index]?.url || verseAudios[index]?.originalUrl || '',
    })),
    [selectedSurah, verseAudios],
  );

  const verses = useMemo(() => {
    const query = normalize(verseQuery).trim();
    return allVerses
      .filter((verse) => !query || normalize(verse.text).includes(query) || String(verse.number).includes(query));
  }, [allVerses, verseQuery]);

  const awardQuranAction = useCallback((actionType, surahMeta, verseNumber) => {
    if (!surahMeta || !verseNumber) return;
    const verseKey = getVerseKey(surahMeta.surahNo, verseNumber);

    commitQuranState((draft) => {
      const rewards = [];

      if (actionType === 'start' && !draft.xp.started[verseKey]) {
        draft.xp.started[verseKey] = true;
        rewards.push({ xp: QURAN_XP.verseStart, label: 'Yangi oyat tinglash' });
      }

      if (actionType === 'complete' && !draft.xp.completed[verseKey]) {
        draft.xp.completed[verseKey] = true;
        rewards.push({ xp: QURAN_XP.verseComplete, label: 'Oyatni toliq tinglash' });

        const dayKey = getTodayKey();
        const dayState = draft.xp.daily[dayKey] || { verses: {}, bonusClaimed: false };
        dayState.verses = dayState.verses || {};
        dayState.verses[verseKey] = true;

        const uniqueCount = Object.keys(dayState.verses).length;
        if (uniqueCount >= QURAN_XP.dailyTarget && !dayState.bonusClaimed) {
          dayState.bonusClaimed = true;
          rewards.push({ xp: QURAN_XP.dailyBonus, label: `Kunlik ${QURAN_XP.dailyTarget} oyat bonusi` });
        }
        draft.xp.daily[dayKey] = dayState;
      }

      if (actionType === 'bookmark' && !draft.xp.bookmarked[verseKey]) {
        draft.xp.bookmarked[verseKey] = true;
        rewards.push({ xp: QURAN_XP.bookmark, label: 'Belgilangan oyat' });
      }

      if (!rewards.length) return null;
      return {
        xp: rewards.reduce((sum, item) => sum + item.xp, 0),
        lines: rewards.map((item) => `${item.label}: +${item.xp} XP`),
      };
    });
  }, [commitQuranState]);

  const saveLastRead = useCallback((surahMeta, verseNumber = 1) => {
    if (!surahMeta) return;
    commitQuranState((draft) => {
      draft.lastRead = {
        surahNo: Number(surahMeta.surahNo),
        surahName: surahMeta.surahName,
        verseNumber: Number(verseNumber),
        reciterId: String(effectiveReciterId || ''),
        savedAt: new Date().toISOString(),
      };
      return null;
    });
  }, [commitQuranState, effectiveReciterId]);

  const persistResume = useCallback((payload) => {
    if (!payload?.surahNo || !payload?.verseNumber) return;

    const safeTime = Math.max(0, Number(payload.currentTime) || 0);
    const safeDuration = Math.max(0, Number(payload.duration) || 0);

    commitQuranState((draft) => {
      draft.lastRead = {
        surahNo: Number(payload.surahNo),
        surahName: payload.surahName || '',
        verseNumber: Number(payload.verseNumber),
        reciterId: String(payload.reciterId || effectiveReciterId || ''),
        savedAt: new Date().toISOString(),
      };

      if (safeTime > 0.5) {
        draft.resume = {
          surahNo: Number(payload.surahNo),
          surahName: payload.surahName || '',
          verseNumber: Number(payload.verseNumber),
          reciterId: String(payload.reciterId || effectiveReciterId || ''),
          audioUrl: payload.audioUrl || '',
          currentTime: safeTime,
          duration: safeDuration,
          updatedAt: new Date().toISOString(),
        };
      } else {
        draft.resume = null;
      }
      return null;
    });
  }, [commitQuranState, effectiveReciterId]);

  const clearResume = useCallback(() => {
    commitQuranState((draft) => {
      draft.resume = null;
      return null;
    });
  }, [commitQuranState]);

  const stopVersePlayback = useCallback((options = {}) => {
    const { keepResume = true, clearSavedResume = false } = options;
    const audio = verseAudioRef.current;

    if (keepResume && playingVerse) {
      persistResume({
        ...playingVerse,
        currentTime: audio?.currentTime || audioTime || 0,
        duration: audio?.duration || audioDuration || 0,
      });
    }

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setPlayingVerse(null);
    setAudioTime(0);
    setAudioDuration(0);
    setIsAudioPlaying(false);

    if (clearSavedResume) clearResume();
  }, [audioDuration, audioTime, clearResume, persistResume, playingVerse]);

  const playVerse = useCallback((verse, options = {}) => {
    if (!selectedSurah || !verse?.audioUrl) return;

    const isSameVerse = playingVerse
      && Number(playingVerse.surahNo) === Number(selectedSurah.surahNo)
      && Number(playingVerse.number) === Number(verse.number)
      && playingVerse.audioUrl === verse.audioUrl;

    if (isSameVerse) {
      stopVersePlayback({ keepResume: true });
      return;
    }

    const canResumeFromSaved = savedResume
      && Number(savedResume.surahNo) === Number(selectedSurah.surahNo)
      && Number(savedResume.verseNumber) === Number(verse.number)
      && String(savedResume.reciterId || '') === String(effectiveReciterId || '');

    const resumeFrom = Math.max(
      0,
      Number(options.resumeFrom ?? (canResumeFromSaved ? savedResume.currentTime : 0)) || 0,
    );

    setPlayingVerse({
      surahNo: Number(selectedSurah.surahNo),
      surahName: selectedSurah.surahName,
      number: Number(verse.number),
      audioUrl: verse.audioUrl,
      reciterId: String(effectiveReciterId || ''),
      reciterName: currentReciter?.name || '',
      resumeFrom,
    });
    setAudioTime(resumeFrom);
    setAudioDuration(0);
    setIsAudioPlaying(false);
    saveLastRead(selectedSurah, verse.number);

    if (!options.skipXp) {
      awardQuranAction('start', selectedSurah, verse.number);
    }
  }, [
    awardQuranAction,
    currentReciter?.name,
    effectiveReciterId,
    playingVerse,
    saveLastRead,
    savedResume,
    selectedSurah,
    stopVersePlayback,
  ]);

  const isVerseActive = useCallback((verse) => Boolean(
    playingVerse
      && Number(playingVerse.surahNo) === Number(selectedSurah.surahNo)
      && Number(playingVerse.number) === Number(verse.number)
      && playingVerse.audioUrl === verse.audioUrl,
  ), [playingVerse, selectedSurah]);

  const isBookmarkedVerse = useCallback((verse) => Boolean(
    lastRead
      && Number(lastRead.surahNo) === Number(selectedSurah.surahNo)
      && Number(lastRead.verseNumber) === Number(verse.number),
  ), [lastRead, selectedSurah]);

  const copyVerse = (verse) => {
    const text = `${selectedSurah.surahName} ${selectedSurah.surahNo}:${verse.number}\n${verse.text}`;
    navigator.clipboard?.writeText(text);
    saveLastRead(selectedSurah, verse.number);
  };

  const bookmarkVerse = (verse) => {
    saveLastRead(selectedSurah, verse.number);
    awardQuranAction('bookmark', selectedSurah, verse.number);
  };

  const jumpToLastRead = () => {
    if (!lastRead?.surahNo) return;
    stopVersePlayback({ keepResume: true });
    setSurahQuery('');
    setSelectedSurahNo(Number(lastRead.surahNo));
    setVerseQuery('');
    setTimeout(() => {
      const id = `verse-${lastRead.surahNo}-${lastRead.verseNumber || 1}`;
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  };

  const resumeSavedAudio = () => {
    if (!savedResume?.surahNo || !savedResume?.verseNumber) return;
    stopVersePlayback({ keepResume: false });
    pendingResumeRef.current = {
      ...savedResume,
      reciterId: String(savedResume.reciterId || '1'),
    };
    setSurahQuery('');
    setVerseQuery('');
    setSelectedSurahNo(Number(savedResume.surahNo));
    setReciterId(String(savedResume.reciterId || '1'));
  };

  useEffect(() => {
    const pending = pendingResumeRef.current;
    if (!pending || !selectedSurah) return;
    if (Number(selectedSurah.surahNo) !== Number(pending.surahNo)) return;
    if (String(effectiveReciterId) !== String(pending.reciterId || effectiveReciterId)) return;

    const verse = allVerses.find((item) => Number(item.number) === Number(pending.verseNumber));
    if (!verse?.audioUrl) {
      pendingResumeRef.current = null;
      return;
    }

    playVerse(verse, { resumeFrom: Number(pending.currentTime) || 0, skipXp: true });
    setTimeout(() => {
      const id = `verse-${pending.surahNo}-${pending.verseNumber}`;
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 220);
    pendingResumeRef.current = null;
  }, [allVerses, effectiveReciterId, playVerse, selectedSurah]);

  useEffect(() => {
    if (!playingVerse?.audioUrl || !verseAudioRef.current) return;
    verseAudioRef.current.play().catch(() => {});
  }, [playingVerse]);

  useEffect(() => () => {
    if (!playingVerse || !verseAudioRef.current) return;
    persistResume({
      ...playingVerse,
      currentTime: verseAudioRef.current.currentTime || 0,
      duration: verseAudioRef.current.duration || 0,
    });
  }, [persistResume, playingVerse]);

  const activeVerseIndex = useMemo(() => {
    if (!playingVerse) return -1;
    return allVerses.findIndex((item) => Number(item.number) === Number(playingVerse.number));
  }, [allVerses, playingVerse]);

  const playAdjacentVerse = (offset) => {
    if (activeVerseIndex < 0) return;
    const next = allVerses[activeVerseIndex + offset];
    if (!next?.audioUrl) return;
    playVerse(next);
  };

  const toggleMiniPlayerPlayback = () => {
    if (!verseAudioRef.current) return;
    if (verseAudioRef.current.paused) {
      verseAudioRef.current.play().catch(() => {});
      return;
    }
    verseAudioRef.current.pause();
  };

  const handleViewModeChange = (modeId) => {
    commitQuranState((draft) => {
      draft.viewMode = modeId;
      return null;
    });
  };

  return (
    <div className={`page-wrapper quran-page ${playingVerse ? 'has-mini-player' : ''}`}>
      <div className="quran-hero card">
        <div>
          <h2>Qur'on sahifasi</h2>
          <p>`quran.json` dagi barcha 114 sura to'liq ko'rinadi.</p>
        </div>
        <div className="quran-hero-stats">
          <span className="badge badge-gold">114 sura</span>
          <span className="badge badge-accent">{totalAyahCount} oyat</span>
          {lastRead?.surahNo && (
            <button className="btn btn-outline quran-continue-btn" onClick={jumpToLastRead}>
              <IconBookmark size={14} />
              {lastRead.surahNo}:{lastRead.verseNumber || 1}
            </button>
          )}
          {savedResume?.surahNo && (
            <button className="btn btn-primary quran-continue-btn" onClick={resumeSavedAudio}>
              Davom: {savedResume.surahNo}:{savedResume.verseNumber} - {formatTime(savedResume.currentTime)}
            </button>
          )}
        </div>
      </div>

      <div className="quran-layout">
        <aside className="quran-surah-panel card">
          <div className="quran-panel-head">
            <h3>Suralar</h3>
            <span>{filteredSurahs.length} ta</span>
          </div>
          <input
            className="input-field"
            value={surahQuery}
            onChange={(event) => setSurahQuery(event.target.value)}
            placeholder="Sura qidirish..."
          />

          <div className="quran-surah-list">
            {filteredSurahs.map((surah) => {
              const active = Number(surah.surahNo) === Number(selectedSurahNo);
              return (
                <button
                  key={surah.surahNo}
                  className={`quran-surah-item ${active ? 'active' : ''}`}
                  onClick={() => {
                    stopVersePlayback({ keepResume: true });
                    setSelectedSurahNo(Number(surah.surahNo));
                  }}
                >
                  <div className="quran-surah-top">
                    <span className="quran-surah-no">{surah.surahNo}</span>
                    <span className="quran-surah-total">{surah.totalAyah} oyat</span>
                  </div>
                  <div className="quran-surah-name">{surah.surahName}</div>
                  <div className="quran-surah-arabic">{surah.surahNameArabic}</div>
                </button>
              );
            })}
            {!filteredSurahs.length && <div className="quran-empty">Sura topilmadi</div>}
          </div>
        </aside>

        <section className={`quran-reader card quran-view-${viewMode}`}>
          <header className="quran-reader-head">
            <div>
              <div className="quran-reader-kicker">{selectedSurah.revelationPlace} nozil bo'lgan</div>
              <h3>{selectedSurah.surahNo}. {selectedSurah.surahName}</h3>
              <p>{selectedSurah.surahNameArabicLong} - {selectedSurah.surahNameTranslation}</p>
            </div>
            <div className="quran-reader-actions">
              <span className="badge badge-success">{selectedSurah.totalAyah} oyat</span>
              {lastRead?.surahNo && (
                <span className="badge badge-accent">
                  Oxirgi: {lastRead.surahNo}:{lastRead.verseNumber || 1}
                </span>
              )}
            </div>
          </header>

          <div className="quran-controls">
            <input
              className="input-field"
              value={verseQuery}
              onChange={(event) => setVerseQuery(event.target.value)}
              placeholder="Oyat ichidan qidirish..."
            />
            <select
              className="input-field quran-reciter-select"
              value={effectiveReciterId}
              onChange={(event) => {
                stopVersePlayback({ keepResume: true });
                setReciterId(event.target.value);
              }}
            >
              {reciters.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="quran-view-switch">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`quran-view-btn ${viewMode === mode.id ? 'active' : ''}`}
                onClick={() => handleViewModeChange(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="quran-audio-row">
            <div className="quran-audio-head">
              <div className="quran-audio-kicker">Surah audio</div>
              <div className="quran-audio-reciter">{currentReciter?.name || 'Qori tanlanmagan'}</div>
            </div>
            {surahAudioUrl ? (
              <audio className="quran-audio-player" controls preload="none" src={surahAudioUrl} />
            ) : (
              <span className="quran-empty-inline">Audio topilmadi</span>
            )}
          </div>

          <div className="quran-verses">
            {verses.map((verse) => {
              const isActive = isVerseActive(verse);
              const isBookmarked = isBookmarkedVerse(verse);
              return (
                <article
                  key={verse.number}
                  id={`verse-${selectedSurah.surahNo}-${verse.number}`}
                  className={`quran-verse-item ${isActive ? 'playing' : ''} ${isBookmarked ? 'bookmarked' : ''}`}
                >
                  <div className="quran-verse-meta">
                    <span className="badge badge-gold">{selectedSurah.surahNo}:{verse.number}</span>
                    <div className="quran-verse-actions">
                      <button className="btn btn-ghost" onClick={() => copyVerse(verse)}>Nusxa</button>
                      <button
                        className={`btn ${isBookmarked ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => bookmarkVerse(verse)}
                      >
                        <IconBookmark size={14} />
                        Belgi
                      </button>
                      <button
                        className={`btn quran-voice-btn ${isActive ? 'btn-primary active' : 'btn-outline'}`}
                        disabled={!verse.audioUrl}
                        onClick={() => playVerse(verse)}
                      >
                        {isActive ? "To'xtatish" : 'Ovoz'}
                      </button>
                    </div>
                  </div>
                  <p className="quran-verse-text">{verse.text}</p>
                </article>
              );
            })}

            {!verses.length && <div className="quran-empty">Oyat topilmadi</div>}
          </div>
        </section>
      </div>

      {playingVerse && (
        <div className="quran-mini-player card">
          <audio
            ref={verseAudioRef}
            className="quran-audio-player quran-verse-audio quran-mini-audio-hidden"
            controls
            preload="none"
            src={playingVerse.audioUrl}
            onLoadedMetadata={(event) => {
              const duration = Number(event.currentTarget.duration) || 0;
              setAudioDuration(duration);
              const resumeAt = Math.max(0, Number(playingVerse.resumeFrom) || 0);
              if (resumeAt > 0.5 && (duration <= 0 || resumeAt < duration - 0.4)) {
                event.currentTarget.currentTime = resumeAt;
                setAudioTime(resumeAt);
              }
            }}
            onTimeUpdate={(event) => {
              setAudioTime(Number(event.currentTarget.currentTime) || 0);
              setAudioDuration(Number(event.currentTarget.duration) || 0);
            }}
            onPlay={() => setIsAudioPlaying(true)}
            onPause={(event) => {
              setIsAudioPlaying(false);
              const currentTime = Number(event.currentTarget.currentTime) || 0;
              const duration = Number(event.currentTarget.duration) || 0;
              if (duration > 0 && currentTime >= duration - 0.35) return;
              persistResume({
                ...playingVerse,
                currentTime,
                duration,
              });
            }}
            onEnded={(event) => {
              setIsAudioPlaying(false);
              setAudioTime(Number(event.currentTarget.duration) || 0);
              setAudioDuration(Number(event.currentTarget.duration) || 0);
              awardQuranAction(
                'complete',
                { surahNo: playingVerse.surahNo, surahName: playingVerse.surahName },
                playingVerse.number,
              );
              clearResume();
              setPlayingVerse(null);
              setAudioTime(0);
              setAudioDuration(0);
            }}
          />

          <div className="quran-mini-meta">
            <span className="quran-player-pill">Oyat audio</span>
            <strong>{playingVerse.surahName} {playingVerse.surahNo}:{playingVerse.number}</strong>
            <small>
              {playingVerse.reciterName || currentReciter?.name || 'Qori'} - {formatTime(audioTime)} / {formatTime(audioDuration)}
            </small>
          </div>

          <div className="quran-mini-controls">
            <button
              className="btn btn-outline"
              onClick={() => playAdjacentVerse(-1)}
              disabled={activeVerseIndex <= 0}
            >
              Oldingi
            </button>
            <button className="btn btn-primary" onClick={toggleMiniPlayerPlayback}>
              {isAudioPlaying ? 'Pauza' : 'Davom'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => playAdjacentVerse(1)}
              disabled={activeVerseIndex < 0 || activeVerseIndex >= allVerses.length - 1}
            >
              Keyingi
            </button>
            <button
              type="button"
              className="quran-player-close"
              onClick={() => stopVersePlayback({ keepResume: true })}
              aria-label="Audio playerni yopish"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {xpToast && (
        <div className="quran-xp-toast">
          <strong>+{xpToast.xp} XP</strong>
          <div className="quran-xp-toast-lines">
            {xpToast.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
