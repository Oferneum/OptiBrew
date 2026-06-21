import { Suspense } from 'react';
import HomeGreeting from '@/components/HomeGreeting';
import Link from 'next/link';

function GlowOrb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="3.5" fill="#5D4037" />
      <circle cx="24" cy="24" r="9"  stroke="#5D4037" strokeWidth="0.75" strokeOpacity="0.45" />
      <circle cx="24" cy="24" r="16" stroke="#5D4037" strokeWidth="0.5"  strokeOpacity="0.22" />
      <circle cx="24" cy="24" r="23" stroke="#8D6E63" strokeWidth="0.5"  strokeOpacity="0.10" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-28 space-y-8">

      {/* ── Header ── */}
      <header className="relative pt-4">
        <GlowOrb className="absolute top-2 right-0 w-11 h-11 opacity-80" />
        <div className="w-16 h-0.5 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] mb-3 rounded-full" />
        <h1 className="text-7xl font-black uppercase tracking-tighter leading-none bg-gradient-to-r from-[#2C1E16] to-[#5D4037] bg-clip-text text-transparent">
          DIALED
        </h1>
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#7A6858] mt-2">
          Espresso Journal
        </p>
      </header>

      {/* ── Greeting ── */}
      <Suspense>
        <HomeGreeting />
      </Suspense>

      {/* ── Primary actions ── */}
      <div className="space-y-3">

        {/* Log Shot */}
        <Link
          href="/shots/new"
          className="flex items-center justify-between w-full rounded-2xl px-6 py-5 bg-gradient-to-r from-[#2C1E16] to-[#5D4037] shadow-xl shadow-[#2C1E16]/30 active:scale-95 transition-all duration-200"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Pull a shot</p>
            <p className="text-2xl font-black uppercase tracking-tight leading-none mt-0.5 text-white">LOG SHOT</p>
          </div>
          <span className="text-4xl font-black leading-none text-white/60">+</span>
        </Link>

        {/* Scan a Bag */}
        <Link
          href="/beans/new"
          className="flex items-center justify-between w-full glass rounded-2xl px-6 py-5 active:scale-95 transition-all duration-200"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A6858]">New beans?</p>
            <p className="text-2xl font-black uppercase tracking-tight leading-none mt-0.5 text-[#2C1E16]">SCAN BAG</p>
          </div>
          <svg className="w-7 h-7 text-[#5D4037]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </Link>

      </div>
    </div>
  );
}
