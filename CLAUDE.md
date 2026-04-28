@AGENTS.md

---

# Coffee Dial-in — Project Context

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16.2.4**, App Router, TypeScript 5 |
| Styling | Tailwind CSS **v4** — uses `@theme` / `@utility` directives, NOT v3 syntax |
| Font | Geist Sans via `next/font/google`, exposed as `--font-geist-sans` CSS var |
| Backend | Supabase (postgres + RLS). Client in `lib/supabase.ts` |
| Charts | Recharts v3 (installed, not yet wired up — Layer 3) |
| Runtime | React 19, Node via Next.js dev server |

### Env vars (`.env.local`, gitignored)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## File Map

```
app/
  globals.css           Design tokens + all custom CSS classes (read this before adding styles)
  layout.tsx            Geist font, <Nav />, body pb-24
  page.tsx              Dashboard — server component, fetches shots + current setup
  shots/
    new/page.tsx        Log Shot flow — client component, shows ShotForm then success state
    page.tsx            Shot History — server component
  beans/page.tsx        Placeholder — "Layer 2 coming soon"
  api/
    shots/route.ts      GET (list) + POST (insert + recommendation)
    shots/[id]/route.ts (exists, not yet used in UI)
    equipment/route.ts  GET (list) + POST (dedup via search_equipment RPC before insert)
    search/route.ts     GET ?type=beans|equipment&q= → calls Supabase fuzzy RPC

components/
  Nav.tsx               Floating glass pill, SVG icons, active dot indicator
  ShotCard.tsx          Glass card — shows all shot params including grind_setting
  ShotForm.tsx          Client form — equipment search, grind setting, live ratio, score picker
  RecommendationCard.tsx Glass card with colored left-accent bar

lib/
  supabase.ts           createClient(url, key) — used on both server and client
  types.ts              All shared types (Shot, Bean, EquipmentProfile, Recommendation, …)
  analytics.ts          computeBrewRatio, computeSuccessZone, restDays
  recommendations.ts    analyzeShot(shot, recentShots) → Recommendation
```

---

## Database Schema

### `shots`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| dose | numeric | grams in |
| yield | numeric | grams out |
| brew_ratio | numeric | yield/dose, computed on insert |
| extraction_time | int | seconds |
| brew_temp | numeric | °C, nullable |
| flavor_tags | text[] | `'Sour' \| 'Bitter' \| 'Balanced' \| 'Astringent'` |
| overall_score | int | 1–10, nullable |
| notes | text | nullable |
| bean_id | uuid FK | → beans, nullable |
| equipment_id | uuid FK | → equipment_profiles, nullable |
| grind_setting | text | per-shot override, nullable — **added in Layer 1 migration** |

### `equipment_profiles`
`id, created_at, machine_name, basket_type, grinder_name, grinder_setting, notes`

### `beans`
Schema exists (Layer 1 migration), UI is Layer 2.

### Supabase RPCs
- `search_equipment(query text, threshold float)` → `FuzzyEquipmentMatch[]` — global fuzzy search across all profiles
- `search_beans(query text, threshold float)` → `FuzzyBeanMatch[]`

---

## Design System (globals.css)

### Color tokens (`@theme`)
| Token | Hex | Use |
|---|---|---|
| `espresso` | #120a04 | Page background, button text |
| `surface` | #2d1a0e | Neutral card background |
| `surface-raised` | #3d2415 | Elevated surface (legacy — prefer `.glass` now) |
| `crema` | #c4873e | Primary accent — numbers, active states, CTAs |

### CSS classes
| Class | Purpose |
|---|---|
| `.glass` | Standard glass card — white/4.5% + 16px blur + thin white border |
| `.glass-display` | Amber-tinted instrument panel — crema/5% bg, crema border, inset highlight. Used for Current Rig card and selected-equipment chip in form |
| `.glass-nav` | Dark-tinted blur — espresso/75% bg, 24px blur. Floating bottom nav only |
| `.glass-input` | Form field — near-invisible bg, crema focus ring (`0 0 0 3px crema/7%`) |
| `.btn-crema` | Primary CTA — 3-stop gradient, 28px crema glow, inset highlight, scale-down on press |
| `.readout` | Tabular numerics (`font-variant-numeric: tabular-nums`) — all shot values, scores |
| `.status-dot` | Slow 2.4s pulse animation — green "active rig" indicator |
| `.spin` | 0.75s linear rotation — loading spinner |

Body has a warm radial gradient at top (`#2d1a0e` fading to transparent) for depth.

---

## Key Patterns

**Server components** (Dashboard, Shot History): query Supabase directly, no `useEffect`, no `'use client'`.

**Client components** (ShotForm, NewShotPage, Nav): `'use client'` at top. ShotForm queries Supabase directly via the client export for the "last used equipment" pre-fill on mount.

**Equipment search flow**: user types in ShotForm → 280ms debounce → `GET /api/search?type=equipment&q=` → `search_equipment` RPC (global) → fuzzy-matched dropdown → selecting locks in `equipment_id` + shows grind setting field → on submit both are POSTed to `/api/shots`.

**Recommendation engine** (`lib/recommendations.ts`): rule-based, looks at extraction time, brew ratio, and flavor tags. Checks last 2 shots for trending patterns. Returns one of four types: `under-extracted | over-extracted | balanced | neutral`.

---

## Layer Progress

- **Layer 1 ✅** Shot logging, equipment profiles, grind setting, glassmorphism UI, current rig dashboard display
- **Layer 2 🔲** Bean inventory — page is placeholder at `/beans`, RPC + schema exist, `Bean` type defined
- **Layer 3 🔲** Analytics charts — Recharts installed, `computeSuccessZone` in analytics.ts, no UI yet
