import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 20% of traces in production. Raise to 1.0 while debugging.
  tracesSampleRate: 0.2,

  // Sentry is a no-op when the DSN isn't configured — safe for local dev.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  ignoreErrors: [
    // ── PWA / Service Worker noise from restricted WebViews ─────────────────
    // These errors fire in Facebook, Instagram, TikTok, WeChat, and other
    // in-app browsers that sandbox or outright block the Service Worker API.
    // None of them represent actionable bugs in the application.

    // Specific rejection thrown by some Android WebView SW shims
    "Rejected at wrsParams.serviceWorkers.navigator.serviceWorker.register",
    // Standard browser error when SW registration is refused
    "Failed to register a ServiceWorker",
    // Older Android WebViews surface this variant
    "Could not register service worker",
    // SW script unreachable — network sandboxed inside the in-app browser
    "An unknown error occurred when fetching the script",
    // iOS WKWebView: SW blocked by host-app entitlement / sandbox config
    /SecurityError.*ServiceWorker/,
    // Catch-all for remaining navigator.serviceWorker-scoped rejections
    // (RegExp avoids matching unrelated errors that merely mention the string)
    /navigator\.serviceWorker/,
  ],
});
