import type { Shot } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function qualityLabel(shot: Shot): { text: string; gradient: string } | null {
  if (shot.flavor_tags.includes('Balanced') && (shot.overall_score ?? 0) >= 7)
    return { text: 'DIALED IN', gradient: 'from-emerald-400 to-teal-400' };
  if (shot.flavor_tags.includes('Bitter'))
    return { text: 'BITTER', gradient: 'from-red-400 to-rose-500' };
  if (shot.flavor_tags.includes('Sour'))
    return { text: 'SOUR', gradient: 'from-yellow-300 to-amber-400' };
  if (shot.flavor_tags.includes('Dry'))
    return { text: 'DRY', gradient: 'from-orange-400 to-amber-500' };
  return null;
}

const TAG_CLS: Record<string, string> = {
  Balanced:   'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  Sour:       'text-yellow-300 border-yellow-400/30 bg-yellow-400/10',
  Bitter:     'text-red-400 border-red-500/30 bg-red-500/10',
  Dry:        'text-orange-400 border-orange-500/30 bg-orange-500/10',
  Astringent: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
};

export default function ShotCard({ shot }: { shot: Shot }) {
  const quality = qualityLabel(shot);
  const ratio   = shot.brew_ratio ? `1:${shot.brew_ratio.toFixed(2)}` : null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">

      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#A1A1AA] text-xs font-mono tracking-wide">{formatDate(shot.created_at)}</span>
          {quality && (
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-gradient-to-r ${quality.gradient} text-black`}>
              {quality.text}
            </span>
          )}
        </div>
        {shot.overall_score != null && (
          <span className="readout font-black text-sm bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent shrink-0">
            {shot.overall_score}/10
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="readout text-sm font-bold text-white">{shot.dose}g → {shot.yield}g</span>
        {ratio && (
          <span className="readout text-sm font-black bg-gradient-to-r from-[#FF4500] to-[#FFC107] bg-clip-text text-transparent">
            {ratio}
          </span>
        )}
        <span className="readout text-sm text-white">{shot.extraction_time}s</span>
        {shot.brew_temp != null && (
          <span className="readout text-sm text-[#A1A1AA]">{shot.brew_temp}°C</span>
        )}
        {shot.grind_setting && (
          <span className="readout text-sm text-[#A1A1AA]">⌀{shot.grind_setting}</span>
        )}
      </div>

      {/* Flavor tags */}
      {shot.flavor_tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {shot.flavor_tags.map((tag) => {
            const cls = TAG_CLS[tag] ?? 'text-[#A1A1AA] border-white/10 bg-white/5';
            return (
              <span
                key={tag}
                className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border rounded-full ${cls}`}
              >
                {(tag as string) === 'Astringent' ? 'Dry' : tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Notes */}
      {shot.notes && (
        <p className="text-[#A1A1AA] text-xs leading-relaxed line-clamp-2 border-l-2 border-[#FF4500]/50 pl-2">
          {shot.notes}
        </p>
      )}
    </div>
  );
}
