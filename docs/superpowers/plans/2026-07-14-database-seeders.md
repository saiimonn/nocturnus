# Database Seeders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `tsx`-run, faker-backed seeder that wipes and repopulates all 9 Supabase tables with constraint-valid sample data.

**Architecture:** Two files under `scripts/`. `scripts/seed/factories.ts` holds pure, per-table factory functions that return typed `Insert` rows from `lib/db.ts` (IDs generated in-code with `crypto.randomUUID()` so children reference parents without DB round-trips). `scripts/seed.ts` is the orchestrator: it builds a service-role Supabase client, wipes in FK-reverse order, generates a consistent object graph, inserts in FK order, and prints a summary plus plaintext verification tokens.

**Tech Stack:** TypeScript, `tsx` (runner), `@faker-js/faker` (generation), `@supabase/supabase-js` (already present), Node built-in `crypto`.

## Global Constraints

- **No test framework exists in this repo.** Verification is `npx tsc --noEmit` (typecheck; `include` covers `**/*.ts`) plus a manual seeder run. Do NOT add a test runner.
- **Relative imports only inside `scripts/`.** The `@/*` tsconfig path alias is NOT resolved by the `tsx` runtime — use `../lib/db`, `./seed/factories`, etc.
- **Row types come from `lib/db.ts`** — `Database["public"]["Tables"][<name>]["Insert"]`. Never hand-redeclare column shapes.
- **Enums must be valid:** `users.role` ∈ {owner, admin}; `users.status` ∈ {active, suspended}; `clubs.status` ∈ {active, inactive}; `club_tables.category` ∈ {VIP, regular, booth, bar}; `events.status` ∈ {draft, published, cancelled}; `discount_codes.discount_type` ∈ {percentage, fixed_amount}; `reservations.status` ∈ {pending, confirmed, cancelled, checked_in}.
- **`club_id` is denormalized** on `club_tables` and `reservations` — it MUST equal the owning club's id, not a random one.
- **`Users.email` and `Clubs.slug` are UNIQUE** — suffix them with a short `randomUUID()` slice to guarantee no collision.
- **Faker v9+ API names:** `faker.internet.username()` (not `userName`), `faker.number.float({ fractionDigits })`, `faker.image.url()`. Do not use deprecated `urlLoremFlickr`.
- Every seeded user shares one placeholder bcrypt hash (auth is not wired).

---

### Task 1: Add dependencies and the `seed` npm script

**Files:**
- Modify: `package.json` (devDependencies + scripts)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run seed` → `node --env-file=.env.local --import tsx scripts/seed.ts`. `tsx` and `@faker-js/faker` available as dev deps.

- [ ] **Step 1: Install the dev dependencies**

Run:
```bash
npm install -D tsx @faker-js/faker
```
Expected: both appear under `devDependencies` in `package.json`; exit 0.

- [ ] **Step 2: Add the `seed` script**

Edit `package.json` `scripts` so it reads (keep the existing four scripts):
```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "seed": "node --env-file=.env.local --import tsx scripts/seed.ts"
  },
```
Rationale for the exact form: `node --env-file` is native (Node 20.6+) so no `dotenv`; `--import tsx` registers the TS loader. This is more robust than passing `--env-file` through the `tsx` binary.

- [ ] **Step 3: Verify the script is registered**

Run:
```bash
npm run seed --silent 2>&1 | head -5 || true
```
Expected: it fails because `scripts/seed.ts` does not exist yet (e.g. "Cannot find module .../scripts/seed.ts"). This confirms npm resolves the script and `tsx` loads — the missing file is expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(seed): add tsx + faker dev deps and seed script"
```

---

### Task 2: Table factories

**Files:**
- Create: `scripts/seed/factories.ts`

