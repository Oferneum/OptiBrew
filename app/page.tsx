'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ShotCard from '@/components/ShotCard';
import HomeGreeting from '@/components/HomeGreeting';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

function GlowOrb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="3.5" fill="#FF4500" />
      <circle cx="24" cy="24" r="9"  stroke="#FF4500" strokeWidth="0.75" strokeOpacity="0.45" />
      <circle cx="24" cy="24" r="16" stroke="#FF4500" strokeWidth="0.5"  strokeOpacity="0.22" />
      <circle cx="24" cy="24" r="23" stroke="#FFC107" strokeWidth="0.5"  strokeOpacity="0.10" />
    </svg>
  );
}

function EmptyState() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-28 h-28">
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
  const [shots, setShots]   = useState<Shot[]>([]);
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

  const recent = shots.slice(0, 3);

  const scoredShots = shots.filter((s) => s.overall_score != null);
  const avgScore    = scoredShots.length > 0
    ? (scoredShots.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / scoredShots.length).toFixed(1)
    : null;
  const avgTime = shots.length > 0
    ? Math.round(shots.reduce((sum, s) => sum + s.extraction_time, 0) / shots.length)
    : null;

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-28 space-y-8">

      {/* ── Header ────────────────────────────────── */}
      <header className="relative pt-4">
        <GlowOrb className="absolute top-2 right-0 w-11 h-11 opacity-80" />
        <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF4500] to-[#FFC107] mb-3 rounded-full" />
        <h1 className="text-7xl font-black uppercase tracking-tighter leading-none bg-gradient-to-r from-[#FF4500] via-white to-[#FFC107] bg-clip-text text-transparent">
          DIALED
        </h1>
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#A1A1AA] mt-2">
          Espresso Journal
        </p>
      </header>

      {/* ── Personalised greeting + welcome toast ─── */}
      <HomeGreeting />

      {/* ── Log Shot CTA ──────────────────────────── */}
      <Link
        href="/shots/new"
        className="flex items-center justify-between w-full rounded-2xl px-6 py-5 bg-gradient-to-r from-[#FF4500] to-[#FFC107] shadow-xl shadow-[#FF4500]/30 active:scale-95 transition-all duration-200"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60">Pull a shot</p>
          <p className="text-2xl font-black uppercase tracking-tight leading-none mt-0.5 text-black">LOG SHOT</p>
        </div>
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

      {/* ── Recent ────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" style={{ boxShadow: '0 0 6px #FF4500' }} />
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Recent</p>
          </div>
          {shots.length > 3 && (
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
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-2xl h-24 animate-pulse"
                style={{ opacity: 1 - i * 0.18 }}
              />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="glass rounded-3xl py-12 px-6 flex flex-col items-center text-center space-y-5">
            <EmptyState />
            <div className="space-y-1.5">
              <p className="font-black text-white uppercase tracking-tight text-xl">No shots yet</p>
              <p className="text-xs text-[#A1A1AA] font-bold uppercase tracking-[0.25em]">Your espresso journal awaits</p>
            </div>
            <Link
              href="/shots/new"
              className="bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-[#FF4500]/30 active:scale-95 transition-all"
            >
              Pull first shot →
            </Link>
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
