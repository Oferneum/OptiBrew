'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import BeanCard from '@/components/BeanCard';
import Link from 'next/link';
import { computeCostPerShot, computeVFM } from '@/lib/analytics';
import type { BeanVFMData } from '@/lib/vfm-actions';
import type { BrewMethod, CommunityMethodResult } from '@/lib/types';

// ── Community method helper (replicated from agent — pure math, no AI) ──

function computeCommunityMethod(
  shots: Array<{ brew_method?: string | null; overall_score?: number | null }>,
): CommunityMethodResult | null {
  const groups: Record<string, { scores: number[]; count: number }> = {};
  for (const s of shots) {
    if (!s.brew_method) continue;
    if (!groups[s.brew_method]) groups[s.brew_method] = { scores: [], count: 0 };
    groups[s.brew_method].count++;
    if (s.overall_score != null) groups[s.brew_method].scores.push(s.overall_score);
  }
  const entries = Object.entries(groups);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1].count - a[1].count);
  const [brew_method, { scores, count }] = entries[0];
  const avg_score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { brew_method: brew_method as BrewMethod, avg_score, shot_count: count };
}

// ── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({
  label, active, disabled, onClick,
}: {
  label: string; active: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 touch-manipulation ${
        active
          ? 'bg-[#5D4037] text-[#FFFBF4] shadow-md shadow-[#5D4037]/25'
          : disabled
            ? 'bg-[#F5EBD8] text-[#C8B49A] cursor-not-allowed'
            : 'bg-[#F5EBD8] text-[#7A6858] active:scale-95'
      }`}
    >
      {label}
    </button>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function BeansSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-3xl h-24 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

// ── Shared shot row type ───────────────────────────────────────────────────

type ShotRow = {
  bean_id: string;
  overall_score: number | null;
  dose: number | null;
  brew_method: string | null;
  equipment_id: string | null;
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function BeansPage() {
  const [allBeans, setAllBeans]         = useState<BeanVFMData[]>([]);
  const [displayBeans, setDisplayBeans] = useState<BeanVFMData[]>([]);
  const [allShots, setAllShots]         = useState<ShotRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<'all' | 'machine' | 'grinder' | 'rig'>('all');
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [activeGrinder, setActiveGrinder] = useState<string | null>(null);
  const [filterBeanIds, setFilterBeanIds] = useState<Set<string> | null>(null);
  const [setupLoaded, setSetupLoaded]   = useState(false);

  // Load setup + persisted filter
  useEffect(() => {
    setActiveMachine(localStorage.getItem('activeMachineName') || null);
    setActiveGrinder(localStorage.getItem('activeGrinderName') || null);
    const saved = (localStorage.getItem('beansFilter') as typeof filter) || 'all';
    setFilter(saved);
    setSetupLoaded(true);
  }, []);

  function changeFilter(f: typeof filter) {
    setFilter(f);
    localStorage.setItem('beansFilter', f);
  }

  // ── Load all beans + shots ──
  const loadBeans = useCallback(async () => {
    const [{ data: beansData }, { data: shotsData }] = await Promise.all([
      supabase
        .from('beans')
        .select('id, roaster, bag_name, origin, is_active, price_paid, weight_grams, roast_date')
        .order('created_at', { ascending: false }),
      supabase
        .from('shots')
        .select('bean_id, overall_score, dose, brew_method, equipment_id')
        .not('bean_id', 'is', null),
    ]);

    const shots = (shotsData ?? []) as ShotRow[];
    setAllShots(shots);

    const beans: BeanVFMData[] = (beansData ?? []).map((bean) => {
      const beanShots   = shots.filter((s) => s.bean_id === bean.id);
      const scoredShots = beanShots.filter((s) => s.overall_score != null);
      const avgScore    = scoredShots.length
        ? scoredShots.reduce((sum, s) => sum + s.overall_score!, 0) / scoredShots.length
        : null;
      const dosedShots  = beanShots.filter((s) => (s.dose ?? 0) > 0);
      const avgDose     = dosedShots.length
        ? dosedShots.reduce((sum, s) => sum + s.dose!, 0) / dosedShots.length
        : 18;

      return {
        id:             bean.id,
        roaster:        bean.roaster,
        bag_name:       (bean as Record<string, unknown>).bag_name as string | null ?? null,
        origin:         bean.origin,
        shotCount:      beanShots.length,
        avgScore,
        costPerShot:    bean.price_paid && bean.weight_grams
          ? computeCostPerShot(bean.price_paid, bean.weight_grams, avgDose) : null,
        vfm:            avgScore != null && bean.price_paid && bean.weight_grams
          ? computeVFM(avgScore, bean.price_paid, bean.weight_grams, avgDose) : null,
        isActive:       bean.is_active,
        price_paid:     bean.price_paid,
        weight_grams:   bean.weight_grams,
        roast_date:     bean.roast_date ?? '',
        community_method: computeCommunityMethod(beanShots),
      };
    });

    setAllBeans(beans);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (setupLoaded) loadBeans();
  }, [setupLoaded, loadBeans]);

  // ── Compute filtered bean IDs when filter/setup changes ──
  useEffect(() => {
    if (filter === 'all' || !activeMachine) {
      setFilterBeanIds(null);
      return;
    }

    (async () => {
      let q = supabase.from('equipment_profiles').select('id');
      if (filter === 'machine' || filter === 'rig') q = q.eq('machine_name', activeMachine!);
      if ((filter === 'grinder' || filter === 'rig') && activeGrinder) q = q.eq('grinder_name', activeGrinder);
      const { data: rigs } = await q;
      const rigIds = (rigs ?? []).map((r) => r.id);

      if (!rigIds.length) { setFilterBeanIds(new Set()); return; }

      const ids = new Set(
        allShots
          .filter((s) => s.equipment_id && rigIds.includes(s.equipment_id) && s.bean_id)
          .map((s) => s.bean_id),
      );
      setFilterBeanIds(ids);
    })();
  }, [filter, activeMachine, activeGrinder, allShots]);

  // Apply filter
  useEffect(() => {
    if (filterBeanIds === null) {
      setDisplayBeans(allBeans);
    } else {
      setDisplayBeans(allBeans.filter((b) => filterBeanIds.has(b.id)));
    }
  }, [allBeans, filterBeanIds]);

  const activeBeans = displayBeans.filter((b) => b.isActive);

  const filterLabel =
    filter === 'machine' ? `Used with ${activeMachine}`
    : filter === 'grinder' ? `Used with ${activeGrinder}`
    : filter === 'rig'     ? `Used with ${[activeMachine, activeGrinder].filter(Boolean).join(' + ')}`
    : null;

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#7A6858] mb-1">
          Global Database
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-[#2C1E16] font-bold text-2xl tracking-tight leading-none">
            Community Beans
          </h1>
          <span className="text-[#7A6858] text-sm font-medium">
            {displayBeans.length} bean{displayBeans.length !== 1 ? 's' : ''}
          </span>
        </div>
        {activeBeans.length > 0 && (
          <p className="text-[#5D4037] text-xs font-bold mt-1.5">
            {activeBeans.length} active bag{activeBeans.length !== 1 ? 's' : ''} in rotation
          </p>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <FilterPill label="All Beans" active={filter === 'all'} onClick={() => changeFilter('all')} />
        {activeMachine && (
          <FilterPill label={activeMachine} active={filter === 'machine'} onClick={() => changeFilter('machine')} />
        )}
        {activeGrinder && (
          <FilterPill label={activeGrinder} active={filter === 'grinder'} onClick={() => changeFilter('grinder')} />
        )}
        {activeMachine && (
          <FilterPill label="Full Rig" active={filter === 'rig'} onClick={() => changeFilter('rig')} />
        )}
        {!activeMachine && (
          <span className="text-[10px] text-[#7A6858] self-center ml-1 whitespace-nowrap">
            Set up equipment in Settings to filter →
          </span>
        )}
      </div>

      {/* Filter context label */}
      {filter !== 'all' && filterLabel && !loading && (
        <p className="text-[10px] text-[#7A6858] font-bold uppercase tracking-wider -mt-1">
          {filterLabel} · {displayBeans.length} bean{displayBeans.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* ── VFM Leaderboard entry ── */}
      <Link
        href="/beans/vfm"
        className="flex items-center justify-between glass rounded-3xl px-5 py-4 border border-[#C8B49A] transition-colors active:border-[#5D4037]/40"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#5D4037]">
            Community Rankings
          </p>
          <p className="text-[#2C1E16] font-semibold text-sm mt-0.5">
            🏆 Value for Money Leaderboard
          </p>
        </div>
        <span className="text-[#5D4037] font-bold text-lg">→</span>
      </Link>

      {/* ── Bean list ── */}
      {loading ? (
        <BeansSkeleton />
      ) : displayBeans.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          {filter !== 'all' ? (
            <>
              <p className="text-[#2C1E16] font-semibold mb-1">
                No beans found for this setup
              </p>
              <p className="text-[#7A6858] text-sm mb-4">
                Log shots with your {filter === 'machine' ? 'machine' : filter === 'grinder' ? 'grinder' : 'rig'} to build community insights.
              </p>
              <button
                type="button"
                onClick={() => changeFilter('all')}
                className="text-[#5D4037] text-sm font-medium transition-colors"
              >
                Show all beans →
              </button>
            </>
          ) : (
            <>
              <p className="text-[#2C1E16] font-semibold mb-1">No beans in the community yet</p>
              <p className="text-[#7A6858] text-sm">Be the first — add a bag when logging a shot.</p>
              <Link href="/shots/new" className="inline-block mt-4 text-[#5D4037] text-sm font-medium transition-colors">
                Log a shot →
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayBeans.map((bean) => (
            <BeanCard key={bean.id} bean={bean} onSaved={loadBeans} />
          ))}
        </div>
      )}
    </div>
  );
}
