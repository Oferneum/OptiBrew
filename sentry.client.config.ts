import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 20% of traces in production. Raise to 1.0 while debugging.
  tracesSampleRate: 0.2,

  // Sentry is a no-op when the DSN isn't configured — safe for local dev.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
