'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BADGE_DEFS } from '@/lib/achievements';
import { BADGE_SVGS } from '@/components/BadgeSVGs';
import PageLoader from '@/components/PageLoader';

export default function AchievementsPage() {
  const [unlockedIds, setUnlockedIds]   = useState<Set<string>>(new Set());
  const [unlockDates, setUnlockDates]   = useState<Record<string, string>>({});
  const [streak, setStreak]             = useState<{ current: number; longest: number } | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [{ data: badges }, { data: stats }] = await Promise.all([
        supabase
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', session.user.id),
        supabase
          .from('user_stats')
          .select('current_streak, longest_streak')
          .eq('user_id', session.user.id)
          .maybeSingle(),
      ]);

      const ids   = new Set((badges ?? []).map((b: { badge_id: string }) => b.badge_id));
      const dates: Record<string, string> = {};
      for (const b of (badges ?? []) as { badge_id: string; unlocked_at: string }[]) {
        dates[b.badge_id] = b.unlocked_at;
      }
      setUnlockedIds(ids);
      setUnlockDates(dates);
      if (stats) setStreak({ current: (stats as { current_streak: number; longest_streak: number }).current_streak, longest: (stats as { current_streak: number; longest_streak: number }).longest_streak });
      setLoading(false);
    }
    load();
  }, []);

  const unlocked = BADGE_DEFS.filter((b) => unlockedIds.has(b.id));
  const locked   = BADGE_DEFS.filter((b) => !unlockedIds.has(b.id));

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 space-y-6 pb-28">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6858] mb-1">
          Hall of Fame
        </p>
        <h1 className="text-[#2C1E16] font-black text-3xl tracking-tight leading-none">
          Trophy Room
        </h1>
        <p className="text-[#7A6858] text-xs font-bold mt-1.5">
          {unlocked.length}/{BADGE_DEFS.length} badges earned
        </p>
      </div>

      {/* ── Streak card ── */}
      <div className="glass rounded-3xl px-5 py-4 flex items-center gap-4">
        <span className="text-4xl leading-none">🔥</span>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Current Streak</p>
          <p className="text-[#2C1E16] font-black text-2xl leading-tight">
            {streak?.current ?? 0}
            <span className="text-[#7A6858] font-bold text-sm ml-1.5">days</span>
          </p>
        </div>
        {streak && streak.longest > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Best</p>
            <p className="text-[#5D4037] font-black text-xl readout">{streak.longest}</p>
          </div>
        )}
      </div>

      {/* ── Earned badges ── */}
      {unlocked.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D4037]"/>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#2C1E16]">Earned</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {unlocked.map((badge) => {
              const Icon     = BADGE_SVGS[badge.id];
              const dateStr  = unlockDates[badge.id];
              const date     = dateStr
                ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : null;
              return (
                <div key={badge.id} className="glass rounded-2xl p-3 flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16">
                    {Icon && <Icon />}
                  </div>
                  <p className="text-[#2C1E16] font-black text-[10px] uppercase tracking-wide leading-tight">
                    {badge.name}
                  </p>
                  {date && (
                    <p className="text-[#7A6858] text-[9px] font-bold">{date}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Locked badges ── */}
      {locked.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8B49A]"/>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#7A6858]">Locked</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {locked.map((badge) => {
              const Icon = BADGE_SVGS[badge.id];
              return (
                <div key={badge.id} className="glass rounded-2xl p-3 flex flex-col items-center text-center gap-2 opacity-40">
                  <div className="w-16 h-16 grayscale">
                    {Icon && <Icon />}
                  </div>
                  <p className="text-[#2C1E16] font-black text-[10px] uppercase tracking-wide leading-tight">
                    {badge.name}
                  </p>
                  <p className="text-[#7A6858] text-[9px] font-medium leading-tight">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {unlocked.length === 0 && (
        <div className="glass rounded-3xl py-10 px-6 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-[#2C1E16] font-black text-lg uppercase tracking-tight mb-1">No badges yet</p>
          <p className="text-[#7A6858] text-xs font-bold uppercase tracking-[0.2em]">
            Log shots to start earning
          </p>
        </div>
      )}
    </div>
  );
}
