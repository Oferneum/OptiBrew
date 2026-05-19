'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import RecommendationCard from './RecommendationCard';

const AI_FAILURES = new Set([
  'Analysis temporarily unavailable.',
  'Dialed is cooling down — try again in a moment.',
  'AI configuration missing.',
]);

const isFailed = (rec: string | null | undefined) =>
  !rec || AI_FAILURES.has(rec.trim());

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
  const [streaming, setStreaming] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    if (!isFailed(rec)) return;
    triggered.current = true;
    startStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startStream() {
    setStreaming(true);
    setError(null);
    setRec(null);

    try {
      const res = await fetch(`/api/shots/${shotId}/analyze`, {
        method: 'POST',
        headers: await authHeaders(),
      });

      if (!res.ok || !res.body) {
        setError('Analysis unavailable — tap to retry');
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setRec(full);
      }

      if (isFailed(full)) setError('Analysis unavailable — tap to retry');
    } catch {
      setError('Analysis unavailable — tap to retry');
    } finally {
      setStreaming(false);
    }
  }

  // Has partial or complete valid text — show card (with optional streaming indicator)
  if (rec && !isFailed(rec)) {
    return (
      <div>
        <RecommendationCard rec={{ diagnosis: rec }} />
        {streaming && (
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <svg className="spin w-3 h-3 text-[#7A6858]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] text-[#A1A1AA] font-medium">Analyzing…</span>
          </div>
        )}
      </div>
    );
  }

  // Streaming with no text yet
  if (streaming) {
    return (
      <div className="glass rounded-3xl p-5 flex items-center gap-3">
        <svg className="spin w-4 h-4 text-[#7A6858] shrink-0" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-[#7A6858] text-sm font-medium">Dialed AI is analyzing your shot…</p>
      </div>
    );
  }

  // Error / unavailable — show retry button
  return (
    <div className="glass rounded-3xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-[#5D4037]/10 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-[#5D4037]" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <p className="text-[#2C1E16] text-sm font-semibold">AI analysis unavailable</p>
          <p className="text-[#7A6858] text-xs mt-0.5 leading-relaxed">
            {error ?? 'No analysis was generated for this shot.'}
          </p>
        </div>
      </div>
      <button
        onClick={startStream}
        className="w-full py-3 bg-[#5D4037] text-[#FFFBF4] font-black text-xs uppercase tracking-widest rounded-2xl active:scale-[0.97] transition-all touch-manipulation"
      >
        ↺ Retry AI Analysis
      </button>
    </div>
  );
}
