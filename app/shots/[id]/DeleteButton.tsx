'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { mutate } from 'swr';
import { supabase } from '@/lib/supabase';
import type { Shot } from '@/lib/types';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shots/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Delete failed (${res.status})`);
      }
      // Instantly remove from both SWR caches — no reload needed.
      mutate('home/shots', (prev: Shot[] | undefined) => prev?.filter((s) => s.id !== id), { revalidate: false });
      mutate('shots/list', (prev: Shot[] | undefined) => prev?.filter((s) => s.id !== id), { revalidate: false });
      router.push('/shots');
    } catch (err) {
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : 'Delete failed');
      setLoading(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <p className="text-red-600 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-black text-center">
        {error}
      </p>
    );
  }

  if (confirming) {
    return (
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex-1 py-3.5 min-h-[44px] rounded-2xl text-sm font-medium bg-[#F3EFEA] text-[#8A7B72] transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={doDelete}
          disabled={loading}
          className="flex-1 py-3.5 min-h-[44px] rounded-2xl text-sm font-semibold bg-[#FAF0F0] text-[#9B3030] border border-[#E8C0C0] transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full py-3.5 min-h-[44px] rounded-2xl font-medium text-sm text-[#8A7B72] bg-[#F3EFEA] transition-all active:scale-[0.98]"
    >
      Delete Shot
    </button>
  );
}
