import './Confetti.css';

const COLORS = ['#C9A84C', '#f0c050', '#27AE60', '#2E86AB', '#E74C3C', '#9B59B6', '#F39C12'];
const COUNT = 60;

function seededUnit(index, salt = 1) {
  const value = Math.sin((index + 1) * (salt + 1) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function seededBetween(index, salt, min, max) {
  return min + seededUnit(index, salt) * (max - min);
}

function buildParticles() {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: seededBetween(i, 1, 10, 90),
    color: COLORS[Math.floor(seededUnit(i, 2) * COLORS.length)],
    size: seededBetween(i, 3, 6, 12),
    delay: seededBetween(i, 4, 0, 0.5),
    duration: seededBetween(i, 5, 1.5, 2.8),
    rotation: seededBetween(i, 6, -180, 180),
    shape: seededUnit(i, 7) > 0.5 ? 'circle' : 'rect',
  }));
}

const PARTICLES = buildParticles();

export default function Confetti({ active }) {
  if (!active) return null;

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className={`confetti-particle ${p.shape}`}
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rot': `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
