<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

This file provides guidance to coding agents working in this repository. It is the single source of truth — `CLAUDE.md` only points here.

## Keeping This File Current

**Every change to this repository must be accompanied by an update to `AGENTS.md` when it invalidates or extends anything written here.** That includes: adding or removing a dependency, changing the stack or build commands, introducing a new architectural pattern, wiring up the data layer, resolving one of the open questions below. If you finish a task and this file now describes a repo that no longer exists, you are not done. Update it in the same change.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build (also the only full typecheck — tsconfig is noEmit)
npm run start    # serve the production build
npm run lint     # eslint (flat config; note the script passes no path — it lints the project default)
npm run seed     # wipe + reseed every Supabase table with faker data (dev DB only; needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
```

There is no test framework configured in this repo.

## Stack Realities

These differ from what you likely have memorized. Check before writing code.

- **Next.js 16 (App Router).** Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code — APIs and conventions have breaking changes vs. older versions. Dynamic route `params` is a `Promise` and must be awaited (see `app/(dashboard)/reservations/[id]/page.tsx`).
- **Tailwind v4, CSS-first.** There is no `tailwind.config.*`. Design tokens live in `@theme inline` and `:root`/`.dark` blocks in `app/globals.css`. `--radius: 0rem` is deliberate — this UI has square corners.
- **shadcn/ui `base-vega` style, built on `@base-ui/react` — not Radix.** Composition uses the `render` prop, not `asChild`:
  ```tsx
  <SidebarMenuButton render={<Link href={item.url} />} />
  ```
  When adding shadcn components, let the CLI resolve them from `components.json` rather than pasting Radix-based snippets from memory.
- Path alias `@/*` maps to the repo root.

## Architecture

`/` (`app/page.tsx`) is a bare redirect to `/dashboard`. All real screens live under the `(dashboard)` route group, whose layout (`app/(dashboard)/layout.tsx`) wraps children in `SidebarProvider` + `AppSidebar` + `SidebarInset`. Adding a page under `(dashboard)` gets the chrome for free.

Navigation is data-driven: the `navGroups` array in `components/app-sidebar.tsx` is the single source of truth for sidebar structure. Adding a route means adding an entry there, not editing JSX. Active state uses `pathname.startsWith(url)` unless the item sets `exact: true` — so nested routes like `/finance/payouts` will light up their parent (`/finance`) too unless that parent is marked exact.

The page files under `(dashboard)` are still **scaffolds** — no live data fetching. Live data is not wired up: `lib/supabase.ts` exports a `createSupabaseClient()` factory (anon key), but nothing calls it yet and there is no env wiring. Adding the real data layer is greenfield work. The sidebar also links to `/settings`, which does not exist yet.

The typed schema — the source of truth for every row shape — lives in **`lib/db.ts`** (the `Database` interface, 9 tables). UI mock data lives in **`lib/mock-data-owner.ts`** and **`lib/mock-data-user.ts`** (typed modules whose shapes mirror the `DB.md` tables); new pages should import from these rather than hardcoding arrays, and swap them for Supabase queries returning the same types once the data layer lands.

### Seeding the database

`npm run seed` (`scripts/seed.ts`, invoked via `tsx`) **wipes then repopulates** every Supabase table with constraint-valid faker data. It builds its **own** service-role Supabase client (distinct from the anon `lib/supabase.ts` singleton) to bypass RLS, so it needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`; it fails fast if either is missing and prints the target host before wiping. Deletes run in FK-reverse order and inserts in FK-safe order (`users → clubs → images/floor_plans/events/discount_codes → club_tables → reservations`; `owner_verification_tokens` is standalone), keeping the denormalized `club_id` consistent. Adjust generated data shapes in `scripts/seed/factories.ts` and volume via the `COUNTS` object at the top of `scripts/seed.ts`. Verification-token plaintexts are printed to the console for out-of-band redemption. This is a **dev-only** tool — never point it at production.

Every seeded user shares one bcrypt-hashed password (`bcryptjs`, hashing the `SEED_PASSWORD` constant in `scripts/seed.ts`), so any of them can log in. Two fixed, memorable accounts lead the set and are forced `active`: **`owner@otus.dev`** (role `owner`, owns clubs) and **`admin@otus.dev`** (role `admin`). Default password is `password123` — the seed run prints the accounts and password at the end.

### API layer

REST routes under `app/api/` follow a **thin-route** convention: each `route.ts` is a one-line re-export that maps HTTP verbs to named handlers, and all logic lives in `lib/api/<feature>/api.ts`. Example:

```ts
// app/api/clubs/route.ts
export { listClubs as GET, createClub as POST } from "@/lib/api/clubs/api"
```

Shared plumbing is in `lib/api/shared/`:
- `errors.ts` — the `ApiError` class + factories (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `notImplemented`, …), the `handle()` wrapper (catches thrown `ApiError`s and serializes them to JSON with the right status), `fromDb()` (unwraps a Supabase `{ data, error }`, throwing 500 on error / 404 on null), `readJson()`, `requireFields()`, and `RouteContext<T>` (whose `params` is a `Promise`, per Next 16). Handlers **throw** to signal failure — never hand-build error responses.
- `auth.ts` — the owner guards, now **implemented** (see Authentication below): `requireOwner()` reads/verifies the session cookie and returns `{ userId, role: "owner" }` or throws `unauthorized`; `requireClubOwner(clubId)` additionally loads the club (service-role client) and throws `forbidden` unless `club.owner_id` matches. Every mutation guards on one of these.

### Authentication

Auth is **custom credentials**, not Supabase Auth: `users.password_hash` is a bcrypt hash (`bcryptjs`, now a runtime dependency). **Only `role === "owner"` can log in** — `admin`/non-owner and suspended accounts are rejected.

- **Session:** a signed JWT (`jose`, HS256, 7-day expiry) in an `HttpOnly` cookie named `otus_session`, keyed by `AUTH_SECRET` (required env var, in `.env.local`). The cookie contract lives in **`lib/api/auth/session.ts`** (`createSession`, `verifySession`, `SESSION_COOKIE`, `sessionCookieOptions`) — nothing else touches JWTs directly.
- **Endpoints** (`lib/api/auth/api.ts`, thin routes under `app/api/auth/`): `POST /api/auth/login` (`readJson` → verify email+password → set cookie → return the safe user fields, never `password_hash`; generic 401 for missing user / bad password / non-owner, 403 for suspended) and `POST /api/auth/logout` (clears the cookie). `redeemVerificationToken` (register) is still a `notImplemented` stub.
- **Reads use the service-role client** (`lib/supabase-admin.ts`, `supabaseAdmin`) because RLS hides the `users` table from the anon key and `password_hash` must never be exposed through it. Import it **server-side only**.
- **Route protection:** `proxy.ts` at the repo root (Next 16 renamed `middleware` → `proxy`; it defaults to the Node.js runtime) verifies the cookie and redirects anonymous users to `/auth/login`. Its `matcher` covers the `(owner)` routes — `/dashboard`, `/reservations/*`, `/discounts/*`, `/owner-events/*`, and the owner-only `/club/details` + `/club/layout` (NOT `/club/[slug]`, which is a public `(user)` page).
- **Login UI:** `app/auth/login/page.tsx` POSTs to `/api/auth/login` and on success `router.push("/dashboard")`.

Handler modules: `clubs`, `reservations`, `users`, `onboarding` (verification tokens), `finance`, `auth`, `events`. **Cross-tenant reads are implemented** against Supabase; selects deliberately omit `password_hash` (users) and `token_hash` (tokens). **Owner login/logout are implemented** (see Authentication above). **Owner event fetching is implemented:** `GET /api/owner/events` → `listOwnerEvents` (`lib/api/events/api.ts`) guards with `requireOwner()`, resolves the caller's single club via `clubs.owner_id` (an owner owns exactly one club), and returns `{ clubId, events }` — that club's events in **all** statuses (draft/published/cancelled) using the **service-role** client so drafts hidden from consumer surfaces stay visible to their owner. **Event CRUD is fully implemented** in `lib/api/events/api.ts`: `createEvent` (`POST /api/owner/clubs/[clubId]/events`), `updateEvent` (`PATCH .../events/[eventId]`), and `deleteEvent` (`DELETE .../events/[eventId]`) all guard with `requireClubOwner(clubId)` and write via the service-role client; update/delete additionally scope by `club_id` so an owner can only touch events on their own club, and both 404 on a non-matching row. `status` is validated against `draft|published|cancelled`. The owner events page (`app/(owner)/owner-events/page.tsx`, a client component) fetches `/api/owner/events` on mount and its Add/Edit/Delete call the mutation endpoints. Note: event **images** persist only as pasted URLs — file uploads are browser-only previews because no storage bucket is wired yet. Other **mutations are still stubbed** — they call `requireOwner()`/`requireClubOwner()` (now real guards) then throw `notImplemented`, awaiting the business logic. Finance is fully stubbed because no payments/PayMongo table exists in `DB.md` yet (the numbers live only as `mock-data.ts` aggregates). Note the DB-typed client narrows enum columns to string-literal unions, so `.eq("status", value)` on a filter needs a cast to that union.

## Domain Context

This is the Superadmin (God-Mode) portal for Otus — a Cebu nightclub reservation platform. It is a **separate repository** from the B2C/B2B consumer app but reads and writes the **same Supabase database**. Expect to need `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for cross-tenant reads.

Three workflows define what this portal is for:

1. **B2B white-glove onboarding.** Venue owners cannot self-serve signup — an account exists only by redeeming a token a superadmin issued. The order is **owner first, club second**, and both steps after the first happen *in this repo*:

   1. A superadmin generates a secure one-time token in the superadmin portal. It is **not tied to any club** — it carries only an expiry.
   2. The token is handed to the venue manager out-of-band and redeemed **here** (`redeemVerificationToken`) to create their authenticated `owner` account. Redemption creates the user and marks the token `used`; it links no club, because none exists yet.
   3. The now-authenticated owner registers their **own** club **here**, as `draft`. This is how `Clubs.owner_id` gets its value.

   **A token gates account creation, not venue identity.** It proves the holder is an approved owner; it does not prove they own any particular venue. Nothing structurally stops a token holder from registering a club under a name that isn't theirs and publishing it — the backstop is reactive: a superadmin spots it and flips the club to `inactive`. That trade is accepted deliberately; do not write code or docs that assume the token already guarantees venue identity.

   **Why the token has no `club_id`:** `Clubs.owner_id` is `FK, NO NULL`, so a club cannot exist before its owner does. Owner-first is what makes that constraint satisfiable, and it is why `DB.md` states no owner association is stored on the token. Club creation lives in this repo, never in the superadmin portal.

   **Clubs status lifecycle:** `draft` → `active` → `inactive`. A club is created by its **owner** as `draft` and is **hidden from all consumer surfaces** — `listClubs`/`getClub` in `lib/api/clubs/api.ts` filter `.eq("status", "active")`, so `draft` and `inactive` never surface. The owner fills in images, description, and hours, then publishes (`draft` → `active`) via `updateClub` (`requireClubOwner`) — *when* a venue is showcased is up to the owner, not the superadmin. `inactive` is a superadmin-only enforcement state (fraud offline); owners cannot set it.

2. **Global reservation ledger.** A master view of every booking across every club, searchable by guest email, phone, or `qr_code_token`. Guest identity is denormalized onto the reservation row (`guest_name`, `guest_email`, `guest_contact`) specifically so bookings work for walk-ins and guests without accounts — do not assume a reservation joins to a user.

3. **Financial reconciliation.** Track total PayMongo volume, compute the Otus platform commission, and surface the pending payout balance owed to each club.

### Schema

`DB.md` is the schema reference. Note two conventions that will bite you: primary keys are UUID v4, and `club_id` is **intentionally denormalized** onto both `Club_Tables` and `Reservations` to avoid joins on hot queries. All timestamps are UTC; convert at the application layer.

✅ **Naming conflict resolved.** `DB.md` is the source of truth. Tables are `Clubs`, `Users`, `Owner_Verification_Tokens` (PascalCase). `Users.role` accepts `owner` or `admin` only — guests have no accounts.
