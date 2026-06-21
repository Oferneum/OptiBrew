'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
import DialInChart from '@/components/DialInChart';
import type { ShotPoint } from '@/components/DialInChart';

type FilterMode = 'all' | 'machine' | 'grinder' | 'rig';

interface AnalyticsShot extends ShotPoint {
  user_id?: string | null;
}

const avg = (arr: number[]) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

function mode(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  arr.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({ label, active, disabled, onClick }: {
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

// ── Insights panel ─────────────────────────────────────────────────────────

function Insights({ shots }: { shots: AnalyticsShot[] }) {
  if (shots.length < 3) return null;

  // Sweet-spot recipe (shots ≥ 7/10)
  const goodShots = shots.filter((s) => s.overall_score >= 7);
  const sweetSpot = goodShots.length >= 2 ? {
    dose:  avg(goodShots.filter(s => s.dose).map(s => s.dose!)),
    yield: avg(goodShots.filter(s => s.yield).map(s => s.yield!)),
    time:  Math.round(avg(goodShots.map(s => s.extraction_time)) ?? 0),
    grind: mode(goodShots.filter(s => s.grind_setting).map(s => s.grind_setting!)),
  } : null;

  // Top beans by average score
  type BeanBucket = { scores: number[]; doses: number[]; yields: number[]; times: number[]; grinds: string[] };
  const beanMap: Record<string, BeanBucket> = {};
  for (const s of shots) {
    const key = s.bean_label || '__unknown__';
    if (!beanMap[key]) beanMap[key] = { scores: [], doses: [], yields: [], times: [], grinds: [] };
    beanMap[key].scores.push(s.overall_score);
    if (s.dose)          beanMap[key].doses.push(s.dose);
    if (s.yield)         beanMap[key].yields.push(s.yield);
    beanMap[key].times.push(s.extraction_time);
    if (s.grind_setting) beanMap[key].grinds.push(s.grind_setting);
  }
  const topBeans = Object.entries(beanMap)
    .filter(([k]) => k !== '__unknown__')
    .map(([label, b]) => ({
      label,
      avgScore: avg(b.scores)!,
      count:    b.scores.length,
      time:     b.times.length ? Math.round(avg(b.times)!) : null,
      grind:    mode(b.grinds),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Grind settings by avg score
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

  if (!sweetSpot && topBeans.length === 0 && topGrinds.length === 0) return null;

  return (
    <div className="space-y-4">

      {/* Winning recipe */}
      {sweetSpot && (
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">
              Winning Recipe
              <span className="normal-case tracking-normal font-medium opacity-60 ml-1">(avg of 7+ shots)</span>
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Dose',  value: sweetSpot.dose  ? `${sweetSpot.dose.toFixed(1)}g`  : '—' },
              { label: 'Yield', value: sweetSpot.yield ? `${sweetSpot.yield.toFixed(1)}g` : '—' },
              { label: 'Time',  value: sweetSpot.time  ? `${sweetSpot.time}s`              : '—' },
              { label: 'Grind', value: sweetSpot.grind ? `⌀${sweetSpot.grind}`             : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F5EBD8] rounded-2xl py-3 px-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#7A6858] mb-1">{label}</p>
                <p className="readout font-black text-[#2C1E16] text-sm leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top beans */}
      {topBeans.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5D4037]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Top Beans</p>
          </div>
          <div className="space-y-2">
            {topBeans.map((b, i) => (
              <div key={b.label} className="flex items-center gap-3 py-2.5 border-b border-[#E8DED2] last:border-0">
                <span className="readout text-[11px] font-black text-[#C8B49A] w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#2C1E16] font-bold text-sm leading-tight truncate">{b.label}</p>
                  {(b.time || b.grind) && (
                    <p className="readout text-[10px] text-[#7A6858] mt-0.5">
                      {[b.time && `${b.time}s`, b.grind && `⌀${b.grind}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="readout font-black text-[#5D4037] text-sm">{b.avgScore.toFixed(1)}</p>
                  <p className="text-[10px] text-[#7A6858]">{b.count} shot{b.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grind settings */}
      {topGrinds.length >= 2 && (
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5D4037]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">Grind Settings</p>
          </div>
          <div className="space-y-3">
            {topGrinds.map((g) => (
              <div key={g.setting} className="flex items-center gap-3">
                <span className="readout text-sm font-black text-[#2C1E16] w-10 shrink-0">⌀{g.setting}</span>
                <div className="flex-1 bg-[#F5EBD8] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(g.avgScore / maxGrindScore) * 100}%`, background: '#5D4037' }}
                  />
                </div>
                <div className="shrink-0 w-14 text-right">
                  <span className="readout text-xs font-black text-[#5D4037]">{g.avgScore.toFixed(1)}</span>
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
  const [shots, setShots]               = useState<AnalyticsShot[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterMode>('all');
  const [activeMachine, setActiveMachine] = useState<string | null>(null);
  const [activeGrinder, setActiveGrinder] = useState<string | null>(null);
  const [setupLoaded, setSetupLoaded]   = useState(false);

  useEffect(() => {
    const machine = localStorage.getItem('activeMachineName') || null;
    const grinder = localStorage.getItem('activeGrinderName') || null;
    const saved   = (localStorage.getItem('analyticsFilter') as FilterMode) || 'all';
    setActiveMachine(machine);
    setActiveGrinder(grinder);
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
      if ((filter === 'machine' || filter === 'rig') && activeMachine) q = q.eq('machine_name', activeMachine);
      if ((filter === 'grinder' || filter === 'rig') && activeGrinder)  q = q.eq('grinder_name', activeGrinder);
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
        bean_label:      b ? (b.bag_name ? `${b.roaster} · ${b.bag_name}` : `${b.roaster} · ${b.origin}`) : null,
      };
    });

    setShots(mapped);
    setLoading(false);
  }

  const avgScore  = shots.length > 0 ? (shots.reduce((a, s) => a + s.overall_score, 0) / shots.length).toFixed(1) : null;
  const avgTime   = shots.length > 0 ? Math.round(shots.reduce((a, s) => a + s.extraction_time, 0) / shots.length) : null;

  const filterLabel =
    filter === 'all'     ? 'All shots'
    : filter === 'machine' ? (activeMachine ?? 'My machine')
    : filter === 'grinder' ? (activeGrinder  ?? 'My grinder')
    : [activeMachine, activeGrinder].filter(Boolean).join(' + ');

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-28 space-y-5">

      {/* ── Header ── */}
      <header className="pt-4">
        <div className="w-8 h-0.5 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] rounded-full mb-3" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7A6858]">Analytics</p>
        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-[#2C1E16]">
          Dial-In
        </h1>
      </header>

      {/* ── Filter bar ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <FilterPill label="All shots"   active={filter === 'all'}     onClick={() => changeFilter('all')} />
        {activeMachine && (
          <FilterPill label={activeMachine} active={filter === 'machine'} onClick={() => changeFilter('machine')} />
        )}
        {activeGrinder && (
          <FilterPill label={activeGrinder}  active={filter === 'grinder'} onClick={() => changeFilter('grinder')} />
        )}
        {activeMachine && (
          <FilterPill label="Full rig"  active={filter === 'rig'}     onClick={() => changeFilter('rig')} />
        )}
        {!activeMachine && (
          <span className="text-[10px] text-[#7A6858] self-center ml-1 whitespace-nowrap">
            Add equipment in Settings to filter →
          </span>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : shots.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center space-y-2">
          <p className="text-[#2C1E16] font-bold">No shots found</p>
          <p className="text-[#7A6858] text-sm">
            {filter !== 'all' ? 'Try a different filter, or log shots with this setup.' : 'Log scored shots to see your chart.'}
          </p>
          {filter !== 'all' && (
            <button type="button" onClick={() => changeFilter('all')} className="text-[#5D4037] text-sm font-black uppercase tracking-wider mt-2">
              Show all →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Chart ── */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6858]">
                  Extraction time vs. score
                </p>
                <p className="text-[#2C1E16] font-bold text-sm mt-0.5 leading-none">{filterLabel}</p>
              </div>
              <div className="text-right shrink-0">
                {avgScore && (
                  <p className="readout font-black text-[#5D4037] text-xl leading-none">{avgScore}</p>
                )}
                {avgTime && (
                  <p className="readout text-[10px] text-[#7A6858] mt-0.5">avg {avgTime}s</p>
                )}
              </div>
            </div>
            <DialInChart shots={shots} />
          </div>

          {/* ── Insights ── */}
          <Insights shots={shots} />

          <p className="text-[10px] text-[#7A6858] text-center pb-2">
            Only scored shots with extraction times are shown.
          </p>
        </>
      )}
    </div>
  );
}
