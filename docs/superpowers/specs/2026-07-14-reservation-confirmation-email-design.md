# Reservation Acceptance Email + QR — Design

**Date:** 2026-07-14
**Status:** Approved (pending spec review)

## Problem

A guest submits a reservation via the consumer form (`POST /api/reservations`), landing as
`status: pending`. When an owner accepts the request, the guest must be emailed a confirmation
containing a scannable QR code. That QR encodes the reservation's `qr_code_token`, which the
door staff scan into the existing check-in flow (`POST /api/reservations/checkin`).

Today the acceptance endpoint (`PATCH /api/reservations/[id]` → `updateReservation`) is a
`notImplemented` stub, and no email or QR library is installed.

## Scope

**In scope**
- Implement `PATCH /api/reservations/[id]` end-to-end for `action: accept | decline | cancel`.
- On `accept`: generate `qr_code_token`, render a QR PNG, email the guest via Resend, then
  persist `status: confirmed` + the token.
- A reusable email module and a reusable QR-generation step.
- Docs updates (`AGENTS.md`, `ROUTES.md`) and dependency/env additions.

**Out of scope**
- Owner authentication (`requireOwner` remains a stub — see "Auth" below).
- Wiring the owner UI (`app/(owner)/reservations/requests/page.tsx`) to call the real API; it
  continues to mutate local mock state. This will be done separately.
- Emails for any state other than acceptance (no decline/cancel notification email).

## Flow & Ordering

Because a failed email must fail the whole request (the reservation must **not** silently become
`confirmed` while the guest is never notified), operations are ordered **email-first,
persist-second**:

1. `PATCH /api/reservations/[id]` with body `{ "action": "accept" }`.
2. Fetch the reservation. If not found → `404`. If `status !== "pending"` → `409`.
3. Generate a `qr_code_token` (UUID v4) **in memory** — not yet saved.
4. Render a QR PNG encoding the raw token string.
5. Look up the club name (and table label) needed for the email body.
6. Send the confirmation email via Resend with the QR embedded.
   - **If the send throws → the error propagates out of the handler, which `handle()` serializes
     to `500`. The DB is untouched, the reservation stays `pending`, and the owner can cleanly
     retry accepting.** (No new `502` factory is added; this matches how `fromDb` and other
     thrown errors already surface as `500`.)
7. Only after the email succeeds, `UPDATE` the row to `status: confirmed` + `qr_code_token`.
8. Return `200` with `{ reservation: { id, status, qr_code_token, updated_at } }`.

`decline` and `cancel` are pure status updates (→ `cancelled`), with no token and no email. They
also require the reservation to be `pending` (→ `409` otherwise); `action` outside the three
verbs → `400`.

### Known residual risk

If the email sends successfully but the subsequent DB write fails, the guest holds a QR whose
token was never persisted, so check-in would fail until the owner re-accepts. This is rare and is
logged server-side. We deliberately do **not** build cross-service transaction machinery for it.

## Modules & Boundaries

- **`lib/email/resend.ts`** — lazily constructs and memoizes the Resend client from
  `RESEND_API_KEY`. Throws a clear, actionable error if the key is missing. No template logic.
- **`lib/email/reservation-confirmation.ts`** — exports
  `sendReservationConfirmation(input)` where `input` carries the guest name/email, club name,
  table label, reservation date, party size, and the `qr_code_token`. Owns QR PNG generation
  (`qrcode`), the HTML template, and the Resend call. Resolves on success; throws on any failure.
- **`lib/api/reservations/api.ts`** — `updateReservation` is implemented here: parse `action`,
  guard status, orchestrate the email-first flow, do the club/table lookups, and persist. This is
  the only unit that touches both the DB and the email module.

The handler passes already-resolved display strings (club name, table label) into the email
module so the email module stays free of DB concerns.

### QR delivery

The QR PNG is delivered as an **inline `cid` attachment** referenced by `<img src="cid:...">`,
not a `data:` URI (Gmail and others strip `data:` image sources). The exact Resend field for
inline attachments will be confirmed against current Resend docs (via context7) during
implementation.

## Auth (deferred)

`requireOwner()` / `requireClubOwner()` still throw `notImplemented`. Calling either would make
this endpoint permanently return `501`, so `updateReservation` will **not** invoke the guard yet.
A prominent marker sits exactly where the call belongs:

```ts
// TODO(auth): guard with requireClubOwner(reservation.club_id) once owner sessions land
```

**This is a known security gap:** until auth lands, anyone who can reach the endpoint can accept,
decline, or cancel any reservation. Acceptable for the current greenfield/dev stage; must be
closed before production. Documented in `AGENTS.md`.

## Dependencies & Config

**New dependencies**
- `resend` — email transport (HTTP API; the right fit for serverless vs. SMTP sockets).
- `qrcode` — server-side QR PNG generation.
- `@types/qrcode` (dev).

**New environment variables**
- `RESEND_API_KEY` — Resend API key.
- `RESERVATION_EMAIL_FROM` — sender identity, e.g. `Otus <noreply@otus.app>`.

In development, Resend's sandbox sender `onboarding@resend.dev` can email your own verified
address without domain verification. Production requires a verified sender domain (DNS records).

## Email Content

- **Subject:** `You're confirmed at {club name} 🎉`
- **Body:** greeting with guest name; club name; reservation date/time (formatted, note all
  timestamps are UTC in the DB and converted for display); table label; party size; the embedded
  QR; and a line instructing the guest to present the QR at the door for check-in.

## Testing / Verification

There is no test framework in this repo, so verification is:

1. `npm run build` — the only full typecheck (tsconfig is `noEmit`).
2. Manual: seed/identify a `pending` reservation, `curl` the accept endpoint with a real Resend
   sandbox key, confirm an email with a scannable QR arrives, and confirm the scanned token drives
   `POST /api/reservations/checkin` to `checked_in`.
3. Negative: with an intentionally invalid `RESEND_API_KEY`, confirm the accept request errors
   and the reservation remains `pending` (email-first ordering holds).

## Docs to Update (same change)

- **`AGENTS.md`** — new email layer under Architecture, new deps in Stack Realities, new env vars,
  the deferred-auth security note, and that `updateReservation` is now implemented.
- **`ROUTES.md`** — note that `PATCH /api/reservations/[id]` now sends a confirmation email on
  `accept`, and document the failure semantics.