**Interfaces:**
- Consumes: `Database` from `../../lib/db`; `faker`; `randomUUID`, `createHash` from `node:crypto`.
- Produces (all IDs are set, so callers read `row.id!`):
  - `SEED_PASSWORD_HASH: string`
  - `makeUser(role: "owner" | "admin"): UsersInsert`
  - `makeClub(ownerId: string): ClubsInsert`
  - `makeClubImage(clubId: string): ClubImagesInsert`
  - `makeFloorPlan(clubId: string): FloorPlansInsert`
  - `makeClubTable(floorPlanId: string, clubId: string): ClubTablesInsert`
  - `makeEvent(clubId: string): EventsInsert`
  - `makeDiscountCode(clubId: string): DiscountCodesInsert`
  - `makeReservation(tableId: string, clubId: string, eventId: string | null): ReservationsInsert`
  - `makeVerificationToken(): { row: OwnerVerificationTokensInsert; plaintext: string }`

- [ ] **Step 1: Write `scripts/seed/factories.ts`**

```ts
import { randomUUID, createHash } from "node:crypto"
import { faker } from "@faker-js/faker"
import type { Database } from "../../lib/db"

type Tables = Database["public"]["Tables"]

/** Placeholder bcrypt-format hash. Auth is not wired; the column only needs a valid shape. */
export const SEED_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

function now(): string {
  return new Date().toISOString()
}

function shortId(): string {
  return randomUUID().slice(0, 8)
}

function operatingHours(): { day: string; open: string; close: string }[] {
  return ["Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    open: "20:00",
    close: "04:00",
  }))
}

export function makeUser(role: "owner" | "admin"): Tables["users"]["Insert"] {
  const ts = now()
  return {
    id: randomUUID(),
    full_name: faker.person.fullName(),
    email: `${faker.internet.username().toLowerCase()}.${shortId()}@example.com`,
    contact_number:
      faker.helpers.maybe(() => faker.phone.number(), { probability: 0.8 }) ?? null,
    password_hash: SEED_PASSWORD_HASH,
    role,
    status: faker.helpers.weightedArrayElement([
      { value: "active", weight: 9 },
      { value: "suspended", weight: 1 },
    ]),
    created_at: ts,
    updated_at: ts,
  }
}

export function makeClub(ownerId: string): Tables["clubs"]["Insert"] {
  const ts = now()
  const name = `${faker.company.name()} Club`
  return {
    id: randomUUID(),
    owner_id: ownerId,
    name,
    slug: `${faker.helpers.slugify(name).toLowerCase()}-${shortId()}`,
    description: faker.lorem.paragraph(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    operating_hours: operatingHours(),
    cover_image_url: faker.image.url(),
    status: faker.helpers.weightedArrayElement([
      { value: "active", weight: 9 },
      { value: "inactive", weight: 1 },
    ]),
    created_at: ts,
    updated_at: ts,
  }
}

export function makeClubImage(clubId: string): Tables["club_images"]["Insert"] {
  return {
    id: randomUUID(),
    club_id: clubId,
    image_url: faker.image.url(),
    caption:
      faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) ?? null,
    created_at: now(),
  }
}

export function makeFloorPlan(clubId: string): Tables["floor_plans"]["Insert"] {
  const ts = now()
  return {
    id: randomUUID(),
    club_id: clubId,
    name: faker.helpers.arrayElement([
      "Ground Floor",
      "VIP Mezzanine",
      "Rooftop",
      "Basement Lounge",
    ]),
    image_url: faker.image.url(),
    labels: [
      { text: "STAGE", x: 0.5, y: 0.1 },
      { text: "BAR", x: 0.1, y: 0.5 },
      { text: "DANCEFLOOR", x: 0.5, y: 0.6 },
    ],
    created_at: ts,
    updated_at: ts,
  }
}

export function makeClubTable(
  floorPlanId: string,
  clubId: string,
): Tables["club_tables"]["Insert"] {
  const ts = now()
  return {
    id: randomUUID(),
    floor_plan_id: floorPlanId,
    club_id: clubId,
    label: `T-${faker.number.int({ min: 1, max: 99 })}`,
    capacity: faker.number.int({ min: 2, max: 12 }),
    minimum_spend:
      faker.helpers.maybe(
        () => faker.number.float({ min: 1000, max: 20000, fractionDigits: 2 }),
        { probability: 0.7 },
      ) ?? null,
    category: faker.helpers.arrayElement(["VIP", "regular", "booth", "bar"] as const),
    pos_x: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
    pos_y: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
    is_available: faker.datatype.boolean(),
    created_at: ts,
    updated_at: ts,
  }
}

export function makeEvent(clubId: string): Tables["events"]["Insert"] {
  const ts = now()
  return {
    id: randomUUID(),
    club_id: clubId,
    title: `${faker.word.adjective()} ${faker.helpers.arrayElement([
      "Nights",
      "Sessions",
      "Takeover",
      "Rave",
    ])}`,
    description: faker.lorem.sentences(2),
    image_url: faker.image.url(),
    event_date: faker.date.soon({ days: 60 }).toISOString(),
    status: faker.helpers.arrayElement(["draft", "published", "cancelled"] as const),
    created_at: ts,
    updated_at: ts,
  }
}

export function makeDiscountCode(clubId: string): Tables["discount_codes"]["Insert"] {
  const start = faker.date.recent({ days: 10 })
  const end = faker.date.soon({ days: 30, refDate: start })
  const type = faker.helpers.arrayElement(["percentage", "fixed_amount"] as const)
  return {
    id: randomUUID(),
    club_id: clubId,
    code: `${faker.word.noun().toUpperCase()}${faker.number.int({ min: 5, max: 50 })}`,
    discount_type: type,
    discount_value:
      type === "percentage"
        ? faker.number.int({ min: 5, max: 50 })
        : faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }),
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    usage_limit: faker.number.int({ min: 50, max: 500 }),
    times_used: faker.number.int({ min: 0, max: 50 }),
    is_active: faker.datatype.boolean(),
    min_order_value: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
  }
}

export function makeReservation(
  tableId: string,
  clubId: string,
  eventId: string | null,
): Tables["reservations"]["Insert"] {
  const ts = now()
  const status = faker.helpers.arrayElement([
    "pending",
    "confirmed",
    "cancelled",
    "checked_in",
  ] as const)
  const hasQr = status === "confirmed" || status === "checked_in"
  return {
    id: randomUUID(),
    table_id: tableId,
    club_id: clubId,
    event_id: eventId,
    reservation_date: faker.date.soon({ days: 30 }).toISOString(),
    guest_name: faker.person.fullName(),
    guest_email: faker.internet.email().toLowerCase(),
    guest_contact:
      faker.helpers.maybe(() => faker.phone.number(), { probability: 0.8 }) ?? null,
    party_size: faker.number.int({ min: 1, max: 10 }),
    qr_code_token: hasQr ? randomUUID() : null,
    status,
    created_at: ts,
    updated_at: ts,
  }
}

export function makeVerificationToken(): {
  row: Tables["owner_verification_tokens"]["Insert"]
  plaintext: string
} {
  const plaintext = randomUUID().replace(/-/g, "")
  const token_hash = createHash("sha256").update(plaintext).digest("hex")
  return {
    row: {
      id: randomUUID(),
      token_hash,
      expires_at: faker.date.soon({ days: 7 }).toISOString(),
      used: false,
      revoked: false,
      created_at: now(),
    },
    plaintext,
  }
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0, no errors referencing `scripts/seed/factories.ts`.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed/factories.ts
git commit -m "feat(seed): per-table faker factories"
```

