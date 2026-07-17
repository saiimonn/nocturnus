import type { ReactElement } from "react"
import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Otus <onboarding@resend.dev>"

// Lazily construct the client so a missing key degrades to a no-op send rather
// than throwing at import time.
const resend = apiKey ? new Resend(apiKey) : null

// Sends a transactional email rendered from a React Email element. If
// RESEND_API_KEY is unset (e.g. a dev without email configured), it warns and
// no-ops so the caller's flow still succeeds — callers treat email as
// best-effort regardless.
export async function sendReservationEmail(args: {
  to: string
  subject: string
  react: ReactElement
}): Promise<void> {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY is unset — skipping send to",
      args.to,
      `(subject: ${args.subject})`,
    )
    return
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    react: args.react,
  })
  if (error) {
    throw new Error(error.message)
  }
}
