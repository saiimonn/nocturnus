import QRCode from "qrcode"

// Encodes a reservation's qr_code_token as a PNG QR code containing the full
// check-in URL, not the bare token. A phone's native camera app only offers a
// tap-through when the payload is a URL, which is what lets door staff scan
// with the camera they already have.
//
// This is safe only because /scan/[token] requires a club_employee session.
// The QR lives in the guest's own inbox, so an unguarded link would let guests
// check themselves in from home. Do not weaken that guard.
export async function generateQrPng(token: string): Promise<Buffer> {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set")
  }
  const url = `${base.replace(/\/$/, "")}/scan/${encodeURIComponent(token)}`
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  })
}
