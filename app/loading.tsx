export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#050505]">
      <style>{`
        @keyframes cupFill {
          0%   { transform: translateY(44px); }
          100% { transform: translateY(0px); }
        }
        @keyframes steamWaft {
          0%   { opacity: 0; transform: translateY(0); }
          35%  { opacity: 0.75; }
          100% { opacity: 0; transform: translateY(-18px) scaleX(1.3); }
        }
        .loading-fill { animation: cupFill 1.8s ease-in-out infinite alternate; }
        .steam-a      { animation: steamWaft 2.2s ease-out 0.0s  infinite; }
        .steam-b      { animation: steamWaft 2.2s ease-out 0.55s infinite; }
        .steam-c      { animation: steamWaft 2.2s ease-out 1.1s  infinite; }
      `}</style>

      <svg width="64" height="88" viewBox="0 0 64 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="cup-clip">
            <path d="M8 22 L56 22 L50 66 L14 66 Z" />
          </clipPath>
          <linearGradient id="coffee-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C85A32" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6B2D0F" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Steam wisps */}
        <path className="steam-a" d="M22 21 C20 16 24 12 22 7"
              stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" />
        <path className="steam-b" d="M32 19 C30 14 34 10 32 5"
              stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
        <path className="steam-c" d="M42 21 C44 16 40 12 42 7"
              stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" />

        {/* Coffee fill — clipped to cup trapezoid, rises on animation */}
        <g clipPath="url(#cup-clip)">
          <rect className="loading-fill" x="6" y="22" width="52" height="44"
                fill="url(#coffee-grad)" />
        </g>

        {/* Cup outline */}
        <path d="M8 22 L56 22 L50 66 L14 66 Z"
              stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />

        {/* Rim */}
        <rect x="6" y="20" width="52" height="3.5" rx="1.75"
              fill="rgba(255,255,255,0.10)" />

        {/* Handle */}
        <path d="M56 33 Q72 33 72 46 Q72 59 56 59"
              stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Saucer */}
        <ellipse cx="32" cy="72" rx="29" ry="4"
                 stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" fill="rgba(255,255,255,0.03)" />
        <rect x="10" y="68" width="44" height="5" rx="2.5"
              fill="rgba(255,255,255,0.05)" />
      </svg>

      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#A1A1AA] animate-pulse">
        Loading
      </p>
    </div>
  );
}
