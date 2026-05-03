☕ OptiBrew — Progress Tracker

---

## 🎨 Active Aesthetic: Premium Spatial UI

| Token | Value |
|---|---|
| Background | `#FAF8F5` |
| Cards | `#FFFFFF` (shadow-only, no borders) |
| Inputs | `#F3EFEA` (focus: `ring-2 ring-[#C85A32]`) |
| Accent | `#C85A32` (Terracotta) |
| Primary Text | `#3C2A21` (Espresso Brown) |
| Muted Labels | `#8A7B72` — `text-[10px] uppercase tracking-[0.15em] font-bold` |
| Readout Font | Space Mono — all numeric data |

---

## ✅ Layer 1 — Complete

- Supabase schema: Shots, Beans, Equipment
- BaristaBrain logic (SCA-based: Sour / Bitter / Dry / flow speed)
- Multi-method support: Espresso, V60, Moka Pot, French Press, AeroPress
- Analytics helpers: `computeBrewRatio`, VFM formula (`lib/analytics.ts`)
- Base shot logging, Supabase connectivity, UI shell

---

## ✅ Layer 2 — Complete

**Design System**
- Full pivot from dark "Calm Matte" → "Premium Spatial UI"
- `globals.css`: `@theme` tokens, borderless components, shadow-only depth
- `btn-crema`, `.glass`, `.readout`, `.glass-input` utility classes

**ShotForm (`components/ShotForm.tsx`)**
- 4 white card sections: Method+Rig, Bean+Grind, Extraction, Taste+Score
- Dose & Yield: borderless steppers (0.5g) + direct type-in
- Espresso extraction timer: `requestAnimationFrame` loop (iOS-safe, no throttle)
- Segmented control: ⏱ Timer / ✎ Type — manual input always in DOM for iOS focus
- Bean search: fixed overlay (z-40) closes dropdown; `onClick` on items (no `onBlur` race)
- Score buttons: `w-11 h-11` (44px), all touch targets `min-h-[44px]`
- All inputs: `type="text"` + `inputMode` + `fontSize: 16px` (no iOS zoom)

**Bean Inventory**
- `BeanCard.tsx`: inline edit panel (roaster, origin, price, weight, roast date, is_active)
- `PATCH /api/beans/[id]`: field-allowlisted update
- VFM badge tiers: Great / Good / Premium
- `lib/vfm-actions.ts`: `'use server'` + React `cache()` + Zod v4 runtime validation
- Supabase RPC `get_beans_with_stats` for aggregated shot data

**Other Pages**
- Dashboard: recent shots feed + analytics entry card
- Shot History: quality-labelled cards
- Settings: equipment management, active rig ring indicator

**Navigation**
- 5-tab bottom nav: Home / Shots / Log / Beans / Charts
- Active-state bug fixed (`/shots/new` no longer activates History tab)

**Dev Setup**
- `next dev -H 0.0.0.0` for LAN access
- `allowedDevOrigins` for iPhone cross-origin dev
- HMR does not work over LAN — hard-refresh iPhone after changes

---

## 🔄 Layer 3 — Mostly Complete

**Done**
- ✅ VFM Leaderboard (`/beans/vfm`) — medals, cost/shot, avg score, ranked table
- ✅ Analytics scatter chart (`/analytics`) — extraction time vs. score, 3-stat strip
- ✅ `DialInChart.tsx` — Recharts ScatterChart, custom tooltip
- ✅ PWA shell: `@ducanh2912/next-pwa`, `public/manifest.json`, `themeColor: #FAF8F5`
- ✅ Shot detail API: `GET /api/shots/[id]`, `PATCH`, `DELETE` all ready

**Remaining**
- ✅ Shot detail page: `/shots/[id]/page.tsx` — server page + `DeleteButton` client component
  - Stat grid: dose, yield, ratio, time, temp, grind (Space Mono readouts)
  - Inline bean card with link to inventory
  - BaristaBrain via `RecommendationCard`
  - Two-step delete confirm (Cancel / Yes, delete) — no native dialog
  - Back chevron → `/shots`; history list cards now link to detail
- ❌ PWA icons: `public/icon-192.png` + `public/icon-512.png` (referenced in manifest, files missing)
- ❌ Offline fallback page (optional — basic SW from next-pwa may be sufficient)
