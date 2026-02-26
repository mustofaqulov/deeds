const DIFFICULTY = {
  1: { label: 'Oson', badge: 'badge-success' },
  2: { label: 'O\'rta', badge: 'badge-gold' },
  3: { label: 'Qiyin', badge: 'badge-accent' },
};

export default function SurahCard({ surah, memorized, selected, onOpen }) {
  const diff = DIFFICULTY[surah.difficulty] || DIFFICULTY[2];

  return (
    <button
      id={`surah-${surah.id}`}
      type="button"
      className={`surah-card ${memorized ? 'done' : ''} ${selected ? 'active' : ''}`}
      onClick={onOpen}
    >
      <div className="surah-status">{memorized ? '✅' : '◯'}</div>
      <div className="surah-number">{surah.id}</div>
      <div className="surah-names">
        <div className="surah-arabic arabic">{surah.nameAr}</div>
        <div className="surah-translit">{surah.nameTranslit}</div>
        <div className="surah-uz">{surah.nameUz}</div>
      </div>
      <div className="surah-meta">
        <span>{surah.ayahCount} oyat</span>
        <span className={`badge ${diff.badge}`}>{diff.label}</span>
        <span className="badge badge-gold">+{surah.xp} XP</span>
      </div>
      <div className="surah-action">
        <span className={`surah-action-chip ${memorized ? 'done' : ''}`}>
          {memorized ? 'Yodlangan' : 'Boshlash'}
        </span>
      </div>
    </button>
  );
}

