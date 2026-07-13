import { handle, notImplemented, readJson, requireFields } from "@/lib/api/shared/errors"

export const redeemVerificationToken = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token", "full_name", "email", "password"])
  throw notImplemented("Owner verification token redemption is not implemented yet")
})
