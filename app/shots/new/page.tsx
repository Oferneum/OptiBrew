'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShotForm from '@/components/ShotForm';
import RecommendationCard from '@/components/RecommendationCard';
import ShotCard from '@/components/ShotCard';
import type { Shot, Recommendation } from '@/lib/types';

export default function NewShotPage() {
  const router = useRouter();
  const [result, setResult] = useState<{ shot: Shot; rec: Recommendation } | null>(null);

  if (result) {
    return (
      <div className="p-4 space-y-4">
        {/* Success header */}
        <div className="pt-6 pb-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-400/15 border border-green-400/25 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-stone-50 font-bold text-xl leading-tight">Shot Logged</h1>
            <p className="text-stone-500 text-xs mt-0.5">Here&apos;s your extraction analysis</p>
          </div>
        </div>

        <ShotCard shot={result.shot} />
        <RecommendationCard rec={result.rec} />

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setResult(null)}
            className="flex-1 glass text-stone-200 font-medium py-3.5 rounded-2xl transition-all active:scale-[0.97]"
          >
            Log Another
          </button>
          <button
            onClick={() => router.push('/shots')}
            className="flex-1 btn-crema text-espresso font-bold py-3.5 rounded-2xl"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-stone-50 font-bold text-2xl tracking-tight">Log Espresso Shot</h1>
        <p className="text-stone-500 text-sm mt-1">Fill in your extraction parameters</p>
      </div>
      <ShotForm onSuccess={(shot, rec) => setResult({ shot, rec })} />
    </div>
  );
}
