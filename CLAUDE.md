## OptiBrew — Project Context

### Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4, App Router, TypeScript 5 |
| Styling | Tailwind CSS v4 — uses `@theme` / `@utility` directives |
| Font | Plus Jakarta Sans (`--font-jakarta`) + Space Mono (`--font-space-mono`) |
| Backend | Supabase (PostgreSQL + RLS). Client in `lib/supabase.ts` |
| Charts | Recharts v3 |
| Runtime | React 19, Node via Next.js dev server |

### Env vars (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Dev server access
`package.json` dev script: `next dev --webpack -H 0.0.0.0`  
`next.config.ts` includes `allowedDevOrigins` for LAN IP access from iPhone.  
HMR WebSocket does not work over LAN — manually reload Safari after code changes.

---

### File Map

```
app/
  globals.css               Design tokens (Premium Spatial UI) + utility classes
  layout.tsx                Jakarta + Space Mono fonts, <Nav />, #FAF8F5 body
  page.tsx                  Dashboard — recent shots + analytics entry card
  shots/
    new/page.tsx            Log Shot flow (ShotForm)
    page.tsx                Shot History — card list, quality labels
    [id]/page.tsx           Shot Detail — full data + BaristaBrain (NOT YET BUILT)
  beans/
    page.tsx                Bean Inventory — VFM badge, active bag, shot stats
    vfm/page.tsx            VFM Leaderboard — ranked medals, formula footnote
  analytics/page.tsx        Dial-in scatter chart + stat strip
  settings/page.tsx         Equipment management (add, activate rig)
  api/
    shots/route.ts          GET (list) + POST (insert + BaristaBrain diagnosis)
    shots/[id]/route.ts     GET + PATCH + DELETE individual shot
    beans/route.ts          POST create bean
    beans/[id]/route.ts     PATCH update bean fields
    equipment/route.ts      Equipment CRUD
    search/route.ts         GET ?type=beans|equipment&q= → fuzzy RPC calls

components/
  Nav.tsx                   5-tab bottom nav (Home/Shots/Log/Beans/Charts)
  ShotCard.tsx              White card, quality label, score, extraction data
  ShotForm.tsx              Full log form — brew method, bean search, timer, score
                            Timer: requestAnimationFrame loop (never throttled on iOS)
                            Manual input: always in DOM, off-screen when hidden (iOS focus fix)
                            Bean dropdown: fixed overlay (z-40) + onClick (no onBlur race)
  BeanCard.tsx              Bean row with inline edit panel, router.refresh() on save
  DialInChart.tsx           Recharts ScatterChart — extraction time vs. score
  RecommendationCard.tsx    BaristaBrain insight display
  ActiveEquipmentCard.tsx   Active rig display widget

lib/
  supabase.ts               Standard Supabase client
  types.ts                  Shot, Bean, Equipment, BaristaBrain, BrewMethod
  recommendations.ts        BaristaBrain — SCA-based diagnosis (Sour/Bitter/Dry/flow)
  analytics.ts              computeBrewRatio, computeVFM, computeCostPerShot
  vfm-actions.ts            'use server' — fetchBeansWithVFM() with React cache() + Zod
```

---

### Database Schema

**shots**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| bean_id | uuid FK→beans | |
| equipment_id | uuid FK→equipment_profiles | |
| brew_method | text | Espresso, V60, MokaPot, FrenchPress, Aeropress |
| dose | numeric | grams |
| yield | numeric | grams |
| extraction_time | int | seconds |
| grind_setting | text | |
| overall_score | int | 1–10 |
| flavor_tags | text[] | Sour, Bitter, Balanced, Dry |
| has_milk | boolean | default false |

**beans**
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| roaster | text | |
| origin | text | |
| roast_date | date | |
| price_paid | numeric | ILS, used for VFM |
| weight_grams | numeric | used for VFM |
| is_active | boolean | default true |

---

### Design System (`globals.css`)

**`@theme` tokens**
| Token | Hex | Use |
|---|---|---|
| `--color-espresso` | `#3C2A21` | Primary text |
| `--color-crema` | `#C85A32` | Accent / CTA |
| `--color-muted` | `#A39A92` | Labels, secondary text |
| `--color-surface` | `#FFFFFF` | Cards |
| `--color-surface-raised` | `#F3EFEA` | Inputs, display areas |
| `--color-border` | `#E8E2D9` | Dividers |

**Background:** `#FAF8F5` (body)

**CSS classes**
| Class | Purpose |
|---|---|
| `.glass` | White bg + shadow-only depth (no border) |
| `.glass-input` | `#F3EFEA` fill, focus ring `#C85A32` |
| `.readout` | Space Mono, tabular-nums, tracking |
| `.btn-crema` | Terracotta CTA, scale on active |

---

### Key Patterns

**Premium Spatial UI:** Light cream backgrounds, white cards with shadow-only depth (`box-shadow` not borders), large `rounded-3xl` radius, Space Mono for all numeric readouts.

**iOS Mobile:**
- All inputs: `type="text"` with `inputMode`, `style={{ fontSize: '16px' }}` (prevents zoom)
- Touch targets: `min-h-[44px]` everywhere
- Timer: `requestAnimationFrame` loop (not `setInterval` — avoids iOS throttling)
- Manual input focus: input always in DOM; hidden via `position: fixed; left: -9999px; width: 1px; height: 1px` — iOS allows `.focus()` on it synchronously in the click handler
- Bean dropdown: fixed `z-40` overlay closes on outside tap; items use `onClick` only

**VFM Index:** `overall_score / (price_paid / (weight_grams / dose))` — ranks beans by sensory quality relative to cost.

**BaristaBrain:** SCA-based logic differentiating flow issues (fast/slow extraction) from extraction issues (sour/bitter/dry). Returns numbered fixes.

**Server Actions:** `lib/vfm-actions.ts` uses `'use server'` + React `cache()` + Zod v4 (`z.uuid()`) for runtime safety.

---

### Layer Progress

**Layer 1 — ✅ Complete**  
Base shot logging, Supabase connectivity, BaristaBrain, UI shell.

**Layer 2 — ✅ Complete**  
Premium Spatial UI, ShotForm (timer + stepper + bean search), Bean Inventory, VFM Index, Bean editing, Settings, iOS mobile fixes, cross-device dev server.

**Layer 3 — 🔄 Mostly Complete**  
- ✅ VFM Leaderboard (`/beans/vfm`)
- ✅ Analytics scatter chart (`/analytics` + `DialInChart`)
- ✅ PWA setup (`@ducanh2912/next-pwa`, `manifest.json`)
- ✅ 5-tab navigation
- ❌ Shot detail page (`/shots/[id]`) — API ready, UI not built
- ❌ PWA icons (`icon-192.png`, `icon-512.png` referenced in manifest)
