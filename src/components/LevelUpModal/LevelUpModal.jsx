import { useEffect } from 'react';
import './LevelUpModal.css';

export default function LevelUpModal({ levelUp, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!levelUp) return null;

  return (
    <div className="levelup-backdrop" onClick={onClose}>
      <div className="levelup-card" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-rays" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="levelup-ray" style={{ '--i': i }} />
          ))}
        </div>

        <div className="levelup-icon">{levelUp.toIcon}</div>
        <div className="levelup-label">DARAJA OSHDI!</div>
        <div className="levelup-numbers">
          <span className="levelup-from">{levelUp.from}</span>
          <span className="levelup-arrow">→</span>
          <span className="levelup-to">{levelUp.to}</span>
        </div>
        <div className="levelup-name">{levelUp.toName}</div>
        <p className="levelup-msg">
          Tabriklaymiz! Siz <strong>{levelUp.toName}</strong> darajasiga yetdingiz.
          Ibodatlaringizni davom ettiring!
        </p>

        <button className="btn btn-primary levelup-btn" onClick={onClose}>
          Davom etish ✨
        </button>
      </div>
    </div>
  );
}
