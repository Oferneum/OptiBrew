'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doDelete() {
    setLoading(true);
    await fetch(`/api/shots/${id}`, { method: 'DELETE' });
    router.push('/shots');
    router.refresh();
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