---

### Task 3: Seed orchestrator

**Files:**
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: every `make*` factory from `./seed/factories`; `createClient` + `Database`; `faker`.
- Produces: the executable entrypoint run by `npm run seed`. No exports.

- [ ] **Step 1: Write `scripts/seed.ts`**

```ts
import { createClient } from "@supabase/supabase-js"
import { faker } from "@faker-js/faker"
import type { Database } from "../lib/db"
import {
  makeUser,
  makeClub,
  makeClubImage,
  makeFloorPlan,
  makeClubTable,
  makeEvent,
  makeDiscountCode,
  makeReservation,
  makeVerificationToken,
} from "./seed/factories"

const COUNTS = {
  owners: 8,
  admins: 2,
  clubsPerOwner: 2,
  imagesPerClub: 4,
  floorPlansPerClub: 2,
  tablesPerFloorPlan: 8,
  eventsPerClub: 3,
  discountCodesPerClub: 2,
  reservationsPerClub: 15,
  verificationTokens: 5,
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    "Missing env. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set in .env.local).",
  )
  process.exit(1)
}

const db = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false },
})

// Reverse-FK order for wiping. Impossible-UUID filter matches all rows
// (Supabase requires a filter on delete).
const IMPOSSIBLE_UUID = "00000000-0000-0000-0000-000000000000"
const WIPE_ORDER = [
  "reservations",
  "club_tables",
  "club_images",
  "floor_plans",
  "events",
  "discount_codes",
  "clubs",
  "users",
  "owner_verification_tokens",
] as const

async function wipe(): Promise<void> {
  for (const table of WIPE_ORDER) {
    const { error } = await db.from(table).delete().neq("id", IMPOSSIBLE_UUID)
    if (error) {
      console.error(`wipe ${table} failed:`, error.message)
      process.exit(1)
    }
  }
}

// Rows are built by typed factories; the dynamic-table insert is cast to keep
// this helper terse. Type safety lives in the factories.
async function insertRows(
  table: keyof Database["public"]["Tables"],
  rows: unknown[],
): Promise<void> {
  if (rows.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from(table).insert(rows as any)
  if (error) {
    console.error(`insert ${table} failed:`, error.message)
    process.exit(1)
  }
  console.log(`  ${table}: ${rows.length}`)
}

async function main(): Promise<void> {
  console.log(`\n⚠️  Seed target: ${url}`)
  console.log("Wiping existing data (FK-reverse order)...")
  await wipe()

  const owners = Array.from({ length: COUNTS.owners }, () => makeUser("owner"))
  const admins = Array.from({ length: COUNTS.admins }, () => makeUser("admin"))
  const users = [...owners, ...admins]

  const clubs: ReturnType<typeof makeClub>[] = []
  const clubImages: ReturnType<typeof makeClubImage>[] = []
  const floorPlans: ReturnType<typeof makeFloorPlan>[] = []
  const clubTables: ReturnType<typeof makeClubTable>[] = []
  const events: ReturnType<typeof makeEvent>[] = []
  const discountCodes: ReturnType<typeof makeDiscountCode>[] = []
  const reservations: ReturnType<typeof makeReservation>[] = []

  for (const owner of owners) {
    for (let c = 0; c < COUNTS.clubsPerOwner; c++) {
      const club = makeClub(owner.id!)
      clubs.push(club)

      for (let i = 0; i < COUNTS.imagesPerClub; i++) {
        clubImages.push(makeClubImage(club.id!))
      }

      const clubEvents = Array.from({ length: COUNTS.eventsPerClub }, () =>
        makeEvent(club.id!),
      )
      events.push(...clubEvents)

      for (let d = 0; d < COUNTS.discountCodesPerClub; d++) {
        discountCodes.push(makeDiscountCode(club.id!))
      }

      const clubTableRows: ReturnType<typeof makeClubTable>[] = []
      for (let f = 0; f < COUNTS.floorPlansPerClub; f++) {
        const fp = makeFloorPlan(club.id!)
        floorPlans.push(fp)
        for (let t = 0; t < COUNTS.tablesPerFloorPlan; t++) {
          const tbl = makeClubTable(fp.id!, club.id!)
          clubTables.push(tbl)
          clubTableRows.push(tbl)
        }
      }

      for (let r = 0; r < COUNTS.reservationsPerClub; r++) {
        const tbl = faker.helpers.arrayElement(clubTableRows)
        const evt = faker.helpers.maybe(
          () => faker.helpers.arrayElement(clubEvents),
          { probability: 0.4 },
        )
        reservations.push(makeReservation(tbl.id!, club.id!, evt?.id ?? null))
      }
    }
  }

  const tokens = Array.from({ length: COUNTS.verificationTokens }, () =>
    makeVerificationToken(),
  )

  console.log("Inserting (FK order):")
  await insertRows("users", users)
  await insertRows("clubs", clubs)
  await insertRows("club_images", clubImages)
  await insertRows("floor_plans", floorPlans)
  await insertRows("events", events)
  await insertRows("discount_codes", discountCodes)
  await insertRows("club_tables", clubTables)
  await insertRows("reservations", reservations)
  await insertRows(
    "owner_verification_tokens",
    tokens.map((t) => t.row),
  )

  console.log("\n✅ Seed complete.")
  console.log("\nVerification tokens (plaintext — redeem out-of-band):")
  for (const t of tokens) console.log(`  ${t.plaintext}`)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0. If the `insert(rows as any)` line raises a lint error during a later `npm run lint`, the inline `eslint-disable-next-line` above it suppresses it — leave it in place.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(seed): wipe-then-seed orchestrator"
```

