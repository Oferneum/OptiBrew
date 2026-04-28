import { supabase } from '@/lib/supabase';
import ShotCard from '@/components/ShotCard';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ShotsPage() {
  const { data, error } = await supabase
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm">Failed to load shots: {error.message}</div>
    );
  }

  const shots = (data ?? []) as Shot[];

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center pt-6 pb-1">
        <h1 className="text-stone-50 font-bold text-2xl tracking-tight">Shot History</h1>
        <Link href="/shots/new" className="text-crema/80 text-sm font-medium hover:text-crema transition-colors">
          + New
        </Link>
      </div>

      {shots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 opacity-30">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#c4873e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 28h24l-3.5 18H23.5L20 28z" />
              <path d="M44 32h4a5 5 0 0 1 0 10h-4" />
              <ellipse cx="32" cy="48" rx="16" ry="2.5" />
              <path d="M26 22c0-5 5-5 5-10" />
              <path d="M35 24c0-5 5-5 5-10" />
            </svg>
          </div>
          <p className="text-stone-300 font-semibold text-base mb-2">No shots logged yet</p>
          <Link href="/shots/new" className="text-crema/80 font-medium text-sm hover:text-crema transition-colors">
            Log your first shot →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shots.map((shot) => (
            <ShotCard key={shot.id} shot={shot} />
          ))}
        </div>
      )}
    </div>
  );
}
