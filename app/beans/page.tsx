import { fetchBeansWithVFM } from '@/lib/vfm-actions';
import BeanCard from '@/components/BeanCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BeansPage() {
  const beans = await fetchBeansWithVFM();

  return (
    <div className="p-4 space-y-4">
      <div className="pt-6 pb-1 flex items-center justify-between">
        <h1 className="text-[#3C2A21] font-bold text-2xl tracking-tight">Bean Inventory</h1>
        <span className="text-[#8A7B72] text-sm">{beans.length} bag{beans.length !== 1 ? 's' : ''}</span>
      </div>

      <Link href="/beans/vfm" className="flex items-center justify-between bg-[#FEF2EC] rounded-3xl px-5 py-4 transition-colors active:bg-[#FDE8DC]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#C85A32]">Leaderboard</p>
          <p className="text-[#3C2A21] font-semibold text-sm mt-0.5">🏆 Value for Money Rankings</p>
        </div>
        <span className="text-[#C85A32] font-bold text-lg">→</span>
      </Link>

      {beans.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-[#3C2A21] font-semibold mb-1">No beans saved yet</p>
          <p className="text-[#8A7B72] text-sm">Add a bag when logging a shot.</p>
          <Link href="/shots/new" className="inline-block mt-4 text-[#C85A32] text-sm font-medium hover:text-[#3C2A21] transition-colors">
            Log a shot →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {beans.map((bean) => <BeanCard key={bean.id} bean={bean} />)}
        </div>
      )}
    </div>
  );
}
