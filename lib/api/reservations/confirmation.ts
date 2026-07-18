import { supabaseAdmin } from "@/lib/supabase-admin"
import { uploadClubMediaBytes } from "@/lib/api/shared/storage"
import { generateQrPng } from "@/lib/qr"
import { sendEmail } from "@/lib/email/client"
import ReservationConfirmed from "@/emails/reservation-confirmed"
import type { Database } from "@/lib/db"

type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"]

// Best-effort: generates the QR for a just-confirmed reservation, uploads it to
// the club-media bucket, and emails the guest their booking details + QR.
// Throws on any failure; the caller (updateReservation) catches and logs so the
// confirm itself never fails.
export async function sendReservationConfirmation(
  reservation: ReservationRow,
): Promise<void> {
  if (!reservation.qr_code_token) {
    throw new Error(`Reservation ${reservation.id} has no qr_code_token to encode`)
  }

  // generateQrPng (lib/qr.ts) throws if NEXT_PUBLIC_APP_URL is unset, and this
  // whole function is wrapped in a swallowed try/catch by the caller
  // (updateReservation) so a confirm never fails because of email. That means
  // an unset var otherwise fails completely silently to the guest, with only
  // a generic log line for the operator to go on. Fail loudly and specifically
  // here so `console.error` in the caller names the actual cause.
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is not set — cannot build the QR check-in link, so the guest " +
        "confirmation email was NOT sent. NEXT_PUBLIC_APP_URL is inlined at BUILD time; " +
        "setting it only at runtime after the app is already built will not fix this — " +
        "it must be present when `npm run build` runs, then the app rebuilt/redeployed.",
    )
  }

  const { data: club, error: clubError } = await supabaseAdmin
    .from("clubs")
    .select("name")
    .eq("id", reservation.club_id)
    .maybeSingle()
  if (clubError) throw new Error(clubError.message)

  const { data: table, error: tableError } = await supabaseAdmin
    .from("club_tables")
    .select("label")
    .eq("id", reservation.table_id)
    .maybeSingle()
  if (tableError) throw new Error(tableError.message)

  const png = await generateQrPng(reservation.qr_code_token)
  const qrUrl = await uploadClubMediaBytes(
    `reservations/${reservation.id}`,
    png,
    "image/png",
    "png",
  )

  await sendEmail({
    to: reservation.guest_email,
    subject: `Your reservation at ${club?.name ?? "the club"} is confirmed`,
    react: ReservationConfirmed({
      guestName: reservation.guest_name,
      clubName: club?.name ?? "the club",
      tableLabel: table?.label ?? "your table",
      reservationDate: reservation.reservation_date,
      partySize: reservation.party_size,
      qrUrl,
    }),
  })
}
