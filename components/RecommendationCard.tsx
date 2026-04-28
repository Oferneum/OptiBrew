import type { Recommendation } from '@/lib/types';

const ACCENT: Record<Recommendation['type'], { bar: string; icon: string; iconColor: string }> = {
  'under-extracted': { bar: 'bg-yellow-400/70',  icon: '↑', iconColor: 'text-yellow-400' },
  'over-extracted':  { bar: 'bg-red-400/70',     icon: '↓', iconColor: 'text-red-400'    },
  balanced:          { bar: 'bg-green-400/70',   icon: '✓', iconColor: 'text-green-400'  },
  neutral:           { bar: 'bg-crema/40',        icon: '·', iconColor: 'text-crema'      },
};

export default function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { bar, icon, iconColor } = ACCENT[rec.type];
  return (
    <div className="glass rounded-2xl overflow-hidden flex">
      {/* Colored left accent bar */}
      <div className={`w-1 shrink-0 ${bar}`} />

      <div className="flex-1 p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className={`text-lg leading-none font-bold ${iconColor}`}>{icon}</span>
          <span className="font-semibold text-stone-100 text-sm">{rec.title}</span>
          {rec.isTrend && (
            <span className="ml-auto text-xs bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 px-2 py-0.5 rounded-full">
              Trend
            </span>
          )}
        </div>

        <ul className="space-y-1.5">
          {rec.adjustments.map((adj, i) => (
            <li key={i} className="text-stone-400 text-sm flex gap-2.5">
              <span className="text-crema/70 shrink-0">→</span>
              <span>{adj}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