---

### Task 4: Run against the dev database and update AGENTS.md

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: everything above; a reachable dev Supabase project with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- Produces: a populated dev database and current docs.

- [ ] **Step 1: Confirm `.env.local` has the service-role key**

Run:
```bash
grep -c SUPABASE_SERVICE_ROLE_KEY .env.local
```
Expected: `1`. If `0`, add `SUPABASE_SERVICE_ROLE_KEY=<dev service role key>` to `.env.local` (get it from Supabase dashboard → Project Settings → API). Do NOT commit `.env.local` (it is gitignored).

- [ ] **Step 2: Run the seeder**

Run:
```bash
npm run seed
```
Expected output shape:
```
⚠️  Seed target: https://<project>.supabase.co
Wiping existing data (FK-reverse order)...
Inserting (FK order):
  users: 10
  clubs: 16
  club_images: 64
  floor_plans: 32
  events: 48
  discount_codes: 32
  club_tables: 256
  reservations: 240
  owner_verification_tokens: 5
✅ Seed complete.

Verification tokens (plaintext — redeem out-of-band):
  <32-hex-chars>
  ... (5 total)
```
(Counts follow from `COUNTS`: 8 owners × 2 clubs = 16 clubs; 16 × 8 tables/plan × 2 plans = 256; 16 × 15 = 240.) If any `insert <table> failed` line appears, stop and fix the reported Supabase error before continuing.

