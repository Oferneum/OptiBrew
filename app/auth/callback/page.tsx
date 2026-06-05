'use client';

import { useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe();
        window.location.href = '/?welcome=1';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <svg className="spin w-8 h-8 text-[#5D4037] mx-auto" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-[#7A6858] text-sm font-bold uppercase tracking-widest">Signing in…</p>
      </div>
    </div>
  );
}
