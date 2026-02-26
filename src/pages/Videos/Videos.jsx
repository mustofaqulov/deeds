import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LECTURES, VIDEO_CATEGORIES, VIDEO_XP_BONUS } from '../../utils/videoData';
import { playComplete, playLevelUp } from '../../utils/sound';
import { getLevelInfo } from '../../utils/helpers';
import {
  IconBookmark, IconCheckCircle, IconTarget, IconVideo,
} from '../../components/Icons/RamadanIcons';
import './Videos.css';

const VIDEO_XP_BOOST = 10;
const parseDurationToSeconds = (duration = '') => {
  const parts = String(duration).split(':').map((item) => Number(item));
  if (!parts.every(Number.isFinite) || parts.length === 0) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
};

export default function Videos() {
  const { user, updateUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [notesOnly, setNotesOnly] = useState(false);
  const [watchFilter, setWatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('smart');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteVideo, setNoteVideo] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const playerRef = useRef(null);
  const playerDivRef = useRef(null);
  const ytReady = useRef(false);
  const activeVideoRef = useRef(null);
  const onVideoEndRef = useRef(null);

  const watchedVideos = useMemo(() => user?.watchedVideos || {}, [user?.watchedVideos]);
  const videoNotes = useMemo(() => user?.videoNotes || {}, [user?.videoNotes]);
  const videoProgress = useMemo(() => user?.videoProgress || {}, [user?.videoProgress]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayWatched = user?.watchedToday?.[todayKey] || [];
  const activeVideoId = activeVideo?.id;
  const activeVideoYoutubeId = activeVideo?.videoId;
  const activeVideoProgress = activeVideoId ? Number(videoProgress[activeVideoId] || 0) : 0;
  const canResumeActive = !!activeVideo && !watchedVideos[activeVideo.id] && activeVideoProgress >= 20;

  const getVideoXp = (video) => (video?.xp || 0) + VIDEO_XP_BOOST;
  const formatClock = (seconds = 0) => {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const saveVideoProgress = useCallback((videoId, seconds) => {
    if (!videoId) return;
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const prev = user?.videoProgress || {};

    if (safe <= 0) {
      if (!(videoId in prev)) return;
      const next = { ...prev };
      delete next[videoId];
      updateUser({ videoProgress: next });
      return;
    }

    if (prev[videoId] === safe) return;
    updateUser({ videoProgress: { ...prev, [videoId]: safe } });
  }, [updateUser, user?.videoProgress]);
  const getRecommendations = () => {
    if (!activeVideo) return [];
    const sameCat = LECTURES.filter(v => v.categoryId === activeVideo.categoryId && v.id !== activeVideo.id);
    const pool = sameCat.length > 0 ? sameCat : LECTURES.filter(v => v.id !== activeVideo.id);
    return pool.slice(0, 4);
  };

  const openNoteModal = (video) => {
    if (!video) return;
    setNoteVideo(video);
    setNoteDraft(videoNotes[video.id] || '');
    setNoteSaved(false);
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setNoteSaved(false);
  };

  const resumeVideo = () => {
    setIsPaused(false);
    playerRef.current?.playVideo?.();
  };

  const onVideoEnd = useCallback((video) => {
    const currentWatchedVideos = user?.watchedVideos || {};
    if (currentWatchedVideos[video.id]) return; // allaqachon ko'rilgan

    const currentTodayWatched = user?.watchedToday?.[todayKey] || [];
    const xpGained = (video?.xp || 0) + VIDEO_XP_BOOST;
    const newWatched = { ...currentWatchedVideos, [video.id]: true };
    const newTodayWatched = {
      ...(user?.watchedToday || {}),
      [todayKey]: [...currentTodayWatched, video.id],
    };
    const newXP = (user?.xp || 0) + xpGained;

    // Level check
    const oldLevel = getLevelInfo(user?.xp || 0).current.level;
    const newLevel = getLevelInfo(newXP).current.level;

    let bonusXP = 0;
    const bonusMessages = [];

    // Bugungi 3 ta video bonusi
    const todayCount = (newTodayWatched[todayKey] || []).length;
    if (todayCount === VIDEO_XP_BONUS.daily3.count) {
      bonusXP += VIDEO_XP_BONUS.daily3.xp;
      bonusMessages.push(`Bonus: ${VIDEO_XP_BONUS.daily3.label}: +${VIDEO_XP_BONUS.daily3.xp} XP`);
    }

    // Kategoriya tugash bonusi
    const catVideos = LECTURES.filter(l => l.categoryId === video.categoryId);
    const catWatched = catVideos.filter(l => newWatched[l.id]);
    if (catWatched.length === catVideos.length) {
      bonusXP += VIDEO_XP_BONUS.category.xp;
      const cat = VIDEO_CATEGORIES.find(c => c.id === video.categoryId);
      bonusMessages.push(`Kategoriya tugadi: "${cat?.label}" +${VIDEO_XP_BONUS.category.xp} XP`);
    }

    // Barcha videolar bonusi
    const allWatched = LECTURES.filter(l => newWatched[l.id]);
    if (allWatched.length === LECTURES.length) {
      bonusXP += VIDEO_XP_BONUS.allVideos.xp;
      bonusMessages.push(`Barcha darsliklar bonusi: +${VIDEO_XP_BONUS.allVideos.xp} XP`);
    }

    const totalXP = newXP + bonusXP;
    const nextVideoProgress = { ...(user?.videoProgress || {}) };
    delete nextVideoProgress[video.id];
    updateUser({
      xp: totalXP,
      watchedVideos: newWatched,
      watchedToday: newTodayWatched,
      videoProgress: nextVideoProgress,
    });

    if (user?.soundEnabled !== false) {
      newLevel > oldLevel ? playLevelUp() : playComplete();
    }

    setToast({
      title: video.title,
      xp: xpGained,
      bonusXP,
      bonusMessages,
      isLevelUp: newLevel > oldLevel,
    });
    setTimeout(() => setToast(null), 6000);
    setNoteVideo(video);
    setNoteDraft(user?.videoNotes?.[video.id] || '');
    setNoteSaved(false);
    setNoteModalOpen(true);
  }, [todayKey, updateUser, user]);

  useEffect(() => {
    activeVideoRef.current = activeVideo;
  }, [activeVideo]);

  useEffect(() => {
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoEnd]);

  // YouTube IFrame API ni yuklash
  useEffect(() => {
    if (window.YT) { ytReady.current = true; return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { ytReady.current = true; };
    return () => { window.onYouTubeIframeAPIReady = null; };
  }, []);

  // Video ochilganda player yaratish
  useEffect(() => {
    if (!activeVideoYoutubeId || !playerDivRef.current) return;

    const createPlayer = () => {
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: activeVideoYoutubeId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, hl: 'uz' },
        events: {
          onStateChange: (e) => {
            // 2 = pauza, 0 = tugadi
            if (e.data === 2 || e.data === 0) {
              setIsPaused(true);
              if (e.data === 2 && activeVideoRef.current?.id) {
                const position = playerRef.current?.getCurrentTime?.() || 0;
                saveVideoProgress(activeVideoRef.current.id, position);
              }
              if (e.data === 0 && activeVideoRef.current && onVideoEndRef.current) {
                onVideoEndRef.current(activeVideoRef.current);
              }
              return;
            }
            setIsPaused(false);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          createPlayer();
        }
      }, 300);
      return () => clearInterval(interval);
    }

    return () => { if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; } };
  }, [activeVideoId, activeVideoYoutubeId, saveVideoProgress]);

  const saveNote = () => {
    if (!noteVideo) return;
    const trimmed = noteDraft.trim();
    const nextNotes = { ...(user?.videoNotes || {}) };
    if (trimmed) nextNotes[noteVideo.id] = trimmed;
    else delete nextNotes[noteVideo.id];
    updateUser({ videoNotes: nextNotes });
    setNoteSaved(true);
  };

  const categoryStats = useMemo(
    () => VIDEO_CATEGORIES.map((category) => {
      const inCategory = LECTURES.filter((item) => item.categoryId === category.id);
      const done = inCategory.filter((item) => Boolean(watchedVideos[item.id])).length;
      const noted = inCategory.filter((item) => Boolean((videoNotes[item.id] || '').trim())).length;
      const inProgress = inCategory.filter((item) => !watchedVideos[item.id] && Number(videoProgress[item.id] || 0) > 0).length;
      const pct = Math.round((done / Math.max(inCategory.length, 1)) * 100);
      return {
        ...category,
        total: inCategory.length,
        done,
        noted,
        inProgress,
        pct,
      };
    }),
    [videoNotes, videoProgress, watchedVideos],
  );

  const continueWatching = useMemo(
    () => LECTURES
      .filter((item) => !watchedVideos[item.id] && Number(videoProgress[item.id] || 0) > 0)
      .sort((a, b) => Number(videoProgress[b.id] || 0) - Number(videoProgress[a.id] || 0))
      .slice(0, 6),
    [videoProgress, watchedVideos],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const withMeta = LECTURES.filter((video) => {
      const watched = Boolean(watchedVideos[video.id]);
      const noted = Boolean((videoNotes[video.id] || '').trim());
      const savedProgress = Number(videoProgress[video.id] || 0);
      const matchCat = activeCategory === 'all' || video.categoryId === activeCategory;
      const matchSearch = q === '' || video.title.toLowerCase().includes(q);
      const matchNotes = !notesOnly || noted;

      let matchWatch = true;
      if (watchFilter === 'watched') matchWatch = watched;
      if (watchFilter === 'unwatched') matchWatch = !watched;
      if (watchFilter === 'progress') matchWatch = !watched && savedProgress > 0;

      return matchCat && matchSearch && matchNotes && matchWatch;
    });

    return withMeta.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'xp') return getVideoXp(b) - getVideoXp(a);
      if (sortBy === 'duration') return parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration);

      const watchedA = watchedVideos[a.id] ? 1 : 0;
      const watchedB = watchedVideos[b.id] ? 1 : 0;
      if (watchedA !== watchedB) return watchedA - watchedB;

      const progressA = Number(videoProgress[a.id] || 0);
      const progressB = Number(videoProgress[b.id] || 0);
      if (progressA !== progressB) return progressB - progressA;

      return a.title.localeCompare(b.title);
    });
  }, [activeCategory, notesOnly, search, sortBy, videoNotes, videoProgress, watchFilter, watchedVideos]);
  const suggestedVideo = filtered[0] || LECTURES[0] || null;

  const handleVideoSelect = (video) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPaused(false);
  };

  const resumeFromSaved = () => {
    if (!activeVideo) return;
    const saved = Number(videoProgress[activeVideo.id] || 0);
    if (saved <= 0 || !playerRef.current) return;
    playerRef.current.seekTo?.(saved, true);
    playerRef.current.playVideo?.();
    setIsPaused(false);
  };

  const totalWatched = Object.keys(watchedVideos).length;
  const totalVideos = LECTURES.length;
  const totalNoted = Object.keys(videoNotes).filter((id) => Boolean((videoNotes[id] || '').trim())).length;
  const totalInProgress = continueWatching.length;
  const progressPct = Math.round((totalWatched / Math.max(totalVideos, 1)) * 100);

  const recommendations = getRecommendations();
  const showRecoOverlay = isPaused && activeVideo && !noteModalOpen;

  return (
    <div className="page-wrapper videos-page">
      <div className="videos-layout">
        <section className="videos-main-col">
          <div className="videos-header card fade-in-up">
            <div className="videos-header-text">
              <h2><IconVideo size={20} /> Shayx Muhammad Sodiq darsliklari</h2>
              <p>Ko'rgan har bir darslik uchun XP yig'asiz</p>
              <div className="videos-header-meta">
                <span className="badge badge-gold">Ko'rildi: {totalWatched}/{totalVideos}</span>
                <span className="badge badge-accent">Note: {totalNoted}</span>
                <span className="badge badge-success">Davom etayotgan: {totalInProgress}</span>
              </div>
            </div>
            <div className="videos-overall-prog">
              <span className="vop-frac">{totalWatched}/{totalVideos}</span>
              <div className="progress-bar" style={{ width: 120 }}>
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="vop-pct">{progressPct}%</span>
            </div>
          </div>

          {/* Player */}
          {activeVideo ? (
            <div className="video-player-wrap card fade-in-up">
              <div className={`yt-frame-wrap ${showRecoOverlay ? 'show-reco' : ''}`}>
                <div id="yt-player" ref={playerDivRef} />
                {showRecoOverlay && (
                  <div className="video-reco-overlay">
                    <div className="video-reco-top">
                      <span className="video-reco-label">Pauza</span>
                      <button className="btn btn-outline" onClick={resumeVideo}>Davom ettirish</button>
                    </div>
                    <div className="video-reco-title">Bizning tavsiyalar</div>
                    {recommendations.length > 0 ? (
                      <div className="video-reco-grid">
                        {recommendations.map(rec => (
                          <div
                            key={rec.id}
                            className="video-reco-card"
                            onClick={() => handleVideoSelect(rec)}
                          >
                            <img
                              src={`https://img.youtube.com/vi/${rec.videoId}/mqdefault.jpg`}
                              alt={rec.title}
                              loading="lazy"
                            />
                            <div className="video-reco-info">
                              <div className="video-reco-name">{rec.title}</div>
                              <div className="video-reco-meta">{rec.duration}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="video-reco-empty">Hozircha tavsiyalar yo'q</div>
                    )}
                  </div>
                )}
              </div>
              <div className="vp-info">
                <div className="vp-title">{activeVideo.title}</div>
                <div className="vp-meta">
                  <span className="badge badge-gold">+{getVideoXp(activeVideo)} XP</span>
                  <span className="badge badge-accent">{activeVideo.duration}</span>
                  {canResumeActive && (
                    <span className="badge badge-accent">Davom: {formatClock(activeVideoProgress)}</span>
                  )}
                  {watchedVideos[activeVideo.id] && (
                    <span className="badge badge-success"><IconCheckCircle size={12} /> Ko'rildi</span>
                  )}
                </div>
                <p className="vp-desc">{activeVideo.description}</p>
                {!watchedVideos[activeVideo.id] && (
                  <p className="vp-hint">
                    Video oxirigacha ko'ring — <strong>+{getVideoXp(activeVideo)} XP</strong> olasiz.
                  </p>
                )}
                {canResumeActive && (
                  <button className="btn btn-outline vp-resume-btn" onClick={resumeFromSaved}>
                    Davom ettirish ({formatClock(activeVideoProgress)})
                  </button>
                )}
                {!!videoNotes[activeVideo.id] && (
                  <div className="vp-note-preview">
                    <span className="ui-kicker"><IconBookmark size={12} /> Saqlangan xulosa</span>
                    <p>{videoNotes[activeVideo.id]}</p>
                  </div>
                )}
                {watchedVideos[activeVideo.id] ? (
                  <div className="vp-notes-cta">
                    <button className="btn btn-outline" onClick={() => openNoteModal(activeVideo)}>
                      <IconBookmark size={14} /> Xulosa yozish
                    </button>
                  </div>
                ) : (
                  <div className="vp-notes-hint">
                    Note yozish uchun videoni oxirigacha ko'ring.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="video-player-empty card fade-in-up">
              <h3>Darslikni tanlang</h3>
              <p>Chap tomondagi ro'yxatdan videoni tanlasangiz, bu yerda player ochiladi.</p>
              {suggestedVideo && (
                <button className="btn btn-primary" onClick={() => handleVideoSelect(suggestedVideo)}>
                  Birinchi mos darslikni ochish
                </button>
              )}
            </div>
          )}

          <section className="videos-list-wrap">
            <div className="videos-results-meta">
              <span>{filtered.length} ta darslik ko'rsatildi</span>
              <span>Filter: {watchFilter === 'all' ? 'hammasi' : watchFilter === 'unwatched' ? "ko'rilmagan" : watchFilter === 'watched' ? "ko'rilgan" : 'davom etayotgan'}</span>
            </div>

            <div className="videos-grid fade-in">
              {filtered.map(video => {
                const watched = !!watchedVideos[video.id];
                const noteText = (videoNotes[video.id] || '').trim();
                const isActive = activeVideo?.id === video.id;
                const cat = VIDEO_CATEGORIES.find(c => c.id === video.categoryId);
                const savedProgress = Number(videoProgress[video.id] || 0);
                const durationSeconds = parseDurationToSeconds(video.duration);
                const progressPctCard = watched
                  ? 100
                  : durationSeconds > 0
                    ? Math.min(100, Math.round((savedProgress / durationSeconds) * 100))
                    : 0;

                return (
                  <div
                    key={video.id}
                    className={`video-card card ${watched ? 'watched' : ''} ${isActive ? 'playing' : ''}`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    {/* Thumbnail */}
                    <div className="vc-thumb">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt={video.title}
                        loading="lazy"
                      />
                      <div className="vc-overlay">
                        {isActive ? (
                          <span className="vc-play playing-pulse">PLAY</span>
                        ) : (
                          <span className="vc-play">PLAY</span>
                        )}
                      </div>
                      {watched && <div className="vc-watched-badge">OK</div>}
                      <div className="vc-duration">{video.duration}</div>
                    </div>

                    {/* Info */}
                    <div className="vc-info">
                      <div className="vc-cat-tag" style={{ color: cat?.color, background: `${cat?.color}18` }}>
                        {cat?.icon} {cat?.label}
                      </div>
                      <div className="vc-title">{video.title}</div>
                      <div className="vc-meta">
                        <span className="badge badge-gold">+{getVideoXp(video)} XP</span>
                        {noteText && (
                          <span className="vc-note-chip">
                            <IconBookmark size={12} /> Note
                          </span>
                        )}
                        {watched && <span className="vc-done-text">Ko'rildi</span>}
                      </div>
                      <div className="vc-progress-line">
                        <span className={`vc-progress-label ${!watched && savedProgress <= 0 ? 'is-not-started' : ''}`}>
                          {watched ? '100% tugallangan' : savedProgress > 0 ? `${formatClock(savedProgress)} davom etilgan` : 'Boshlash navbatda'}
                        </span>
                        <div className="progress-bar vc-progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${progressPctCard}%` }} />
                        </div>
                      </div>
                      {noteText && <p className="vc-note-preview">{noteText}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="card videos-empty">
                <p>Hech narsa topilmadi</p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearch('');
                    setNotesOnly(false);
                    setWatchFilter('all');
                    setSortBy('smart');
                    setActiveCategory('all');
                  }}
                >
                  Filterni tozalash
                </button>
              </div>
            )}
          </section>
        </section>

        <aside className="videos-side-col">
          <section className="videos-side-panel videos-filters fade-in-up" style={{ animationDelay: '0.02s' }}>
            <div className="videos-side-title">
              <IconTarget size={16} />
              Saralash va qidiruv
            </div>
            <div className="videos-filters-head">
              <button
                className={`vcat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Barcha kategoriya
              </button>
              {activeCategory !== 'all' && (
                <span className="videos-active-category">
                  Faol kategoriya: {VIDEO_CATEGORIES.find((cat) => cat.id === activeCategory)?.label}
                </span>
              )}
            </div>
            <div className="videos-filter-tools">
              <div className="videos-watch-filter">
                <button
                  className={`vcat-btn ${watchFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setWatchFilter('all')}
                >
                  Hammasi
                </button>
                <button
                  className={`vcat-btn ${watchFilter === 'unwatched' ? 'active' : ''}`}
                  onClick={() => setWatchFilter('unwatched')}
                >
                  Ko'rilmagan
                </button>
                <button
                  className={`vcat-btn ${watchFilter === 'progress' ? 'active' : ''}`}
                  onClick={() => setWatchFilter('progress')}
                >
                  Davom etayotgan
                </button>
                <button
                  className={`vcat-btn ${watchFilter === 'watched' ? 'active' : ''}`}
                  onClick={() => setWatchFilter('watched')}
                >
                  Ko'rilgan
                </button>
              </div>

              <button
                className={`vcat-btn notes-toggle ${notesOnly ? 'active' : ''}`}
                onClick={() => setNotesOnly((prev) => !prev)}
              >
                <IconBookmark size={14} /> Note bor ({totalNoted})
              </button>

              <select
                className="input-field videos-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="smart">Smart tartib</option>
                <option value="title">Sarlavha A-Z</option>
                <option value="xp">XP yuqoridan</option>
                <option value="duration">Davomiylik uzunidan</option>
              </select>

              <input
                className="input-field videos-search"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <button
                className="btn btn-ghost videos-reset-btn"
                onClick={() => {
                  setSearch('');
                  setNotesOnly(false);
                  setWatchFilter('all');
                  setSortBy('smart');
                }}
              >
                Tozalash
              </button>
            </div>
          </section>

          <section className="videos-side-panel fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="videos-side-title">
              <IconVideo size={16} />
              Kategoriyalar bo'yicha holat
            </div>
            <div className="videos-category-overview">
              {categoryStats.map((category) => (
                <article
                  key={category.id}
                  className={`video-category-card ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                  style={{ '--cat-color': category.color }}
                >
                  <div className="video-category-head">
                    <strong>{category.icon} {category.label}</strong>
                    <span>{category.done}/{category.total}</span>
                  </div>
                  <div className="progress-bar video-category-progress">
                    <div className="progress-bar-fill" style={{ width: `${category.pct}%` }} />
                  </div>
                  <div className="video-category-meta">
                    <small>{category.pct}% yakunlandi</small>
                    <small>Note: {category.noted}</small>
                    <small>Davom: {category.inProgress}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {continueWatching.length > 0 && (
            <section className="videos-side-panel video-continue fade-in-up" style={{ animationDelay: '0.08s' }}>
              <div className="videos-side-title">
                <IconTarget size={16} />
                Davom ettirish
              </div>
              <div className="video-continue-row">
                {continueWatching.map((video) => {
                  const savedProgress = Number(videoProgress[video.id] || 0);
                  return (
                    <button
                      key={video.id}
                      type="button"
                      className="video-continue-item"
                      onClick={() => handleVideoSelect(video)}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt={video.title}
                        loading="lazy"
                      />
                      <div className="video-continue-info">
                        <strong>{video.title}</strong>
                        <span>{formatClock(savedProgress)} nuqtadan davom</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="videos-side-panel fade-in-up">
            <div className="videos-side-title">
              <IconCheckCircle size={16} />
              XP bonuslari
            </div>
            <div className="video-bonuses">
              {Object.values(VIDEO_XP_BONUS).map((b, i) => (
                <div key={i} className="vb-item">
                  <span className="vb-icon">
                    {i === 0 ? <IconTarget size={18} /> : i === 1 ? <IconCheckCircle size={18} /> : <IconVideo size={18} />}
                  </span>
                  <span className="vb-label">{b.label}</span>
                  <span className="badge badge-gold">+{b.xp} XP</span>
                </div>
              ))}
              {todayWatched.length > 0 && (
                <div className="vb-item vb-today">
                  <span className="vb-icon"><IconVideo size={18} /></span>
                  <span className="vb-label">Bugun ko'rildi</span>
                  <span className="badge badge-success">{todayWatched.length} ta</span>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* XP Toast */}
      {toast && (
        <div className="video-toast fade-in">
          <div className="vt-header">
            {toast.isLevelUp ? "Daraja ko'tarildi!" : 'Video tugatildi!'}
          </div>
          <div className="vt-title">{toast.title}</div>
          <div className="vt-xp">+{toast.xp} XP</div>
          {toast.bonusXP > 0 && (
            <div className="vt-bonuses">
              {toast.bonusMessages.map((msg, i) => (
                <div key={i} className="vt-bonus-item">{msg}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {noteModalOpen && (
        <div className="video-note-modal">
          <div className="video-note-backdrop" onClick={closeNoteModal} />
          <div className="video-note-card card">
            <div className="video-note-header">
              <div>
                <div className="video-note-title">Xulosa yozish</div>
                <div className="video-note-subtitle">{noteVideo?.title}</div>
              </div>
              <button className="btn btn-ghost" onClick={closeNoteModal}>Yopish</button>
            </div>
            <textarea
              className="video-note-input"
              placeholder="Videodan olgan xulosalaringizni yozing..."
              value={noteDraft}
              onChange={(e) => { setNoteDraft(e.target.value); setNoteSaved(false); }}
            />
            <div className="video-note-actions">
              <button className="btn btn-primary" onClick={saveNote}>Saqlash</button>
              {noteSaved && <span className="video-note-saved">Saqlanildi</span>}
              <button className="btn btn-ghost" onClick={closeNoteModal}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










