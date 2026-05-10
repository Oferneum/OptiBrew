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

// ── First Drip ────────────────────────────────────────────────────────────────
function FirstDrip() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fd-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3E2723"/>
          <stop offset="100%" stopColor="#8D6E63"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#fd-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFCC80" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFCC80" strokeWidth="0.6" opacity="0.5"/>
      {/* Coffee drop */}
      <path d="M50,22 Q56,32 56,39 Q56,47 50,47 Q44,47 44,39 Q44,32 50,22 Z"
            fill="#FFCC80" opacity="0.95"/>
      <line x1="50" y1="47" x2="50" y2="55" stroke="#FFCC80" strokeWidth="1.2"
            strokeLinecap="round" opacity="0.5" strokeDasharray="2,2"/>
      {/* Espresso cup */}
      <rect x="36" y="57" width="28" height="14" rx="2.5" fill="#1A0800" stroke="#FFCC80" strokeWidth="1.2"/>
      <path d="M64,61 Q69,61 69,64 Q69,67 64,67" fill="none" stroke="#FFCC80" strokeWidth="1.2"/>
      <rect x="34" y="71" width="32" height="2.5" rx="1.2" fill="#FFCC80" opacity="0.5"/>
      {/* Coffee surface + ripple */}
      <rect x="38" y="59" width="24" height="10" rx="1.5" fill="#3E2723" opacity="0.8"/>
      <ellipse cx="50" cy="61" rx="7" ry="1.8" fill="none" stroke="#8D6E63" strokeWidth="0.8" opacity="0.7"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFCC80"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">FIRST DRIP</text>
    </svg>
  );
}

// ── Bean Counter ──────────────────────────────────────────────────────────────
function BeanCounter() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bcnt-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4E342E"/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#bcnt-g)"/>
      <polygon points={HEX}  fill="none" stroke="#A5D6A7" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#A5D6A7" strokeWidth="0.6" opacity="0.5"/>
      {/* 3 coffee beans */}
      <g transform="rotate(-35 36 43)">
        <ellipse cx="36" cy="43" rx="10" ry="5.5" fill="#795548" stroke="#BCAAA4" strokeWidth="0.9"/>
        <line x1="36" y1="37.5" x2="36" y2="48.5" stroke="#5D4037" strokeWidth="1" opacity="0.8"/>
      </g>
      <g transform="rotate(35 64 43)">
        <ellipse cx="64" cy="43" rx="10" ry="5.5" fill="#795548" stroke="#BCAAA4" strokeWidth="0.9"/>
        <line x1="64" y1="37.5" x2="64" y2="48.5" stroke="#5D4037" strokeWidth="1" opacity="0.8"/>
      </g>
      <ellipse cx="50" cy="63" rx="10" ry="5.5" fill="#795548" stroke="#BCAAA4" strokeWidth="0.9"/>
      <line x1="50" y1="57.5" x2="50" y2="68.5" stroke="#5D4037" strokeWidth="1" opacity="0.8"/>
      {/* "50" badge */}
      <circle cx="73" cy="26" r="12" fill="#2E7D32" stroke="#A5D6A7" strokeWidth="1.5"/>
      <text x="73" y="30.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#A5D6A7"
            fontFamily="system-ui,sans-serif">50</text>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#A5D6A7"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">BEAN COUNTER</text>
    </svg>
  );
}

// ── Century Mark ──────────────────────────────────────────────────────────────
function CenturyMark() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cmark-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#827717"/>
          <stop offset="100%" stopColor="#F57F17"/>
        </linearGradient>
        <radialGradient id="cmark-rg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFF176"/>
          <stop offset="100%" stopColor="#F9A825"/>
        </radialGradient>
      </defs>
      <polygon points={HEX}  fill="url(#cmark-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFD700" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5"/>
      {/* Ribbon tails */}
      <path d="M42,44 L38,74 L50,68 L62,74 L58,44 Z" fill="#E53935" opacity="0.9"/>
      <line x1="50" y1="44" x2="50" y2="74" stroke="#B71C1C" strokeWidth="0.8" opacity="0.6"/>
      {/* Medal */}
      <circle cx="50" cy="40" r="21" fill="url(#cmark-rg)" stroke="#FFD700" strokeWidth="2"/>
      <circle cx="50" cy="40" r="18" fill="none" stroke="#FFD700" strokeWidth="0.6" opacity="0.5"/>
      <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1A0800"
            fontFamily="system-ui,sans-serif">100</text>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFD700"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">CENTURY MARK</text>
    </svg>
  );
}

