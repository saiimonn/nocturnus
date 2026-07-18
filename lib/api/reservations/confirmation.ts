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
