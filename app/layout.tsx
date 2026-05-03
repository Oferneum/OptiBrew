import type { Metadata, Viewport } from 'next';
import { Space_Mono, Heebo } from 'next/font/google'; 
import './globals.css';
import Nav from '@/components/Nav';

const heebo = Heebo({ 
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-heebo',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Dialed',
  description: 'Master your espresso extraction',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dialed',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#050505',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${heebo.variable} ${spaceMono.variable} antialiased`}>
      <body className="bg-[#050505] min-h-screen pb-24 font-sans text-white">
        <main className="max-w-lg mx-auto px-4">
          {children}
        </main>
        <Nav />
      </body>
    </html>
  );
}