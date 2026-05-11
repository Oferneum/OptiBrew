'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
import ShotCard from '@/components/ShotCard';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

async function fetchShots(): Promise<Shot[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('shots')
    .select('*, beans(roaster, origin, bag_name)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as Shot[];
}

export default function ShotsPage() {
  const { data: shots = [], isLoading, error } = useSWR('shots/list', fetchShots);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center pt-6 pb-1">
        <h1 className="text-[#2C1E16] font-bold text-2xl tracking-tight">Shot History</h1>
        <Link href="/shots/new" className="text-[#5D4037] text-sm font-medium transition-colors">
          + New
        </Link>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="p-4 text-red-600 text-sm">Failed to load shots: {(error as Error).message}</div>
      ) : shots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 opacity-20">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 28h24l-3.5 18H23.5L20 28z" />
              <path d="M44 32h4a5 5 0 0 1 0 10h-4" />
              <ellipse cx="32" cy="48" rx="16" ry="2.5" />
              <path d="M26 22c0-5 5-5 5-10" />
              <path d="M35 24c0-5 5-5 5-10" />
            </svg>
          </div>
          <p className="text-[#2C1E16] font-semibold text-base mb-2">No shots logged yet</p>
          <Link href="/shots/new" className="text-[#5D4037] font-medium text-sm transition-colors">
            Log your first shot →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shots.map((shot) => (
            <Link key={shot.id} href={`/shots/${shot.id}`} className="block active:scale-[0.99] transition-transform">
              <ShotCard shot={shot} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
