import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

/** Register a browser push subscription and persist it to the database. */
export async function subscribeToPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
  });
  const res = await fetch('/api/notifications/subscribe', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body:    JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? 'Failed to save subscription');
  }
}

/** Unsubscribe the browser and delete the stored subscription. */
export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  await fetch('/api/notifications/subscribe', {
    method:  'DELETE',
    headers: await getAuthHeaders(),
  });
}
