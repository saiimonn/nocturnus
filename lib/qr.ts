import QRCode from "qrcode"

// Encodes the raw string (a reservation's qr_code_token) as a PNG QR code.
// The door scanner reads this token back and posts it to
// POST /api/reservations/checkin, which looks the reservation up by it.
export async function generateQrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  })
}
