'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ShotForm from '@/components/ShotForm';
import RetryableRecommendation from '@/components/RetryableRecommendation';
import ShotCard from '@/components/ShotCard';
import CoffeeCupLoader from '@/components/CoffeeCupLoader';
import PageLoader from '@/components/PageLoader';
import BadgeUnlockModal from '@/components/BadgeUnlockModal';
import { supabase } from '@/lib/supabase';
import type { Shot } from '@/lib/types';
import type { StreakResult } from '@/lib/achievements';

const screenTransition = { type: 'spring' as const, stiffness: 280, damping: 28 };
const buttonPress = { type: 'spring' as const, stiffness: 500, damping: 20 };

const successVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

const successItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function NewShotPage() {
  const router = useRouter();
  const [result, setResult]           = useState<{ shot: Shot; recommendation: string | null; newBadges: string[]; streakResult: StreakResult | null } | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [weather, setWeather]         = useState<{ temp: number; humidity: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setAuthChecked(true);
    });
  }, [router]);

  // Silent background weather fetch — never blocks the form, never shows errors.
  // Triggers the native geolocation prompt at most ONCE per device: if permission
  // is already granted we read position silently; if it's been denied we skip; if
  // it's still in the "prompt" state we ask a single time, gated by a localStorage
  // flag so a dismissed prompt doesn't reappear on every visit.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let cancelled = false;

    const fetchWeather = async (pos: GeolocationPosition) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const c = data?.current;
        if (!cancelled && c?.temperature_2m != null && c?.relative_humidity_2m != null) {
          setWeather({
            temp:     Math.round(c.temperature_2m * 10) / 10,
            humidity: Math.round(c.relative_humidity_2m),
          });
        }
      } catch { /* silent */ }
    };

    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (!cancelled) fetchWeather(pos); },
        () => { /* denied or dismissed — silent */ },
        { timeout: 5000, maximumAge: 300_000 },
      );
    };

    const askOnce = () => {
      if (localStorage.getItem('hasAskedLocation')) return;
      localStorage.setItem('hasAskedLocation', '1');
      requestPosition();
    };

    (async () => {
      if (navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (cancelled) return;
          if (status.state === 'granted') {
            requestPosition();
          } else if (status.state === 'prompt') {
            askOnce();
          }
          return;
        } catch { /* fall through */ }
      }
      askOnce();
    })();

    return () => { cancelled = true; };
  }, []);

  if (!authChecked) return <PageLoader />;

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div
          key="success"
          variants={successVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="p-4 space-y-6"
        >
          {showModal && (
            <BadgeUnlockModal
              badgeIds={result.newBadges}
              streakResult={result.streakResult}
              onClose={() => setShowModal(false)}
            />
          )}

          <motion.div variants={successItemVariants} className="pt-6 pb-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-[#2C1E16] font-bold text-xl leading-tight">Shot Logged</h1>
              <p className="text-[#7A6858] text-[10px] font-bold uppercase tracking-widest mt-0.5">Dialed-in analysis</p>
            </div>
          </motion.div>

          <motion.div variants={successItemVariants}>
            <ShotCard shot={result.shot} />
          </motion.div>

          <motion.div variants={successItemVariants}>
            <RetryableRecommendation shotId={result.shot.id} initialRec={result.recommendation} />
          </motion.div>

          <motion.div variants={successItemVariants} className="flex gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={buttonPress}
              onClick={() => { setResult(null); setSubmitting(false); }}
              className="flex-1 glass border border-[#C8B49A] text-[#2C1E16] font-bold py-4 rounded-2xl transition-colors text-sm uppercase tracking-widest"
            >
              Log Another
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={buttonPress}
              onClick={() => router.push('/shots')}
              className="flex-1 bg-[#5D4037] text-[#FFFBF4] font-black py-4 rounded-2xl transition-colors text-sm uppercase tracking-widest shadow-lg shadow-[#5D4037]/25"
            >
              View History
            </motion.button>
          </motion.div>
        </motion.div>
      ) : submitError ? (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={screenTransition}
          className="p-4 space-y-6"
        >
          <div className="pt-6 pb-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 className="text-[#2C1E16] font-bold text-xl leading-tight">Connection Issue</h1>
              <p className="text-[#7A6858] text-[10px] font-bold uppercase tracking-widest mt-0.5">Shot saved — AI unavailable</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="text-[#7A6858] text-sm leading-relaxed">{submitError}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={buttonPress}
              onClick={() => { setSubmitError(null); setSubmitting(false); }}
              className="flex-1 glass border border-[#C8B49A] text-[#2C1E16] font-bold py-4 rounded-2xl transition-colors text-sm uppercase tracking-widest"
            >
              Log Another
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={buttonPress}
              onClick={() => router.push('/shots')}
              className="flex-1 bg-[#5D4037] text-[#FFFBF4] font-black py-4 rounded-2xl transition-colors text-sm uppercase tracking-widest shadow-lg shadow-[#5D4037]/25"
            >
              View History
            </motion.button>
          </div>
        </motion.div>
      ) : submitting ? (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={screenTransition}
          className="p-4 space-y-6"
        >
          <div className="pt-6 pb-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#C8B49A] flex items-center justify-center shrink-0">
              <svg className="spin w-4 h-4 text-[#5D4037]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-[#2C1E16] font-bold text-xl leading-tight">Saving Shot…</h1>
              <p className="text-[#7A6858] text-[10px] font-bold uppercase tracking-widest mt-0.5">AI analysis in progress</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-[#F5EBD8] p-1 rounded-md">
                <svg className="w-3.5 h-3.5 text-[#7A6858]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A6858]">Dialed AI</span>
            </div>
            <div className="flex flex-col items-center py-2 gap-4">
              <CoffeeCupLoader size={56} />
              <p className="text-[#7A6858] text-sm font-medium">Brewing your analysis…</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={screenTransition}
        >
          <div className="px-4 pt-8 pb-4">
            <h1 className="text-[#2C1E16] font-bold text-2xl tracking-tight">Log Shot</h1>
            <p className="text-[#7A6858] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Extraction Parameters</p>
          </div>
          <ShotForm
            weather={weather}
            onSubmitting={() => setSubmitting(true)}
            onSuccess={(shot, recommendation, newBadges, streakResult) => {
              setSubmitting(false);
              setResult({ shot, recommendation, newBadges, streakResult });
              const milestone = streakResult?.isNew3 || streakResult?.isNew7 || streakResult?.isNew30;
              if (newBadges.length > 0 || milestone) setShowModal(true);
            }}
            onError={(err) => {
              setSubmitting(false);
              setSubmitError(err);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
