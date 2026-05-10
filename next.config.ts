import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {};

export default withSentryConfig(withPWA(nextConfig), {
  silent: !process.env.CI,
  disableLogger: true,
  sourcemaps: { disable: true },
});
