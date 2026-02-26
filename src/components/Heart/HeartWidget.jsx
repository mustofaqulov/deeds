import { useMemo } from 'react';
import './HeartWidget.css';

export default function HeartWidget({ percent = 0, animating = false }) {
  const clipId = 'heartClip';

  // ===== Dynamic emerald → lime color =====
  const { dynamicColor, glowSize, glowOpacity } = useMemo(() => {
    const p = Math.max(0, Math.min(100, percent));

    // Hue: Emerald (158) → Lime (70)
    const hueStart = 158;
    const hueEnd = 70;
    const hue = hueStart + ((hueEnd - hueStart) * p) / 100;

    const dynamicColor = `hsl(${hue}, 85%, ${45 + p * 0.1}%)`;

    // Glow logic
    const glowSize =
      p < 50
        ? 14 + p * 0.4 // stronger burning effect
        : 18 + (100 - p) * 0.15; // calmer glow

    const glowOpacity = p < 50 ? 0.8 : 0.45;

    return { dynamicColor, glowSize, glowOpacity };
  }, [percent]);

  return (
    <div className={`heart-widget ${animating ? 'animating' : ''}`}>
      <svg
        viewBox="0 0 100 90"
        xmlns="http://www.w3.org/2000/svg"
        className="heart-svg"
        style={{
          filter: `drop-shadow(0 0 ${glowSize}px rgba(7,102,83,${glowOpacity}))`,
        }}>
        <defs>
          <clipPath id={clipId}>
            <path d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 14 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85 Z" />
          </clipPath>

          {/* Dynamic emerald → lime gradient */}
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={dynamicColor} />
            <stop offset="100%" stopColor="#E3EF26" />
          </linearGradient>

          {/* Soft golden glow filter */}
          <filter id="haloGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base heart (dark emerald instead of black) */}
        <path
          d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 14 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85 Z"
          fill="#06231D"
          stroke={dynamicColor}
          strokeWidth="2.5"
        />

        {/* Fill layer */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y={90 - (90 * percent) / 100}
            width="100"
            height={(90 * percent) / 100}
            fill="url(#heartGrad)"
            style={{ transition: 'y 0.8s ease, height 0.8s ease' }}
          />

          {/* Light shimmer line */}
          {percent > 0 && (
            <rect
              x="0"
              y={90 - (90 * percent) / 100}
              width="100"
              height="3"
              fill="rgba(255,255,255,0.5)"
              style={{ transition: 'y 0.8s ease' }}
            />
          )}
        </g>

        {/* Golden halo at 100% */}
        {percent === 100 && (
          <path
            d="M50 85 C50 85 5 55 5 28 C5 12 17 2 30 2 C38 2 45 7 50 14 C55 7 62 2 70 2 C83 2 95 12 95 28 C95 55 50 85 50 85 Z"
            fill="none"
            stroke="#f5d76e"
            strokeWidth="4"
            opacity="0.9"
            filter="url(#haloGlow)"
          />
        )}

        {/* Percentage text */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill={percent > 45 ? '#06231D' : '#ffffff'}>
          {Math.round(percent)}%
        </text>

        <text
          x="50"
          y="59"
          textAnchor="middle"
          fontSize="7"
          fill={percent > 45 ? '#0C342C' : 'rgba(255,255,255,0.8)'}>
          nuri
        </text>
      </svg>
    </div>
  );
}
