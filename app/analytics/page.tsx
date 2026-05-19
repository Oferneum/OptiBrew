'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
import DialInChart from '@/components/DialInChart';
import type { ShotPoint } from '@/components/DialInChart';

// ── Types ──────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'machine' | 'grinder' | 'rig';

interface AnalyticsShot extends ShotPoint {
  user_id?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

function mode(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  arr.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
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

// ── Setup Insights panel ───────────────────────────────────────────────────

function SetupInsights({
  shots, filterLabel,
}: {
  shots: AnalyticsShot[];
  filterLabel: string;
}) {
  if (shots.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 text-center space-y-1.5">
        <p className="text-[#2C1E16] font-semibold text-sm">No shots for {filterLabel}</p>
        <p className="text-[#7A6858] text-xs">Log shots with this setup to see community benchmarks.</p>
      </div>
    );
  }

  // ── Bean grouping ──
  type BeanBucket = { label: string; scores: number[]; doses: number[]; yields: number[]; times: number[]; grinds: string[] };
  const beanMap: Record<string, BeanBucket> = {};
  for (const s of shots) {
    const key = s.bean_label || '__unknown__';
    if (!beanMap[key]) {
      beanMap[key] = { label: s.bean_label ?? 'Unknown', scores: [], doses: [], yields: [], times: [], grinds: [] };
    }
    beanMap[key].scores.push(s.overall_score);
    if (s.dose)           beanMap[key].doses.push(s.dose);
    if (s.yield)          beanMap[key].yields.push(s.yield);
    beanMap[key].times.push(s.extraction_time);
    if (s.grind_setting)  beanMap[key].grinds.push(s.grind_setting);
  }

  const topBeans = Object.entries(beanMap)
    .filter(([k]) => k !== '__unknown__')
    .map(([, b]) => ({
      label:    b.label,
      avgScore: avg(b.scores)!,
      count:    b.scores.length,
      dose:     b.doses.length  ? avg(b.doses)!  : null,
      yieldG:   b.yields.length ? avg(b.yields)! : null,
      time:     b.times.length  ? Math.round(avg(b.times)!) : null,
      grind:    mode(b.grinds),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 6);

  // ── Grind settings ranked by avg score ──
  const grindMap: Record<string, number[]> = {};
  for (const s of shots) {
    if (!s.grind_setting) continue;
    if (!grindMap[s.grind_setting]) grindMap[s.grind_setting] = [];
    grindMap[s.grind_setting].push(s.overall_score);
  }
  const topGrinds = Object.entries(grindMap)
    .map(([setting, scores]) => ({ setting, avgScore: avg(scores)!, count: scores.length }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);
  const maxGrindScore = topGrinds[0]?.avgScore ?? 10;

  // ── Sweet-spot recipe (shots ≥ 7/10) ──
  const goodShots = shots.filter((s) => s.overall_score >= 7);
  const sweetSpot = goodShots.length >= 2 ? {
    dose:  avg(goodShots.filter(s => s.dose).map(s => s.dose!)),
    yield: avg(goodShots.filter(s => s.yield).map(s => s.yield!)),
    time:  goodShots.length ? Math.round(avg(goodShots.map(s => s.extraction_time))!) : null,
    grind: mode(goodShots.filter(s => s.grind_setting).map(s => s.grind_setting!)),
  } : null;

  // Unique user count
  const uniqueUsers = new Set(shots.map(s => s.user_id).filter(Boolean)).size;

  return (
    <div className="glass rounded-3xl p-5 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Setup Insights</p>
          <p className="text-[#2C1E16] font-bold text-base mt-0.5 leading-tight">{filterLabel}</p>
          {uniqueUsers > 0 && (
            <p className="text-[#7A6858] text-xs mt-1">
              {shots.length} shot{shots.length !== 1 ? 's' : ''} · {uniqueUsers} community {uniqueUsers === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
        <div className="readout font-black text-3xl text-[#5D4037] shrink-0">
          {shots.length}
        </div>
      </div>

      {/* Sweet-spot recipe */}
      {sweetSpot && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-3">
            Winning Recipe <span className="normal-case tracking-normal font-medium opacity-60">(avg from ≥7/10 shots)</span>
          </p>
          <div className="bg-[#F5EBD8] rounded-2xl px-4 py-3 grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Dose',  value: sweetSpot.dose  ? `${sweetSpot.dose.toFixed(1)}g`  : '—' },
              { label: 'Yield', value: sweetSpot.yield ? `${sweetSpot.yield.toFixed(1)}g` : '—' },
              { label: 'Time',  value: sweetSpot.time  ? `${sweetSpot.time}s`              : '—' },
              { label: 'Grind', value: sweetSpot.grind ? `⌀${sweetSpot.grind}`             : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#7A6858] mb-0.5">{label}</p>
                <p className="readout font-black text-[#2C1E16] text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top beans */}
      {topBeans.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-3">Top Beans on This Setup</p>
          <div className="space-y-2">
            {topBeans.map((b, i) => (
              <div key={b.label} className="bg-[#F5EBD8] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="readout text-[11px] font-bold text-[#7A6858] w-5 shrink-0">#{i + 1}</span>
                  <p className="text-[#2C1E16] font-semibold text-sm leading-tight flex-1 truncate">{b.label}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="readout font-black text-[#5D4037] text-sm">{b.avgScore.toFixed(1)}</span>
                    <span className="text-[10px] text-[#7A6858]">{b.count}×</span>
                  </div>
                </div>
                {(b.dose || b.time || b.grind) && (
                  <p className="readout text-[10px] text-[#7A6858] mt-1.5 pl-7">
                    {[
                      b.dose && b.yieldG ? `${b.dose.toFixed(1)}→${b.yieldG.toFixed(1)}g` : null,
                      b.time ? `${b.time}s` : null,
                      b.grind ? `⌀${b.grind}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grind hall of fame */}
      {topGrinds.length >= 2 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858] mb-3">Grind Settings</p>
          <div className="space-y-2">
            {topGrinds.map((g) => (
              <div key={g.setting} className="flex items-center gap-3">
                <span className="readout text-sm font-black text-[#2C1E16] w-12 shrink-0">⌀{g.setting}</span>
                <div className="flex-1 bg-[#E8E2D9] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#5D4037] h-2 rounded-full transition-all"
                    style={{ width: `${(g.avgScore / maxGrindScore) * 100}%` }}
                  />
                </div>
                <div className="text-right shrink-0 w-16">
                  <span className="readout text-xs font-bold text-[#5D4037]">★{g.avgScore.toFixed(1)}</span>
                  <span className="text-[10px] text-[#7A6858] ml-1">({g.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [shots, setShots]             = useState<AnalyticsShot[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterMode>('all');
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [activeGrinder, setActiveGrinder] = useState<string | null>(null);
  const [setupLoaded, setSetupLoaded] = useState(false);

  useEffect(() => {
    const machine = localStorage.getItem('activeMachineName') || null;
    const grinder = localStorage.getItem('activeGrinderName') || null;
    const saved   = (localStorage.getItem('analyticsFilter') as FilterMode) || 'all';
    setActiveMachine(machine);
    setActiveGrinder(grinder || null);
    setFilter(saved);
    setSetupLoaded(true);
  }, []);

  useEffect(() => {
    if (setupLoaded) fetchShots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeMachine, activeGrinder, setupLoaded]);

  function changeFilter(f: FilterMode) {
    setFilter(f);
    localStorage.setItem('analyticsFilter', f);
  }

  async function fetchShots() {
    setLoading(true);

    let equipmentIds: string[] | null = null;

    if (filter !== 'all') {
      let q = supabase.from('equipment_profiles').select('id');
      if ((filter === 'machine' || filter === 'rig') && activeMachine) {
        q = q.eq('machine_name', activeMachine);
      }
      if ((filter === 'grinder' || filter === 'rig') && activeGrinder) {
        q = q.eq('grinder_name', activeGrinder);
      }
      const { data: rigs } = await q;
      equipmentIds = (rigs ?? []).map((r) => r.id);
    }

    let q = supabase
      .from('shots')
      .select('extraction_time, overall_score, grind_setting, dose, yield, notes, user_id, beans(roaster, origin, bag_name)')
      .not('overall_score', 'is', null)
      .not('extraction_time', 'is', null)
      .neq('brew_method', 'ColdBrew')
      .order('created_at', { ascending: false })
      .limit(500);

    if (equipmentIds !== null) {
      if (equipmentIds.length === 0) { setShots([]); setLoading(false); return; }
      q = q.in('equipment_id', equipmentIds);
    }

    const { data } = await q;

    const mapped: AnalyticsShot[] = (data ?? []).map((s) => {
      const b = s.beans as { roaster?: string; origin?: string; bag_name?: string | null } | null;
      return {
        extraction_time: s.extraction_time as number,
        overall_score:   s.overall_score   as number,
        grind_setting:   s.grind_setting   ?? null,
        dose:            s.dose            ?? null,
        yield:           (s as Record<string, unknown>).yield as number ?? null,
        notes:           (s as Record<string, unknown>).notes as string ?? null,
        user_id:         s.user_id         ?? null,
        bean_label:      b
          ? (b.bag_name ? `${b.roaster} · ${b.bag_name}` : `${b.roaster} · ${b.origin}`)
          : null,
      };
    });

    setShots(mapped);
    setLoading(false);
  }

  const avgScore  = shots.length > 0 ? (shots.reduce((a, s) => a + s.overall_score, 0) / shots.length).toFixed(1) : null;
  const avgTime   = shots.length > 0 ? Math.round(shots.reduce((a, s) => a + s.extraction_time, 0) / shots.length) : null;
  const bestScore = shots.length > 0 ? Math.max(...shots.map(s => s.overall_score)) : null;

  const chartPoints: ShotPoint[] = shots.map((s) => ({
    extraction_time: s.extraction_time,
    overall_score:   s.overall_score,
    grind_setting:   s.grind_setting,
    dose:            s.dose,
    yield:           s.yield,
    notes:           s.notes,
    bean_label:      s.bean_label,
  }));

  const filterLabel =
    filter === 'all'     ? 'All Community'
    : filter === 'machine' ? (activeMachine ?? 'My Machine')
    : filter === 'grinder' ? (activeGrinder  ?? 'My Grinder')
    : [activeMachine, activeGrinder].filter(Boolean).join(' + ');

  return (
    <div className="p-4 space-y-5">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Analytics</p>
        <h1 className="text-[#2C1E16] font-bold text-3xl tracking-tight leading-none">Dial-in Chart</h1>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <FilterPill label="All Community" active={filter === 'all'} onClick={() => changeFilter('all')} />
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

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {/* ── Stats strip ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Shots',     value: shots.length.toString() },
              { label: 'Avg Score', value: avgScore ?? '—' },
              { label: 'Best',      value: bestScore?.toString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-3xl p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">{label}</p>
                <p className="readout text-[#5D4037] font-bold text-2xl leading-none">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Chart ── */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858]">
                  Extraction Time vs. Score
                  {filter !== 'all' && (
                    <span className="ml-2 text-[#5D4037] normal-case tracking-normal">— {filterLabel}</span>
                  )}
                </p>
                {avgTime != null && (
                  <p className="text-[#2C1E16] text-xs mt-0.5">
                    avg extraction <span className="readout font-bold">{avgTime}s</span>
                  </p>
                )}
              </div>
              {shots.length >= 2 && (
                <span className="text-[10px] text-[#7A6858] readout">trend line shown</span>
              )}
            </div>
            <DialInChart shots={chartPoints} />
          </div>

          {/* ── Setup Insights (only when filtered) ── */}
          {filter !== 'all' && (
            <SetupInsights shots={shots} filterLabel={filterLabel} />
          )}

          <p className="text-[10px] text-[#7A6858] text-center pb-2">
            Only scored shots with extraction times are plotted.
          </p>
        </>
      )}
    </div>
  );
}