// ── Dawn Patrol ───────────────────────────────────────────────────────────────
function DawnPatrol() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dawn-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF360C"/>
          <stop offset="100%" stopColor="#F9A825"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#dawn-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FFCC02" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FFCC02" strokeWidth="0.6" opacity="0.5"/>
      {/* Horizon */}
      <line x1="17" y1="60" x2="83" y2="60" stroke="#FFCC02" strokeWidth="1.2" opacity="0.7"/>
      {/* Rising sun semi-circle */}
      <path d="M27,60 A23,23 0 0 1 73,60 Z" fill="#FFCC02" opacity="0.95"/>
      {/* Sun rays */}
      <line x1="50" y1="31" x2="50" y2="23" stroke="#FFCC02" strokeWidth="2" strokeLinecap="round"/>
      <line x1="69" y1="37" x2="75" y2="31" stroke="#FFCC02" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="31" y1="37" x2="25" y2="31" stroke="#FFCC02" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="77" y1="53" x2="85" y2="50" stroke="#FFCC02" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
      <line x1="23" y1="53" x2="15" y2="50" stroke="#FFCC02" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
      {/* Espresso cup on horizon */}
      <rect x="43" y="52" width="14" height="9" rx="1.5" fill="#BF360C" opacity="0.95"/>
      <path d="M57,54.5 Q61,54.5 61,57 Q61,59.5 57,59.5" fill="none" stroke="#FFCC02" strokeWidth="1"/>
      <rect x="42" y="61" width="16" height="2" rx="1" fill="#BF360C" opacity="0.7"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FFCC02"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">DAWN PATROL</text>
    </svg>
  );
}

// ── Night Owl ─────────────────────────────────────────────────────────────────
function NightOwl() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nowl-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D0D2B"/>
          <stop offset="100%" stopColor="#283593"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#nowl-g)"/>
      <polygon points={HEX}  fill="none" stroke="#B39DDB" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#B39DDB" strokeWidth="0.6" opacity="0.5"/>
      {/* Crescent moon */}
      <path d="M44,22 Q30,27 26,46 Q27,65 44,72 Q35,62 36,46 Q37,30 44,22 Z"
            fill="#FFF9C4" opacity="0.95"/>
      {/* Stars */}
      <circle cx="67" cy="27" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="74" cy="41" r="1.2" fill="white" opacity="0.8"/>
      <circle cx="70" cy="57" r="1.0" fill="white" opacity="0.7"/>
      <circle cx="24" cy="32" r="1.2" fill="white" opacity="0.7"/>
      <circle cx="76" cy="33" r="0.9" fill="white" opacity="0.6"/>
      {/* 4-point sparkle */}
      <path d="M74,49 L75.3,52 L78,52.5 L75.3,53 L74,56 L72.7,53 L70,52.5 L72.7,52 Z"
            fill="white" opacity="0.85"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#B39DDB"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">NIGHT OWL</text>
    </svg>
  );
}

// ── Method Actor ──────────────────────────────────────────────────────────────
function MethodActor() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mact-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#004D40"/>
          <stop offset="100%" stopColor="#006064"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#mact-g)"/>
      <polygon points={HEX}  fill="none" stroke="#80CBC4" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#80CBC4" strokeWidth="0.6" opacity="0.5"/>
      {/* Divider cross */}
      <line x1="50" y1="28" x2="50" y2="78" stroke="#80CBC4" strokeWidth="0.8" opacity="0.4"/>
      <line x1="18" y1="54" x2="82" y2="54" stroke="#80CBC4" strokeWidth="0.8" opacity="0.4"/>
      {/* 2×2 method grid */}
      {(['E','V','M','F'] as const).map((label, i) => {
        const cx = i % 2 === 0 ? 33 : 67;
        const cy = i < 2 ? 43 : 65;
        return (
          <g key={label}>
            <rect x={cx - 12} y={cy - 11} width="24" height="22" rx="3"
                  fill="#00695C" stroke="#80CBC4" strokeWidth="1"/>
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="16" fontWeight="900" fill="#80CBC4"
                  fontFamily="system-ui,sans-serif">{label}</text>
          </g>
        );
      })}
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#80CBC4"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">METHOD ACTOR</text>
    </svg>
  );
}

// ── Roasters Dozen ────────────────────────────────────────────────────────────
function RoastersDozens() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rdoz-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A1A1A"/>
          <stop offset="100%" stopColor="#37474F"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#rdoz-g)"/>
      <polygon points={HEX}  fill="none" stroke="#FF7043" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#FF7043" strokeWidth="0.6" opacity="0.5"/>
      {/* Roasting drum body */}
      <rect x="24" y="40" width="48" height="24" rx="12" fill="#263238" stroke="#FF7043" strokeWidth="1.5"/>
      <ellipse cx="24" cy="52" rx="12" ry="12" fill="#2E3B40" stroke="#FF7043" strokeWidth="1.5"/>
      <ellipse cx="72" cy="52" rx="12" ry="12" fill="#2E3B40" stroke="#FF7043" strokeWidth="1.5"/>
      <line x1="24" y1="45" x2="72" y2="45" stroke="#FF7043" strokeWidth="0.7" opacity="0.5"/>
      <line x1="24" y1="52" x2="72" y2="52" stroke="#FF7043" strokeWidth="0.7" opacity="0.5"/>
      <line x1="24" y1="59" x2="72" y2="59" stroke="#FF7043" strokeWidth="0.7" opacity="0.5"/>
      {/* Handle */}
      <rect x="75" y="49.5" width="8" height="5" rx="2" fill="#37474F" stroke="#FF7043" strokeWidth="1"/>
      {/* Heat waves */}
      <path d="M33,38 Q36,32 39,38" fill="none" stroke="#FF7043" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
      <path d="M47,36 Q50,30 53,36" fill="none" stroke="#FF7043" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
      <path d="M61,38 Q64,32 67,38" fill="none" stroke="#FF7043" strokeWidth="1.3" strokeLinecap="round" opacity="0.8"/>
      {/* ×12 badge */}
      <circle cx="27" cy="30" r="11" fill="#BF360C" stroke="#FF7043" strokeWidth="1.2"/>
      <text x="27" y="34" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="white"
            fontFamily="system-ui,sans-serif">×12</text>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#FF7043"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">ROASTERS DOZEN</text>
    </svg>
  );
}

