'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Google OAuth returns 403 "disallowed_useragent" in embedded WebViews.
// Detect them on mount and warn before the user attempts sign-in.
function detectWebView(ua: string): { restricted: boolean; isIOS: boolean } {
  const restricted =
    // Social app in-app browsers
    /FBAN|FBAV|FB_IAB|FB4A/i.test(ua) ||   // Facebook
    /Instagram/i.test(ua)              ||   // Instagram
    /Twitter/i.test(ua)                ||   // X / Twitter
    /LinkedInApp/i.test(ua)            ||   // LinkedIn
    /MicroMessenger/i.test(ua)         ||   // WeChat
    /BytedanceWebview|musical_ly/i.test(ua) || // TikTok
    /Snapchat/i.test(ua)               ||
    /Pinterest/i.test(ua)              ||
    // Android generic WebView flag
    /; wv\)/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  return { restricted, isIOS };
}

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
  const [webView, setWebView] = useState<{ restricted: boolean; isIOS: boolean } | null>(null);

  useEffect(() => {
    const result = detectWebView(navigator.userAgent);
    if (result.restricted) setWebView(result);
  }, []);

  async function signInWithGoogle() {
    console.log('Button clicked');
    setLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('redirectTo:', redirectTo);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      console.log('signInWithOAuth result — data:', data, 'error:', error);

      if (error) {
        console.error('signInWithOAuth error:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to OAuth URL:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No OAuth URL returned — data was:', data);
        setError('Could not start sign-in. No OAuth URL returned.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error in signInWithGoogle:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / wordmark */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#5D4037] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#5D4037]/25">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFBF4" strokeWidth="2" strokeLinecap="round">
            <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
        <h1 className="text-[#2C1E16] font-black text-4xl tracking-tighter">Dialed</h1>
        <p className="text-[#7A6858] text-sm font-medium mt-2 tracking-wide">
          Master your extraction
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-3xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-[#2C1E16] font-black text-xl tracking-tight">Sign in to continue</h2>
          <p className="text-[#7A6858] text-sm mt-1.5">
            Your shots, beans, and dial-in data are saved to your account.
          </p>
        </div>

        {webView ? (
          /* ── Restricted WebView warning ── */
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-5 text-center space-y-2.5">
              <p className="text-2xl">😕</p>
              <p className="text-amber-900 font-black text-sm uppercase tracking-wide">
                Can&apos;t sign in here
              </p>
              <p className="text-amber-800 text-xs leading-relaxed">
                You opened Dialed inside another app&apos;s browser. Google doesn&apos;t
                allow sign-in from there — <span className="font-bold">your account and
                data are completely fine</span>, this is just a browser limitation.
              </p>
              <div className="border-t border-amber-200 pt-2.5">
                <p className="text-amber-900 font-black text-xs uppercase tracking-wider mb-1">
                  How to fix it
                </p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  {webView.isIOS
                    ? 'Tap the share icon ⬆ at the bottom of the screen, then choose "Open in Safari".'
                    : 'Tap the menu ⋮ in the top-right corner, then choose "Open in Chrome".'}
                </p>
              </div>
            </div>
            <p className="text-[#A1A1AA] text-[11px] text-center">
              This is a Google restriction — not a bug in Dialed.
            </p>
          </div>
        ) : (
          /* ── Normal sign-in button ── */
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#C8B49A] text-[#2C1E16] font-bold py-4 px-6 rounded-2xl min-h-[56px] text-sm tracking-wide transition-all active:scale-[0.97] disabled:opacity-60 shadow-sm touch-manipulation"
            >
              {loading ? (
                <svg className="spin w-5 h-5 text-[#7A6858]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {error && (
              <p className="text-red-600 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-bold text-center">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
