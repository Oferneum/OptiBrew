import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import DialInChart from '@/components/DialInChart';
import type { ShotPoint } from '@/components/DialInChart';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <div className="p-4 space-y-5">
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Analytics</p>
        <h1 className="text-[#2C1E16] font-bold text-3xl tracking-tight leading-none">Dial-in Chart</h1>
      </div>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-3xl p-4 h-16 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
        ))}
      </div>
      <div className="glass rounded-3xl p-5 h-72 animate-pulse" />
    </div>
  );
}

async function AnalyticsContent() {
  const { data } = await supabase
    .from('shots')
    .select('extraction_time, overall_score, grind_setting, dose, yield, beans(roaster, origin, bag_name), equipment_profiles(machine_name)')
    .not('overall_score', 'is', null)
    .not('extraction_time', 'is', null)
    .order('created_at', { ascending: false });

  const shots: ShotPoint[] = (data ?? [])
    .filter((s) => s.extraction_time != null && s.overall_score != null)
    .map((s) => {
      const b = s.beans as { roaster?: string; origin?: string; bag_name?: string | null } | null;
      const eq = s.equipment_profiles as { machine_name?: string } | null;
      return {
        extraction_time: s.extraction_time as number,
        overall_score:   s.overall_score as number,
        grind_setting:   s.grind_setting ?? null,
        dose:            s.dose ?? null,
        yield:           (s.yield as number | null) ?? null,
        bean_label:      b ? (b.bag_name ? `${b.roaster} · ${b.bag_name}` : `${b.roaster} · ${b.origin}`) : null,
        equipment_name:  eq?.machine_name ?? null,
      };
    });

  const avgScore = shots.length > 0
    ? (shots.reduce((acc, s) => acc + s.overall_score, 0) / shots.length).toFixed(1)
    : null;

  const avgTime = shots.length > 0
    ? Math.round(shots.reduce((acc, s) => acc + s.extraction_time, 0) / shots.length)
    : null;

  const bestScore = shots.length > 0
    ? Math.max(...shots.map((s) => s.overall_score))
    : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Shots</p>
          <p className="readout text-[#5D4037] font-bold text-2xl leading-none">{shots.length}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Avg Score</p>
          <p className="readout text-[#5D4037] font-bold text-2xl leading-none">{avgScore ?? '—'}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Best</p>
          <p className="readout text-[#5D4037] font-bold text-2xl leading-none">{bestScore ?? '—'}</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858]">Extraction Time vs. Score</p>
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
        <DialInChart shots={shots} />
      </div>

      <p className="text-[10px] text-[#7A6858] text-center pb-2">
        Only scored shots with extraction times are plotted.
      </p>
    </>
  );
}
