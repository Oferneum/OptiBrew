/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

interface PushPayload {
  title?: string;
  body?:  string;
  url?:   string;
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() as PushPayload ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? 'Dialed';
  const options: NotificationOptions = {
    body:  payload.body  ?? "Your espresso machine misses you! Don't break your streak.",
    icon:  '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    data:  { url: payload.url ?? '/shots/new' },
    tag:   'dialed-reminder',       // replaces older notification of same tag
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target: string = (event.notification.data as { url?: string })?.url ?? '/shots/new';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(target) && 'focus' in c);
        if (existing) return (existing as WindowClient).focus();
        return self.clients.openWindow(target);
      }),
  );
});
