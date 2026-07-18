import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { forbidden, notFound, unauthorized } from "./errors"
import {
  SESSION_COOKIE,
  verifySession,
  type Session,
} from "@/lib/api/auth/session"

export type { Session }

async function readSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}

/**
 * Owner guard. The role assertion here is load-bearing: `verifySession` now
 * admits club employees too, so without this check every owner endpoint would
 * be employee-accessible. Do not remove it.
 */
export async function requireOwner(): Promise<Session> {
  const session = await readSession()
  if (!session) {
    throw unauthorized("Authentication required")
  }
  if (session.role !== "owner") {
    throw forbidden("Owner access required")
  }
  return session
}

export interface EmployeeSession {
  userId: string
  role: "club_employee"
  clubId: string
}

/**
 * Employee guard. Resolves the caller's club from `users.club_id` so callers
 * can scope every operation to that one venue.
 */
export async function requireEmployee(): Promise<EmployeeSession> {
  const session = await readSession()
  if (!session) {
    throw unauthorized("Authentication required")
  }
  if (session.role !== "club_employee") {
    throw forbidden("Employee access required")
  }
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, club_id, status")
    .eq("id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!user) {
    throw unauthorized("Authentication required")
  }
  if (user.status === "suspended") {
    throw forbidden("Account suspended")
  }
  if (!user.club_id) {
    throw forbidden("Employee is not assigned to a club")
  }
  return { userId: user.id, role: "club_employee", clubId: user.club_id }
}

export interface OwnerProfile {
  id: string
  full_name: string
  email: string
}

/**
 * Resolves the session cookie to the owner's display profile, or `null` when
 * there is no valid session, the caller is not an owner, or the user no longer
 * exists. Unlike `requireOwner` this never throws, so server components (which
 * have no `handle()` wrapper to serialize an `ApiError`) can render a
 * signed-out state instead of crashing.
 */
export async function getOwnerProfile(): Promise<OwnerProfile | null> {
  const session = await readSession()
  if (!session || session.role !== "owner") {
    return null
  }
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email")
    .eq("id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return user ?? null
}

export async function requireClubOwner(clubId: string): Promise<Session> {
  const session = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    throw notFound("Club not found")
  }
  if (club.owner_id !== session.userId) {
    throw forbidden("You do not own this club")
  }
  return session
}
