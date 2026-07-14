import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  forbidden,
  handle,
  notImplemented,
  readJson,
  requireFields,
  unauthorized,
} from "@/lib/api/shared/errors"
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/api/auth/session"

// Precomputed bcrypt hash of a random string. Compared against when no user is
// found so the response timing does not reveal whether the email exists.
const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8DvXHr8pqzXY8oB0h7Xz1J8b4y0zK"

export const login = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["email", "password"])
  const email = String(body.email).trim().toLowerCase()
  const password = String(body.password)

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email, role, status, password_hash")
    .eq("email", email)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }

  // Always run a compare to keep timing uniform for missing users.
  const passwordOk = await bcrypt.compare(
    password,
    user?.password_hash ?? DUMMY_HASH,
  )

  // Generic 401 for missing user, wrong password, or non-owner role — never
  // disclose which one failed.
  if (!user || !passwordOk || user.role !== "owner") {
    throw unauthorized("Invalid email or password")
  }

  if (user.status === "suspended") {
    throw forbidden("Account suspended")
  }

  const token = await createSession({ userId: user.id, role: "owner" })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)

  return Response.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
  })
})

export const logout = handle(async () => {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 })
  return Response.json({ ok: true })
})

export const redeemVerificationToken = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token", "full_name", "email", "password"])
  throw notImplemented("Owner verification token redemption is not implemented yet")
})
