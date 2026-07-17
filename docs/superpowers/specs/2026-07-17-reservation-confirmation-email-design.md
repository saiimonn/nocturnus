# Reservation Confirmation Email — Design

**Date:** 2026-07-17
**Status:** Approved (design), pending implementation
**Branch:** feature/owner-registration (or a new feature branch)

## Summary

When an owner confirms a reservation, the guest should automatically receive an
email containing their booking details and a QR code to present at the door.
This spec covers the flow **through the generation and sending of that email**.
It builds on the existing accept/decline flow, which already sets a reservation's
status to `confirmed` and auto-generates a `qr_code_token`.

## Scope

**In scope**

- On the confirm transition inside `updateReservation`
  (`lib/api/reservations/api.ts`), generate a QR code from the reservation's
  `qr_code_token`, upload it to the existing public `club-media` Supabase
  Storage bucket, render a React Email confirmation template, and send it to the
  guest via Resend.
- The email send is **best-effort**: any failure (QR generation, upload, or
  send) is logged but never fails the confirm action. The status change is the
  source of truth.

**Out of scope (deferred to later specs)**

- The entry scanner / check-in UI that reads the QR and drives
  `checkinReservation`.
- The Supabase `pg_cron` job that auto-cancels a confirmed reservation one hour
  past its `reservation_date` if it was never checked in.

## Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Email provider | **Resend + React Email** | Modern transactional API, generous free tier, React templating fits Next.js. Resend's Node SDK renders a React Email element directly (`react:` field), so no separate render package. |
| QR content | **Raw `qr_code_token` (UUID)** | `checkinReservation` already accepts `qr_code_token`; encoding the raw token keeps any future scanner (camera, URL-based, or manual) working without committing to a scanning approach now. |
| QR delivery | **Upload PNG to `club-media`, link via `<Img src>`** | Gmail/Outlook strip data-URI images; a hosted public URL renders reliably and reuses the repo's only Storage integration. |
| Trigger structure | **Inline, best-effort after the DB write (Option A)** | One code path, matches the thin-route → `lib/api` convention, idempotent via a transition guard. A standalone service function leaves room to add a "resend" endpoint later without rework. |
| QR URL persistence | **Not persisted** | Not needed for this scope; avoids a schema change. Generated fresh at send time. |

## New Dependencies & Environment

**Dependencies**

- `resend` — Resend SDK
- `@react-email/components` — building the email template
- `qrcode` — server-side QR PNG generation
- `@types/qrcode` (dev)

**Environment (`.env.local`)**

- `RESEND_API_KEY` — Resend API key.
- `EMAIL_FROM` — sender identity, e.g. `Otus <onboarding@resend.dev>` for dev.

> **Dev note:** Resend's sandbox sender (`onboarding@resend.dev`) only delivers
> to the Resend account owner's own email address until a domain is verified.
> This is expected in development.

## Components

Each unit has one clear purpose and a well-defined interface.

### `lib/email/client.ts`
- Exports a Resend client singleton and the `EMAIL_FROM` constant.
- Exports `sendEmail(...)` (thin wrapper over `resend.emails.send`).
- **If `RESEND_API_KEY` is unset:** `sendEmail` logs a warning and no-ops, so
  developers without a key are not blocked and the confirm flow still succeeds.

### `emails/reservation-confirmed.tsx`
- A React Email component.
- Props: `guestName`, `clubName`, `tableLabel`, `reservationDate`,
  `partySize`, `qrUrl`.
- Renders the booking details and `<Img src={qrUrl} />` for the QR.

### `lib/qr.ts`
- `generateQrPng(token: string): Promise<Buffer>` — encodes the raw token as a
  PNG using `qrcode`.

### `lib/api/shared/storage.ts` (extend)
- Add `uploadClubMediaBytes(pathPrefix, bytes, contentType, ext)` — uploads raw
  bytes to the `club-media` bucket (service-role client) and returns the public
  URL.
- Refactor the existing `uploadClubMedia(pathPrefix, file)` to delegate to it so
  the `File`-based signature and all current callers stay unchanged.
- QR uploads use `pathPrefix = reservations/{reservationId}`.

### `lib/api/reservations/confirmation.ts`
- `sendReservationConfirmation(reservation): Promise<void>` — the orchestrator:
  1. Fetch `clubs.name` (by `club_id`) and `club_tables.label` (by `table_id`)
     via the service-role client.
  2. `generateQrPng(reservation.qr_code_token)`.
  3. `uploadClubMediaBytes("reservations/" + reservation.id, png, "image/png", "png")`.
  4. Render `ReservationConfirmed` and `sendEmail` to `reservation.guest_email`.

## Data Flow

```
PATCH /api/reservations/[id]
  → existing status-write logic runs unchanged
    (validates body, resolves club_id, requireClubOwner, applies updates,
     auto-generates qr_code_token when status becomes "confirmed")
  → compute didConfirm =
      (new status === "confirmed" && existing.status !== "confirmed")
  → if didConfirm:
      try { await sendReservationConfirmation(updatedReservation) }
      catch (e) { console.error(...) }   // best-effort, never rethrown
  → return { reservation }   // 200 regardless of email outcome
```

- **`await` (not fire-and-forget):** serverless functions may freeze after the
  response is returned, so an un-awaited promise could be killed before it runs.
  We await the send but swallow its errors.
- **Idempotency:** the `existing.status !== "confirmed"` guard means re-PATCHing
  an already-confirmed row sends nothing.
- The `qr_code_token` used is the one on the freshly-updated row returned by the
  `update(...).select("*")` call.

## Error Handling

| Failure | Behavior |
|---|---|
| `RESEND_API_KEY` unset | `sendEmail` warns and no-ops; confirm returns 200. |
| QR generation / upload / send throws | Caught in `updateReservation`, logged via `console.error`, confirm returns 200. |
| Guest email missing | Not possible — `guest_email` is required at reservation creation. |

No schema change; no QR URL persisted on the reservation row.

## Verification

No test framework is configured in this repo, so verification is manual:

1. `npm run build` — the only full typecheck (tsconfig is `noEmit`).
2. Confirm a seeded reservation (owner UI or a direct PATCH) and observe the
   send in the Resend dashboard / sandbox inbox; confirm the email renders the
   details and a scannable QR.
3. Use the `/verify` skill for the end-to-end check.

## Documentation

Per the repo rule ("every feature change must update `AGENTS.md`"), the same
change updates `AGENTS.md`:

- New dependencies (`resend`, `@react-email/components`, `qrcode`).
- New env vars (`RESEND_API_KEY`, `EMAIL_FROM`) and the sandbox delivery caveat.
- The Storage section: QR PNGs now also live in `club-media` under
  `reservations/{reservationId}/`, and the new `uploadClubMediaBytes` helper.
- The reservations behavior: confirming a reservation now best-effort sends the
  guest a confirmation email with a QR of the `qr_code_token`.
