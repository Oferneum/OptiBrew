'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShotForm from '@/components/ShotForm';
import RecommendationCard from '@/components/RecommendationCard';
import ShotCard from '@/components/ShotCard';
import CoffeeCupLoader from '@/components/CoffeeCupLoader';
import { supabase } from '@/lib/supabase';
import type { Shot } from '@/lib/types';

export default function NewShotPage() {
  const router = useRouter();
  const [result, setResult]           = useState<{ shot: Shot; recommendation: string } | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthChecked(true);
    });
  }, []);

  if (!authChecked) return null;

  // ── Success screen ──────────────────────────────────────────
  if (result) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-6 pb-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">Shot Logged</h1>
            <p className="text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mt-0.5">Dialed-in analysis</p>
          </div>
        </div>

        <ShotCard shot={result.shot} />
        <RecommendationCard rec={{ diagnosis: result.recommendation } as Parameters<typeof RecommendationCard>[0]['rec']} />

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { setResult(null); setSubmitting(false); }}
            className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] text-sm uppercase tracking-widest"
          >
            Log Another
          </button>
          <button
            onClick={() => router.push('/shots')}
            className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FFC107] text-black font-black py-4 rounded-2xl transition-all active:scale-[0.97] text-sm uppercase tracking-widest"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  // ── Analyzing screen ────────────────────────────────────────
  if (submitting) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-6 pb-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center shrink-0">
            <svg className="spin w-4 h-4 text-[#FF4500]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">Saving Shot…</h1>
            <p className="text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mt-0.5">AI analysis in progress</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="bg-white/10 p-1 rounded-md">
              <svg className="w-3.5 h-3.5 text-[#A1A1AA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">Dialed AI</span>
          </div>
          <div className="flex flex-col items-center py-2 gap-4">
            <CoffeeCupLoader size={56} />
            <p className="text-[#A1A1AA] text-sm font-medium">Brewing your analysis…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────
  return (
    <div>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-white font-bold text-2xl tracking-tight">Log Shot</h1>
        <p className="text-[#A1A1AA] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Extraction Parameters</p>
      </div>
      <ShotForm
        onSubmitting={() => setSubmitting(true)}
        onSuccess={(shot, recommendation) => {
          setSubmitting(false);
          setResult({ shot, recommendation });
        }}
      />
    </div>
  );
}
