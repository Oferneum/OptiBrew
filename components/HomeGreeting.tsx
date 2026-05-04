'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomeGreeting() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [toastMounted, setToastMounted] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Resolve user's first name from Google OAuth metadata
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const meta = session.user.user_metadata as Record<string, string>;
      const full = meta.full_name ?? meta.name ?? '';
      const first = full.split(' ')[0];
      if (first) setFirstName(first);
    });
  }, []);

  // Show welcome toast when redirected from OAuth callback
  useEffect(() => {
    if (searchParams.get('welcome') !== '1') return;

    setToastMounted(true);
    setToastVisible(true);

    // Clean the URL param so refresh doesn't re-trigger
    router.replace('/', { scroll: false });

    const fadeOut = setTimeout(() => setToastVisible(false), 2500);
    const unmount = setTimeout(() => setToastMounted(false), 3100);
    return () => { clearTimeout(fadeOut); clearTimeout(unmount); };
  }, []);

  return (
    <>
      {/* ── Welcome toast ────────────────────────── */}
      {toastMounted && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl glass shadow-xl border border-white/10 transition-opacity duration-500 ${
            toastVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-green-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6l3 3 5-5" />
            </svg>
          </span>
          <p className="text-white text-sm font-bold whitespace-nowrap">Signed in successfully</p>
        </div>
      )}

      {/* ── Personalised greeting ─────────────────── */}
      {firstName && (
        <div dir="rtl" className="text-right px-1">
          <p className="text-white/60 text-sm font-medium leading-snug">
            שלום, <span className="text-white font-black">{firstName}</span>. איזה כיף שחזרת!
          </p>
        </div>
      )}
    </>
  );
}
