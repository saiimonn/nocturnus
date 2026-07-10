# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Nocturnus — Cebu Nightclub Reservation System

A PWA for digitizing nightclub table reservations and VIP bottle service.

**Current state: front-end prototype.** Every screen renders from hardcoded data. There is no database, no auth, no network layer — no Supabase client, no `route.ts` handlers, no server actions, and not a single `fetch()` in `app/`, `components/`, or `lib/`. Treat `DB.md` and the "Target design" section below as the spec being built toward, not as a description of code that exists.

## Stack
- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4 + TypeScript (strict)
- **Styling:** Tailwind CSS v4, tw-animate-css, shadcn/ui (`base-vega` style via Base UI, not Radix)
- **Icons:** lucide-react
- **Canvas:** Konva + react-konva + use-image (owner floorplan editor)
- **Fonts:** Geist + Inter (next/font)
- **Smooth scroll:** Lenis (mounted in the `(user)` layout only)

Installed but unused: `leaflet` / `react-leaflet` (only leftover `.club-popup .leaflet-popup-*` rules in `globals.css`).

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (bare `eslint`, flat config)
- `npx tsc --noEmit` — typecheck

There is no test framework, no test script, and no tests.

**The baseline is not clean.** Before you start, `npm run lint` reports 4 errors / 32 warnings and `npx tsc --noEmit` reports 2 errors (`components/ui/tooltip.tsx` `asChild`, `components/userEventCard.tsx` implicit `any`). The most notable lint error is `react-hooks/set-state-in-effect` in `hooks/use-mobile.ts`. Don't assume you introduced these — diff against the baseline before claiming a regression, and don't silently "fix" them as drive-by work.

## Architecture

### Two route groups with genuinely different visual systems

This is the thing that trips people up. `globals.css` defines a light `:root` palette and a `.dark` block — **but the `dark` class is never applied anywhere.** So:

- **`app/(user)/`** — consumer PWA. Bypasses the token system and **hardcodes dark colors** (`bg-black text-white`, `bg-linear-to-b from-black to-[#080808]`). Layout is `'use client'` because it initializes Lenis in an effect. Wraps `UserNav` + `Footer`.
- **`app/(owner)/`** — B2B dashboard. Uses semantic tokens (`bg-background text-foreground`), which resolve to the **light** `:root` values. Server component wrapping `SidebarProvider` + `AdminSidebar` + `AdminHeader`.
- **`app/auth/`** — login / register. Outside both groups.

If you add a screen, match the group you're in. Don't "fix" the owner dashboard to be dark or the user routes to use tokens without being asked — the split is load-bearing today.

Owner routes (from `components/Sidebar.tsx`): `/dashboard`, `/club/details`, `/club/layout`, `/booking/requests`, `/booking/history`, `/events`.

### Data layer: hardcoded, and not centralized

There are **two competing sources of truth**, and new work keeps adding to the wrong one:

1. `data/placeholder.ts` — exports `venues: Venue[]` and `getVenueBySlug()`. Consumed by `app/(user)/browse/page.tsx` and `app/(user)/club/[slug]/page.tsx`.
2. **Page-local `const` arrays** — e.g. `EVENTS` in `app/(user)/events/[id]/page.tsx`, `stats` in `app/(owner)/dashboard/page.tsx`, `initialTables` in the floorplan canvas.

Prefer extending `data/placeholder.ts` over adding another page-local array. When the backend lands, module #1 is the seam that gets replaced; page-local arrays are all separate migrations.

### Floorplan editor (`app/(owner)/club/layout/floorplanCanvas.tsx`)

The single most complex file in the repo (~500 lines). A Konva `<Stage>` with `<Group>`-wrapped tables supporting drag, `<Transformer>` resize, add/edit/delete via shadcn `<Dialog>`.

**What it actually does, which differs from the spec:**
- Stage is a **fixed 800×600** and table `x`/`y` are **absolute pixels**. The `pos_x`/`pos_y` percentage scheme (0.0–1.0) in `DB.md` is *not implemented*. There is no responsive recalculation.
- The blueprint image is uploaded client-side via `URL.createObjectURL` and held in local state. It is never persisted, and the object URL is revoked on unmount.
- Table state (`Table[]`) lives entirely in `useState`. Nothing is saved.
- Its local `Table` type (`name`, `pax`, `price`, `shape`, `width`/`height`/`radius`) does **not** match `Club_Tables` in `DB.md` (`label`, `capacity`, `minimum_spend`, `category`, `pos_x`/`pos_y`). Reconciling these is unfinished work.

Konva rules that *are* honored and should stay: the blueprint image sits in a `<Layer listening={false}>`, interactive tables in a separate `<Layer>`. Note it's imported directly (no `next/dynamic` / `ssr: false`) — if you hit an SSR canvas error after touching it, that's why.

## Conventions
- **Zero-Comment Rule:** no inline or block comments. (Three violations exist — `floorplanCanvas.tsx:69`, `currentEvents/page.tsx:16`, `events/[id]/page.tsx:50`. Don't add more; removing them is fair game.)
- Co-locate route-specific components in `app/(route)/components/` (see `app/(user)/browse/components/`).
- Shared components live flat in `components/`; shadcn primitives in `components/ui/`.
- Naming is inconsistent (`Header.tsx`, `Sidebar.tsx`, `UserNav.tsx` vs `footer.tsx`, `userEventCard.tsx`, `dateRangeFilter.tsx`). Match the neighbors of whatever you touch rather than mass-renaming.
- Use `cn()` from `@/lib/utils` for class merging. Import via the `@/*` alias.
- Tailwind v4 syntax (`@import "tailwindcss"`, `@theme inline`, `@custom-variant`) — no `tailwind.config`.
- `docs/` and `.worktrees/` are **gitignored**. Plans written under `docs/superpowers/` are local-only and invisible to reviewers.

## Next.js 16
Per `AGENTS.md`: this is not the Next.js in your training data. **Read the relevant guide in `node_modules/next/dist/docs/` before writing code**, and heed deprecation notices.

Concretely, `params` is a Promise. `app/(user)/club/[slug]/page.tsx` does this correctly:
```ts
export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
```
Client components read route params via `useParams()` instead (see `events/[id]/page.tsx`).

## Target design (spec — not yet built)
Read `DB.md` for the full schema (UUID PKs, UTC timestamps, `club_id` denormalized onto `Club_Tables` and `Reservations`). The intended system:

- **Guest checkout, no account.** User submits a reservation request → `pending`.
- **Owner reviews** → accept sets `confirmed` and generates a `qr_code_token` (UUID); decline sets `cancelled`.
- **Guest sees the QR** on a confirmation page and screenshots it.
- **Bouncer scans** at `/admin/scanner` → `checked_in`.
- **Owner onboarding** via a superadmin-generated one-time token, delivered out-of-band. `Owner_Verification_Tokens` stores only a `token_hash` — no owner association. The register page already collects a 12-character token in step 1.
- **Pricing** is fixed per table via `Club_Tables.minimum_spend`; no per-event overrides.
- **Discount codes** are per-club; applied at checkout when the table's `minimum_spend` meets the code's `min_order_value`.
- **Backend** is intended to be Supabase (PostgreSQL + PostGIS for distance filtering, Realtime for live floorplan status) with Supabase Auth for owners/managers only.

None of `/admin/scanner`, QR generation, discount codes, distance filtering, or auth exists yet.
