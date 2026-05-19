'use client';

import { useState, useEffect } from 'react';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/pushSubscribe';

type PermState = 'unsupported' | 'loading' | 'default' | 'granted' | 'denied';

export default function NotificationRegister() {
  const [state, setState] = useState<PermState>('loading');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    setState(Notification.permission as PermState);
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PermState);
      if (permission !== 'granted') return;
      await subscribeToPush();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setState('default');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'unsupported' || state === 'loading') return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#2C1E16] text-sm font-bold">Shot reminders</p>
          <p className="text-[#7A6858] text-xs mt-0.5">
            {state === 'granted'
              ? "You'll get a nudge if you go 48h without logging."
              : "Get notified when you haven't logged in a while."}
          </p>
        </div>

        {state === 'granted' ? (
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-[#F3EFEA] text-[#7A6858] border border-[#C8B49A] transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
          >
            {busy ? '…' : 'Turn off'}
          </button>
        ) : state === 'denied' ? (
          <span className="text-[10px] text-[#9B3030] font-bold uppercase tracking-widest">
            Blocked in browser
          </span>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-[#5D4037] text-[#FFFBF4] shadow-md shadow-[#5D4037]/20 transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
          >
            {busy ? '…' : 'Enable'}
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-xs font-medium">{error}</p>}
    </div>
  );
}
