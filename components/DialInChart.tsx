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
  x:              number; // jittered extraction_time
  y:              number; // jittered overall_score
  rawX:           number; // original extraction_time for display
  rawY:           number; // original overall_score for display
  grind_setting?: string | null;
  dose?:          number | null;
  yield?:         number | null;
  notes?:         string | null;
  bean_label?:    string | null;
  equipment_name?:string | null;
}

// Deterministic pseudo-random jitter — same seed always gives same offset so
// dots don't jump on re-render, but two shots with identical values still
// separate slightly.
function jitter(seed: number, range: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return (s - Math.floor(s) - 0.5) * 2 * range;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  const ratio = d.dose && d.yield ? `1:${(d.yield / d.dose).toFixed(2)}` : null;
  const scoreColor = d.rawY >= 8 ? '#4A7C59' : d.rawY >= 6 ? '#7A6858' : '#9B3030';

  return (
    <div style={{
      background: '#FAF3E6',
      border: '1px solid #C8B49A',
      borderRadius: 16,
      padding: '12px 14px',
      minWidth: 190,
      maxWidth: 240,
      boxShadow: '0 4px 24px rgba(44,30,22,0.13)',
    }}>
      {/* Score + time */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontWeight: 900, fontSize: 22, color: scoreColor, lineHeight: 1 }}>
          {d.rawY}/10
        </span>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 11, color: '#AFA096' }}>
          {d.rawX}s
        </span>
      </div>

      {/* Bean */}
      {d.bean_label && (
        <p style={{ fontSize: 11, color: '#2C1E16', fontWeight: 700, marginBottom: 2, lineHeight: 1.3 }}>
          {d.bean_label}
        </p>
      )}

      {/* Dose / yield / ratio */}
      {(d.dose || d.yield) && (
        <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858', marginBottom: 2 }}>
          {d.dose}g → {d.yield}g{ratio ? ` · ${ratio}` : ''}
        </p>
      )}

      {/* Grind */}
      {d.grind_setting && (
        <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858', marginBottom: 2 }}>
          Grind ⌀{d.grind_setting}
        </p>
      )}

      {/* Notes */}
      {d.notes && (
        <p style={{
          fontSize: 10,
          color: '#5D4037',
          fontStyle: 'italic',
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid #E8DED2',
          lineHeight: 1.4,
          maxWidth: 210,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
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
      <div className="h-[280px] flex items-center justify-center text-[#7A6858] text-sm">
        Log scored shots to see your dial-in chart.
      </div>
    );
  }

  // Build chart points with deterministic jitter to separate overlapping dots
  const chartPoints: ChartPoint[] = shots.map((s, i) => ({
    x:              s.extraction_time + jitter(i * 17.3 + s.extraction_time, 0.9),
    y:              Math.max(1, Math.min(10, s.overall_score + jitter(i * 31.7 + s.overall_score, 0.08))),
    rawX:           s.extraction_time,
    rawY:           s.overall_score,
    grind_setting:  s.grind_setting,
    dose:           s.dose,
    yield:          s.yield,
    notes:          s.notes,
    bean_label:     s.bean_label,
    equipment_name: s.equipment_name,
  }));

  // Sweet spot: extraction time range where the user typically scores >= 8
  const highScored = shots.filter((s) => s.overall_score >= 8);
  const sweetSpot = highScored.length > 0 ? {
    x1: Math.min(...highScored.map((s) => s.extraction_time)) - 1,
    x2: Math.max(...highScored.map((s) => s.extraction_time)) + 1,
  } : null;

  return (
    <div>
      {sweetSpot && (
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#4A7C59', opacity: 0.5 }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A7C59]">
            Sweet spot: {sweetSpot.x1 + 1}–{sweetSpot.x2 - 1}s
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart margin={{ top: 8, right: 12, bottom: 28, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[15, 45]}
            name="Extraction Time"
            tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
            tickLine={false}
            axisLine={{ stroke: '#E8E2D9' }}
            label={{ value: 'extraction time (s)', position: 'insideBottom', offset: -14, fill: '#AFA096', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[1, 10]}
            name="Score"
            ticks={[2, 4, 6, 8, 10]}
            tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C8B49A', strokeDasharray: '4 4' }} />

          {/* Sweet spot zone */}
          {sweetSpot && (
            <ReferenceArea
              x1={sweetSpot.x1}
              x2={sweetSpot.x2}
              fill="#4A7C59"
              fillOpacity={0.10}
              stroke="#4A7C59"
              strokeOpacity={0.25}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {/* Scatter dots — fillOpacity separates overlapping shots visually */}
          <Scatter
            data={chartPoints}
            fill="#5D4037"
            fillOpacity={0.60}
            strokeWidth={0}
            r={5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
