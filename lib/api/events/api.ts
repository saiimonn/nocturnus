import { supabase } from "@/lib/supabase"
import { requireClubOwner } from "@/lib/api/shared/auth"
import { fromDb, handle, notImplemented, type RouteContext } from "@/lib/api/shared/errors"

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
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Creating an event is not implemented yet")
  },
)

export const updateEvent = handle(
  async (_request, context: RouteContext<{ clubId: string; eventId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Updating an event is not implemented yet")
  },
)

export const deleteEvent = handle(
  async (_request, context: RouteContext<{ clubId: string; eventId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Deleting an event is not implemented yet")
  },
)
