'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import RecommendationCard from './RecommendationCard';

const AI_FAILURES = new Set([
  'Analysis temporarily unavailable.',
  'Dialed is cooling down — try again in a moment.',
  'AI configuration missing.',
]);

const isFailed = (rec: string | null | undefined) => !rec || AI_FAILURES.has(rec);

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const h: Record<string, string> = {};
  if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
  return h;
}

export default function RetryableRecommendation({
  shotId,
  initialRec,
}: {
  shotId: string;
  initialRec: string | null | undefined;
}) {
  const [rec, setRec]           = useState(initialRec ?? null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(`/api/shots/${shotId}/reanalyze`, {
        method: 'POST',
        headers: await authHeaders(),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Retry failed — try again in a moment'); return; }
      setRec(data.recommendation);
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setError(isAbort ? 'Analysis timed out — tap retry to try again' : 'Retry failed — try again in a moment');
    } finally {
      clearTimeout(timeoutId);
      setRetrying(false);
    }
  }

  if (rec && !isFailed(rec)) {
    return <RecommendationCard rec={{ diagnosis: rec } as React.ComponentProps<typeof RecommendationCard>['rec']} />;
  }

  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-[#5D4037]/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-[#5D4037]" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <p className="text-[#2C1E16] text-sm font-semibold">AI analysis unavailable</p>
          <p className="text-[#7A6858] text-xs mt-0.5 leading-relaxed">
            {rec && rec !== 'AI configuration missing.'
              ? rec
              : 'No analysis was generated for this shot.'}
          </p>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs font-medium px-1">{error}</p>}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="w-full py-3 bg-[#5D4037] text-[#FFFBF4] font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-50 active:scale-[0.97] transition-all touch-manipulation flex items-center justify-center gap-2"
      >
        {retrying ? (
          <>
            <svg className="spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Analyzing…
          </>
        ) : '↺ Retry AI Analysis'}
      </button>
    </div>
  );
}
