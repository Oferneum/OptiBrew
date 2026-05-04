## OptiBrew — Project Context

### Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4, App Router, TypeScript 5 |
| Styling | Tailwind CSS v4 — uses `@theme` / `@utility` directives |
| Font | Heebo (`--font-heebo`) + Space Mono (`--font-space-mono`) |
| Backend | Supabase (PostgreSQL + RLS). Client in `lib/supabase.ts` |
| Auth | Supabase Auth — Google OAuth (PKCE flow) |
| AI | Google Gemini via `@google/generative-ai` — primary `gemini-2.5-flash`, fallback `gemini-1.5-flash` |
| Charts | Recharts v3 |
| Runtime | React 19, Node via Next.js dev server |

### Env vars (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY          ← server-only, never NEXT_PUBLIC_
```
All three are set in Vercel via CLI (`vercel env add`) for Production + Development environments.

### Dev server access
`package.json` dev script: `next dev --webpack -H 0.0.0.0`  
`next.config.ts` includes `allowedDevOrigins` for LAN IP access from iPhone.  
HMR WebSocket does not work over LAN — manually reload Safari after code changes.

---

### File Map

```
app/
  globals.css               Design tokens (dark theme) + utility classes
  layout.tsx                Heebo + Space Mono fonts, <Nav />, #050505 body
  page.tsx                  Dashboard — greeting, recent shots, stat strip
  login/
    page.tsx                Google OAuth login — skipBrowserRedirect + manual window.location.href
  auth/
    callback/page.tsx       PKCE code exchange → router.replace('/?welcome=1')
  shots/
    new/page.tsx            Log Shot flow — auth-gated (redirects to /login if no session)
    page.tsx                Shot History — card list, quality labels
    [id]/page.tsx           Shot Detail — full data + BaristaBrain
  beans/
    page.tsx                Bean Inventory — VFM badge, active bag, shot stats
    vfm/page.tsx            VFM Leaderboard — ranked medals, formula footnote
  analytics/page.tsx        Dial-in scatter chart + stat strip
  settings/page.tsx         Equipment management + signed-in user + Sign Out button
  api/
    shots/route.ts          GET (list) + POST (insert + BaristaBrain diagnosis)
    shots/[id]/route.ts     GET + PATCH + DELETE individual shot
    beans/route.ts          GET list + POST create bean
    beans/[id]/route.ts     PATCH update bean fields
    equipment/route.ts      GET list + POST create (injects user_id from auth token)
    search/route.ts         GET ?type=beans|equipment&q= → fuzzy RPC calls

components/
  Nav.tsx                   5-tab bottom nav (Home/Log/History/Beans/Charts)
  HomeGreeting.tsx          Client component — Hebrew greeting from Google user_metadata
                            + welcome toast on ?welcome=1 (fades out after 2.5 s)
  ShotCard.tsx              Shot card — quality label, score, extraction data
  ShotForm.tsx              Full log form — brew method, bean search, timer, score
                            Passes Authorization: Bearer <token> on all fetch() calls
                            Timer: requestAnimationFrame loop (never throttled on iOS)
                            Manual input: always in DOM, off-screen when hidden (iOS focus fix)
                            Bean dropdown: native <select> with fixed overlay
  BeanCard.tsx              Bean row with inline edit panel, router.refresh() on save
  DialInChart.tsx           Recharts ScatterChart — extraction time vs. score
  RecommendationCard.tsx    BaristaBrain insight display
  ActiveEquipmentCard.tsx   Active rig display widget

lib/
  supabase.ts               Browser singleton + createAuthClient(token) + getRequestClient(req)
  types.ts                  Shot, Bean, Equipment, BaristaBrain, BrewMethod
  recommendations.ts        BaristaBrain — Gemini AI call with primary/fallback model strategy
  analytics.ts              computeBrewRatio, computeVFM, computeCostPerShot
  vfm-actions.ts            'use server' — fetchBeansWithVFM() with React cache() + Zod
  context-builder.ts        getShotContext() — recent shots trend summary for AI prompt
```

---

### Auth Architecture

**Flow:** Google OAuth (PKCE) → Supabase → `/auth/callback` → `/?welcome=1`

**Browser client** (`lib/supabase.ts` — `supabase` singleton): persists session in
`localStorage`. Direct Supabase calls from client components use it automatically
once logged in.

**API routes** (`getRequestClient(req)`): extracts `Authorization: Bearer <token>`
from the request header and creates a per-request authenticated client via
`createAuthClient(token)`. Falls back to the anon client if no token (read-only
public data only).

**Passing the token from client → API route:**
```ts
const { data: { session } } = await supabase.auth.getSession();
headers['Authorization'] = `Bearer ${session.access_token}`;
```
Done in `ShotForm.tsx` (shots + beans POST) and `settings/page.tsx` (equipment).

**Equipment insert — RLS:** `equipment_profiles` has `user_id uuid REFERENCES auth.users`.
The POST route calls `db.auth.getUser()` and explicitly sets `user_id: user.id`.

**Auth guard:** `shots/new/page.tsx` calls `getSession()` on mount and does
`router.replace('/login')` if no session.

**Login page note:** Uses `skipBrowserRedirect: true` + `window.location.href = data.url`
to avoid silent no-ops in iOS Safari PWA mode where `window.location.assign()` can fail.

---

### Database Schema

**shots**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| user_id | uuid FK→auth.users ON DELETE CASCADE | RLS: INSERT/UPDATE owner-only, SELECT community-wide |
| bean_id | uuid FK→beans | |
| equipment_id | uuid FK→equipment_profiles | |
| brew_method | text | Espresso, V60, MokaPot, FrenchPress, Aeropress |
| dose | numeric | grams |
| yield | numeric | grams |
| extraction_time | int | seconds |
| brew_temp | numeric | °C |
| grind_setting | text | |
| overall_score | int | 1–10 |
| flavor_tags | text[] | Sour, Bitter, Balanced, Dry |
| has_milk | boolean | default false |
| notes | text | |
| recommendation | text | BaristaBrain output |

**beans**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→auth.users ON DELETE CASCADE | RLS: INSERT/UPDATE owner-only, SELECT community-wide |
| roaster | text | |
| origin | text | |
| roast_date | date | |
| price_paid | numeric | ILS, used for VFM |
| weight_grams | numeric | used for VFM |
| is_active | boolean | default true |

**equipment_profiles**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| machine_name | text | |
| grinder_name | text | nullable |
| user_id | uuid FK→auth.users ON DELETE CASCADE | RLS enforced |

---

### Design System (`globals.css`)

**Dark theme** — body background `#050505`, white text, glass cards.

