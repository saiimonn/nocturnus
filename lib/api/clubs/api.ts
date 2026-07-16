import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireClubOwner, requireOwner } from "@/lib/api/shared/auth"
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
import { optionalImageFile, requireImageFile, uploadClubMedia } from "@/lib/api/shared/storage"

type ClubUpdate = Database["public"]["Tables"]["clubs"]["Update"]
type FloorPlanUpdate = Database["public"]["Tables"]["floor_plans"]["Update"]
type TableUpdate = Database["public"]["Tables"]["club_tables"]["Update"]
const TABLE_CATEGORIES = ["VIP", "regular", "booth", "bar"] as const
type TableCategory = (typeof TABLE_CATEGORIES)[number]

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

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} must be a non-empty string`)
  }
  return value.trim()
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw badRequest(`${field} must be a number`)
  }
  return value
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Appends a short random suffix until the slug is free. Collisions are rare
// (few clubs, human-chosen names) so a handful of attempts is plenty.
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "club"
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabaseAdmin
      .from("clubs")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (error) {
      throw new Error(error.message)
    }
    if (!data) {
      return candidate
    }
  }
  throw new Error("Could not generate a unique slug")
}

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

// An owner owns at most one club (enforced by the `UNIQUE` constraint on
// `clubs.owner_id`). This is the step that gives that column its value: the
// owner registers their own club here, as `draft`, after redeeming their
// verification token.
export const createClub = handle(async (request) => {
  const { userId } = await requireOwner()

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle()
  if (existingError) {
    throw new Error(existingError.message)
  }
  if (existing) {
    throw conflict("You already own a club")
  }

  const body = await readJson(request)
  requireFields(body, ["name", "address"])
  if (typeof body.name !== "string" || body.name.trim() === "") {
    throw badRequest("name must be a non-empty string")
  }
  if (typeof body.address !== "string" || body.address.trim() === "") {
    throw badRequest("address must be a non-empty string")
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    throw badRequest("description must be a string or null")
  }

  const slug = await uniqueSlug(body.name)
  const club = fromDb(
    await supabaseAdmin
      .from("clubs")
      .insert({
        owner_id: userId,
        name: body.name.trim(),
        slug,
        address: body.address.trim(),
        description: (body.description as string | null | undefined) ?? null,
        status: "draft",
      })
      .select("*")
      .single(),
  )
  return Response.json({ club }, { status: 201 })
})

// The caller's own club, resolved from the session rather than a route param —
// mirrors `listOwnerEvents`'s "an owner owns exactly one club" lookup. Used by
// the owner club-details screen, which doesn't know its clubId up front.
export const getOwnerClub = handle(async () => {
  const { userId } = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return Response.json({ club: club ?? null })
})

// The owner's edit path — this is also where publishing lives: an owner flips
// their club from `draft` to `active` (making it visible to consumers) when they
// choose to showcase it. Owners may only move between `draft` and `active`;
// `inactive` is a superadmin-only enforcement state and must be rejected here.
// Accepts either JSON (text-only edits: name/address/description/status) or
// multipart form-data (when a cover image file is attached) — both are
// normalized into the same optional-field body below.
export const updateClub = handle(
  async (request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    const contentType = request.headers.get("content-type") ?? ""
    let body: Record<string, unknown>
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      body = {}
      for (const field of ["name", "address", "description", "status"] as const) {
        const value = form.get(field)
        if (value !== null) body[field] = value
      }
      const operatingHours = form.get("operating_hours")
      if (typeof operatingHours === "string" && operatingHours !== "") {
        try {
          body.operating_hours = JSON.parse(operatingHours)
        } catch {
          throw badRequest("operating_hours must be valid JSON")
        }
      }
      const coverImage = await optionalImageFile(form, "cover_image")
      if (coverImage) {
        body.cover_image_url = await uploadClubMedia(`clubs/${clubId}/cover`, coverImage)
      }
    } else {
      body = await readJson(request)
    }

    const updates: ClubUpdate = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = requireNonEmptyString(body.name, "name")
    if (body.address !== undefined) updates.address = requireNonEmptyString(body.address, "address")
    const description = optionalNullableString(body.description, "description")
    if (description !== undefined) updates.description = description
    if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url as string
    if (body.operating_hours !== undefined) {
      if (body.operating_hours !== null && !Array.isArray(body.operating_hours)) {
        throw badRequest("operating_hours must be an array or null")
      }
      updates.operating_hours = body.operating_hours as ClubUpdate["operating_hours"]
    }
    if (body.status !== undefined) {
      if (body.status !== "draft" && body.status !== "active") {
        throw badRequest("status must be one of: draft, active")
      }
      updates.status = body.status
    }

    const club = fromDb(
      await supabaseAdmin
        .from("clubs")
        .update(updates)
        .eq("id", clubId)
        .select("*")
        .maybeSingle(),
    )
    return Response.json({ club })
  },
)

export const addClubImage = handle(
  async (request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)

    const form = await request.formData()
    const file = await requireImageFile(form, "file")
    const caption = optionalNullableString(form.get("caption"), "caption") ?? null
    const imageUrl = await uploadClubMedia(`clubs/${clubId}/gallery`, file)

    const image = fromDb(
      await supabaseAdmin
        .from("club_images")
        .insert({ club_id: clubId, image_url: imageUrl, caption })
        .select("*")
        .single(),
    )
    return Response.json({ image }, { status: 201 })
  },
)

export const deleteClubImage = handle(
  async (_request, context: RouteContext<{ clubId: string; imageId: string }>) => {
    const { clubId, imageId } = await context.params
    await requireClubOwner(clubId)
    const deleted = await supabaseAdmin
      .from("club_images")
      .delete()
      .eq("id", imageId)
      .eq("club_id", clubId)
      .select("id")
      .maybeSingle()
    if (deleted.error) {
      throw new Error(deleted.error.message)
    }
    if (!deleted.data) {
      throw notFound("Image not found")
    }
    return Response.json({ id: deleted.data.id })
  },
)

// Floor plans are created lazily by the layout editor: the first save with no
// existing floor plan hits this endpoint (name defaults to "Main Floor"),
// every later background-image save hits `updateFloorPlan` instead.
export const createFloorPlan = handle(
  async (request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    const form = await request.formData()
    const name = requireNonEmptyString(form.get("name"), "name")
    const file = await requireImageFile(form, "image")
    const labelsRaw = form.get("labels")
    let labels: FloorPlanUpdate["labels"] = null
    if (typeof labelsRaw === "string" && labelsRaw !== "") {
      try {
        labels = JSON.parse(labelsRaw)
      } catch {
        throw badRequest("labels must be valid JSON")
      }
      if (labels !== null && !Array.isArray(labels)) {
        throw badRequest("labels must be an array or null")
      }
    }
    const imageUrl = await uploadClubMedia(`clubs/${clubId}/floor-plans`, file)

    const floorPlan = fromDb(
      await supabaseAdmin
        .from("floor_plans")
        .insert({
          club_id: clubId,
          name,
          image_url: imageUrl,
          labels,
        })
        .select("*")
        .single(),
    )
    return Response.json({ floorPlan }, { status: 201 })
  },
)

export const updateFloorPlan = handle(
  async (request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId, floorPlanId } = await context.params
    await requireClubOwner(clubId)
    const form = await request.formData()

    const updates: FloorPlanUpdate = { updated_at: new Date().toISOString() }
    const name = form.get("name")
    if (name !== null) updates.name = requireNonEmptyString(name, "name")
    const image = await optionalImageFile(form, "image")
    if (image) updates.image_url = await uploadClubMedia(`clubs/${clubId}/floor-plans`, image)
    const labelsRaw = form.get("labels")
    if (labelsRaw !== null) {
      if (typeof labelsRaw !== "string" || labelsRaw === "") {
        updates.labels = null
      } else {
        try {
          updates.labels = JSON.parse(labelsRaw)
        } catch {
          throw badRequest("labels must be valid JSON")
        }
        if (updates.labels !== null && !Array.isArray(updates.labels)) {
          throw badRequest("labels must be an array or null")
        }
      }
    }

    const floorPlan = fromDb(
      await supabaseAdmin
        .from("floor_plans")
        .update(updates)
        .eq("id", floorPlanId)
        .eq("club_id", clubId)
        .select("*")
        .maybeSingle(),
    )
    return Response.json({ floorPlan })
  },
)

export const deleteFloorPlan = handle(
  async (_request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId, floorPlanId } = await context.params
    await requireClubOwner(clubId)
    const deleted = await supabaseAdmin
      .from("floor_plans")
      .delete()
      .eq("id", floorPlanId)
      .eq("club_id", clubId)
      .select("id")
      .maybeSingle()
    if (deleted.error) {
      throw new Error(deleted.error.message)
    }
    if (!deleted.data) {
      throw notFound("Floor plan not found")
    }
    return Response.json({ id: deleted.data.id })
  },
)

function parseCategory(value: unknown): TableCategory | null {
  if (value === undefined || value === null) return null
  if (!TABLE_CATEGORIES.includes(value as TableCategory)) {
    throw badRequest(`category must be one of: ${TABLE_CATEGORIES.join(", ")}`)
  }
  return value as TableCategory
}

export const createTable = handle(
  async (request, context: RouteContext<{ clubId: string; floorPlanId: string }>) => {
    const { clubId, floorPlanId } = await context.params
    await requireClubOwner(clubId)
    const body = await readJson(request)
    requireFields(body, ["label", "capacity", "pos_x", "pos_y"])

    const table = fromDb(
      await supabaseAdmin
        .from("club_tables")
        .insert({
          floor_plan_id: floorPlanId,
          club_id: clubId,
          label: requireNonEmptyString(body.label, "label"),
          capacity: requireNumber(body.capacity, "capacity"),
          minimum_spend: (body.minimum_spend as number | null | undefined) ?? null,
          category: parseCategory(body.category),
          pos_x: requireNumber(body.pos_x, "pos_x"),
          pos_y: requireNumber(body.pos_y, "pos_y"),
          is_available: (body.is_available as boolean | undefined) ?? true,
        })
        .select("*")
        .single(),
    )
    return Response.json({ table }, { status: 201 })
  },
)

export const updateTable = handle(
  async (
    request,
    context: RouteContext<{ clubId: string; floorPlanId: string; tableId: string }>,
  ) => {
    const { clubId, floorPlanId, tableId } = await context.params
    await requireClubOwner(clubId)
    const body = await readJson(request)

    const updates: TableUpdate = { updated_at: new Date().toISOString() }
    if (body.label !== undefined) updates.label = requireNonEmptyString(body.label, "label")
    if (body.capacity !== undefined) updates.capacity = requireNumber(body.capacity, "capacity")
    if (body.minimum_spend !== undefined) {
      updates.minimum_spend = body.minimum_spend as number | null
    }
    if (body.category !== undefined) updates.category = parseCategory(body.category)
    if (body.pos_x !== undefined) updates.pos_x = requireNumber(body.pos_x, "pos_x")
    if (body.pos_y !== undefined) updates.pos_y = requireNumber(body.pos_y, "pos_y")
    if (body.is_available !== undefined) {
      if (typeof body.is_available !== "boolean") {
        throw badRequest("is_available must be a boolean")
      }
      updates.is_available = body.is_available
    }

    const table = fromDb(
      await supabaseAdmin
        .from("club_tables")
        .update(updates)
        .eq("id", tableId)
        .eq("club_id", clubId)
        .eq("floor_plan_id", floorPlanId)
        .select("*")
        .maybeSingle(),
    )
    return Response.json({ table })
  },
)

export const deleteTable = handle(
  async (
    _request,
    context: RouteContext<{ clubId: string; floorPlanId: string; tableId: string }>,
  ) => {
    const { clubId, floorPlanId, tableId } = await context.params
    await requireClubOwner(clubId)
    const deleted = await supabaseAdmin
      .from("club_tables")
      .delete()
      .eq("id", tableId)
      .eq("club_id", clubId)
      .eq("floor_plan_id", floorPlanId)
      .select("id")
      .maybeSingle()
    if (deleted.error) {
      throw new Error(deleted.error.message)
    }
    if (!deleted.data) {
      throw notFound("Table not found")
    }
    return Response.json({ id: deleted.data.id })
  },
)
