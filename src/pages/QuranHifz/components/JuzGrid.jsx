export default function JuzGrid({ juzs, selectedJuzId, onSelect }) {
  return (
    <div className="juz-grid">
      {juzs.map(juz => {
        const state = juz.done === 0 ? 'locked' : juz.done === juz.total ? 'completed' : 'in-progress';
        return (
          <button
            key={juz.id}
            type="button"
            className={`juz-card card ${state} ${selectedJuzId === juz.id ? 'active' : ''}`}
            onClick={() => onSelect(juz.id)}
          >
            <div className="juz-card-top">
              <span className="juz-number">Juz {juz.id}</span>
              <span className="juz-state">
                {state === 'completed' ? '✅' : state === 'in-progress' ? '✨' : '🔒'}
              </span>
            </div>
            <div className="juz-name">{juz.name}</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${juz.percent}%` }} />
            </div>
            <div className="juz-meta">
              <span>{juz.done}/{juz.total} surah</span>
              <span>{juz.percent}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

