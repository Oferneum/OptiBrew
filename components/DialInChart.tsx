'use client';

import {
  ComposedChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';

export interface ShotPoint {
  extraction_time: number;
  overall_score:   number;
  grind_setting?:  string | null;
  dose?:           number | null;
  yield?:          number | null;
  notes?:          string | null;
  bean_label?:     string | null;
  equipment_name?: string | null;
}

interface ChartPoint {
  x:              number;
  y:              number;
  rawX:           number;
  rawY:           number;
  grind_setting?: string | null;
  dose?:          number | null;
  yield?:         number | null;
  notes?:         string | null;
  bean_label?:    string | null;
}

function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return (s - Math.floor(s) - 0.5) * 2 * range;
}

const TIERS = [
  { label: '8–10',  color: '#4A7C59', min: 8,  max: 10 },
  { label: '6–7',   color: '#B8860B', min: 6,  max: 7  },
  { label: '1–5',   color: '#9B3030', min: 1,  max: 5  },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const ratio = d.dose && d.yield ? `1:${(d.yield / d.dose).toFixed(2)}` : null;
  const tier  = TIERS.find((t) => d.rawY >= t.min && d.rawY <= t.max);
  const scoreColor = tier?.color ?? '#7A6858';

  return (
    <div style={{
      background: '#FAF3E6',
      border: '1px solid #C8B49A',
      borderRadius: 14,
      padding: '12px 14px',
      minWidth: 180,
      maxWidth: 240,
      boxShadow: '0 6px 24px rgba(44,30,22,0.14)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontWeight: 900, fontSize: 22, color: scoreColor, lineHeight: 1 }}>
          {d.rawY}/10
        </span>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, color: '#AFA096' }}>
          {d.rawX}s
        </span>
      </div>
      {d.bean_label && (
        <p style={{ fontSize: 11, color: '#2C1E16', fontWeight: 700, marginBottom: 3, lineHeight: 1.3 }}>
          {d.bean_label}
        </p>
      )}
      {(d.dose || d.yield) && (
        <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858', marginBottom: 2 }}>
          {d.dose}g → {d.yield}g{ratio ? ` · ${ratio}` : ''}
        </p>
      )}
      {d.grind_setting && (
        <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858', marginBottom: 2 }}>
          Grind ⌀{d.grind_setting}
        </p>
      )}
      {d.notes && (
        <p style={{
          fontSize: 10, color: '#5D4037', fontStyle: 'italic',
          marginTop: 6, paddingTop: 6, borderTop: '1px solid #E8DED2',
          lineHeight: 1.4, whiteSpace: 'normal', wordBreak: 'break-word',
        }}>
          &ldquo;{d.notes}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function DialInChart({ shots }: { shots: ShotPoint[] }) {
  if (shots.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-[#7A6858]">
        <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7.5" cy="15" r="1.5" fill="currentColor" strokeWidth="0" />
          <circle cx="12" cy="9" r="1.5" fill="currentColor" strokeWidth="0" />
          <circle cx="16.5" cy="13" r="1.5" fill="currentColor" strokeWidth="0" />
          <path d="M3 20h18" />
        </svg>
        <p className="text-sm font-medium">Log scored shots to see your chart</p>
      </div>
    );
  }

  const X_MIN = 15;
  const X_MAX = 45;

  const allPoints: ChartPoint[] = shots.map((s, i) => ({
    x:             Math.max(X_MIN, Math.min(X_MAX, s.extraction_time + jitter(i * 17.3 + s.extraction_time, 0.9))),
    y:             Math.max(1, Math.min(10, s.overall_score + jitter(i * 31.7 + s.overall_score, 0.08))),
    rawX:          s.extraction_time,
    rawY:          s.overall_score,
    grind_setting: s.grind_setting,
    dose:          s.dose,
    yield:         s.yield,
    notes:         s.notes,
    bean_label:    s.bean_label,
  }));

  const tierPoints = TIERS.map((t) => ({
    ...t,
    points: allPoints.filter((p) => p.rawY >= t.min && p.rawY <= t.max),
  }));

  const highScored = shots
    .filter((s) => s.overall_score >= 8)
    .map((s) => s.extraction_time)
    .sort((a, b) => a - b);

  const sweetSpot = (() => {
    if (highScored.length === 0) return null;
    if (highScored.length === 1) return { x1: highScored[0] - 1, x2: highScored[0] + 1, label: `${highScored[0]}s` };
    const p25 = highScored[Math.floor(highScored.length * 0.25)];
    const p75 = highScored[Math.ceil(highScored.length * 0.75 - 1)];
    return { x1: p25 - 0.5, x2: p75 + 0.5, label: `${p25}–${p75}s` };
  })();

  return (
    <div>
      {/* Legend + sweet spot */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          {tierPoints.filter((t) => t.points.length > 0).map((t) => (
            <div key={t.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.color }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
        {sweetSpot && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: '#4A7C59' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A7C59]">
              Sweet spot {sweetSpot.label}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart margin={{ top: 8, right: 12, bottom: 28, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[X_MIN, X_MAX]}
            tickFormatter={(v: number) => String(Math.round(v))}
            tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
            tickLine={false}
            axisLine={{ stroke: '#E8E2D9' }}
            label={{ value: 'extraction time (s)', position: 'insideBottom', offset: -14, fill: '#AFA096', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            ticks={[2, 4, 6, 8, 10]}
            tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C8B49A', strokeDasharray: '4 4' }} />

          {sweetSpot && (
            <ReferenceArea
              x1={sweetSpot.x1} x2={sweetSpot.x2}
              fill="#4A7C59" fillOpacity={0.12}
              stroke="#4A7C59" strokeOpacity={0.35}
              strokeWidth={1} strokeDasharray="4 3"
            />
          )}

          {tierPoints.map((t) => (
            <Scatter
              key={t.label}
              data={t.points}
              fill={t.color}
              fillOpacity={0.75}
              strokeWidth={0}
              r={5}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