- [ ] **Step 3: Verify idempotency — run it a second time**

Run:
```bash
npm run seed
```
Expected: same per-table counts as Step 2 (wipe-then-seed keeps totals stable across runs), exit 0.

- [ ] **Step 4: Spot-check foreign keys resolve**

Either in the Supabase dashboard SQL editor, or via an existing API route (e.g. `npm run dev` then `GET /api/clubs`), confirm: clubs list returns rows, every `reservations.club_id` matches its table's `club_id`, and no enum/constraint errors were logged. Record the result mentally — there is no automated assertion here.

- [ ] **Step 5: Update `AGENTS.md`**

Make these edits to `AGENTS.md`:

1. Under **Commands**, add the seed command to the code block:
```bash
npm run seed     # wipe + reseed all Supabase tables with faker data (dev DB; needs SUPABASE_SERVICE_ROLE_KEY)
```

2. In the **Architecture** section, replace the stale mock-data sentence. The current text says *"all UI mock data lives in `lib/mock-data.ts`"* — that file does not exist. Change it to describe reality: the schema/row types live in `lib/db.ts` (the typed `Database` interface, 9 tables), UI mocks live in `lib/mock-data-owner.ts` and `lib/mock-data-user.ts`, and the database can be populated with `npm run seed` (see `scripts/seed.ts` + `scripts/seed/factories.ts`, which generate constraint-valid faker rows in FK-safe order).

3. Add a short note that `scripts/seed/factories.ts` is the place to adjust generated data shapes and `COUNTS` in `scripts/seed.ts` controls volume.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): document npm run seed and correct data-layer refs"
```

---

## Notes for the implementer

- If `npm run seed` errors with `--env-file` unrecognized, the Node version is < 20.6. Check `node -v`; the repo targets `@types/node@^20` which implies 20.6+ is expected.
- If `tsx` fails to resolve `../lib/db`, confirm you used relative paths (not `@/lib/db`) — the alias is not wired for the `tsx` runtime.
- The `insertRows` helper casts to `any` at the Supabase call only; the row objects are fully typed by the factories, so column mistakes are still caught at compile time in `factories.ts`.
