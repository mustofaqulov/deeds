export default function HifzStats({
  totalSurahs,
  totalSurahCount,
  totalAyahs,
  completedJuz,
  streak,
  juzProgress,
  hardestSurahs,
  recentMemorized,
}) {
  return (
    <div className="hifz-stats card">
      <div className="hifz-stats-grid">
        <div className="hifz-stat-card">
          <span className="stat-value">{totalSurahs} / {totalSurahCount}</span>
          <span className="stat-label">Surahlar</span>
        </div>
        <div className="hifz-stat-card">
          <span className="stat-value">{totalAyahs.toLocaleString()}</span>
          <span className="stat-label">Oyatlar</span>
        </div>
        <div className="hifz-stat-card">
          <span className="stat-value">{completedJuz} / 30</span>
          <span className="stat-label">Juzlar</span>
        </div>
        <div className="hifz-stat-card">
          <span className="stat-value">{streak} kun</span>
          <span className="stat-label">Streak</span>
        </div>
      </div>

      <div className="hifz-subsection">
        <div className="section-title">🧭 Juz progress mini-xarita</div>
        <div className="juz-mini-map">
          {juzProgress.map(j => (
            <div key={j.id} className="juz-mini-item" title={`Juz ${j.id}: ${j.percent}%`}>
              <span style={{ width: `${j.percent}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="hifz-subsection-grid">
        <div className="hifz-subsection">
          <div className="section-title">🔥 Eng qiyin surahlar</div>
          <div className="hifz-list">
            {hardestSurahs.length === 0 && <span className="hifz-empty">Barchasi yodlangan!</span>}
            {hardestSurahs.map(s => (
              <div key={s.id} className="hifz-list-item">
                <span>#{s.id} {s.nameTranslit}</span>
                <span className="badge badge-accent">{s.ayahCount} oyat</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hifz-subsection">
          <div className="section-title">🕊️ So'nggi yodlangan</div>
          <div className="hifz-list">
            {recentMemorized.length === 0 && <span className="hifz-empty">Hozircha yozuv yo'q</span>}
            {recentMemorized.map(s => (
              <div key={s.id} className="hifz-list-item">
                <span>#{s.id} {s.nameTranslit}</span>
                <span className="badge badge-gold">{s.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

