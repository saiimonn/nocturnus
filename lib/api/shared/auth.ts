import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { forbidden, notFound, unauthorized } from "./errors"
import {
  SESSION_COOKIE,
  verifySession,
  type OwnerSession,
} from "@/lib/api/auth/session"

export type { OwnerSession }

export async function requireOwner(): Promise<OwnerSession> {
  const cookieStore = await cookies()
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) {
    throw unauthorized("Authentication required")
  }
  return session
}

export async function requireClubOwner(clubId: string): Promise<OwnerSession> {
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
