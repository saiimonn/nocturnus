import { supabase } from "@/lib/supabase"
import { requireClubOwner, requireOwner } from "@/lib/api/shared/auth"
import {
  badRequest,
  conflict,
  fromDb,
  handle,
  notFound,
  notImplemented,
  readJson,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"

export const createReservation = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, [
    "table_id",
    "club_id",
    "reservation_date",
    "guest_name",
    "guest_email",
    "party_size",
  ])

  const partySize = Number(body.party_size)
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw badRequest("party_size must be a positive integer")
  }

  const reservation = fromDb(
    await supabase
      .from("reservations")
      .insert({
        table_id: String(body.table_id),
        club_id: String(body.club_id),
        event_id: body.event_id ? String(body.event_id) : null,
        reservation_date: String(body.reservation_date),
        guest_name: String(body.guest_name),
        guest_email: String(body.guest_email),
        guest_contact: body.guest_contact ? String(body.guest_contact) : null,
        party_size: partySize,
        status: "pending",
      })
      .select("id, status, reservation_date")
      .maybeSingle(),
  )

  return Response.json({ reservation }, { status: 201 })
})

export const getReservation = handle(
  async (request, context: RouteContext<{ id: string }>) => {
    const { id } = await context.params
    const email = request.headers.get("x-guest-email")
    if (!email) {
      throw badRequest("An X-Guest-Email header is required to look up a reservation")
    }

    const reservation = fromDb(
      await supabase
        .from("reservations")
        .select(
          "id, status, reservation_date, guest_name, party_size, qr_code_token, club_id, table_id, event_id",
        )
        .eq("id", id)
        .eq("guest_email", email)
        .maybeSingle(),
    )

    return Response.json({ reservation })
  },
)

export const updateReservation = handle(
  async (_request, context: RouteContext<{ id: string }>) => {
    await context.params
    await requireOwner()
    throw notImplemented("Updating a reservation is not implemented yet")
  },
)

export const listClubReservations = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Listing club reservations is not implemented yet")
  },
)

export const checkinReservation = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["qr_code_token"])

  const { data: existing, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("qr_code_token", String(body.qr_code_token))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!existing) {
    throw notFound("No reservation matches that code")
  }
  if (existing.status === "checked_in") {
    throw conflict("This reservation has already been checked in")
  }
  if (existing.status !== "confirmed") {
    throw conflict(`A ${existing.status} reservation cannot be checked in`)
  }

  const reservation = fromDb(
    await supabase
      .from("reservations")
      .update({ status: "checked_in" })
      .eq("id", existing.id)
      .select("id, status, guest_name, party_size, reservation_date")
      .maybeSingle(),
  )

  return Response.json({ reservation })
})
