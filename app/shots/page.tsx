'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageLoader from '@/components/PageLoader';
import ShotCard from '@/components/ShotCard';
import Link from 'next/link';
import type { Shot } from '@/lib/types';

export default function ShotsPage() {
  const [shots, setShots]     = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error: fetchError } = await supabase
        .from('shots')
        .select('*, beans(roaster, origin, bag_name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setShots((data ?? []) as Shot[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center pt-6 pb-1">
        <h1 className="text-[#2C1E16] font-bold text-2xl tracking-tight">Shot History</h1>
        <Link href="/shots/new" className="text-[#5D4037] text-sm font-medium transition-colors">
          + New
        </Link>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <div className="p-4 text-red-600 text-sm">Failed to load shots: {error}</div>
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
