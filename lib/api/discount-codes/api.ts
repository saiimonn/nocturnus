import { supabase } from "@/lib/supabase"
import { requireClubOwner } from "@/lib/api/shared/auth"
import {
  badRequest,
  handle,
  notFound,
  notImplemented,
  readJson,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"

export const validateDiscountCode = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["club_id", "code", "subtotal"])

  const subtotal = Number(body.subtotal)
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw badRequest("subtotal must be a non-negative number")
  }

  const { data: code, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("club_id", String(body.club_id))
    .eq("code", String(body.code))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!code) {
    throw notFound("Discount code not found for this club")
  }

  const now = new Date()
  const invalid =
    (!code.is_active && "This code is not active") ||
    (now < new Date(code.start_date) && "This code is not active yet") ||
    (now > new Date(code.end_date) && "This code has expired") ||
    (code.times_used >= code.usage_limit && "This code has reached its usage limit") ||
    (subtotal < code.min_order_value &&
      `A minimum order of ${code.min_order_value} is required`)

  if (invalid) {
    return Response.json({ valid: false, reason: invalid })
  }

  const rawDiscount =
    code.discount_type === "percentage"
      ? (subtotal * code.discount_value) / 100
      : code.discount_value
  const discountAmount = Math.round(Math.min(rawDiscount, subtotal) * 100) / 100

  return Response.json({
    valid: true,
    code: code.code,
    discount_type: code.discount_type,
    discount_value: code.discount_value,
    discount_amount: discountAmount,
  })
})

export const createDiscountCode = handle(
  async (_request, context: RouteContext<{ clubId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Creating a discount code is not implemented yet")
  },
)

export const updateDiscountCode = handle(
  async (_request, context: RouteContext<{ clubId: string; codeId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Updating a discount code is not implemented yet")
  },
)

export const deleteDiscountCode = handle(
  async (_request, context: RouteContext<{ clubId: string; codeId: string }>) => {
    const { clubId } = await context.params
    await requireClubOwner(clubId)
    throw notImplemented("Deleting a discount code is not implemented yet")
  },
)
