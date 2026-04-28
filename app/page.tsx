import { supabase } from '@/lib/supabase';
import ShotCard from '@/components/ShotCard';
import ActiveEquipmentCard from '@/components/ActiveEquipmentCard';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

export const dynamic = 'force-dynamic';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-5 opacity-25">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#c4873e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 28h24l-3.5 18H23.5L20 28z" />
          <path d="M44 32h4a5 5 0 0 1 0 10h-4" />
          <ellipse cx="32" cy="48" rx="16" ry="2.5" />
          <path d="M26 22c0-5 5-5 5-10" />
          <path d="M35 24c0-5 5-5 5-10" />
        </svg>
      </div>
      <p className="text-stone-300 font-semibold text-base mb-1">No shots logged yet</p>
      <p className="text-stone-600 text-sm leading-relaxed max-w-xs">
        Pull your first shot and dial in your recipe. Every extraction teaches you something.
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const { data } = await supabase
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const shots = (data ?? []) as Shot[];
  const avgScore =
    shots.length > 0
      ? (shots.reduce((s, sh) => s + (sh.overall_score ?? 0), 0) / shots.length).toFixed(1)
      : null;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-1 flex items-start justify-between">
        <div>
          <p className="text-crema/55 text-xs font-semibold tracking-[0.22em] uppercase mb-1">Espresso Studio</p>
          <h1 className="text-stone-50 font-bold text-3xl tracking-tight leading-none">Coffee Dial-in</h1>
        </div>
        <Link
          href="/settings"
          className="mt-1 p-2 -mr-1 text-stone-600 hover:text-stone-300 transition-colors"
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-stone-500 text-[10px] font-medium uppercase tracking-widest mb-2">Total Shots</p>
          <p className="readout text-crema font-bold text-3xl leading-none">{shots.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-stone-500 text-[10px] font-medium uppercase tracking-widest mb-2">Avg Score</p>
          <p className="readout text-crema font-bold text-3xl leading-none">{avgScore ?? '—'}</p>
        </div>
      </div>

      {/* Active rig — client component (reads localStorage) */}
      <ActiveEquipmentCard />

      {/* CTA */}
      <Link
        href="/shots/new"
        className="btn-crema block w-full text-espresso font-bold py-4 rounded-2xl text-center text-base tracking-wide"
      >
        + Log Espresso Shot
      </Link>

      {/* Recent shots */}
      {shots.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-stone-500 font-semibold text-[10px] uppercase tracking-widest">Recent Shots</h2>
            <Link href="/shots" className="text-crema/70 text-xs font-medium hover:text-crema transition-colors">
              See all →
            </Link>
          </div>
          {shots.map((shot) => (
            <ShotCard key={shot.id} shot={shot} />
          ))}
        </div>
      )}

      {shots.length === 0 && <EmptyState />}
    </div>
  );
}
