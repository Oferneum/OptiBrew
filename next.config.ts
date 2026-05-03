import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.100.102.117', 'http://10.100.102.117:3000', '192.168.33.26', '10.100.102.4'],
};

export default withPWA(nextConfig);
