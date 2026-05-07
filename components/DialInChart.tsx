'use client';

import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export interface ShotPoint {
  extraction_time: number;
  overall_score: number;
  grind_setting?: string | null;
  dose?: number | null;
  yield?: number | null;
  bean_label?: string | null;
  equipment_name?: string | null;
}

interface ChartPoint {
  x: number;
  y: number;
  grind_setting?: string | null;
  dose?: number | null;
  yield?: number | null;
  bean_label?: string | null;
  equipment_name?: string | null;
  source: 'shot' | 'trend';
}

function linearRegression(pts: ChartPoint[]) {
  const n = pts.length;
  if (n < 2) return null;
  const sumX  = pts.reduce((s, p) => s + p.x, 0);
  const sumY  = pts.reduce((s, p) => s + p.y, 0);
  const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = pts.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.source !== 'shot') return null;

  const ratio = d.dose && d.yield ? `1:${(d.yield / d.dose).toFixed(2)}` : null;

  return (
    <div style={{ background: '#FAF3E6', border: '1px solid #C8B49A', borderRadius: 14, padding: '12px 14px', minWidth: 160, boxShadow: '0 4px 20px rgba(44,30,22,0.12)' }}>
      <p style={{ fontFamily: 'var(--font-space-mono)', fontWeight: 900, fontSize: 18, color: '#5D4037', lineHeight: 1, marginBottom: 6 }}>
        {d.y}/10
      </p>
      {d.bean_label && (
        <p style={{ fontSize: 11, color: '#2C1E16', fontWeight: 600, marginBottom: 2 }}>{d.bean_label}</p>
      )}
      {d.equipment_name && (
        <p style={{ fontSize: 11, color: '#7A6858', marginBottom: 4 }}>{d.equipment_name}</p>
      )}
      <div style={{ borderTop: '1px solid #C8B49A', paddingTop: 6, marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858' }}>{d.x}s</span>
        {d.dose && d.yield && (
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858' }}>
            {d.dose}→{d.yield}g{ratio ? ` (${ratio})` : ''}
          </span>
        )}
        {d.grind_setting && (
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: 10, color: '#7A6858' }}>⌀{d.grind_setting}</span>
        )}
      </div>
    </div>
  );
}

export default function DialInChart({ shots }: { shots: ShotPoint[] }) {
  if (shots.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-[#7A6858] text-sm">
        Log scored shots to see your dial-in chart.
      </div>
    );
  }

  const chartPoints: ChartPoint[] = shots.map((s) => ({
    x: s.extraction_time,
    y: s.overall_score,
    grind_setting:  s.grind_setting,
    dose:           s.dose,
    yield:          s.yield,
    bean_label:     s.bean_label,
    equipment_name: s.equipment_name,
    source: 'shot',
  }));

  const reg = linearRegression(chartPoints);
  const trendData: ChartPoint[] = reg ? [
    { x: 15, y: clamp(reg.slope * 15 + reg.intercept, 1, 10), source: 'trend' },
    { x: 45, y: clamp(reg.slope * 45 + reg.intercept, 1, 10), source: 'trend' },
  ] : [];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[15, 45]}
          name="Extraction Time"
          tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
          tickLine={false}
          axisLine={{ stroke: '#E8E2D9' }}
          label={{ value: 'seconds', position: 'insideBottom', offset: -12, fill: '#AFA096', fontSize: 10 }}
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

        {/* Trend line */}
        {trendData.length === 2 && (
          <Line
            data={trendData}
            dataKey="y"
            type="linear"
            stroke="#5D4037"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />
        )}

        {/* Scatter dots */}
        <Scatter
          data={chartPoints}
          fill="#5D4037"
          fillOpacity={0.65}
          strokeWidth={0}
          r={5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
