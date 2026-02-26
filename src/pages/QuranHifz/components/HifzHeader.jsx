import ProgressRing from '../../../components/ProgressRing/ProgressRing';

export default function HifzHeader({
  totalMemorized,
  totalSurahs,
  totalXp,
  streak,
  currentJuz,
  progressPercent,
  quote,
  onOpenMethods,
  onNextSurah,
  nextSurah,
}) {
  return (
    <section className="hifz-hero card reveal">
      <div className="hifz-hero-left">
        <div className="hifz-basmala arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <h1 className="hifz-title">Hofiz bo'l</h1>
        <p className="hifz-subtitle">"Qur'onni yodlaganlar - Allohning xalqi"</p>
        <div className="hifz-quote">
          <span className="quote-text">"{quote.text}"</span>
          <span className="quote-source">- {quote.source}</span>
        </div>
        <div className="hifz-actions">
          <button className="btn btn-outline" onClick={onOpenMethods}>
            📖 Yodlash usullari
          </button>
          <button className="btn btn-primary" onClick={onNextSurah} disabled={!nextSurah}>
            🎯 Keyingi surah
          </button>
        </div>
      </div>

      <div className="hifz-hero-right">
        <div className="hifz-ring">
          <ProgressRing percent={progressPercent} size={150} stroke={10}>
            <div className="ring-count">{totalMemorized}/{totalSurahs}</div>
          </ProgressRing>
          <div className="ring-label">Surahlar yodlandi</div>
        </div>

        <div className="hifz-hero-stats">
          <div className="hifz-stat">
            <span className="hifz-stat-label">XP</span>
            <span className="hifz-stat-value">{totalXp.toLocaleString()}</span>
          </div>
          <div className="hifz-stat">
            <span className="hifz-stat-label">Streak</span>
            <span className="hifz-stat-value">{streak} kun</span>
          </div>
          <div className="hifz-stat">
            <span className="hifz-stat-label">Juz</span>
            <span className="hifz-stat-value">{currentJuz || 1}</span>
          </div>
        </div>

        <div className="progress-bar hifz-overall-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="hifz-overall-label">{progressPercent}% umumiy</div>
      </div>
    </section>
  );
}

