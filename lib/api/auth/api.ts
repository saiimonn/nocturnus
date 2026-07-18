import { cookies } from "next/headers"
import { createHash } from "node:crypto"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  badRequest,
  conflict,
  forbidden,
  fromDb,
  handle,
  readJson,
  requireFields,
  unauthorized,
} from "@/lib/api/shared/errors"
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/api/auth/session"
import type { Database } from "@/lib/db"

type NewUserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "full_name" | "email" | "role"
>

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

  // Generic 401 for missing user, wrong password, or a role that cannot log in
  // (admin) — never disclose which one failed.
  const loginableRole = user?.role === "owner" || user?.role === "club_employee"
  if (!user || !passwordOk || !loginableRole) {
    throw unauthorized("Invalid email or password")
  }

  if (user.status === "suspended") {
    throw forbidden("Account suspended")
  }

  const token = await createSession({
    userId: user.id,
    role: user.role as "owner" | "club_employee",
  })
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

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}

export const checkVerificationToken = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token"])
  const tokenHash = hashToken(String(body.token))

  const { data: record, error } = await supabaseAdmin
    .from("owner_verification_tokens")
    .select("used, revoked, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }

  if (
    !record ||
    record.used ||
    record.revoked ||
    new Date(record.expires_at) <= new Date()
  ) {
    throw unauthorized("Invalid or expired token")
  }

  return Response.json({ valid: true })
})

export const redeemVerificationToken = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token", "full_name", "email", "password"])

  if (typeof body.full_name !== "string" || body.full_name.trim() === "") {
    throw badRequest("full_name must be a non-empty string")
  }
  if (typeof body.email !== "string" || body.email.trim() === "") {
    throw badRequest("email must be a non-empty string")
  }

  const password = String(body.password)
  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters")
  }

  const email = body.email.trim().toLowerCase()
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()
  if (existingUserError) {
    throw new Error(existingUserError.message)
  }
  if (existingUser) {
    throw conflict("An account with this email already exists")
  }

  const tokenHash = hashToken(String(body.token))
  const nowIso = new Date().toISOString()
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("owner_verification_tokens")
    .update({ used: true })
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .eq("revoked", false)
    .gt("expires_at", nowIso)
    .select("id")
    .maybeSingle()
  if (claimError) {
    throw new Error(claimError.message)
  }
  if (!claimed) {
    throw unauthorized("Invalid or already-used token")
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = fromDb<NewUserRow>(
    await supabaseAdmin
      .from("users")
      .insert({
        full_name: String(body.full_name).trim(),
        email,
        contact_number:
          (body.contact_number as string | undefined)?.trim() || null,
        password_hash: passwordHash,
        role: "owner",
        status: "active",
      })
      .select("id, full_name, email, role")
      .single(),
  )

  const token = await createSession({ userId: user.id, role: "owner" })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)

  return Response.json({ user }, { status: 201 })
})
