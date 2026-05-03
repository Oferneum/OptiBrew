'use client';

import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
export interface ShotPoint {
  extraction_time: number;
  overall_score: number;
  grind_setting?: string | null;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ShotPoint }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.10)] p-3 text-[#3C2A21]">
      <p className="readout font-bold text-base leading-none">{d.overall_score}/10</p>
      <p className="text-[#8A7B72] text-xs mt-1">{d.extraction_time}s extraction</p>
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

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
        <XAxis
          type="number"
          dataKey="extraction_time"
          domain={[15, 45]}
          name="Extraction Time"
          tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
          tickLine={false}
          axisLine={{ stroke: '#E8E2D9' }}
          label={{ value: 'seconds', position: 'insideBottom', offset: -12, fill: '#AFA096', fontSize: 10 }}
        />
        <YAxis
          type="number"
          dataKey="overall_score"
          domain={[1, 10]}
          name="Score"
          ticks={[2, 4, 6, 8, 10]}
          tick={{ fill: '#AFA096', fontSize: 10, fontFamily: 'var(--font-space-mono)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#E8E2D9', strokeDasharray: '4 4' }}
        />
        <Scatter
          data={shots}
          fill="#C85A32"
          fillOpacity={0.65}
          strokeWidth={0}
          r={5}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
