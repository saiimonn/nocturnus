# Reservation Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an owner confirms a reservation, best-effort send the guest a confirmation email containing their booking details and a QR code (encoding the raw `qr_code_token`) to present at the door.

**Architecture:** The confirm transition already lives in `updateReservation` (`lib/api/reservations/api.ts`), which auto-generates a `qr_code_token` when status becomes `confirmed`. We hang a standalone `sendReservationConfirmation(reservation)` service off that transition, guarded so it only fires on the actual pending→confirmed change and wrapped in try/catch so any email failure logs but never fails the confirm. The service generates a QR PNG, uploads it to the existing public `club-media` Supabase Storage bucket, renders a React Email template, and sends via Resend.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (service-role client + Storage), Resend, React Email (`@react-email/components`), `qrcode`.

## Global Constraints

- **No test framework exists in this repo.** The only full typecheck is `npm run build` (tsconfig is `noEmit`). Every task's verification uses `npm run build` plus a targeted manual check — there are no unit tests to write.
- **Next.js 16 App Router.** Route `params` is a `Promise`. Do not change route conventions.
- **Service-role client (`supabaseAdmin`) is server-side only.** Never import it into a client component. The email/QR/storage code all runs inside the route handler (server), which is fine.
- **Path alias `@/*` maps to the repo root.**
- **Storage bucket is `club-media`** (public read, 8MB limit, image MIME allowlist including `image/png`). All writes go through the service-role client.
- **Best-effort email:** a QR/upload/send failure must be caught and logged (`console.error`), and the confirm must still return `200`. The reservation status change is the source of truth.
- **QR encodes the raw `qr_code_token` string** — not a URL.
- **No schema change.** The QR public URL is not persisted on the reservation row.
- **`AGENTS.md` must be updated in this same change** (repo rule).
- **Commit messages** end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

- **Create** `lib/email/client.ts` — Resend client singleton, `EMAIL_FROM`, and a `sendReservationEmail` wrapper that no-ops with a warning when `RESEND_API_KEY` is unset.
- **Create** `lib/qr.ts` — `generateQrPng(token)` returning a PNG `Buffer`.
- **Create** `emails/reservation-confirmed.tsx` — the React Email template component.
- **Create** `lib/api/reservations/confirmation.ts` — `sendReservationConfirmation(reservation)` orchestrator.
- **Modify** `lib/api/shared/storage.ts` — add `uploadClubMediaBytes(...)`; refactor `uploadClubMedia` to delegate to it.
- **Modify** `lib/api/reservations/api.ts` — fire the confirmation send on the pending→confirmed transition.
- **Modify** `AGENTS.md` — document deps, env vars, storage path, and the confirm-sends-email behavior.
- **Modify** `.env.local` — add `RESEND_API_KEY` and `EMAIL_FROM` (developer does this by hand; the plan documents the exact keys).

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Consumes: nothing.
- Produces: the `resend`, `@react-email/components`, and `qrcode` modules available to later tasks.

- [ ] **Step 1: Install the runtime and dev dependencies**

Run:
```bash
npm install resend @react-email/components qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: build completes with no new type errors (the new packages are installed but not yet imported).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add resend, react-email, and qrcode deps

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Bytes-based Storage upload helper

**Files:**
- Modify: `lib/api/shared/storage.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (already imported in the file).
- Produces: `uploadClubMediaBytes(pathPrefix: string, bytes: Buffer | Uint8Array, contentType: string, extension: string): Promise<string>` — uploads to the `club-media` bucket under `${pathPrefix}/${uuid}.${extension}` and returns the public URL. The existing `uploadClubMedia(pathPrefix: string, file: File): Promise<string>` keeps its signature and behavior.

- [ ] **Step 1: Add `uploadClubMediaBytes` and refactor `uploadClubMedia` to delegate**

Replace the `uploadClubMedia` function (lines 42–59) with:

```ts
// Uploads raw bytes under `${pathPrefix}/${uuid}.${extension}` and returns the
// bucket's public URL. Used for server-generated media (e.g. a reservation QR
// PNG) that never arrives as a multipart File.
export async function uploadClubMediaBytes(
  pathPrefix: string,
  bytes: Buffer | Uint8Array,
  contentType: string,
  extension: string,
): Promise<string> {
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabaseAdmin.storage
    .from(CLUB_MEDIA_BUCKET)
    .upload(path, bytes, { contentType })
  if (error) {
    throw new Error(error.message)
  }
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(CLUB_MEDIA_BUCKET).getPublicUrl(path)
  return publicUrl
}

// Uploads under `${pathPrefix}/${uuid}.<ext>` and returns the bucket's public
// URL. Callers pass a prefix that scopes the file to its owning record (e.g.
// `clubs/{clubId}/gallery`) — the random suffix just avoids collisions within
// that prefix, it isn't itself a meaningful identifier.
export async function uploadClubMedia(pathPrefix: string, file: File): Promise<string> {
  const extension = file.name.includes(".") ? file.name.split(".").pop()! : "bin"
  const bytes = new Uint8Array(await file.arrayBuffer())
  return uploadClubMediaBytes(pathPrefix, bytes, file.type, extension)
}
```

