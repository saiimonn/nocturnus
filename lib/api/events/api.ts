import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireClubOwner, requireOwner } from "@/lib/api/shared/auth"
import {
  badRequest,
  fromDb,
  handle,
  notFound,
  readJson,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"
import type { Database } from "@/lib/db"

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
    const body = await readJson(request)
    requireFields(body, ["title", "event_date", "status"])
    if (typeof body.title !== "string" || body.title.trim() === "") {
      throw badRequest("title must be a non-empty string")
    }
    if (typeof body.event_date !== "string") {
      throw badRequest("event_date must be an ISO date string")
    }
    const event = fromDb(
      await supabaseAdmin
        .from("events")
        .insert({
          club_id: clubId,
          title: body.title.trim(),
          description: optionalNullableString(body.description, "description") ?? null,
          image_url: optionalNullableString(body.image_url, "image_url") ?? null,
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
    const body = await readJson(request)

    const updates: EventUpdate = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim() === "") {
        throw badRequest("title must be a non-empty string")
      }
      updates.title = body.title.trim()
    }
    if (body.event_date !== undefined) {
      if (typeof body.event_date !== "string") {
        throw badRequest("event_date must be an ISO date string")
      }
      updates.event_date = body.event_date
    }
    if (body.status !== undefined) updates.status = parseStatus(body.status)
    const description = optionalNullableString(body.description, "description")
    if (description !== undefined) updates.description = description
    const imageUrl = optionalNullableString(body.image_url, "image_url")
    if (imageUrl !== undefined) updates.image_url = imageUrl

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
