import { fetchBeansWithVFM } from '@/lib/vfm-actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const MEDAL = ['🥇', '🥈', '🥉'];

export default async function VfmLeaderboardPage() {
  const all = await fetchBeansWithVFM();
  const ranked = all
    .filter((b) => b.vfm != null && b.vfm > 0)
    .sort((a, b) => (b.vfm ?? 0) - (a.vfm ?? 0));

  return (
    <div className="p-4 space-y-4">
      <div className="pt-6 pb-1">
        <Link href="/beans" className="text-[#7A6858] text-xs hover:text-[#5D4037] transition-colors mb-3 inline-block">
          ← Community Beans
        </Link>
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#7A6858] mb-1">Community Rankings</p>
        <h1 className="text-[#2C1E16] font-bold text-2xl tracking-tight">Value for Money</h1>
      </div>

      {ranked.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center">
          <p className="text-[#2C1E16] font-semibold mb-1">No ranked beans yet</p>
          <p className="text-[#7A6858] text-sm">
            Beans need a price, weight, and at least one scored shot to appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ranked.map((bean, i) => (
            <div
              key={bean.id}
              className="glass rounded-3xl px-5 py-4 flex items-center gap-4"
            >
              <span className="text-xl leading-none shrink-0 w-7 text-center">
                {i < 3 ? MEDAL[i] : <span className="readout text-[#7A6858] font-bold text-sm">{i + 1}</span>}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-[#2C1E16] font-semibold text-sm leading-tight truncate">{bean.roaster}</p>
                <p className="text-[#7A6858] text-xs mt-0.5">{bean.origin}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {bean.costPerShot != null && (
                    <span className="readout text-[10px] text-[#7A6858]">₪{bean.costPerShot.toFixed(2)}/shot</span>
                  )}
                  {bean.avgScore != null && (
                    <span className="readout text-[10px] text-[#7A6858]">avg {bean.avgScore.toFixed(1)}/10</span>
                  )}
                  {bean.shotCount > 0 && (
                    <span className="text-[10px] text-[#7A6858]">{bean.shotCount} shot{bean.shotCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="readout text-[#FF4500] font-bold text-2xl leading-none">{bean.vfm!.toFixed(1)}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#7A6858] font-bold mt-0.5">VFM</p>
                {bean.isActive && (
                  <span className="text-[9px] font-bold tracking-widest uppercase text-[#FF4500] opacity-70">Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[#7A6858] text-center px-4 pb-2">
        VFM = community avg score ÷ cost per shot. Higher is better.
      </p>
    </div>
  );
}
