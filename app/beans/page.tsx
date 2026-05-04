import { fetchBeansWithVFM } from '@/lib/vfm-actions';
import BeanCard from '@/components/BeanCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BeansPage() {
  const beans = await fetchBeansWithVFM();
  const activeBeans = beans.filter((b) => b.isActive);

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ── */}
      <div className="pt-6 pb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8A7B72] mb-1">
          Global Database
        </p>
        <div className="flex items-end justify-between">
          <h1 className="text-[#3C2A21] font-black text-2xl tracking-tight leading-none">
            Community Beans
          </h1>
          <span className="text-[#8A7B72] text-sm font-medium">
            {beans.length} bean{beans.length !== 1 ? 's' : ''}
          </span>
        </div>
        {activeBeans.length > 0 && (
          <p className="text-[#C85A32] text-xs font-bold mt-1.5">
            {activeBeans.length} active bag{activeBeans.length !== 1 ? 's' : ''} in rotation
          </p>
        )}
      </div>

      {/* ── VFM Leaderboard entry ── */}
      <Link
        href="/beans/vfm"
        className="flex items-center justify-between bg-[#FEF2EC] rounded-3xl px-5 py-4 transition-colors active:bg-[#FDE8DC]"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#C85A32]">
            Community Rankings
          </p>
          <p className="text-[#3C2A21] font-semibold text-sm mt-0.5">
            🏆 Value for Money Leaderboard
          </p>
        </div>
        <span className="text-[#C85A32] font-bold text-lg">→</span>
      </Link>

      {/* ── Bean list ── */}
      {beans.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-[#3C2A21] font-semibold mb-1">No beans in the community yet</p>
          <p className="text-[#8A7B72] text-sm">Be the first — add a bag when logging a shot.</p>
          <Link
            href="/shots/new"
            className="inline-block mt-4 text-[#C85A32] text-sm font-medium hover:text-[#3C2A21] transition-colors"
          >
            Log a shot →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {beans.map((bean) => (
            <BeanCard key={bean.id} bean={bean} />
          ))}
        </div>
      )}
    </div>
  );
}
