export default function SurahDetailPanel({
  surah,
  isMemorized,
  onClose,
  onMemorize,
  onUndo,
  onOpenVideo,
}) {
  if (!surah) return null;
  const hasVideo = Boolean(surah.youtubeId);

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <aside className="surah-panel" onClick={e => e.stopPropagation()}>
        <button className="panel-close" onClick={onClose} aria-label="Yopish">✕</button>

        <div className="panel-header">
          <div className="panel-arabic arabic">{surah.nameAr}</div>
          <div className="panel-translit">{surah.nameTranslit} · {surah.nameUz}</div>
          <div className="panel-meta">{surah.ayahCount} oyat · {surah.type} · Juz {surah.juz}</div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">💡 Yodlash maslahatlari</div>
          <p className="panel-text">{surah.tips}</p>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">🎥 Video darslik</div>
          <button className="btn btn-outline" onClick={onOpenVideo} disabled={!hasVideo}>
            {hasVideo ? 'Video ko\'rish' : 'Video tayyor emas'}
          </button>
        </div>

        <div className="panel-actions">
          {isMemorized ? (
            <>
              <button className="btn btn-outline" onClick={() => onUndo(surah)}>
                ↩ Bekor qilish
              </button>
              <span className="badge badge-success">✅ Yodlangan</span>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => onMemorize(surah)}>
              ✅ Yodladim! +{surah.xp} XP
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}