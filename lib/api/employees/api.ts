import { createHash, randomBytes } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireOwner } from "@/lib/api/shared/auth"
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
import { sendEmail } from "@/lib/email/client"
import EmployeeInviteEmail from "@/emails/employee-invite"

const INVITE_TTL_DAYS = 7
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}

function appUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set")
  }
  return base.replace(/\/$/, "")
}

/**
 * Resolves the calling owner's single club. An owner owns exactly one club
 * (UNIQUE on clubs.owner_id), so `.maybeSingle()` cannot match multiple rows.
 */
async function requireOwnClub(): Promise<{ ownerId: string; clubId: string; clubName: string; ownerName: string }> {
  const session = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("id, name")
    .eq("owner_id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    throw notFound("You have not registered a club yet")
  }
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("users")
    .select("full_name")
    .eq("id", session.userId)
    .maybeSingle()
  if (ownerError) {
    throw new Error(ownerError.message)
  }
  return {
    ownerId: session.userId,
    clubId: club.id,
    clubName: club.name,
    ownerName: owner?.full_name ?? "Your club owner",
  }
}

export const listEmployees = handle(async () => {
  const { clubId } = await requireOwnClub()

  // Never select password_hash.
  const employees = fromDb(
    await supabaseAdmin
      .from("users")
      .select("id, full_name, email, contact_number, status, created_at")
      .eq("club_id", clubId)
      .eq("role", "club_employee")
      .order("created_at", { ascending: false }),
  )

  // Never select token_hash. Only live invites are of interest.
  const invites = fromDb(
    await supabaseAdmin
      .from("club_employee_invites")
      .select("id, email, expires_at, created_at")
      .eq("club_id", clubId)
      .eq("used", false)
      .eq("revoked", false)
      .order("created_at", { ascending: false }),
  )

  return Response.json({ clubId, employees, invites })
})

export const inviteEmployee = handle(async (request) => {
  const { clubId, clubName, ownerId, ownerName } = await requireOwnClub()
  const body = await readJson(request)
  requireFields(body, ["email"])

  const email = String(body.email).trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw badRequest("Enter a valid email address")
  }

  const { data: existingUser, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, club_id, role")
    .eq("email", email)
    .maybeSingle()
  if (userError) {
    throw new Error(userError.message)
  }
  if (existingUser) {
    throw conflict(
      existingUser.club_id === clubId && existingUser.role === "club_employee"
        ? "This person is already an employee at your club"
        : "An account with this email already exists",
    )
  }

  const { data: liveInvite, error: liveInviteError } = await supabaseAdmin
    .from("club_employee_invites")
    .select("id")
    .eq("club_id", clubId)
    .eq("email", email)
    .eq("used", false)
    .eq("revoked", false)
    .maybeSingle()
  if (liveInviteError) {
    throw new Error(liveInviteError.message)
  }
  if (liveInvite) {
    throw conflict("An invite is already pending for this email")
  }

  const plaintext = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const invite = fromDb(
    await supabaseAdmin
      .from("club_employee_invites")
      .insert({
        club_id: clubId,
        email,
        token_hash: hashToken(plaintext),
        expires_at: expiresAt.toISOString(),
        invited_by: ownerId,
      })
      .select("id, email, expires_at, created_at")
      // Explicit type param works around a TS inference bug where chaining
      // insert().select(cols).single() through fromDb's generic can collapse
      // to `never` for this table once the file has multiple such calls.
      .single<{ id: string; email: string; expires_at: string; created_at: string }>(),
  )

  const registerUrl = `${appUrl()}/auth/employee/register?token=${plaintext}`

  // Unlike the reservation confirmation — which is deliberately best-effort —
  // a failed invite send must fail the request: a silently-unsent invite looks
  // identical to a delivered one, and the plaintext token is unrecoverable
  // after this handler returns. The row has to be inserted before the send
  // (the token must be persisted to be redeemable), so on failure we delete it
  // again; otherwise the partial unique index would block the owner from
  // retrying the same address.
  let sent = false
  try {
    sent = await sendEmail({
      to: email,
      subject: `You're invited to join ${clubName} on Otus`,
      react: EmployeeInviteEmail({
        clubName,
        inviterName: ownerName,
        registerUrl,
        expiresAt: expiresAt.toDateString(),
      }),
    })
  } catch (e) {
    const { error: cleanupError } = await supabaseAdmin
      .from("club_employee_invites")
      .delete()
      .eq("id", invite.id)
    if (cleanupError) {
      // Log only — the send error is what the owner needs to see. The stale
      // invite can still be cleared with Revoke.
      console.error("[invite] failed to roll back invite row:", cleanupError.message)
    }
    throw new Error(
      `Could not send the invite email: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (!sent) {
    // RESEND_API_KEY is unset (dev). The invite is valid, so keep the row and
    // surface the link on the server console so the flow stays testable.
    console.warn(`[invite] email skipped — registration link: ${registerUrl}`)
  }

  return Response.json({ invite }, { status: 201 })
})

export const revokeInvite = handle<RouteContext<{ inviteId: string }>>(
  async (_request, context) => {
    const { clubId } = await requireOwnClub()
    const { inviteId } = await context.params

    const revoked = fromDb(
      await supabaseAdmin
        .from("club_employee_invites")
        .update({ revoked: true })
        .eq("id", inviteId)
        .eq("club_id", clubId)
        .select("id")
        .maybeSingle<{ id: string }>(),
    )

    return Response.json({ ok: true, id: revoked.id })
  },
)

export const updateEmployee = handle<RouteContext<{ employeeId: string }>>(
  async (request, context) => {
    const { clubId } = await requireOwnClub()
    const { employeeId } = await context.params
    const body = await readJson(request)
    requireFields(body, ["status"])

    const status = String(body.status)
    if (status !== "active" && status !== "suspended") {
      throw badRequest("status must be one of: active, suspended")
    }

    // Scoping by club_id AND role means an owner can never touch another
    // club's staff, nor their own user row, through this endpoint.
    const employee = fromDb(
      await supabaseAdmin
        .from("users")
        .update({ status })
        .eq("id", employeeId)
        .eq("club_id", clubId)
        .eq("role", "club_employee")
        .select("id, full_name, email, status")
        .maybeSingle(),
    )

    return Response.json({ employee })
  },
)
