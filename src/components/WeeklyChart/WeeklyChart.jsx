import './WeeklyChart.css';

const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export default function WeeklyChart({ completedDays = {} }) {
  // So'ngi 7 kunni hisoblash
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const xp = (completedDays[key]?.length || 0) * 20;
    return {
      key,
      label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      xp,
      isToday: i === 6,
    };
  });

  const maxXP = Math.max(...days.map(d => d.xp), 20);

  return (
    <div className="wchart-wrap">
      <div className="wchart-bars">
        {days.map((d) => {
          const pct = maxXP > 0 ? (d.xp / maxXP) * 100 : 0;
          return (
            <div key={d.key} className="wchart-col">
              <div className="wchart-bar-wrap">
                {d.xp > 0 && (
                  <span className="wchart-xp-label">{d.xp}</span>
                )}
                <div className="wchart-bar-bg">
                  <div
                    className={`wchart-bar-fill ${d.isToday ? 'today' : ''}`}
                    style={{ height: `${Math.max(pct, d.xp > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
              <span className={`wchart-label ${d.isToday ? 'today' : ''}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
