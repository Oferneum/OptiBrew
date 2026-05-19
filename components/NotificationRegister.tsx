'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

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

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PermState);
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      });

      const res = await fetch('/api/notifications/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body:    JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Failed to save subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch('/api/notifications/subscribe', {
        method:  'DELETE',
        headers: await authHeaders(),
      });

      setState('default');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'unsupported') return null;
  if (state === 'loading')     return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#2C1E16] text-sm font-bold">Shot reminders</p>
          <p className="text-[#7A6858] text-xs mt-0.5">
            {state === 'granted'
              ? 'You\'ll get a nudge if you go 48h without logging.'
              : 'Get notified when you haven\'t logged in a while.'}
          </p>
        </div>

        {state === 'granted' ? (
          <button
            type="button"
            onClick={unsubscribe}
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
            onClick={subscribe}
            disabled={busy}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-[#5D4037] text-[#FFFBF4] shadow-md shadow-[#5D4037]/20 transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
          >
            {busy ? '…' : 'Enable'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs font-medium">{error}</p>
      )}
    </div>
  );
}
