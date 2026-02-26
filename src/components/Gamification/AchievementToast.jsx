import './AchievementToast.css';

export default function AchievementToast({ achievements = [], freezeEvent = null, onClose }) {
  if (!achievements.length && !freezeEvent) return null;

  return (
    <div className="achievement-toast-wrap" role="status" aria-live="polite">
      {freezeEvent && (
        <div className="achievement-toast-item freeze">
          <div className="achievement-toast-head">
            <span className="achievement-toast-icon">🧊</span>
            <div>
              <div className="achievement-toast-title">Streak freeze yangilandi</div>
              <div className="achievement-toast-desc">
                {freezeEvent.awarded > 0 && `+${freezeEvent.awarded} freeze qo'shildi`}
                {freezeEvent.awarded > 0 && freezeEvent.used > 0 ? ' • ' : ''}
                {freezeEvent.used > 0 && `${freezeEvent.used} freeze ishlatildi`}
              </div>
            </div>
          </div>
          <button className="achievement-toast-close" onClick={onClose} aria-label="Yopish">×</button>
        </div>
      )}

      {achievements.map((item) => (
        <div key={item.id} className="achievement-toast-item">
          <div className="achievement-toast-head">
            <span className="achievement-toast-icon">{item.icon || '🏆'}</span>
            <div>
              <div className="achievement-toast-title">Achievement ochildi</div>
              <div className="achievement-toast-name">{item.label}</div>
              <div className="achievement-toast-desc">{item.desc}</div>
            </div>
          </div>
          <div className="achievement-toast-foot">
            <span className="badge badge-gold">+{item.xpBonus || 0} XP</span>
            <button className="achievement-toast-close" onClick={onClose} aria-label="Yopish">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

