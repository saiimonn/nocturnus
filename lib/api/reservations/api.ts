import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireClubOwner, requireEmployee } from "@/lib/api/shared/auth"
import {
  badRequest,
  conflict,
  fromDb,
  handle,
  notFound,
  readJson,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"
import type { Database } from "@/lib/db"
import { sendReservationConfirmation } from "./confirmation"

type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"]
type ReservationUpdate = Database["public"]["Tables"]["reservations"]["Update"]
const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "checked_in"] as const
type ReservationStatus = (typeof RESERVATION_STATUSES)[number]

function parseReservationStatus(value: unknown): ReservationStatus {
  if (!RESERVATION_STATUSES.includes(value as ReservationStatus)) {
    throw badRequest(`status must be one of: ${RESERVATION_STATUSES.join(", ")}`)
  }
  return value as ReservationStatus
}

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

  // Service-role client, not the anon one: guests hold only the "Anyone can
  // create reservations" INSERT policy and no SELECT policy on reservations,
  // so an insert that reads the new row back (which we need, to return it)
  // would be rejected by RLS on the RETURNING clause.
  const reservation = fromDb(
    await supabaseAdmin
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

// Owners update a reservation's status (confirm/cancel/etc.) and, occasionally,
// its table/party size/date. The route only carries the reservation id, so the
// owning club is resolved from the existing row before delegating to
// requireClubOwner for the actual authorization check.
export const updateReservation = handle(
  async (request, context: RouteContext<{ id: string }>) => {
    const { id } = await context.params

    const existing = fromDb<ReservationRow>(
      await supabaseAdmin.from("reservations").select("*").eq("id", id).maybeSingle(),
    )
    await requireClubOwner(existing.club_id)

    const body = await readJson(request)
    const updates: ReservationUpdate = { updated_at: new Date().toISOString() }

    if (body.status !== undefined) {
      updates.status = parseReservationStatus(body.status)
      // A confirmed reservation needs a QR code for door check-in
      // (checkinReservation looks rows up by this token) — generate one the
      // first time a reservation is confirmed, if it doesn't already have one.
      if (updates.status === "confirmed" && !existing.qr_code_token) {
        updates.qr_code_token = crypto.randomUUID()
      }
    }
    if (body.party_size !== undefined) {
      const partySize = Number(body.party_size)
      if (!Number.isInteger(partySize) || partySize < 1) {
        throw badRequest("party_size must be a positive integer")
      }
      updates.party_size = partySize
    }
    if (body.reservation_date !== undefined) {
      if (typeof body.reservation_date !== "string") {
        throw badRequest("reservation_date must be an ISO date string")
      }
      updates.reservation_date = body.reservation_date
    }
    if (body.table_id !== undefined) {
      updates.table_id = String(body.table_id)
    }

    const reservation = fromDb<ReservationRow>(
      await supabaseAdmin
        .from("reservations")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle(),
    )

    // Best-effort: only when THIS request transitioned the row into
    // "confirmed" (not on a re-confirm of an already-confirmed row). A failure
    // to email must never fail the confirm — the status change is the source
    // of truth — so we swallow and log.
    const didConfirm =
      updates.status === "confirmed" && existing.status !== "confirmed"
    if (didConfirm) {
      try {
        await sendReservationConfirmation(reservation)
      } catch (error) {
        console.error(
          `Failed to send reservation confirmation email for reservation ${reservation.id}:`,
          error,
        )
      }
    }

    return Response.json({ reservation })
  },
)

// All reservations for the authenticated owner's club, across every status,
// most recent first, plus that club's tables (across all floor plans) so the
// owner UI can resolve table_id -> label without a second round trip per
// floor plan. Uses the service-role client so pending/cancelled rows are
// visible to their owner regardless of RLS.
export const listClubReservations = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)

    const reservations = fromDb(
      await supabaseAdmin
        .from("reservations")
        .select("*")
        .eq("club_id", clubId)
        .order("reservation_date", { ascending: false }),
    )
    const tables = fromDb(
      await supabaseAdmin.from("club_tables").select("*").eq("club_id", clubId).order("label"),
    )
    return Response.json({ clubId, reservations, tables })
  },
)

export const checkinReservation = handle(async (request) => {
  const session = await requireEmployee()
  const body = await readJson(request)
  requireFields(body, ["qr_code_token"])

  const { data: existing, error } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("qr_code_token", String(body.qr_code_token))
    .maybeSingle()

  if (error) {
    // qr_code_token is a Postgres uuid column. A scanned code that isn't a
    // well-formed UUID (a loyalty card, a parking stub, a damaged scan) makes
    // Postgres reject the comparison with 22P02 (invalid_text_representation)
    // rather than simply matching no rows. To the doorperson, a malformed
    // code and an unknown code are the same situation, so both are reported
    // as not-found instead of leaking a raw database error as a 500.
    if (error.code === "22P02") {
      throw notFound("No reservation matches that code")
    }
    throw new Error(error.message)
  }
  // A token from another venue is reported as not-found rather than forbidden,
  // so the response never reveals that the code is valid somewhere else.
  if (!existing || existing.club_id !== session.clubId) {
    throw notFound("No reservation matches that code")
  }
  if (existing.status === "checked_in") {
    throw conflict("This reservation has already been checked in")
  }
  if (existing.status !== "confirmed") {
    throw conflict(`A ${existing.status} reservation cannot be checked in`)
  }

  // Re-assert status = confirmed in the UPDATE itself, not just the read
  // above: two simultaneous scans of the same QR both pass the read check,
  // but only one may win the write. The losing request's UPDATE then matches
  // no row (data comes back null with no error), which we turn into the same
  // "already checked in" 409 the loser would have gotten had it lost the race
  // more visibly, rather than a confusing 404/500.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("reservations")
    .update({ status: "checked_in" })
    .eq("id", existing.id)
    .eq("status", "confirmed")
    .select("id, status, guest_name, party_size, reservation_date")
    .maybeSingle<
      Pick<ReservationRow, "id" | "status" | "guest_name" | "party_size" | "reservation_date">
    >()
  if (updateError) {
    throw new Error(updateError.message)
  }
  if (!updated) {
    throw conflict("This reservation has already been checked in")
  }
  const reservation = updated

  // Resolve display context for the door screen. Neither lookup is allowed to
  // fail the check-in — the guest is already through at this point.
  const { data: table } = await supabaseAdmin
    .from("club_tables")
    .select("label")
    .eq("id", existing.table_id)
    .maybeSingle()

  const event = existing.event_id
    ? (
        await supabaseAdmin
          .from("events")
          .select("title")
          .eq("id", existing.event_id)
          .maybeSingle()
      ).data
    : null

  return Response.json({
    reservation: {
      ...reservation,
      table_label: table?.label ?? null,
      event_title: event?.title ?? null,
    },
  })
})
