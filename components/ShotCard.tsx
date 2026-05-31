import type { Shot } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function qualityLabel(shot: Shot): { text: string; gradient: string } | null {
  if (shot.flavor_tags.includes('Balanced') && (shot.overall_score ?? 0) >= 7)
    return { text: 'DIALED IN', gradient: 'from-emerald-500 to-teal-500' };
  if (shot.flavor_tags.includes('Bitter'))
    return { text: 'BITTER', gradient: 'from-red-500 to-rose-600' };
  if (shot.flavor_tags.includes('Sour'))
    return { text: 'SOUR', gradient: 'from-yellow-500 to-amber-500' };
  if (shot.flavor_tags.includes('Dry'))
    return { text: 'DRY', gradient: 'from-orange-500 to-amber-600' };
  return null;
}

const TAG_CLS: Record<string, string> = {
  Balanced:   'text-emerald-700 border-emerald-500/40 bg-emerald-500/10',
  Sour:       'text-amber-700 border-amber-500/40 bg-amber-500/10',
  Bitter:     'text-red-700 border-red-500/40 bg-red-500/10',
  Dry:        'text-orange-700 border-orange-500/40 bg-orange-500/10',
  Astringent: 'text-orange-700 border-orange-500/40 bg-orange-500/10',
};

export default function ShotCard({ shot }: { shot: Shot }) {
  const quality = qualityLabel(shot);
  const ratio   = shot.brew_ratio ? `1:${shot.brew_ratio.toFixed(2)}` : null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">

      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span dir="ltr" className="text-[#7A6858] text-xs font-mono tracking-wide">{formatDate(shot.created_at)}</span>
            {quality && (
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-gradient-to-r ${quality.gradient} text-white`}>
                {quality.text}
              </span>
            )}
          </div>
          {shot.beans && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#5D4037] shrink-0" />
              <span className="text-[#7A6858] text-[11px] truncate">
                {shot.beans.roaster} · {shot.beans.origin}
              </span>
            </div>
          )}
        </div>
        {shot.overall_score != null && (
          <span className="readout font-black text-sm text-[#5D4037] shrink-0">
            {shot.overall_score}/10
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="glass-display rounded-xl px-3 py-2">
        <div className="flex items-center justify-evenly text-center divide-x divide-[#C8B49A]">
          {[
            { label: 'Dose',  value: `${shot.dose}g`,           color: 'text-[#2C1E16]' },
            { label: 'Yield', value: `${shot.yield}g`,          color: 'text-[#2C1E16]' },
            ...(ratio            ? [{ label: 'Ratio', value: ratio,                      color: 'text-[#5D4037]' }] : []),
            ...(shot.extraction_time != null ? [{ label: 'Time',  value: `${shot.extraction_time}s`, color: 'text-[#2C1E16]' }] : []),
            ...(shot.brew_temp   != null ? [{ label: 'Temp',  value: `${shot.brew_temp}°C`,      color: 'text-[#7A6858]' }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 flex flex-col items-center px-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#7A6858]">{label}</p>
              <p className={`readout text-sm font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flavor tags */}
      {shot.flavor_tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {shot.flavor_tags.map((tag) => {
            const cls = TAG_CLS[tag] ?? 'text-[#7A6858] border-[#C8B49A] bg-[#2C1E16]/5';
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
        <p className="text-[#7A6858] text-xs leading-relaxed line-clamp-2 border-l-2 border-[#5D4037]/30 pl-2">
          {shot.notes}
        </p>
      )}
    </div>
  );
}
