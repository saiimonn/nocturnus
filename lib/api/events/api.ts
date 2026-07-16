import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireClubOwner, requireOwner } from "@/lib/api/shared/auth"
import {
  badRequest,
  fromDb,
  handle,
  notFound,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"
import type { Database } from "@/lib/db"
import { optionalImageFile, uploadClubMedia } from "@/lib/api/shared/storage"

type EventUpdate = Database["public"]["Tables"]["events"]["Update"]
const EVENT_STATUSES = ["draft", "published", "cancelled"] as const
type EventStatus = (typeof EVENT_STATUSES)[number]

function parseStatus(value: unknown): EventStatus {
  if (!EVENT_STATUSES.includes(value as EventStatus)) {
    throw badRequest(`status must be one of: ${EVENT_STATUSES.join(", ")}`)
  }
  return value as EventStatus
}

// Optional nullable string: undefined = "leave unchanged / omit", other values
// must be a string or explicit null.
function optionalNullableString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") {
    throw badRequest(`${field} must be a string or null`)
  }
  return value
}

// Every event for the authenticated owner's club, all statuses
// (draft/published/cancelled). An owner owns exactly one club. Uses the
// service-role client so draft/cancelled rows — hidden from the anon key /
// consumer surfaces — are visible to their owner.
export const listOwnerEvents = handle(async () => {
  const { userId } = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    return Response.json({ clubId: null, events: [] })
  }
  const events = fromDb(
    await supabaseAdmin
      .from("events")
      .select("*")
      .eq("club_id", club.id)
      .order("event_date", { ascending: false }),
  )
  return Response.json({ clubId: club.id, events })
})

export const getEvent = handle(
  async (_request, context: RouteContext<{ eventId: string }>) => {
    const { eventId } = await context.params
    const event = fromDb(
      await supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    )
    return Response.json({ event })
  },
)

export const createEvent = handle(
  async (request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    const form = await request.formData()
    const body: Record<string, unknown> = {
      title: form.get("title"),
      event_date: form.get("event_date"),
      status: form.get("status"),
      description: form.get("description"),
    }
    requireFields(body, ["title", "event_date", "status"])
    if (typeof body.title !== "string" || body.title.trim() === "") {
      throw badRequest("title must be a non-empty string")
    }
    if (typeof body.event_date !== "string") {
      throw badRequest("event_date must be an ISO date string")
    }
    const image = await optionalImageFile(form, "image")
    const imageUrl = image ? await uploadClubMedia(`clubs/${clubId}/events`, image) : null

    const event = fromDb(
      await supabaseAdmin
        .from("events")
        .insert({
          club_id: clubId,
          title: body.title.trim(),
          description: optionalNullableString(body.description, "description") ?? null,
          image_url: imageUrl,
          event_date: body.event_date,
          status: parseStatus(body.status),
        })
        .select("*")
        .single(),
    )
    return Response.json({ event }, { status: 201 })
  },
)

export const updateEvent = handle(
  async (request, context: RouteContext<{ clubId: string; eventId: string }>) => {
    const { clubId, eventId } = await context.params
    await requireClubOwner(clubId)
    const form = await request.formData()

    const updates: EventUpdate = { updated_at: new Date().toISOString() }
    const title = form.get("title")
    if (title !== null) {
      if (typeof title !== "string" || title.trim() === "") {
        throw badRequest("title must be a non-empty string")
      }
      updates.title = title.trim()
    }
    const eventDate = form.get("event_date")
    if (eventDate !== null) {
      if (typeof eventDate !== "string") {
        throw badRequest("event_date must be an ISO date string")
      }
      updates.event_date = eventDate
    }
    const status = form.get("status")
    if (status !== null) updates.status = parseStatus(status)
    // `form.has` (not `!== null`), because FormData can't distinguish "field
    // omitted" from "field explicitly empty" the way a JSON body's
    // undefined/null can — an empty description is stored as null.
    if (form.has("description")) {
      const description = form.get("description")
      updates.description = optionalNullableString(description === "" ? null : description, "description")
    }
    const image = await optionalImageFile(form, "image")
    if (image) updates.image_url = await uploadClubMedia(`clubs/${clubId}/events`, image)

    // Scope by club_id too, so an owner can only touch events on their own club.
    const event = fromDb(
      await supabaseAdmin
        .from("events")
        .update(updates)
        .eq("id", eventId)
        .eq("club_id", clubId)
        .select("*")
        .maybeSingle(),
    )
    return Response.json({ event })
  },
)

export const deleteEvent = handle(
  async (_request, context: RouteContext<{ clubId: string; eventId: string }>) => {
    const { clubId, eventId } = await context.params
    await requireClubOwner(clubId)
    const deleted = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("club_id", clubId)
      .select("id")
      .maybeSingle()
    if (deleted.error) {
      throw new Error(deleted.error.message)
    }
    if (!deleted.data) {
      throw notFound("Event not found")
    }
    return Response.json({ id: deleted.data.id })
  },
)
