interface Props {
  size?: number;
}

export default function CoffeeCupLoader({ size = 64 }: Props) {
  const h = Math.round(size * 1.375);
  return (
    <>
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
        .ccl-fill  { animation: cupFill 1.8s ease-in-out infinite alternate; }
        .ccl-sa    { animation: steamWaft 2.2s ease-out 0.0s  infinite; }
        .ccl-sb    { animation: steamWaft 2.2s ease-out 0.55s infinite; }
        .ccl-sc    { animation: steamWaft 2.2s ease-out 1.1s  infinite; }
      `}</style>
      <svg width={size} height={h} viewBox="0 0 64 88" fill="none">
        <defs>
          <clipPath id="ccl-clip">
            <path d="M8 22 L56 22 L50 66 L14 66 Z" />
          </clipPath>
          <linearGradient id="ccl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C85A32" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6B2D0F" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path className="ccl-sa" d="M22 21 C20 16 24 12 22 7"  stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" />
        <path className="ccl-sb" d="M32 19 C30 14 34 10 32 5"  stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
        <path className="ccl-sc" d="M42 21 C44 16 40 12 42 7"  stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" />
        <g clipPath="url(#ccl-clip)">
          <rect className="ccl-fill" x="6" y="22" width="52" height="44" fill="url(#ccl-grad)" />
        </g>
        <path d="M8 22 L56 22 L50 66 L14 66 Z"  stroke="rgba(44,30,22,0.25)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        <rect x="6" y="20" width="52" height="3.5" rx="1.75" fill="rgba(44,30,22,0.10)" />
        <path d="M56 33 Q72 33 72 46 Q72 59 56 59"  stroke="rgba(44,30,22,0.20)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <ellipse cx="32" cy="72" rx="29" ry="4" stroke="rgba(44,30,22,0.12)" strokeWidth="1.5" fill="rgba(44,30,22,0.04)" />
        <rect x="10" y="68" width="44" height="5" rx="2.5" fill="rgba(44,30,22,0.05)" />
      </svg>
    </>
  );
}
