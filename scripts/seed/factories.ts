import { randomUUID, createHash } from "node:crypto"
import { faker } from "@faker-js/faker"
import type { Database } from "../../lib/db"

type Tables = Database["public"]["Tables"]

function now(): string {
  return new Date().toISOString()
}

function shortId(): string {
  return randomUUID().slice(0, 8)
}

// Curated nightlife stills so seeded club profiles look like venues rather than
// the random stock photos `faker.image.url()` hands back.
const NIGHTLIFE_IMAGE_IDS = [
  "photo-1566737236500-c8ac43014a67", // neon-lit entrance corridor
  "photo-1516450360452-9312f5e86fc7", // DJ booth over a packed floor
  "photo-1493225457124-a3eb161ffa5f", // hands up in stage smoke
  "photo-1533174072545-7a4b6ad7a6c3", // confetti over a night crowd
  "photo-1514525253161-7a46d19cd819", // lasers and confetti
  "photo-1544785349-c4a5301826fd", // close-up on the decks
  "photo-1492684223066-81342ee5ff30", // confetti burst under blue light
  "photo-1545128485-c400e7702796", // red-washed dark dancefloor
]

function nightlifeImageUrl(width = 1200, height = 800): string {
  const id = faker.helpers.arrayElement(NIGHTLIFE_IMAGE_IDS)
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`
}

function operatingHours(): { day: string; open: string; close: string }[] {
  return ["Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    open: "20:00",
    close: "04:00",
  }))
}

export function makeUser(
  role: "owner" | "admin",
  passwordHash: string,
  overrides: Partial<Tables["users"]["Insert"]> = {},
): Tables["users"]["Insert"] {
  const ts = now()
  return {
    id: randomUUID(),
    full_name: faker.person.fullName(),
    email: `${faker.internet.username().toLowerCase()}.${shortId()}@example.com`,
    contact_number:
      faker.helpers.maybe(() => faker.phone.number(), { probability: 0.8 }) ?? null,
    password_hash: passwordHash,
    role,
    status: faker.helpers.weightedArrayElement([
      { value: "active", weight: 9 },
      { value: "suspended", weight: 1 },
    ]),
    created_at: ts,
    updated_at: ts,
    ...overrides,
  }
}

export function makeClubEmployee(
  clubId: string,
  passwordHash: string,
  overrides: Partial<Tables["users"]["Insert"]> = {},
): Tables["users"]["Insert"] {
  return {
    full_name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    contact_number: faker.phone.number(),
    password_hash: passwordHash,
    role: "club_employee",
    club_id: clubId,
    status: "active",
    ...overrides,
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
    cover_image_url: nightlifeImageUrl(1600, 900),
    status: faker.helpers.weightedArrayElement([
      { value: "active", weight: 8 },
      { value: "draft", weight: 1 },
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
    image_url: nightlifeImageUrl(),
    caption:
      faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) ?? null,
    created_at: now(),
  }
}

export function makeFloorPlan(clubId: string): Tables["floor_plans"]["Insert"] {
  const ts = now()
  // Each plan ships as a hand-drawn blueprint under `public/floorplans/`, so the
  // name and the drawing always describe the same room.
  // Label positions are tuned to each drawing's geometry — a label only makes
  // sense sitting on the room it names, so the two move together.
  const plan = faker.helpers.arrayElement([
    {
      name: "Ground Floor",
      image: "ground-floor",
      labels: [
        { text: "STAGE", x: 0.5, y: 0.19 },
        { text: "BAR", x: 0.14, y: 0.55 },
        { text: "DANCEFLOOR", x: 0.5, y: 0.56 },
        { text: "BOOTHS", x: 0.86, y: 0.25 },
        { text: "ENTRANCE", x: 0.5, y: 0.95 },
      ],
    },
    {
      name: "VIP Mezzanine",
      image: "vip-mezzanine",
      labels: [
        { text: "VIP TABLES", x: 0.5, y: 0.14 },
        { text: "OPEN TO BELOW", x: 0.5, y: 0.7 },
        { text: "BAR", x: 0.11, y: 0.64 },
        { text: "STAIRS", x: 0.89, y: 0.51 },
      ],
    },
    {
      name: "Rooftop",
      image: "rooftop",
      labels: [
        { text: "POOL", x: 0.5, y: 0.35 },
        { text: "BAR", x: 0.5, y: 0.67 },
        { text: "CABANAS", x: 0.16, y: 0.19 },
        { text: "STAIR CORE", x: 0.5, y: 0.95 },
      ],
    },
    {
      name: "Basement Lounge",
      image: "basement-lounge",
      labels: [
        { text: "DJ BOOTH", x: 0.5, y: 0.29 },
        { text: "DANCEFLOOR", x: 0.51, y: 0.7 },
        { text: "BAR", x: 0.86, y: 0.61 },
        { text: "LOUNGE", x: 0.18, y: 0.36 },
      ],
    },
  ])
  return {
    id: randomUUID(),
    club_id: clubId,
    name: plan.name,
    image_url: `/floorplans/${plan.image}.svg`,
    labels: [...plan.labels],
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
    image_url: nightlifeImageUrl(1200, 675),
    event_date: faker.date.soon({ days: 60 }).toISOString(),
    status: faker.helpers.arrayElement(["draft", "published", "cancelled"] as const),
    created_at: ts,
    updated_at: ts,
  }
}

export function makeReservation(
  tableId: string,
  clubId: string,
  eventId: string | null,
): Tables["reservations"]["Insert"] {
  const ts = now()

  // Spread bookings across past/today/future, and pick a status that makes
  // sense for when the booking is. Seeding every reservation into the future
  // (faker.date.soon) left the history screens — which filter to cancelled and
  // checked_in — and the dashboard's "reservations today" permanently empty,
  // and produced nonsense rows like a booking already checked in three weeks
  // from now.
  const when = faker.helpers.weightedArrayElement([
    { value: "past", weight: 5 },
    { value: "today", weight: 2 },
    { value: "future", weight: 5 },
  ] as const)

  let reservationDate: Date
  let status: "pending" | "confirmed" | "cancelled" | "checked_in"

  if (when === "past") {
    reservationDate = faker.date.recent({ days: 45 })
    // A past booking has already resolved: the guest showed up or it fell through.
    status = faker.helpers.weightedArrayElement([
      { value: "checked_in", weight: 7 },
      { value: "cancelled", weight: 3 },
    ] as const)
  } else if (when === "today") {
    reservationDate = new Date()
    reservationDate.setHours(faker.number.int({ min: 20, max: 23 }), 0, 0, 0)
    status = faker.helpers.weightedArrayElement([
      { value: "confirmed", weight: 5 },
      { value: "checked_in", weight: 3 },
      { value: "pending", weight: 2 },
    ] as const)
  } else {
    reservationDate = faker.date.soon({ days: 30 })
    // Nothing upcoming can have been checked in yet.
    status = faker.helpers.weightedArrayElement([
      { value: "pending", weight: 5 },
      { value: "confirmed", weight: 4 },
      { value: "cancelled", weight: 1 },
    ] as const)
  }

  const hasQr = status === "confirmed" || status === "checked_in"
  return {
    id: randomUUID(),
    table_id: tableId,
    club_id: clubId,
    event_id: eventId,
    reservation_date: reservationDate.toISOString(),
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