**`@theme` tokens**
| Token | Hex | Use |
|---|---|---|
| `--color-espresso` | `#3C2A21` | (legacy light-mode) |
| `--color-crema` | `#C85A32` | Accent (light-mode components) |

**Active palette (inline Tailwind)**
| Value | Use |
|---|---|
| `#050505` | Body background |
| `#FF4500` / `#FFC107` | Gradient CTAs and active states |
| `#A1A1AA` | Muted labels |
| `white/5`, `white/10` | Glass card backgrounds / borders |

**CSS classes**
| Class | Purpose |
|---|---|
| `.glass` | Dark glass card — bg white/5, backdrop-blur, border white/10 |
| `.glass-nav` | Bottom nav variant |
| `.readout` | Space Mono, tabular-nums, tracking |
| `.btn-crema` | Terracotta CTA, scale on active |
| `.spin` | CSS keyframe rotation (used on loading spinners) |

---

### Key Patterns

**iOS Mobile:**
- All inputs: `type="text"` with `inputMode`, `style={{ fontSize: '16px' }}` (prevents zoom)
- Touch targets: `min-h-[44px]` everywhere
- Timer: `requestAnimationFrame` loop (not `setInterval` — avoids iOS throttling)
- Manual input focus: input always in DOM; hidden via `position: fixed; left: -9999px`
- Bean dropdown: native `<select>` (no custom dropdown race conditions)

**VFM Index:** `overall_score / (price_paid / (weight_grams / dose))` — ranks beans by
sensory quality relative to cost.

**BaristaBrain AI:** Gemini prompt returns exactly 2 sentences: diagnosis + adjustment.
Primary model: `gemini-2.5-flash`. Auto-fallback to `gemini-1.5-flash` on 503 / high
demand errors. Both failures logged in detail before user-facing error is returned.

**Server Actions:** `lib/vfm-actions.ts` uses `'use server'` + React `cache()` + Zod v4
(`z.uuid()`) for runtime safety.

**Vercel CLI deployment:** `npx vercel --prod --yes` from project root. Env vars managed
via `npx vercel env add <KEY> production --value <VAL> --yes --force`.

---

### Layer Progress

**Layer 1 — ✅ Complete**
Base shot logging, Supabase connectivity, BaristaBrain, UI shell.

**Layer 2 — ✅ Complete**
Dark Midnight Aurora design system, ShotForm (timer + stepper + bean search),
Bean Inventory, VFM Index, Bean editing, Settings, iOS mobile fixes.

**Layer 3 — ✅ Complete**
- ✅ VFM Leaderboard (`/beans/vfm`)
- ✅ Analytics scatter chart (`/analytics`)
- ✅ PWA setup (`@ducanh2912/next-pwa`, `manifest.json`)
- ✅ 5-tab navigation
- ✅ Shot detail page (`/shots/[id]`)

**Layer 4 — ✅ Complete (Auth + Production)**
- ✅ Google OAuth login page (`/login`) with PKCE + manual redirect fix
- ✅ Auth callback handler (`/auth/callback`)
- ✅ RLS enforcement — all API routes use `getRequestClient(req)` with JWT
- ✅ Equipment RLS fix — `user_id` injected from `db.auth.getUser()`
- ✅ Auth guard on Log Shot page
- ✅ Hebrew personalised greeting on home page
- ✅ Welcome toast after OAuth callback
- ✅ Sign Out in Settings
- ✅ Gemini primary/fallback model strategy
- ✅ Vercel production deployment with all env vars

**Layer 5 — Schema + RLS hardening ✅ Complete**
- ✅ `user_id` column added to `shots` (FK→auth.users, ON DELETE CASCADE)
- ✅ `user_id` column added to `beans` (FK→auth.users, ON DELETE CASCADE)
- ✅ RLS: INSERT/UPDATE owner-only on both tables; SELECT community-wide for authenticated users
- ✅ All three POST routes (shots, beans, equipment) call `db.auth.getUser()` and inject `user_id: user.id`

**Still outstanding:**
- ❌ PWA icons (`icon-192.png`, `icon-512.png` referenced in manifest)
