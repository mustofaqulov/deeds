import { useEffect } from 'react';
import Confetti from '../Confetti/Confetti';
import './LevelUpModal.css';

export default function LevelUpModal({ open, level, fromLevel, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !level) return null;

  return (
    <div className="levelup-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <Confetti active={open} />
      <div className="levelup-card" onClick={(event) => event.stopPropagation()}>
        <div className="levelup-rays" aria-hidden="true" />
        <div className="levelup-badge">Daraja oshdi</div>
        <div className="levelup-icon">{level.icon || '✨'}</div>
        <h2 className="levelup-title">{level.name}</h2>
        <p className="levelup-subtitle">
          {fromLevel ? `${fromLevel}-darajadan ${level.level}-darajaga o'tdingiz` : `${level.level}-darajaga o'tdingiz`}
        </p>
        <div className="levelup-level-pill">
          <span>{fromLevel || Math.max(1, level.level - 1)}</span>
          <span className="arrow">→</span>
          <span>{level.level}</span>
        </div>
        <button className="btn btn-primary levelup-close" onClick={onClose}>Davom etish</button>
      </div>
    </div>
  );
}

