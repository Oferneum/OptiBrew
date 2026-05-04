'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, browser navigates away — no need to setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / wordmark */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4500] to-[#FFC107] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#FF4500]/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <h1 className="text-white font-black text-4xl tracking-tighter">Dialed</h1>
        <p className="text-white/40 text-sm font-medium mt-2 tracking-wide">
          Master your extraction
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-3xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-white font-black text-xl tracking-tight">Sign in to continue</h2>
          <p className="text-white/40 text-sm mt-1.5">
            Your shots, beans, and dial-in data are saved to your account.
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-bold py-4 px-6 rounded-2xl min-h-[56px] text-sm tracking-wide transition-all active:scale-[0.97] disabled:opacity-60 shadow-lg touch-manipulation"
        >
          {loading ? (
            <svg className="spin w-5 h-5 text-[#A1A1AA]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          {loading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && (
          <p className="text-[#FF4500] text-sm bg-[#FF4500]/10 border border-[#FF4500]/30 rounded-xl px-4 py-3 font-bold text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
