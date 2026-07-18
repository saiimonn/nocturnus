import { SignJWT, jwtVerify } from "jose"

/**
 * Session contract. This module is the single owner of the cookie + JWT
 * details: the login/logout handlers, the server-side guards, and the
 * edge/Node `proxy.ts` all go through here rather than touching JWTs
 * directly. Sessions are no longer owner-only — a session may belong to an
 * owner or a club employee; callers that need to restrict access to one role
 * must assert `session.role` themselves (see `lib/api/shared/auth.ts`).
 */

export const SESSION_COOKIE = "otus_session"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type SessionRole = "owner" | "club_employee"

export interface Session {
  userId: string
  role: SessionRole
}

const SESSION_ROLES: SessionRole[] = ["owner", "club_employee"]

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(payload: Session): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) {
    return null
  }
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (
      typeof payload.sub !== "string" ||
      !SESSION_ROLES.includes(payload.role as SessionRole)
    ) {
      return null
    }
    return { userId: payload.sub, role: payload.role as SessionRole }
  } catch {
    return null
  }
}
