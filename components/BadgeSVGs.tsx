'use client';

// Rich Untappd-style hexagonal badge SVGs.
// Each badge is self-contained with inline gradients and no external deps.

const HEX  = '50,3 91,27 91,73 50,97 9,73 9,27';
const HEXI = '50,8 87,30 87,70 50,92 13,70 13,30'; // inset ring

// ── Globetrotter ─────────────────────────────────────────────────────────────
function Globetrotter() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gb-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D47A1"/>
          <stop offset="100%" stopColor="#00695C"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#gb-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFD700" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5"/>
      {/* Globe body */}
      <circle cx="50" cy="48" r="27" fill="#1565C0" stroke="#42A5F5" strokeWidth="1.5"/>
      {/* Grid lines */}
      <ellipse cx="50" cy="48" rx="27" ry="9"  fill="none" stroke="#64B5F6" strokeWidth="0.9" opacity="0.7"/>
      <ellipse cx="50" cy="48" rx="27" ry="18" fill="none" stroke="#64B5F6" strokeWidth="0.6" opacity="0.4"/>
      <line x1="50" y1="21" x2="50" y2="75" stroke="#64B5F6" strokeWidth="0.9" opacity="0.6"/>
      <line x1="23" y1="48" x2="77" y2="48" stroke="#64B5F6" strokeWidth="0.9" opacity="0.6"/>
      {/* 5 golden map pins (Africa, South America, Central America, Indonesia, Ethiopia) */}
      {([[55,43],[35,52],[31,39],[67,51],[62,35]] as [number,number][]).map(([cx, cy], i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx} y2={cy+5} stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r="2.5" fill="#FF8F00" stroke="#FFD700" strokeWidth="0.8"/>
        </g>
      ))}
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFD700"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">GLOBETROTTER</text>
    </svg>
  );
}

// ── The Scientist ─────────────────────────────────────────────────────────────
function Scientist() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sci-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A148C"/>
          <stop offset="100%" stopColor="#1A237E"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#sci-g)"/>
      <polygon points={HEX}  fill="none" stroke="#CE93D8" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#CE93D8" strokeWidth="0.6" opacity="0.5"/>
      {/* Erlenmeyer flask */}
      <path d="M44,24 H56 V44 L70,72 Q72,77 67,77 H33 Q28,77 30,72 Z"
            fill="#2D1050" stroke="#CE93D8" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Coffee liquid fill */}
      <path d="M44.5,57 L55.5,57 L68,72 Q69,76 66,76 H34 Q31,76 32,72 Z"
            fill="#5D4037" opacity="0.95"/>
      <line x1="43" y1="57" x2="57" y2="57" stroke="#8D6E63" strokeWidth="0.9" opacity="0.7"/>
      {/* Bubbles */}
      <circle cx="43" cy="64" r="2.2" fill="none" stroke="#FFCC80" strokeWidth="0.9" opacity="0.7"/>
      <circle cx="52" cy="69" r="1.5" fill="none" stroke="#FFCC80" strokeWidth="0.8" opacity="0.6"/>
      <circle cx="48" cy="60" r="1.2" fill="none" stroke="#FFCC80" strokeWidth="0.7" opacity="0.5"/>
      {/* Atom orbitals around neck */}
      <ellipse cx="50" cy="33" rx="9"  ry="3.5" fill="none" stroke="#CE93D8" strokeWidth="0.9" opacity="0.6"/>
      <ellipse cx="50" cy="33" rx="9"  ry="3.5" fill="none" stroke="#CE93D8" strokeWidth="0.9" opacity="0.6" transform="rotate(60 50 33)"/>
      <ellipse cx="50" cy="33" rx="9"  ry="3.5" fill="none" stroke="#CE93D8" strokeWidth="0.9" opacity="0.6" transform="rotate(-60 50 33)"/>
      <circle cx="50" cy="33" r="2" fill="#CE93D8"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#CE93D8"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">THE SCIENTIST</text>
    </svg>
  );
}

// ── Golden Ratio ──────────────────────────────────────────────────────────────
function GoldenRatio() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="phi-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF360C"/>
          <stop offset="100%" stopColor="#F9A825"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#phi-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFD700" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5"/>
      {/* Fibonacci spiral arc */}
      <path d="M50,26 Q68,26 68,44 Q68,62 50,62 Q32,62 32,44 Q32,35 41,31"
            fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>
      {/* Large phi symbol */}
      <text x="50" y="60" textAnchor="middle" fontSize="42" fontWeight="bold" fill="#FFF9C4"
            fontFamily="Georgia,serif" opacity="0.95">φ</text>
      {/* Mini espresso cup */}
      <rect x="42" y="67" width="16" height="10" rx="1.5" fill="#1A0800" stroke="#FFD700" strokeWidth="0.9"/>
      <path d="M58,70 Q62,70 62,72.5 Q62,75 58,75" fill="none" stroke="#FFD700" strokeWidth="1"/>
      <rect x="41" y="77" width="18" height="2.5" rx="1" fill="#FFD700" opacity="0.5"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFD700"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">GOLDEN RATIO</text>
    </svg>
  );
}

