export default function MilestonePopup({ milestone, onClose }) {
  if (!milestone) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="milestone-popup card" onClick={e => e.stopPropagation()}>
        <div className="milestone-icon">🏆</div>
        <h3>Tabriklaymiz!</h3>
        <p>{milestone.count} ta surah yodlandingiz!</p>
        <div className="milestone-title">Siz endi "{milestone.title}" darajasidasiz.</div>
        <div className="milestone-bonus">+{milestone.bonus} Bonus XP 🎉</div>
        <button className="btn btn-primary" onClick={onClose}>Davom etish</button>
      </div>
    </div>
  );
}

