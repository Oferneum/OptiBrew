import type { Shot } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Keyed by string so old 'Astringent' rows still render gracefully
const TAG_CLASSES: Record<string, string> = {
  Balanced:   'bg-green-400/15  text-green-400  border border-green-400/20',
  Sour:       'bg-yellow-400/15 text-yellow-400 border border-yellow-400/20',
  Bitter:     'bg-red-400/15   text-red-400    border border-red-400/20',
  Dry:        'bg-orange-400/15 text-orange-400 border border-orange-400/20',
  Astringent: 'bg-orange-400/15 text-orange-400 border border-orange-400/20',
};

const FALLBACK_TAG = 'bg-stone-400/15 text-stone-400 border border-stone-400/20';

export default function ShotCard({ shot }: { shot: Shot }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <span className="text-stone-600 text-xs tracking-wide">{formatDate(shot.created_at)}</span>
        {shot.overall_score != null && (
          <span className="readout text-crema font-bold text-sm bg-crema/10 px-2 py-0.5 rounded-full border border-crema/20">
            {shot.overall_score}/10
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-stone-200 font-medium text-sm">
        <span>
          <span className="text-stone-500 text-xs mr-1">dose→yield</span>
          {shot.dose}g → {shot.yield}g
        </span>
        <span className="readout text-crema font-semibold">1:{shot.brew_ratio.toFixed(2)}</span>
        <span className="readout">{shot.extraction_time}s</span>
        {shot.brew_temp != null && <span className="readout">{shot.brew_temp}°C</span>}
        {shot.grind_setting && (
          <span className="text-stone-400">
            <span className="text-stone-600 text-xs mr-1">grind</span>
            <span className="readout">{shot.grind_setting}</span>
          </span>
        )}
      </div>

      {shot.flavor_tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {shot.flavor_tags.map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TAG_CLASSES[tag] ?? FALLBACK_TAG}`}
            >
              {(tag as string) === 'Astringent' ? 'Dry' : tag}
            </span>
          ))}
        </div>
      )}

      {shot.notes && (
        <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed">{shot.notes}</p>
      )}
    </div>
  );
}
