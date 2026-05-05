import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ShotCard from '@/components/ShotCard';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ShotsPage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center pt-6 pb-1">
        <h1 className="text-white font-bold text-2xl tracking-tight">Shot History</h1>
        <Link href="/shots/new" className="text-[#FF4500] text-sm font-medium transition-colors">
          + New
        </Link>
      </div>
      <Suspense fallback={<ShotsSkeleton />}>
        <ShotList userId={user.id} />
      </Suspense>
    </div>
  );
}

function ShotsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="glass rounded-2xl h-24 animate-pulse"
          style={{ opacity: 1 - i * 0.18 }}
        />
      ))}
    </div>
  );
}

async function ShotList({ userId }: { userId: string }) {
  const { data, error } = await supabase
    .from('shots')
    .select('*, beans(roaster, origin, bag_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm">Failed to load shots: {error.message}</div>
    );
  }

  const shots = (data ?? []) as Shot[];

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 opacity-20">
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 28h24l-3.5 18H23.5L20 28z" />
            <path d="M44 32h4a5 5 0 0 1 0 10h-4" />
            <ellipse cx="32" cy="48" rx="16" ry="2.5" />
            <path d="M26 22c0-5 5-5 5-10" />
            <path d="M35 24c0-5 5-5 5-10" />
          </svg>
        </div>
        <p className="text-white font-semibold text-base mb-2">No shots logged yet</p>
        <Link href="/shots/new" className="text-[#FF4500] font-medium text-sm transition-colors">
          Log your first shot →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shots.map((shot) => (
        <Link key={shot.id} href={`/shots/${shot.id}`} className="block active:scale-[0.99] transition-transform">
          <ShotCard shot={shot} />
        </Link>
      ))}
    </div>
  );
}
