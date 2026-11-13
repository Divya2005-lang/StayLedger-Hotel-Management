import { useId } from 'react';

// Rows of hotel windows; most are lit and a few flicker, so the skyline feels alive.
const WINDOWS = [];
for (let row = 0; row < 4; row += 1) {
  for (let col = 0; col < 14; col += 1) {
    WINDOWS.push({ x: 392 + col * 28, y: 214 + row * 26, lit: (row * 5 + col * 3) % 7 !== 0, delay: ((row + 1) * (col + 2)) % 9 });
  }
}

const Frond = ({ rotate }) => (
  <path d="M0 0 C 30 -22 62 -18 84 6 C 56 -6 28 -6 0 0Z" transform={`rotate(${rotate})`} />
);

/** Illustrated dusk scene: hotel, palms, sea. Decorative only. */
export default function Scene({ className = '' }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg className={`scene ${className}`} viewBox="0 0 1200 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2a40" />
          <stop offset="0.5" stopColor="#216a82" />
          <stop offset="0.82" stopColor="#f0b36a" />
          <stop offset="1" stopColor="#f7d79a" />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9a35f" />
          <stop offset="0.35" stopColor="#2f7c8e" />
          <stop offset="1" stopColor="#0b3a4d" />
        </linearGradient>
        <radialGradient id={`${uid}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3c9" />
          <stop offset="0.45" stopColor="#ffd38a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb25a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="460" fill={`url(#${uid}-sky)`} />
      {[[90, 40], [210, 90], [330, 30], [470, 70], [640, 28], [760, 80], [980, 36], [1100, 84]].map(([x, y], i) => (
        <circle key={i} className="star" cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.4} fill="#fff" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <circle cx="930" cy="292" r="150" fill={`url(#${uid}-sun)`} />
      <circle cx="930" cy="292" r="46" fill="#fff0c0" />

      <path d="M0 300 Q 150 250 300 292 T 620 280 T 900 296 T 1200 270 V 330 H 0Z" fill="#1c5b6b" opacity="0.65" />
      <rect y="318" width="1200" height="142" fill={`url(#${uid}-sea)`} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} className="glint" x={780 + (i % 3) * 50} y={326 + i * 16} width={120 - i * 12} height="3" rx="1.5" fill="#ffe2a8" opacity="0.7" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}

      {/* hotel */}
      <g>
        <rect x="372" y="196" width="420" height="124" fill="#0d2733" />
        <rect x="352" y="186" width="460" height="16" fill="#0a1f2a" />
        <rect x="470" y="150" width="224" height="40" fill="#0d2733" />
        <rect x="560" y="126" width="44" height="26" fill="#0a1f2a" />
        <rect x="580" y="106" width="4" height="22" fill="#0a1f2a" />
        <circle cx="582" cy="104" r="4" fill="#ffcf6b" className="beacon" />
        {WINDOWS.map((w, i) => (
          <rect key={i} className={w.lit ? 'win win--lit' : 'win'} x={w.x} y={w.y} width="16" height="14" rx="2" style={w.lit ? { animationDelay: `${w.delay * 0.7}s` } : undefined} />
        ))}
        <rect x="560" y="288" width="44" height="32" rx="3" fill="#ffcf6b" opacity="0.9" />
      </g>

      {/* palms */}
      {[[160, 330, 1], [250, 340, 0.8], [1040, 336, 1.05]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#07161e" stroke="none">
          <path d="M-3 0 Q 10 -70 -2 -150 L 4 -150 Q 18 -70 6 0Z" />
          <g transform="translate(1 -150)">
            {[-160, -120, -75, -30, 15, 60, 100, 140].map((r) => (
              <Frond key={r} rotate={r} />
            ))}
          </g>
        </g>
      ))}
      <path d="M0 460 V 392 Q 200 360 420 390 T 820 386 T 1200 380 V 460Z" fill="#07161e" />
    </svg>
  );
}
