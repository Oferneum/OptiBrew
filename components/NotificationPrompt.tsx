'use client';

import { useState } from 'react';
import { useNotificationPrompt } from '@/hooks/useNotificationPrompt';
import NotificationModal          from '@/components/NotificationModal';
import { subscribeToPush }        from '@/lib/pushSubscribe';

export default function NotificationPrompt() {
  const { show, dismiss, markGranted } = useNotificationPrompt();
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPush();
      }
      // Whether granted or denied, don't ask again
      markGranted();
    } catch {
      // Subscription failed — still close the modal so we don't block the user
      markGranted();
    } finally {
      setLoading(false);
    }
  }

  return (
    <NotificationModal
      loading={loading}
      onEnable={handleEnable}
      onDismiss={dismiss}
    />
  );
}
