import { supabase } from '@/lib/supabase';
import DialInChart from '@/components/DialInChart';
import type { ShotPoint } from '@/components/DialInChart';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { data } = await supabase
    .from('shots')
    .select('extraction_time, overall_score, grind_setting')
    .not('overall_score', 'is', null)
    .not('extraction_time', 'is', null)
    .order('created_at', { ascending: false });

  const shots: ShotPoint[] = (data ?? [])
    .filter((s) => s.extraction_time != null && s.overall_score != null)
    .map((s) => ({
      extraction_time: s.extraction_time as number,
      overall_score:   s.overall_score as number,
      grind_setting:   s.grind_setting ?? null,
    }));

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
    <div className="p-4 space-y-5">
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A7B72] mb-1">Analytics</p>
        <h1 className="text-[#3C2A21] font-bold text-3xl tracking-tight leading-none">Dial-in Chart</h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A7B72] mb-1">Shots</p>
          <p className="readout text-[#C85A32] font-bold text-2xl leading-none">{shots.length}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A7B72] mb-1">Avg Score</p>
          <p className="readout text-[#C85A32] font-bold text-2xl leading-none">{avgScore ?? '—'}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A7B72] mb-1">Best</p>
          <p className="readout text-[#C85A32] font-bold text-2xl leading-none">{bestScore ?? '—'}</p>
        </div>
      </div>

      {/* Scatter chart */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#8A7B72]">Extraction Time vs. Score</p>
            {avgTime != null && (
              <p className="text-[#3C2A21] text-xs mt-0.5">
                avg extraction <span className="readout font-bold">{avgTime}s</span>
              </p>
            )}
          </div>
        </div>
        <DialInChart shots={shots} />
      </div>

      <p className="text-[10px] text-[#AFA096] text-center pb-2">
        Only scored shots with extraction times are plotted.
      </p>
    </div>
  );
}