// ── Terroir Hunter ────────────────────────────────────────────────────────────
function TerroirHunter() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trhunt-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B5E20"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#trhunt-g)"/>
      <polygon points={HEX}  fill="none" stroke="#A5D6A7" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#A5D6A7" strokeWidth="0.6" opacity="0.5"/>
      {/* Back mountain */}
      <path d="M30,70 L56,32 L82,70 Z"
            fill="#1B5E20" stroke="#A5D6A7" strokeWidth="0.8" strokeLinejoin="round" opacity="0.7"/>
      {/* Front mountain */}
      <path d="M13,70 L38,28 L63,70 Z"
            fill="#388E3C" stroke="#A5D6A7" strokeWidth="1.2" strokeLinejoin="round"/>
      {/* Snow cap */}
      <path d="M38,28 L33,40 L38,36 L43,40 Z" fill="white" opacity="0.9"/>
      {/* Map pin */}
      <circle cx="38" cy="16" r="5" fill="#E53935" stroke="#FFCDD2" strokeWidth="0.9"/>
      <circle cx="38" cy="16" r="2" fill="white" opacity="0.8"/>
      <path d="M34,20 L42,20 L38,27 Z" fill="#E53935"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#A5D6A7"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">TERROIR HUNTER</text>
    </svg>
  );
}

// ── Cold Front ────────────────────────────────────────────────────────────────
function ColdFront() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cfront-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#01579B"/>
          <stop offset="100%" stopColor="#0288D1"/>
        </linearGradient>
      </defs>
      <polygon points={HEX}  fill="url(#cfront-g)"/>
      <polygon points={HEX}  fill="none" stroke="#B3E5FC" strokeWidth="2.5"/>
      <polygon points={HEXI} fill="none" stroke="#B3E5FC" strokeWidth="0.6" opacity="0.5"/>
      {/* Mason jar body */}
      <rect x="34" y="34" width="32" height="36" rx="3" fill="#0D47A1" stroke="#B3E5FC" strokeWidth="1.5"/>
      {/* Jar neck */}
      <rect x="38" y="28" width="24" height="9" rx="2" fill="#01579B" stroke="#B3E5FC" strokeWidth="1.2"/>
      {/* Lid */}
      <rect x="36" y="23" width="28" height="7" rx="3" fill="#0288D1" stroke="#B3E5FC" strokeWidth="1.2"/>
      {/* Coffee inside */}
      <rect x="36" y="46" width="28" height="22" rx="2" fill="#1A237E" opacity="0.85"/>
      <line x1="36" y1="46" x2="64" y2="46" stroke="#B3E5FC" strokeWidth="0.9" opacity="0.6"/>
      {/* Ice cubes */}
      <rect x="39" y="48" width="8" height="8" rx="1.5" fill="#29B6F6" opacity="0.75" stroke="#B3E5FC" strokeWidth="0.6"/>
      <rect x="50" y="50" width="7" height="7" rx="1.5" fill="#29B6F6" opacity="0.7" stroke="#B3E5FC" strokeWidth="0.6"/>
      <rect x="55" y="47" width="7" height="9" rx="1.5" fill="#29B6F6" opacity="0.65" stroke="#B3E5FC" strokeWidth="0.6"/>
      {/* Snowflake on lid */}
      <line x1="50" y1="23" x2="50" y2="30" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="46" y1="24.5" x2="54" y2="28.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="46" y1="28.5" x2="54" y2="24.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
      <text x="50" y="89" textAnchor="middle" fontSize="5.8" fontWeight="bold" fill="#B3E5FC"
            letterSpacing="0.3" fontFamily="system-ui,sans-serif">COLD FRONT</text>
    </svg>
  );
}

// ── Export map ────────────────────────────────────────────────────────────────

export const BADGE_SVGS: Record<string, React.FC> = {
  'globetrotter':   Globetrotter,
  'scientist':      Scientist,
  'golden-ratio':   GoldenRatio,
  'dialer':         TheDialer,
  'ristretto-rex':  RistrettoRex,
  'perfectionist':  Perfectionist,
  'first-drip':     FirstDrip,
  'bean-counter':   BeanCounter,
  'century-mark':   CenturyMark,
  'dawn-patrol':    DawnPatrol,
  'night-owl':      NightOwl,
  'method-actor':   MethodActor,
  'roasters-dozen': RoastersDozens,
  'terroir-hunter': TerroirHunter,
  'cold-front':     ColdFront,
};
