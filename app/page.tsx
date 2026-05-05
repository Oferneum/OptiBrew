'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ShotCard from '@/components/ShotCard';
import HomeGreeting from '@/components/HomeGreeting';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

function EmptyState() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-20 h-20">
      <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="60" cy="60" r="42" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="60" cy="60" r="28" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
      <circle cx="60" cy="60" r="12" fill="rgba(255,69,0,0.15)" />
      <circle cx="60" cy="60" r="6"  fill="rgba(255,69,0,0.40)" />
      <circle cx="60" cy="60" r="3"  fill="#FF4500" />
      <circle cx="60" cy="4"  r="2.5" fill="#FFC107" opacity="0.75" />
      <circle cx="116" cy="60" r="2"  fill="#FF4500" opacity="0.50" />
      <circle cx="4"   cy="60" r="2"  fill="#7B1FA2" opacity="0.60" />
      <circle cx="60" cy="116" r="2.5" fill="#FFC107" opacity="0.40" />
      <line x1="60" y1="0"   x2="60" y2="9"   stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="120" y1="60" x2="111" y2="60" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="0"   y1="60" x2="9"   y2="60" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1="60"  y1="120" x2="60" y2="111" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  );
}

export default function HomePage() {
  const [shots, setShots]     = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('shots')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setShots(error ? [] : ((data ?? []) as Shot[]));
      setLoading(false);
    }
    load();
  }, []);

  const recent = shots.slice(0, 2);

  const scoredShots = shots.filter((s) => s.overall_score != null);
  const avgScore    = scoredShots.length > 0
    ? (scoredShots.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / scoredShots.length).toFixed(1)
    : null;
  const avgTime = shots.length > 0
    ? Math.round(shots.reduce((sum, s) => sum + s.extraction_time, 0) / shots.length)
    : null;

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-4">

      {/* ── Header ────────────────────────────────── */}
      <header className="pt-2">
        <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF4500] to-[#FFC107] mb-2 rounded-full" />
        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none bg-gradient-to-r from-[#FF4500] via-white to-[#FFC107] bg-clip-text text-transparent">
          DIALED
        </h1>
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#A1A1AA] mt-1.5">
          Espresso Journal
        </p>
      </header>

      {/* ── Personalised greeting ─────────────────── */}
      <HomeGreeting />

      {/* ── Single primary CTA ────────────────────── */}
      <Link
        href="/shots/new"
        className="flex items-center justify-between w-full rounded-2xl px-6 py-4 bg-gradient-to-r from-[#FF4500] to-[#FFC107] shadow-xl shadow-[#FF4500]/30 active:scale-95 transition-all duration-200"
      >
        <p className="text-2xl font-black uppercase tracking-tight text-black">LOG SHOT</p>
        <span className="text-4xl font-black leading-none text-black/60">+</span>
      </Link>

      {/* ── Stats ─────────────────────────────────── */}
      {!loading && shots.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Shots',     value: shots.length.toString() },
            { label: 'Avg Score', value: avgScore ?? '—' },
            { label: 'Avg Time',  value: avgTime != null ? `${avgTime}s` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A1A1AA]">{label}</p>
              <p className="readout text-2xl font-black mt-0.5 bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Fresh Beans CTA ──────────────────────── */}
      <Link
        href="/beans/new"
        className="flex items-center justify-between w-full glass rounded-2xl px-5 py-4 border border-white/10 hover:border-[#FF4500]/30 active:scale-[0.99] transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4500]/15 to-[#FFC107]/10 border border-[#FF4500]/20 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none" stroke="#FF4500" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 28h24l-3.5 18H23.5L20 28z" />
              <path d="M44 32h4a5 5 0 0 1 0 10h-4" />
              <ellipse cx="32" cy="48" rx="16" ry="2.5" />
              <path d="M26 22c0-5 5-5 5-10" />
              <path d="M35 24c0-5 5-5 5-10" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A1A1AA]">New arrival</p>
            <p className="text-white font-black text-base leading-tight mt-0.5">
              Fresh beans?{' '}
              <span className="bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent">
                Get dialed in.
              </span>
            </p>
          </div>
        </div>
        <span className="text-[#FF4500] font-bold text-xl ml-2">→</span>
      </Link>

      {/* ── Recent ────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" style={{ boxShadow: '0 0 6px #FF4500' }} />
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Recent</p>
          </div>
          {shots.length > 2 && (
            <Link
              href="/shots"
              className="text-[11px] font-black uppercase tracking-wider text-[#FF4500] hover:opacity-70 transition-opacity"
            >
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-2xl h-24 animate-pulse"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="glass rounded-3xl py-8 px-6 flex flex-col items-center text-center space-y-4">
            <EmptyState />
            <div className="space-y-1.5">
              <p className="font-black text-white uppercase tracking-tight text-xl">No shots yet</p>
              <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-[0.25em]">Your espresso journal awaits</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((shot) => (
              <Link
                key={shot.id}
                href={`/shots/${shot.id}`}
                className="block active:scale-[0.99] transition-transform"
              >
                <ShotCard shot={shot} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