- [ ] **Step 2: Verify the build passes and existing callers are unaffected**

Run: `npm run build`
Expected: build completes with no type errors. `uploadClubMedia`'s public signature is unchanged, so `addClubImage`, `updateClub`, `createFloorPlan`/`updateFloorPlan`, and `createEvent`/`updateEvent` still compile.

- [ ] **Step 3: Commit**

```bash
git add lib/api/shared/storage.ts
git commit -m "feat(storage): add uploadClubMediaBytes for server-generated media

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: QR PNG generation

**Files:**
- Create: `lib/qr.ts`

**Interfaces:**
- Consumes: the `qrcode` package.
- Produces: `generateQrPng(token: string): Promise<Buffer>` — a PNG buffer of a QR encoding the raw token.

- [ ] **Step 1: Create `lib/qr.ts`**

```ts
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors (`@types/qrcode` provides the `toBuffer` types).

- [ ] **Step 3: Commit**

```bash
git add lib/qr.ts
git commit -m "feat(qr): add generateQrPng helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Resend email client

**Files:**
- Create: `lib/email/client.ts`

**Interfaces:**
- Consumes: the `resend` package, `process.env.RESEND_API_KEY`, `process.env.EMAIL_FROM`.
- Produces: `sendReservationEmail(args: { to: string; subject: string; react: ReactElement }): Promise<void>` — sends via Resend, or logs a warning and returns without sending when `RESEND_API_KEY` is unset.

- [ ] **Step 1: Create `lib/email/client.ts`**

```ts
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/email/client.ts
git commit -m "feat(email): add Resend client with no-op-without-key fallback

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Reservation confirmation email template

**Files:**
- Create: `emails/reservation-confirmed.tsx`

**Interfaces:**
- Consumes: `@react-email/components`.
- Produces: `ReservationConfirmed(props: ReservationConfirmedProps): ReactElement` (default export) where `ReservationConfirmedProps = { guestName: string; clubName: string; tableLabel: string; reservationDate: string; partySize: number; qrUrl: string }`. Also exports the `ReservationConfirmedProps` type.

- [ ] **Step 1: Create `emails/reservation-confirmed.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors. (The template is not yet imported by app code; this confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add emails/reservation-confirmed.tsx
git commit -m "feat(email): add reservation-confirmed template

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Confirmation orchestrator

**Files:**
- Create: `lib/api/reservations/confirmation.ts`

**Interfaces:**
- Consumes:
  - `supabaseAdmin` from `@/lib/supabase-admin`
  - `uploadClubMediaBytes` from `@/lib/api/shared/storage` (Task 2)
  - `generateQrPng` from `@/lib/qr` (Task 3)
  - `sendReservationEmail` from `@/lib/email/client` (Task 4)
  - `ReservationConfirmed` from `@/emails/reservation-confirmed` (Task 5)
  - `Database` type from `@/lib/db`
- Produces: `sendReservationConfirmation(reservation: ReservationRow): Promise<void>` where `ReservationRow = Database["public"]["Tables"]["reservations"]["Row"]`. Throws on any failure (the caller catches).

- [ ] **Step 1: Create `lib/api/reservations/confirmation.ts`**

```ts
import { supabaseAdmin } from "@/lib/supabase-admin"
import { uploadClubMediaBytes } from "@/lib/api/shared/storage"
import { generateQrPng } from "@/lib/qr"
import { sendReservationEmail } from "@/lib/email/client"
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

  await sendReservationEmail({
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors. If the build complains that `reservations`/`clubs`/`club_tables` columns don't match, cross-check the selected column names (`name`, `label`, `guest_email`, `guest_name`, `reservation_date`, `party_size`, `qr_code_token`) against `lib/db.ts` and fix the select to match the real column names.

- [ ] **Step 3: Commit**

```bash
git add lib/api/reservations/confirmation.ts
git commit -m "feat(reservations): add confirmation email orchestrator

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Wire the send into `updateReservation`

**Files:**
- Modify: `lib/api/reservations/api.ts`

**Interfaces:**
- Consumes: `sendReservationConfirmation` from `./confirmation` (Task 6).
- Produces: no new exports; `updateReservation`'s response contract is unchanged (still `{ reservation }`, 200).

- [ ] **Step 1: Import the orchestrator**

Add to the imports at the top of `lib/api/reservations/api.ts` (after the existing imports):

```ts
import { sendReservationConfirmation } from "./confirmation"
```

- [ ] **Step 2: Fire the send on the pending→confirmed transition**

In `updateReservation`, the code currently ends with:

```ts
    const reservation = fromDb(
      await supabaseAdmin
        .from("reservations")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle(),
    )
    return Response.json({ reservation })
  },
)
```

Replace that block with:

```ts
    const reservation = fromDb<ReservationRow>(
      await supabaseAdmin
        .from("reservations")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle(),
    )

    // Best-effort: only when THIS request transitioned the row into
    // "confirmed" (not on a re-confirm of an already-confirmed row). A failure
    // to email must never fail the confirm — the status change is the source
    // of truth — so we swallow and log.
    const didConfirm =
      updates.status === "confirmed" && existing.status !== "confirmed"
    if (didConfirm) {
      try {
        await sendReservationConfirmation(reservation)
      } catch (error) {
        console.error("Failed to send reservation confirmation email:", error)
      }
    }

    return Response.json({ reservation })
  },
)
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors. (`ReservationRow` is already declared at the top of this file; `existing` and `updates` are already in scope.)