// ── The Dialer ────────────────────────────────────────────────────────────────
function TheDialer() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dl-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B71C1C"/>
          <stop offset="100%" stopColor="#E64A19"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#dl-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFAB00" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFAB00" strokeWidth="0.6" opacity="0.5"/>
      {/* Gauge arc + needle */}
      <path d="M25,45 Q50,29 75,45" fill="none" stroke="#FFAB00" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
      <line x1="50" y1="29" x2="50" y2="44" stroke="#FFAB00" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="45" r="2.5" fill="#FFAB00"/>
      {/* 5 espresso cups */}
      {([15,27,39,51,63] as number[]).map((x, i) => (
        <g key={i}>
          <rect x={x} y="51" width="11" height="8" rx="1.5" fill="#1A0800" stroke="#FFAB00" strokeWidth="0.8"/>
          <path d={`M${x+11},${53.5} Q${x+14},${53.5} ${x+14},${55} Q${x+14},${56.5} ${x+11},${56.5}`}
                fill="none" stroke="#FFAB00" strokeWidth="0.8"/>
          <rect x={x-1} y="59" width="13" height="2" rx="1" fill="#FFAB00" opacity="0.4"/>
        </g>
      ))}
      {/* ×5 */}
      <text x="50" y="78" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#FFD700"
            fontFamily="system-ui,sans-serif">×5</text>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFAB00"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">THE DIALER</text>
    </svg>
  );
}

// ── Ristretto Rex ─────────────────────────────────────────────────────────────
function RistrettoRex() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rex-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A0800"/>
          <stop offset="100%" stopColor="#5D4037"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#rex-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFD700" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5"/>
      {/* Crown (points upward, band at base) */}
      <path d="M27,52 L27,42 L36,42 L39,27 L43,42 L50,24 L57,42 L61,27 L64,42 L73,42 L73,52 Z"
            fill="#FFD700" stroke="#E65100" strokeWidth="1" strokeLinejoin="round"/>
      {/* Crown gems */}
      <circle cx="50" cy="27" r="3"   fill="#D32F2F"/>
      <circle cx="39" cy="30" r="2"   fill="#F44336"/>
      <circle cx="61" cy="30" r="2"   fill="#F44336"/>
      {/* 1:1 in crown band */}
      <text x="50" y="51" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#1A0800"
            fontFamily="system-ui,sans-serif">1:1</text>
      {/* Espresso cup below crown */}
      <rect x="37" y="56" width="26" height="15" rx="2.5" fill="#2D1B10" stroke="#8D6E63" strokeWidth="1.2"/>
      <path d="M63,60 Q68,60 68,63.5 Q68,67 63,67" fill="none" stroke="#8D6E63" strokeWidth="1.2"/>
      <rect x="36" y="71" width="28" height="3" rx="1.5" fill="#5D4037" opacity="0.7"/>
      <rect x="39" y="58" width="22" height="11" rx="1.5" fill="#1A0800" opacity="0.6"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFD700"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">RISTRETTO REX</text>
    </svg>
  );
}

// ── The Perfectionist ─────────────────────────────────────────────────────────
function Perfectionist() {
  const starPaths = Array.from({ length: 8 }, (_, i) => {
    const a   = (i * 45 * Math.PI) / 180;
    const cx  = 50 + 24 * Math.sin(a);
    const cy  = 46 - 24 * Math.cos(a);
    const r   = 3;
    const ir  = r * 0.4;
    return `M${cx},${cy - r} L${cx + ir},${cy - ir} L${cx + r},${cy} L${cx + ir},${cy + ir} L${cx},${cy + r} L${cx - ir},${cy + ir} L${cx - r},${cy} L${cx - ir},${cy - ir} Z`;
  });

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pf-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#263238"/>
          <stop offset="100%" stopColor="#607D8B"/>
        </linearGradient>
        <radialGradient id="pf-gl" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <polygon points={HEX}  fill="url(#pf-g)"/>
      <polygon points={HEX}  fill="url(#pf-gl)"/>
      <polygon points={HEX}  fill="none" stroke="#E0E0E0" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#E0E0E0" strokeWidth="0.6" opacity="0.5"/>
      {/* Glow ring */}
      <circle cx="50" cy="46" r="26" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.25"/>
      {/* 8 sparkle stars */}
      {starPaths.map((d, i) => (
        <path key={i} d={d} fill="#FFD700" opacity="0.85"/>
      ))}
      {/* "10" */}
      <text x="50" y="61" textAnchor="middle" fontSize="36" fontWeight="900" fill="white"
            fontFamily="system-ui,sans-serif">10</text>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#CFD8DC"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">THE PERFECTIONIST</text>
    </svg>
  );
}

// ── Export map ────────────────────────────────────────────────────────────────

export const BADGE_SVGS: Record<string, React.FC> = {
  'globetrotter':  Globetrotter,
  'scientist':     Scientist,
  'golden-ratio':  GoldenRatio,
  'dialer':        TheDialer,
  'ristretto-rex': RistrettoRex,
  'perfectionist': Perfectionist,
};
