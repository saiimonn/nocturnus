import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface EmployeeInviteEmailProps {
  clubName: string
  inviterName: string
  registerUrl: string
  expiresAt: string
}

const main = { backgroundColor: "#0a0a0a", fontFamily: "sans-serif" }
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "480px" }
const panel = { backgroundColor: "#141414", padding: "32px 24px" }
const heading = { color: "#ffffff", fontSize: "22px", margin: "0 0 16px" }
const text = { color: "#a1a1a1", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" }
const button = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
}
const fine = { color: "#6b6b6b", fontSize: "12px", lineHeight: "18px", margin: "16px 0 0" }

export default function EmployeeInviteEmail({
  clubName,
  inviterName,
  registerUrl,
  expiresAt,
}: EmployeeInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`You've been invited to join ${clubName} on Otus`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={panel}>
            <Heading style={heading}>Join {clubName} on Otus</Heading>
            <Text style={text}>
              {inviterName} invited you to work the door at {clubName}. Set up
              your account to start checking guests in.
            </Text>
            <Section style={{ margin: "24px 0" }}>
              <Link href={registerUrl} style={button}>
                Set up your account
              </Link>
            </Section>
            <Text style={fine}>
              This invitation is for your email address only and can be used
              once. It expires on {expiresAt}.
            </Text>
            <Text style={fine}>
              If you weren&apos;t expecting this, you can ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