- [ ] **Step 4: Manual end-to-end verification**

1. Ensure `.env.local` has `RESEND_API_KEY` and `EMAIL_FROM` (see Task 8). If you have no key yet, the send no-ops with a console warning — that still proves the wiring path is exercised.
2. Run `npm run dev`, seed if needed (`npm run seed`), and log in as `owner@otus.dev`.
3. Open `/reservations/requests`, confirm a **pending** reservation.
4. With a real key: check the Resend dashboard / the sandbox inbox for the email and confirm the QR image renders and the details match. Without a key: confirm the server logs `[email] RESEND_API_KEY is unset — skipping send to ...`.
5. Confirm the same reservation again (it's now `confirmed`): verify **no** second email/log line fires (idempotency guard holds).
6. Optionally run the `/verify` skill for the end-to-end check.

- [ ] **Step 5: Commit**

```bash
git add lib/api/reservations/api.ts
git commit -m "feat(reservations): send confirmation email on confirm transition

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Environment + documentation

**Files:**
- Modify: `.env.local` (by hand — not committed; `.env*` is gitignored)
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: nothing.
- Produces: documented env vars and updated architecture notes.

- [ ] **Step 1: Add env vars to `.env.local`**

Append (developer supplies real values):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Otus <onboarding@resend.dev>
```

Note: `.env*` is gitignored, so this file is not committed. The sandbox sender `onboarding@resend.dev` only delivers to the Resend account owner's own address until a domain is verified.

- [ ] **Step 2: Update `AGENTS.md`**

In the reservations paragraph of the "Handler modules" section (the block describing `updateReservation`), append after the sentence about auto-generating `qr_code_token`:

```
When a PATCH transitions a reservation from a non-confirmed status into `confirmed`, `updateReservation` additionally makes a **best-effort** call to `sendReservationConfirmation` (`lib/api/reservations/confirmation.ts`): it generates a QR PNG encoding the raw `qr_code_token` (`lib/qr.ts`, `qrcode`), uploads it to the `club-media` bucket under `reservations/{reservationId}/` via the new `uploadClubMediaBytes` helper, renders the `emails/reservation-confirmed.tsx` React Email template, and sends it to `guest_email` via Resend (`lib/email/client.ts`). The send is guarded to fire only on the actual transition (re-confirming an already-`confirmed` row sends nothing) and is wrapped in try/catch so an email failure logs but never fails the confirm. If `RESEND_API_KEY` is unset the send no-ops with a console warning. This is the codebase's only outbound-email integration; it needs `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local` (the `onboarding@resend.dev` sandbox sender only delivers to the Resend account owner until a domain is verified). The door scanner UI and the auto-cancel of un-checked-in confirmed reservations are not yet built.
```

In the Storage paragraph, append a sentence noting the new helper:

```
`uploadClubMediaBytes(pathPrefix, bytes, contentType, extension)` is the bytes-based sibling of `uploadClubMedia` for server-generated media (the reservation QR PNG); `uploadClubMedia` now delegates to it.
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: build completes (doc/env changes don't affect types, but this confirms nothing regressed).

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document reservation confirmation email flow in AGENTS.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Resend + React Email → Tasks 1, 4, 5. ✅
- QR encodes raw `qr_code_token` → Task 3 (`generateQrPng`), consumed in Task 6. ✅
- QR uploaded to `club-media`, linked in email → Task 2 (`uploadClubMediaBytes`), Task 6 (upload + `qrUrl`), Task 5 (`<Img src>`). ✅
- Inline best-effort trigger on confirm transition (Option A), idempotent → Task 7 (`didConfirm` guard + try/catch). ✅
- No-op-without-key dev behavior → Task 4. ✅
- No QR URL persistence / no schema change → confirmed: Task 6 never writes back to the row. ✅
- `EMAIL_FROM` env var + sandbox caveat → Task 8. ✅
- Verification via `npm run build` + manual → every task's verify step; Task 7 Step 4 is the end-to-end. ✅
- AGENTS.md updated in same change → Task 8. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code; no "similar to Task N" references. ✅

**Type consistency:** `uploadClubMediaBytes(pathPrefix, bytes, contentType, extension)` — same 4-arg shape in Task 2 (definition), Task 6 (call). `generateQrPng(token): Promise<Buffer>` — Task 3 def, Task 6 call. `sendReservationEmail({to, subject, react})` — Task 4 def, Task 6 call. `ReservationConfirmed(props)` — Task 5 default export, Task 6 call. `sendReservationConfirmation(reservation: ReservationRow)` — Task 6 def, Task 7 call. `ReservationRow = Database["public"]["Tables"]["reservations"]["Row"]` — consistent in Tasks 6 and 7. ✅
