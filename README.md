# Dialed — Espresso Journal

A mobile-first PWA for tracking and perfecting espresso extractions. Built with Next.js, Supabase, and a dark glassmorphism UI.

## Features

- **Shot logging** — dose, yield, extraction time, grind setting, temperature, brew method
- **Extraction timer** — requestAnimationFrame-based, never throttled on iOS
- **BaristaBrain** — AI-powered diagnosis via Gemini, suggests grind/dose/temp adjustments
- **Bean inventory** — track bags, roasters, origins, price, weight
- **VFM Index** — ranks beans by score-per-shekel (value for money)
- **Analytics** — scatter chart of extraction time vs. score to visualise your dial-in progress
- **PWA** — installable on iOS and Android, works offline via service worker

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Charts | Recharts |
| PWA | `@ducanh2912/next-pwa` |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Designed for Vercel. Add the three environment variables above in your Vercel project settings, then deploy from `main`.

```bash
npm run build   # verify locally before pushing
```

## PWA Icons

Drop `icon-192.png` and `icon-512.png` into `/public` to complete the PWA install experience. A single 512×512 PNG is enough to generate both sizes.
