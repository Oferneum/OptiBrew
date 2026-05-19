'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'dialed:notif_prompt_seen';
const DELAY_MS    = 4_000; // wait 4 s after mount before surfacing the modal

function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification'   in window &&
    'serviceWorker'  in navigator &&
    'PushManager'    in window
  );
}

export function useNotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isPushSupported())                        return;
    if (Notification.permission !== 'default')     return;
    if (localStorage.getItem(STORAGE_KEY))         return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function evaluate() {
      // Only prompt users who are logged in and have at least one shot —
      // reminders are only meaningful once the user has something to continue.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { count } = await supabase
        .from('shots')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (cancelled || !count || count < 1) return;

      timeoutId = setTimeout(() => {
        if (!cancelled) setShow(true);
      }, DELAY_MS);
    }

    evaluate();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  function markGranted() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  return { show, dismiss, markGranted };
}
