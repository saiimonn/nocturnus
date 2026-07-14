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
