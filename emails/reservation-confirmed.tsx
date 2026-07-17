import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export type ReservationConfirmedProps = {
  guestName: string
  clubName: string
  tableLabel: string
  reservationDate: string
  partySize: number
  qrUrl: string
}

// Formats an ISO timestamp for display. Kept inline (not a shared util) because
// the email renders server-side and needs no locale coupling to the app UI.
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function ReservationConfirmed({
  guestName,
  clubName,
  tableLabel,
  reservationDate,
  partySize,
  qrUrl,
}: ReservationConfirmedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your reservation at {clubName} is confirmed</Preview>
      <Body style={{ backgroundColor: "#0a0a0a", color: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "480px" }}>
          <Heading style={{ color: "#ffffff" }}>Reservation confirmed</Heading>
          <Text>Hi {guestName},</Text>
          <Text>
            Your table at <strong>{clubName}</strong> is confirmed. Present the QR
            code below at the door for check-in.
          </Text>
          <Section style={{ backgroundColor: "#141414", padding: "16px", borderRadius: "8px" }}>
            <Text style={{ margin: "4px 0" }}>Table: {tableLabel}</Text>
            <Text style={{ margin: "4px 0" }}>Date: {formatDateTime(reservationDate)}</Text>
            <Text style={{ margin: "4px 0" }}>Party size: {partySize}</Text>
          </Section>
          <Section style={{ textAlign: "center", padding: "24px 0" }}>
            <Img
              src={qrUrl}
              alt="Reservation QR code"
              width="256"
              height="256"
              style={{ margin: "0 auto", backgroundColor: "#ffffff", padding: "8px" }}
            />
          </Section>
          <Text style={{ color: "#a3a3a3", fontSize: "12px" }}>
            If you didn&apos;t make this reservation, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
