<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

This file provides guidance to coding agents working in this repository. It is the single source of truth for project context — `CLAUDE.md` only points here.

## Keeping this file current

**Every feature change must update the context in `AGENTS.md`.** When you add, remove, or meaningfully alter a feature, edit this file in the same change so it keeps describing what the code actually does — not what it used to do, and not what it is supposed to do someday. In particular:

- Move an item out of "Target design" and into the body once it is really built.
- Update "Current state", "Stack", and "Commands" when dependencies, scripts, or the presence of a backend / auth / tests change.
- Revise "Architecture" when a route group, the data layer, or the floorplan editor changes shape.
- Correct the baseline lint/typecheck counts if your change moves them.
- Amend "Conventions" when a convention is genuinely established or abandoned.

A pull request that changes behavior but leaves this file stale is incomplete.

# Nocturnus — Cebu Nightclub Reservation System

A PWA for digitizing nightclub table reservations and VIP bottle service.

**Current state: front-end prototype with a fresh REST API layer.** Every *screen* still renders from hardcoded data — the frontend does not yet call the API (no `fetch()` in `app/`/`components/` wiring pages to it). What now exists on the server side:

- A typed Supabase client (`lib/supabase.ts`, anon key) and a full `app/api/**/route.ts` surface backed by domain handlers in `lib/api/` (see "API layer" below).
- **Public/guest routes are real** and query Supabase directly (club browse/detail/images/floor-plans/tables/events, guest reservation creation, guest reservation lookup, QR check-in, discount-code validation).
- **Owner/admin routes are scaffolded but return `501 not_implemented`** — there is still no auth. `lib/api/shared/auth.ts` (`requireOwner`, `requireClubOwner`) throws until a Supabase Auth session layer is built.

Two schema-drift caveats, both because `DB.md` is ahead of what's deployed:
- `lib/db.ts` has been synced to `DB.md` (added `status` on `clubs`/`users`, `revoked` on `owner_verification_tokens`, `labels` on `floor_plans`).
- **The live Supabase database has NOT been migrated** for those columns yet. Reads that filter `clubs.status = 'active'` currently return `500 column clubs.status does not exist` until a migration runs. `DB.md` remains the spec.

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

### Current events date rendering

- User event cards and the current event detail schedule now format `event_date` via shared helpers in `lib/utils.ts` (`formatEventDate`, `getManilaDayKey`) using `Asia/Manila` timezone.
- This replaced direct `toLocaleString()` calls in current-events screens to avoid server/client hydration mismatches from environment locale differences.

### Data layer: hardcoded, and not centralized

There are **two competing sources of truth**, and new work keeps adding to the wrong one:

1. `data/placeholder.ts` — exports `venues: Venue[]` and `getVenueBySlug()`. Consumed by `app/(user)/browse/page.tsx` and `app/(user)/club/[slug]/page.tsx`.
2. **Page-local `const` arrays** — e.g. `EVENTS` in `app/(user)/events/[id]/page.tsx`, `stats` in `app/(owner)/dashboard/page.tsx`, `initialTables` in the floorplan canvas.

Prefer extending `data/placeholder.ts` over adding another page-local array. When the backend lands, module #1 is the seam that gets replaced; page-local arrays are all separate migrations.

### API layer (`app/api/**` + `lib/api/**`)

REST routes derived from `DB.md`. **`app/api/**/route.ts` files are one-line re-exports** — all logic lives in domain handlers under `lib/api/`, so a `route.ts` never contains a handler body:

```ts
export { listClubs as GET, createClub as POST } from "@/lib/api/clubs/api"
```

- `lib/api/{clubs,events,reservations,discount-codes,auth}/api.ts` — handlers grouped by domain. Every handler is wrapped in `handle()` from `lib/api/shared/errors.ts`, which catches `ApiError` (typed status/code) and unexpected errors into a consistent `{ error, message }` JSON body. Helpers: `fromDb` (throws 404 on a null single-row lookup, 500 on a Postgrest error), `readJson`, `requireFields`, and the `badRequest`/`notFound`/`conflict`/`notImplemented` constructors.
- `lib/api/shared/auth.ts` — `requireOwner` / `requireClubOwner` gate owner routes; both `throw notImplemented()` today.

**Audience split in the URL tree** — public reads use the SEO slug, owner writes use the club UUID. Next.js forbids two differently-named dynamic segments at the same position, so **owner management lives under `/api/owner/clubs/[clubId]/...`**, not `/api/clubs/[clubId]/...`:
- Public (real): `GET /api/clubs`, `/api/clubs/[slug]`, `.../[slug]/images`, `.../[slug]/floor-plans`, `.../[slug]/floor-plans/[floorPlanId]/tables`, `.../[slug]/events`, `GET /api/events/[eventId]`, `POST /api/discount-codes/validate`, `POST /api/reservations`, `GET /api/reservations/[id]` (guest email in `X-Guest-Email` header, kept out of the URL), `POST /api/reservations/checkin`.
- Owner (501 stub): `POST /api/clubs`, `PATCH /api/reservations/[id]`, all of `/api/owner/clubs/[clubId]/**` (club/images/floor-plans/tables/events/discount-codes/reservations), `POST /api/auth/verification/redeem`.

**Supabase-js typing gotcha:** explicit column-list selects (`.select("id, status")`) resolve to `never` for property access without fully generated types — use `.select("*")` when you read fields off the result, or destructure `{ data, error }` and narrow with a null check (see `checkinReservation`). Narrowed selects are fine for response-only payloads. Every table in `lib/db.ts` must carry `Relationships: []` or `.insert()`/`.update()` args resolve to `never`.

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
As stated at the top of this file: this is not the Next.js in your training data. **Read the relevant guide in `node_modules/next/dist/docs/` before writing code**, and heed deprecation notices.

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

Progress against this flow (see "API layer"): guest reservation creation (`POST /api/reservations` → `pending`), guest lookup, QR check-in (`POST /api/reservations/checkin` → `checked_in`), and discount-code validation now exist as **API endpoints**. Still missing: the owner accept/decline step that generates the `qr_code_token` (stubbed 501, pending auth), the `/admin/scanner` UI (only the check-in API exists), owner auth, distance filtering, and any frontend wiring — every screen still reads hardcoded data.

As each of these ships, delete it from this section and describe the real implementation in the body above.
