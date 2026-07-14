import { SignJWT, jwtVerify } from "jose"

/**
 * Owner session contract. This module is the single owner of the cookie + JWT
 * details: the login/logout handlers, the server-side guard, and the edge/Node
 * `proxy.ts` all go through here rather than touching JWTs directly.
 */

export const SESSION_COOKIE = "otus_session"

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface OwnerSession {
  userId: string
  role: "owner"
}

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

export async function createSession(payload: OwnerSession): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(
  token: string | undefined,
): Promise<OwnerSession | null> {
  if (!token) {
    return null
  }
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (typeof payload.sub !== "string" || payload.role !== "owner") {
      return null
    }
    return { userId: payload.sub, role: "owner" }
  } catch {
    return null
  }
}
