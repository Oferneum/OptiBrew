'use client';

import { useEffect, useState } from 'react';

interface Props {
  loading:   boolean;
  onEnable:  () => void;
  onDismiss: () => void;
}

export default function NotificationModal({ loading, onEnable, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  // Delay the CSS transition by one frame so the initial render is invisible
  // and the animation plays on entry rather than being skipped.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDismiss}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-sm bg-[#FAF3E6] rounded-3xl p-7 shadow-2xl transition-all duration-300 ease-out ${
          visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#5D4037] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#5D4037]/30">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFBF4" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {/* Headline */}
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5D4037] text-center mb-2">
          Stay Dialled In
        </p>
        <h2 className="text-[#2C1E16] font-black text-2xl tracking-tight text-center leading-tight mb-3">
          Never miss a shot
        </h2>
        <p className="text-[#7A6858] text-sm text-center leading-relaxed mb-7">
          Get a gentle nudge when you haven't logged in 48 hours.
          One tap keeps your streak alive and your extraction on track.
        </p>

        {/* Benefit pills */}
        <div className="flex justify-center gap-2 mb-7 flex-wrap">
          {['Keep your streak', 'Improve faster', 'One tap'].map((label) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full bg-[#5D4037]/8 border border-[#C8B49A] text-[#5D4037] text-[10px] font-bold uppercase tracking-wider"
            >
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onEnable}
          disabled={loading}
          className="w-full bg-[#5D4037] text-[#FFFBF4] font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-[#5D4037]/25 transition-all active:scale-[0.97] disabled:opacity-60 touch-manipulation mb-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Enabling…
            </>
          ) : (
            'Enable Notifications'
          )}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          disabled={loading}
          className="w-full py-3 text-[#7A6858] text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-40 touch-manipulation"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
