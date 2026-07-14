# Database Seeders — Design

**Date:** 2026-07-14
**Status:** Approved (design), pending implementation plan

## Goal

Provide a repeatable way to fill the real Supabase database with realistic, constraint-valid sample data across all 9 tables, so the API routes and dashboard can be developed and tested against live data instead of hardcoded mocks.

## Decisions

| Question | Decision |
| :--- | :--- |
| Target | Real Supabase database (service-role key, bypasses RLS) |
| Data source | Generated with `@faker-js/faker` (random-but-valid, configurable counts) |
| Reset behavior | Wipe then seed — delete all rows in FK-safe order before inserting |
| Runner | Standalone `tsx` script invoked via `npm run seed` |

## Dependencies

Added as **devDependencies**:

- `tsx` — run the TypeScript seeder directly, outside the Next build.
- `@faker-js/faker` — generate names, emails, addresses, timestamps, etc.

Deliberately avoided:

- **No `bcrypt`/`bcryptjs`.** Auth is not wired up, so `Users.password_hash` only needs a valid-looking bcrypt string. The seeder uses a single precomputed bcrypt-format hash constant for every seeded user.
- **No `dotenv`.** Env is loaded via Node's native `--env-file` flag (Node 20.6+; the repo targets `@types/node@^20`).
- `token_hash` for `Owner_Verification_Tokens` is a SHA-256 hex digest produced by Node's built-in `crypto`. The plaintext tokens are printed to the console so they can be redeemed during testing.

## Runner & environment

`package.json` gains:

```json
"seed": "tsx --env-file=.env.local scripts/seed.ts"
```

The script constructs its **own** Supabase client — it does **not** import `lib/supabase.ts` (that is the anon-key singleton for the app):

```ts
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/db"

const client = createClient<Database>(url, serviceRoleKey)
```

Required env vars (script fails fast with a clear message if either is missing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Before wiping, the script prints the target host loudly (the operation is destructive and must only ever point at a dev database).

## File layout

Two focused files under `scripts/`:

### `scripts/seed/factories.ts`
Pure functions, one per table, each returning a typed `Insert` row (or array) from `lib/db.ts`. No database access — trivially unit-reviewable.

- `makeUser(overrides?)` → `users.Insert` (role `owner`/`admin`, status `active`/`suspended`, shared password hash)
- `makeClub(ownerId)` → `clubs.Insert` (unique `slug`, `operating_hours` jsonb, status `active`/`inactive`)
- `makeClubImage(clubId)` → `club_images.Insert`
- `makeFloorPlan(clubId)` → `floor_plans.Insert` (`labels` jsonb with 0–1 coords)
- `makeClubTable(floorPlanId, clubId)` → `club_tables.Insert` (category enum, `pos_x`/`pos_y` in 0–1, PHP `minimum_spend`)
- `makeEvent(clubId)` → `events.Insert` (status `draft`/`published`/`cancelled`)
- `makeDiscountCode(clubId)` → `discount_codes.Insert` (`discount_type` enum, date window, usage counters)
- `makeReservation(tableId, clubId, eventId?)` → `reservations.Insert` (denormalized `club_id`, guest identity fields, status enum, optional `qr_code_token`)
- `makeVerificationToken()` → `{ row: owner_verification_tokens.Insert; plaintext: string }`

IDs are generated in code via `crypto.randomUUID()` so children can reference parents without a DB round-trip.

### `scripts/seed.ts`
Orchestrator:

1. Validate env, build the service-role client, print target host.
2. **Wipe** every table (see order below).
3. **Generate** rows using the factories and a `COUNTS` config object.
4. **Insert** in FK-safe order.
5. Print a summary (row counts per table) and the plaintext verification tokens.

## Configuration

A `COUNTS` object at the top of `scripts/seed.ts`:

```ts
const COUNTS = {
  owners: 8,              // users with role 'owner'
  admins: 2,              // users with role 'admin'
  clubsPerOwner: 2,
  imagesPerClub: 4,
  floorPlansPerClub: 2,
  tablesPerFloorPlan: 8,
  eventsPerClub: 3,
  discountCodesPerClub: 2,
  reservationsPerClub: 15,
  verificationTokens: 5,  // standalone
}
```

(Exact starting values may be tuned during implementation; the shape is fixed.)

## Insert order (FK-safe)

```
users
  → clubs                       (owner_id → users.id)
      → club_images             (club_id → clubs.id)
      → floor_plans             (club_id → clubs.id)
      → events                  (club_id → clubs.id)
      → discount_codes          (club_id → clubs.id)
      → club_tables             (floor_plan_id → floor_plans.id, club_id → clubs.id)
          → reservations        (table_id → club_tables.id, club_id → clubs.id, event_id? → events.id)
owner_verification_tokens       (standalone, any time)
```

- Only `Clubs.owner_id` points at `users` whose `role = 'owner'` (admins own no clubs).
- `club_id` is kept identical between a table and the reservations booked on it (denormalization is honored, not re-derived).
- `event_id` on a reservation is either null or an event belonging to the **same** club.

## Wipe order (reverse of insert)

```
reservations
  → club_tables
  → club_images, floor_plans, events, discount_codes
  → clubs
  → users
owner_verification_tokens       (standalone)
```

Each table cleared with a `.delete()` that matches all rows.

## Error handling

- Missing env var → print which one and exit non-zero before touching the DB.
- Any Supabase insert/delete error → log the table, the Supabase error, and exit non-zero (no partial silent success).
- Batch inserts per table so a failure names the offending table.

## Testing / verification

There is no test framework in this repo. Verification is manual:

1. `npm run seed` against a dev Supabase project completes without error and prints per-table counts.
2. Re-running produces the same counts (wipe-then-seed is idempotent in row totals).
3. Spot-check in the Supabase dashboard / an API route that FKs resolve and enums are valid.

## Docs to update (same change)

Per the repo's own rule, `AGENTS.md` must be updated in the same change to:

- Document the `npm run seed` command and the `scripts/seed*` files.
- Correct the stale reference to `lib/mock-data.ts` (which does not exist — the mock modules are `lib/mock-data-owner.ts` and `lib/mock-data-user.ts`), and note the schema lives in `lib/db.ts`.

## Out of scope

- Seeding object storage (images) — `*_image_url` columns get faker URLs only.
- Real bcrypt password generation or working login.
- Any production-facing safety beyond the loud target-host print and env checks.
