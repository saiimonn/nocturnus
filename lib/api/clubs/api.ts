import { supabase } from "@/lib/supabase"
import { requireClubOwner, requireOwner } from "@/lib/api/shared/auth"
import {
  fromDb,
  handle,
  notFound,
  notImplemented,
  type RouteContext,
} from "@/lib/api/shared/errors"

async function clubIdFromSlug(slug: string): Promise<string> {
  const { data: club, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    throw notFound("Club not found")
  }
  return club.id
}

export const listClubs = handle(async () => {
  const clubs = fromDb(
    await supabase
      .from("clubs")
      .select("id, name, slug, description, address, cover_image_url, operating_hours")
      .eq("status", "active")
      .order("name"),
  )
  return Response.json({ clubs })
})

export const getClub = handle(async (_request, context: RouteContext<{ slug: string }>) => {
  const { slug } = await context.params
  const club = fromDb(
    await supabase
      .from("clubs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle(),
  )
  return Response.json({ club })
})

export const getClubImages = handle(
  async (_request, context: RouteContext<{ slug: string }>) => {
    const { slug } = await context.params
    const clubId = await clubIdFromSlug(slug)
    const images = fromDb(
      await supabase
        .from("club_images")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at"),
    )
    return Response.json({ images })
  },
)

export const getClubFloorPlans = handle(
  async (_request, context: RouteContext<{ slug: string }>) => {
    const { slug } = await context.params
    const clubId = await clubIdFromSlug(slug)
    const floorPlans = fromDb(
      await supabase
        .from("floor_plans")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at"),
    )
    return Response.json({ floorPlans })
  },
)

export const getFloorPlanTables = handle(
  async (_request, context: RouteContext<{ slug: string; floorPlanId: string }>) => {
    const { slug, floorPlanId } = await context.params
    const clubId = await clubIdFromSlug(slug)
    const tables = fromDb(
      await supabase
        .from("club_tables")
        .select("*")
        .eq("club_id", clubId)
        .eq("floor_plan_id", floorPlanId)
        .order("label"),
    )
    return Response.json({ tables })
  },
)

export const getClubEvents = handle(
  async (_request, context: RouteContext<{ slug: string }>) => {
    const { slug } = await context.params
    const clubId = await clubIdFromSlug(slug)
    const events = fromDb(
      await supabase
        .from("events")
        .select("*")
        .eq("club_id", clubId)
        .eq("status", "published")
        .order("event_date"),
    )
    return Response.json({ events })
  },
)

export const createClub = handle(async () => {
  await requireOwner()
  throw notImplemented("Creating a club is not implemented yet")
})

// The owner's edit path — this is also where publishing lives: an owner flips
// their club from `draft` to `active` (making it visible to consumers) when they
// choose to showcase it. Owners may only move between `draft` and `active`;
// `inactive` is a superadmin-only enforcement state and must be rejected here.
export const updateClub = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Updating a club is not implemented yet")
  },
)

export const addClubImage = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Adding a club image is not implemented yet")
  },
)

export const deleteClubImage = handle(
  async (_request, context: RouteContext<{ clubId: string; imageId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Deleting a club image is not implemented yet")
  },
)

export const createFloorPlan = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Creating a floor plan is not implemented yet")
  },
)

export const updateFloorPlan = handle(
  async (_request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Updating a floor plan is not implemented yet")
  },
)

export const deleteFloorPlan = handle(
  async (_request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Deleting a floor plan is not implemented yet")
  },
)

export const createTable = handle(
  async (_request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Creating a table is not implemented yet")
  },
)

export const updateTable = handle(
  async (
    _request,
    context: RouteContext<{ clubId: string; floorPlanId: string; tableId: string }>,
  ) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Updating a table is not implemented yet")
  },
)

export const deleteTable = handle(
  async (
    _request,
    context: RouteContext<{ clubId: string; floorPlanId: string; tableId: string }>,
  ) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Deleting a table is not implemented yet")
  },
)
