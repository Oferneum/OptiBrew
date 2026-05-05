'use client';

import {
  ComposedChart, Scatter, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export interface ShotPoint {
  extraction_time: number;
  overall_score: number;
  grind_setting?: string | null;
}

interface ChartPoint {
  x: number;
  y: number;
  grind_setting?: string | null;
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
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.10)] p-3 text-[#3C2A21]">
      <p className="readout font-bold text-base leading-none">{d.y}/10</p>
      <p className="text-[#8A7B72] text-xs mt-1">{d.x}s extraction</p>
      {d.grind_setting && (
        <p className="text-[#8A7B72] text-xs">grind {d.grind_setting}</p>
      )}
    </div>
  );
}

export default function DialInChart({ shots }: { shots: ShotPoint[] }) {
  if (shots.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-[#AFA096] text-sm">
        Log scored shots to see your dial-in chart.
      </div>
    );
  }

  const chartPoints: ChartPoint[] = shots.map((s) => ({
    x: s.extraction_time,
    y: s.overall_score,
    grind_setting: s.grind_setting,
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
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E8E2D9', strokeDasharray: '4 4' }} />

        {/* Trend line */}
        {trendData.length === 2 && (
          <Line
            data={trendData}
            dataKey="y"
            type="linear"
            stroke="#FF4500"
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
          fill="#C85A32"
          fillOpacity={0.7}
          strokeWidth={0}
          r={5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
