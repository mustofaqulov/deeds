import { useEffect } from 'react';
import './AchievementToast.css';

export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return undefined;
    const timeout = setTimeout(() => onDismiss?.(), 3600);
    return () => clearTimeout(timeout);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div className="ach-toast ach-toast--show">
      <div className="ach-toast-glow" />
      <span className="ach-toast-icon">{achievement.icon}</span>
      <div className="ach-toast-body">
        <div className="ach-toast-label">Yutuq olindi!</div>
        <div className="ach-toast-name">{achievement.label}</div>
        <div className="ach-toast-desc">{achievement.desc}</div>
      </div>
      <div className="ach-toast-xp">+{achievement.xpBonus}<span>XP</span></div>
    </div>
  );
}
