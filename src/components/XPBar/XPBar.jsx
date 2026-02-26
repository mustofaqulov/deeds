import { getLevelInfo } from '../../utils/helpers';
import { getStreakMultiplierLabel } from '../../utils/xpSystem';
import './XPBar.css';

export default function XPBar({ xp, streak }) {
  const { current, next, progress } = getLevelInfo(xp);
  const streakLabel = getStreakMultiplierLabel(streak || 0);

  const roundedProgress = Math.round(progress);
  const currentMinXp = current?.minXP || 0;
  const nextMinXp = next?.minXP || currentMinXp;
  const inLevelXp = Math.max(0, xp - currentMinXp);
  const levelRangeXp = Math.max(1, nextMinXp - currentMinXp);
  const remainXp = Math.max(0, nextMinXp - xp);

  return (
    <div className="xpbar-wrap">
      <div className="xpbar-orb xpbar-orb-one" aria-hidden="true" />
      <div className="xpbar-orb xpbar-orb-two" aria-hidden="true" />

      <div className="xpbar-header">
        <div className="xpbar-level">
          <span className="level-badge">{current.icon || current.level}</span>
          <div className="xpbar-level-text">
            <div className="level-kicker">Daraja {current.level}</div>
            <div className="level-name">{current.name}</div>
          </div>
        </div>

        <div className="xpbar-right">
          {streakLabel && (
            <span className="xpbar-streak-badge">{streakLabel} Streak</span>
          )}
          <span className="xpbar-progress-chip">{roundedProgress}%</span>
        </div>
      </div>

      <div className="xpbar-score-row">
        <div className="xpbar-score-main">
          <strong>{xp}</strong>
          <span>Jami XP</span>
        </div>

        <div className="xpbar-next">
          {next ? (
            <>
              <span className="next-label">Keyingi daraja: {next.name}</span>
              <span className="next-xp">{remainXp} XP qoldi</span>
            </>
          ) : (
            <span className="max-level">MAX daraja</span>
          )}
        </div>
      </div>

      <div className="xpbar-track-zone">
        <div className="xpbar-track-labels">
          <span>{currentMinXp} XP</span>
          {next ? <span>{nextMinXp} XP</span> : <span>MAX</span>}
        </div>

        <div className="xpbar-track">
          <div className="xpbar-fill" style={{ width: `${progress}%` }} />
          <div className="xpbar-glow" style={{ left: `${progress}%` }} />
        </div>

        <div className="xpbar-track-foot">
          {next ? (
            <span>{inLevelXp}/{levelRangeXp} XP ({roundedProgress}%)</span>
          ) : (
            <span>Daraja chegarasi to'liq yopilgan</span>
          )}
        </div>
      </div>
    </div>
  );
}
