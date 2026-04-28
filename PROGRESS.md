# Coffee Dial-in - Project Progress

## 🎯 Project Overview
A premium espresso extraction tracker and "Dial-in" assistant built with Next.js 16, Supabase, and Tailwind CSS.

## 🛠 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI/Styling:** Tailwind CSS v4, Lucide React (Icons)
- **State Management:** TypeScript (Strict Mode)

## 📊 Current Status: Entering Layer 2 (The Muscle)
We have completed the basic infrastructure and are now moving from simple data logging to intelligent analysis and refined UX.

## ✅ Completed Tasks
- [x] **Project Initialization:** Next.js scaffolded with TypeScript and Tailwind.
- [x] **Database Schema:** Created tables for `beans`, `equipment_profiles`, and `shots`.
- [x] **Supabase Integration:** Connected via `.env.local` and `lib/supabase.ts`.
- [x] **SQL Migrations:** Added `grind_setting` column to `shots` table.
- [x] **Terminology Update:** Changed "Astringent" flavor tag to "Dry" for better UX.
- [x] **UI Simplification:** Decoupled equipment selection from the `ShotForm` to move it to global settings.

## 📋 Next Session Checklist (Layer 2 & 3)
### High Priority
- [ ] **Recommendation Engine:** Implement logic in `lib/recommendations.ts` based on SCA extraction standards (James Hoffmann/Scott Rao style).
- [ ] **Global User Settings:** Create a dedicated page/modal to set "Active Equipment" (Machine/Grinder) to avoid repetitive entry.
- [ ] **Barista Advice UI:** Add a "Smart Advice" card to the dashboard using Glassmorphism design.

### Medium Priority
- [ ] **Analytics Dashboard:** Build a Scatter Plot (Recharts) comparing `grind_setting` vs. `overall_score`.
- [ ] **Visual Overhaul:** Implement full Glassmorphism/Tactile UI across all screens.

### Future (Layer 3)
- [ ] **PWA Configuration:** Setup `manifest.json` and service workers for mobile "Install" capability.
- [ ] **Offline Mode:** Enable basic shot logging without active internet connection.

## 💡 Notes for Claude
- Always check `lib/types.ts` before modifying data structures.
- Use `lib/recommendations.ts` as the central hub for all extraction logic.
- Stick to the "Premium Dark" aesthetic (Glassmorphism).