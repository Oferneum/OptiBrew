'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShotForm from '@/components/ShotForm';
import RecommendationCard from '@/components/RecommendationCard';
import ShotCard from '@/components/ShotCard';
import type { Shot } from '@/lib/types';

export default function NewShotPage() {
  const router = useRouter();
  const [result, setResult] = useState<{ shot: Shot; recommendation: string } | null>(null);

  if (result) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-6 pb-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F0FAF2] border border-[#C5E8CA] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-[#3E362E] font-black text-xl leading-tight uppercase tracking-tight">Shot Logged</h1>
            <p className="text-[#8A7B72] text-[10px] font-bold uppercase tracking-widest mt-0.5">Dialed-in analysis</p>
          </div>
        </div>

        <ShotCard shot={result.shot} />
        <RecommendationCard rec={{ diagnosis: result.recommendation } as any} />

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setResult(null)}
            className="flex-1 bg-white border border-[#E5E1DA] text-[#3E362E] font-bold py-4 rounded-2xl transition-all active:scale-[0.97] text-sm uppercase tracking-widest"
          >
            Log Another
          </button>
          <button
            onClick={() => router.push('/shots')}
            className="flex-1 bg-[#3E362E] text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] text-sm uppercase tracking-widest"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-[#3E362E] font-black text-3xl tracking-tighter uppercase">Log Shot</h1>
        <p className="text-[#8A7B72] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Extraction Parameters</p>
      </div>
      <ShotForm onSuccess={(shot, recommendation) => setResult({ shot, recommendation })} />
    </div>
  );
}