import SurahCard from './SurahCard';

export default function SurahList({ juz, surahs, memorizedSet, onSelectSurah, selectedSurahId }) {
  const done = surahs.filter(s => memorizedSet.has(s.id)).length;

  return (
    <div className="surah-list card">
      <div className="surah-list-header">
        <div>
          <div className="surah-list-title">Juz {juz.id} - {juz.name}</div>
          <div className="surah-list-range">{juz.ayahRange}</div>
        </div>
        <div className="surah-list-count">{done}/{surahs.length} yodlangan</div>
      </div>

      <div className="surah-list-body">
        {surahs.map(surah => (
          <SurahCard
            key={surah.id}
            surah={surah}
            memorized={memorizedSet.has(surah.id)}
            selected={selectedSurahId === surah.id}
            onOpen={() => onSelectSurah(surah)}
          />
        ))}
      </div>
    </div>
  );
}

