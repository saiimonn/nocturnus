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
