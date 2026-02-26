import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IconBookmark } from '../../components/Icons/RamadanIcons';
import quranData from '../../../quran.json';
import './QuranHadith.css';

const SURAHS = [...quranData].sort((a, b) => Number(a.surahNo) - Number(b.surahNo));

const normalize = (value = '') => String(value).toLowerCase();

export default function QuranHadith() {
  const { user, updateUser } = useAuth();
  const lastRead = user?.quranLastRead || null;
  const [surahQuery, setSurahQuery] = useState('');
  const [verseQuery, setVerseQuery] = useState('');
  const [selectedSurahNo, setSelectedSurahNo] = useState(() => Number(lastRead?.surahNo) || 1);
  const [reciterId, setReciterId] = useState('1');
  const [playingVerse, setPlayingVerse] = useState(null);
  const verseAudioRef = useRef(null);

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

  const verses = useMemo(() => {
    const query = normalize(verseQuery).trim();

    return (selectedSurah?.translation || [])
      .map((text, index) => ({
        number: index + 1,
        text,
        audioUrl: verseAudios[index]?.url || verseAudios[index]?.originalUrl || '',
      }))
      .filter((verse) => !query || normalize(verse.text).includes(query) || String(verse.number).includes(query));
  }, [selectedSurah, verseAudios, verseQuery]);

  useEffect(() => {
    if (!playingVerse?.audioUrl || !verseAudioRef.current) return;
    verseAudioRef.current.play().catch(() => {});
  }, [playingVerse]);

  const stopVersePlayback = () => {
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      verseAudioRef.current.currentTime = 0;
    }
    setPlayingVerse(null);
  };

  const playVerse = (verse) => {
    if (!verse.audioUrl) return;
    const isSameVerse = playingVerse
      && Number(playingVerse.surahNo) === Number(selectedSurah.surahNo)
      && Number(playingVerse.number) === Number(verse.number)
      && playingVerse.audioUrl === verse.audioUrl;
    if (isSameVerse) {
      stopVersePlayback();
      return;
    }
    setPlayingVerse({
      surahNo: selectedSurah.surahNo,
      surahName: selectedSurah.surahName,
      number: verse.number,
      audioUrl: verse.audioUrl,
    });
    saveLastRead(verse.number);
  };

  const isVerseActive = (verse) => Boolean(
    playingVerse
      && Number(playingVerse.surahNo) === Number(selectedSurah.surahNo)
      && Number(playingVerse.number) === Number(verse.number)
      && playingVerse.audioUrl === verse.audioUrl,
  );

  const copyVerse = (verse) => {
    const text = `${selectedSurah.surahName} ${selectedSurah.surahNo}:${verse.number}\n${verse.text}`;
    navigator.clipboard?.writeText(text);
    saveLastRead(verse.number);
  };

  const saveLastRead = (verseNumber = 1) => {
    if (!selectedSurah || !updateUser) return;
    updateUser({
      quranLastRead: {
        surahNo: Number(selectedSurah.surahNo),
        surahName: selectedSurah.surahName,
        verseNumber: Number(verseNumber),
        savedAt: new Date().toISOString(),
      },
    });
  };

  const isBookmarkedVerse = (verse) => Boolean(
    lastRead
      && Number(lastRead.surahNo) === Number(selectedSurah.surahNo)
      && Number(lastRead.verseNumber) === Number(verse.number),
  );

  const jumpToLastRead = () => {
    if (!lastRead?.surahNo) return;
    stopVersePlayback();
    setSurahQuery('');
    setSelectedSurahNo(Number(lastRead.surahNo));
    setVerseQuery('');
    setTimeout(() => {
      const id = `verse-${lastRead.surahNo}-${lastRead.verseNumber || 1}`;
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
  };

  return (
    <div className="page-wrapper quran-page">
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
                    stopVersePlayback();
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

        <section className="quran-reader card">
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
                stopVersePlayback();
                setReciterId(event.target.value);
              }}
            >
              {reciters.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
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

          {playingVerse && (
            <div className="quran-verse-player">
              <div className="quran-verse-player-head">
                <div className="quran-player-head-text">
                  <span className="quran-player-pill">Oyat audio</span>
                  Tinglanyapti: {playingVerse.surahName} {playingVerse.surahNo}:{playingVerse.number}
                </div>
                <button
                  type="button"
                  className="quran-player-close"
                  onClick={stopVersePlayback}
                  aria-label="Audio playerni yopish"
                >
                  ×
                </button>
              </div>
              <audio
                ref={verseAudioRef}
                className="quran-audio-player quran-verse-audio"
                controls
                preload="none"
                src={playingVerse.audioUrl}
                onEnded={() => setPlayingVerse(null)}
              />
            </div>
          )}

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
                        onClick={() => saveLastRead(verse.number)}
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
    </div>
  );
}

