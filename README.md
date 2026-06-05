# Dialed — Espresso Journal

A mobile-first PWA for tracking and perfecting espresso extractions. Built with Next.js, Supabase, and Gemini AI.

Live at **https://opti-brew.vercel.app**

## Features

- **Shot logging** — dose, yield, extraction time, grind setting, temperature, brew method
- **Extraction timer** — requestAnimationFrame-based, never throttled on iOS
- **BaristaBrain** — AI-powered per-shot coaching via Gemini; strict Head Barista persona with espresso troubleshooting hierarchy
- **Bag scan** — photograph a coffee bag, Gemini Vision extracts roaster/origin/roast details and generates first-shot startup params
- **Bean inventory** — track bags, roasters, origins, price, weight; duplicate detection with fuzzy matching
- **Community Prep Method** — aggregates shot stats across all users to surface the best brew method per bean
- **VFM Index** — ranks beans by score-per-shekel (value for money)
- **VFM Leaderboard** — medal-ranked leaderboard across your whole bag history
- **Analytics** — scatter chart of extraction time vs. score to visualise dial-in progress
- **Auth** — Google OAuth (PKCE) via Supabase; RLS enforces owner-only writes, community-wide reads
- **PWA** — installable on iOS and Android

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — Google OAuth (PKCE) |
| AI | Google Gemini (`gemini-2.5-flash`, fallback `gemini-1.5-flash`) |
| Charts | Recharts |
| PWA | `@ducanh2912/next-pwa` |

## Multi-Agent Architecture

All AI logic lives in `lib/agents/`. Each agent owns exactly one domain:

| Agent | Domain |
|---|---|
| `DiagnosticsAgent` | Per-shot barista coaching |
| `VisionAgent` | Photo OCR — bag image → structured JSON |
| `BrewRecommendationAgent` | First-shot startup params from bean details |
| `CommunityAnalyticsAgent` | Best brew method per bean from shot statistics |
| `Orchestrator` | Routes and chains agent calls |

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

Deployed on Vercel. Env vars are managed via the Vercel CLI:

```bash
npx vercel env add GEMINI_API_KEY production
npx vercel --prod --yes
```

## PWA Icons

Drop `icon-192.png` and `icon-512.png` into `/public` to complete the PWA install experience.
