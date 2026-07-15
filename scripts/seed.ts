import { createClient } from "@supabase/supabase-js"
import { faker } from "@faker-js/faker"
import bcrypt from "bcryptjs"
import type { Database } from "../lib/db"
import {
  makeUser,
  makeClub,
  makeClubImage,
  makeFloorPlan,
  makeClubTable,
  makeEvent,
  makeReservation,
  makeVerificationToken,
} from "./seed/factories"

const COUNTS = {
  owners: 8,
  admins: 2,
  clubsPerOwner: 1,
  imagesPerClub: 4,
  floorPlansPerClub: 2,
  tablesPerFloorPlan: 8,
  eventsPerClub: 3,
  reservationsPerClub: 15,
  verificationTokens: 5,
}

// Known login credentials. Every seeded user shares SEED_PASSWORD (bcrypt-hashed
// per DB.md), and these two fixed accounts have stable, memorable emails so you
// always know one owner and one admin to log in with. Change to taste.
const SEED_PASSWORD = "password123"
const FIXED_OWNER = { email: "owner@otus.dev", full_name: "Demo Owner" }
const FIXED_ADMIN = { email: "admin@otus.dev", full_name: "Demo Admin" }

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

  // One bcrypt hash of SEED_PASSWORD, shared by every seeded user so any of them
  // can log in. The two fixed accounts lead their arrays (forced active, never
  // suspended), and the fixed owner is owners[0] so it owns clubs below.
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, 10)

  const owners = [
    makeUser("owner", passwordHash, { ...FIXED_OWNER, status: "active" }),
    ...Array.from({ length: COUNTS.owners - 1 }, () =>
      makeUser("owner", passwordHash),
    ),
  ]
  const admins = [
    makeUser("admin", passwordHash, { ...FIXED_ADMIN, status: "active" }),
    ...Array.from({ length: COUNTS.admins - 1 }, () =>
      makeUser("admin", passwordHash),
    ),
  ]
  const users = [...owners, ...admins]

  const clubs: ReturnType<typeof makeClub>[] = []
  const clubImages: ReturnType<typeof makeClubImage>[] = []
  const floorPlans: ReturnType<typeof makeFloorPlan>[] = []
  const clubTables: ReturnType<typeof makeClubTable>[] = []
  const events: ReturnType<typeof makeEvent>[] = []
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
  await insertRows("club_tables", clubTables)
  await insertRows("reservations", reservations)
  await insertRows(
    "owner_verification_tokens",
    tokens.map((t) => t.row),
  )

  console.log("\n✅ Seed complete.")
  console.log(`\nLogin accounts — password for ALL seeded users: ${SEED_PASSWORD}`)
  console.log(
    `  owner → ${FIXED_OWNER.email}  (role: owner, owns ${COUNTS.clubsPerOwner} clubs)`,
  )
  console.log(`  admin → ${FIXED_ADMIN.email}  (role: admin)`)
  console.log("\nVerification tokens (plaintext — redeem out-of-band):")
  for (const t of tokens) console.log(`  ${t.plaintext}`)
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
