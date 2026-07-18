# Club Employee User Type — Design

**Date:** 2026-07-18
**Status:** Approved, ready for implementation planning

## Summary

Introduce a third user role, `club_employee`, scoped to exactly one club. Owners
invite employees by email from a new owner page; the invite email carries a
single-use, club-and-email-bound registration link. A registered employee has
access to exactly one screen — `/scan` — where they check guests in by reading
the QR code from the guest's confirmation email, and see a clear success or
failure state.

## Motivation

Reservation confirmation already emails guests a QR code encoding their
`qr_code_token`, and `checkinReservation` already exists to redeem it. What is
missing is the person at the door: there is no user type that can operate the
check-in flow, and no UI that reads a QR.

There is also a live security gap this change closes. Today
`checkinReservation` (`lib/api/reservations/api.ts:182`) has **no auth guard**
and uses the anon client. It looks a reservation up purely by token, so any
anonymous caller holding a token string can check in a reservation at any club.
Giving check-in a real operator is the natural point to require a session and
scope the operation to a single venue.

## Goals

- A `club_employee` role, bound to one club, that can log in.
- An owner-facing page to invite, list, revoke, and suspend employees.
- An employee registration flow driven by a single-use invite link.
- A `/scan` page with live camera scanning plus a manual fallback, showing
  explicit success/failure states.
- Check-in authenticated and scoped to the employee's own club.

## Non-Goals

- Multiple clubs per employee. One employee belongs to one club.
- Granular employee permissions. There is one capability: check in a guest.
- Self-serve employee signup. An invite is the only path in.
- Employee password reset / email change. Out of scope; an owner can suspend and
  re-invite.
- Auto-cancel of un-checked-in confirmed reservations. Still unbuilt, unrelated.

## Design Decisions

Each of these was chosen deliberately over a named alternative.

### Employees link to a club via `users.club_id`, not a join table

A nullable `club_id` FK on `users` matches the denormalization convention
already used on `club_tables` and `reservations`, and keeps `requireEmployee()`
a single row read with no join. A `club_employees` join table would support one
employee across multiple venues, which is explicitly a non-goal.

### Invites get their own table, not a column on `owner_verification_tokens`

`AGENTS.md` states the owner token is deliberately club-less: *"A token gates
account creation, not venue identity."* An employee invite is the opposite — it
asserts venue identity, because the club is precisely what it grants access to.
Adding `club_id` to the owner token table would blur an invariant the codebase
documents at length. A separate `club_employee_invites` table keeps both
meanings clean while reusing the proven hash/expiry/used/revoked shape.

### Invites bind to both club and email

The token row stores the invited email, and registration takes the email from
**the invite row, never the request body**. A forwarded link is therefore
useless to a third party — they cannot register under their own address. This is
the main reason the invite is worth more than a shared signup URL.

### QR payload becomes a URL

`lib/qr.ts` currently encodes the bare `qr_code_token`. A phone's native camera
only offers a tap-through when the payload is a URL, so the payload becomes
`${NEXT_PUBLIC_APP_URL}/scan/${token}`. This enables zero-training check-in: the
employee points their normal camera app at the guest's phone and taps the
notification.

This is safe **only because `/scan/[token]` requires an employee session.** The
QR lives in the guest's own inbox; if the link performed check-in unguarded, a
guest could check themselves in from home. The guard is what secures this, not
the scanning method — do not weaken it.

### Both scan paths, not one

Native camera tap-through requires no training but forces the employee out of
the camera app for every guest, and the result can only render in the browser. A
live in-app scanner keeps the camera open and shows the result inline, which
matters with a queue at the door. Both read the same URL format and hit the same
endpoint, so supporting both costs one dependency (`@zxing/browser`) and one
shared result component.

### `/scan` is employee-only

Owners are redirected away. An owner has no `users.club_id` to scope check-in
against, so admitting them would mean a second resolution path
(`clubs.owner_id`) through the same guard. If owners covering the door turns out
to matter, the change is small and localized to `requireEmployee()` and
`proxy.ts` — but it is not built now.

## Architecture

### 1. Schema

One migration, plus matching updates to `DB.md` and the `Database` interface in
`lib/db.ts`.

**`users` changes**

- `role` check constraint gains `club_employee`. The `"owner" | "admin"` union in
  `lib/db.ts` becomes `"owner" | "admin" | "club_employee"` across Row, Insert,
  and Update.
- New column `club_id uuid NULL REFERENCES clubs(id) ON DELETE CASCADE`. Null for
  `owner` and `admin`.
- New constraint `CHECK (role <> 'club_employee' OR club_id IS NOT NULL)` so an
  employee can never exist unattached to a venue.

**New table `club_employee_invites`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | default `gen_random_uuid()` |
| `club_id` | uuid NOT NULL | FK → `clubs(id)` ON DELETE CASCADE |
| `email` | text NOT NULL | stored lowercased |
| `token_hash` | text NOT NULL UNIQUE | sha256 of the plaintext token |
| `expires_at` | timestamptz NOT NULL | 7 days from issue |
| `used` | boolean NOT NULL | default false |
| `revoked` | boolean NOT NULL | default false |
| `invited_by` | uuid NOT NULL | FK → `users(id)` |
| `created_at` | timestamptz NOT NULL | default `now()` |

Indexes: `token_hash` (unique, the lookup path) and `club_id`. Plus a partial
unique index preventing duplicate live invites to one address:

```sql
CREATE UNIQUE INDEX club_employee_invites_one_live_per_email
  ON club_employee_invites (club_id, lower(email))
  WHERE used = false AND revoked = false;
```

RLS is enabled with no policies, matching every other table — all access goes
through the service-role client.

### 2. Session and guards

`lib/api/auth/session.ts` currently hardcodes `payload.role !== "owner" → null`
in `verifySession`. Generalizing it:

- `OwnerSession` becomes `Session { userId: string; role: SessionRole }` where
  `SessionRole = "owner" | "club_employee"`. `createSession` takes the role.
- `verifySession` accepts either role and returns it.

**This loosening is the highest-risk change in the spec.** `requireOwner()`
today relies on `verifySession` to reject non-owners implicitly. Once
`verifySession` admits employees, `requireOwner()` must assert
`session.role === "owner"` itself — otherwise every owner mutation endpoint
silently becomes employee-accessible. The same applies to `getOwnerProfile()`,
which gates the owner layout and must return `null` for a non-owner.

`lib/api/shared/auth.ts` gains:

```ts
requireEmployee(): Promise<{ userId: string; role: "club_employee"; clubId: string }>
```

It verifies the session role, loads `users.club_id` and `users.status` via the
service-role client, throws `unauthorized` on a missing/suspended user, and
throws `forbidden` if `club_id` is somehow null.

`login` (`lib/api/auth/api.ts`) currently 401s any non-owner. It accepts `owner`
and `club_employee`, still rejects `admin`, keeps the generic 401 for
missing-user/bad-password, keeps the 403 for suspended, and returns `role` in
the response so the client can route.

### 3. Route protection

`proxy.ts` becomes role-aware rather than "any valid session passes":

- Owner-group paths require `role === "owner"`; an employee is redirected to
  `/scan`.
- `/scan/*` requires `role === "club_employee"`; an owner is redirected to
  `/dashboard`.
- Anonymous requests continue to redirect to `/auth/login`.

Matcher gains `/scan/:path*` and `/employees/:path*`.

### 4. API layer

New module `lib/api/employees/api.ts`, with thin re-export routes per the
existing convention. All owner endpoints resolve the caller's single club via
`clubs.owner_id ... .maybeSingle()`, exactly as `listOwnerEvents` does.

| Route | Handler | Behavior |
| --- | --- | --- |
| `GET /api/owner/employees` | `listEmployees` | `requireOwner` → `{ clubId, employees, invites }`. Selects never include `token_hash` or `password_hash`. Invites filtered to live ones. |
| `POST /api/owner/employees/invite` | `inviteEmployee` | `requireOwner` → validate email → conflict if an employee with that email already exists or a live invite does → generate token, store sha256 → send email → return the invite row (never the plaintext). |
| `DELETE /api/owner/employees/invites/[inviteId]` | `revokeInvite` | `requireOwner`, scoped by `club_id`, sets `revoked = true`. 404 on non-matching row. |
| `PATCH /api/owner/employees/[employeeId]` | `updateEmployee` | `requireOwner`, scoped by `club_id` **and** `role = 'club_employee'`, toggles `status` between `active`/`suspended`. |

Token generation: `crypto.randomBytes(32).toString("base64url")`, stored as
sha256 — the same scheme `owner_verification_tokens` uses. The plaintext appears
only in the email.

**Invite email.** A new React Email template `emails/employee-invite.tsx`,
following `emails/reservation-confirmed.tsx`, containing the club name, who
invited them, the registration link
(`${NEXT_PUBLIC_APP_URL}/auth/employee/register?token=...`), and the expiry. It
sends through the existing Resend client (`lib/email/client.ts`), which no-ops
with a console warning when `RESEND_API_KEY` is unset.

Unlike the reservation confirmation — which is deliberately best-effort, wrapped
in try/catch so a mail failure never fails the confirm — **a failed invite send
must fail the request**. A silently-unsent invite is indistinguishable to the
owner from a delivered one, and the plaintext token is unrecoverable afterward.
The handler therefore sends before returning success, and surfaces a send failure
as a 5xx so the owner can retry.

This creates an ordering hazard. The invite row must be inserted before the send
(the token has to be persisted to be redeemable), but the partial unique index
then blocks a retry to the same address — the owner would be stuck behind a live
invite that never arrived. So on send failure the handler **deletes the
just-inserted row** before throwing, leaving no live invite and making retry
clean. A delete failure inside that path is logged, not thrown, so the original
send error is what reaches the owner; the fallback in that rare case is Revoke,
which is already in the UI. Note the `onboarding@resend.dev` sandbox sender
only delivers to the Resend account owner until a domain is verified, which will
affect testing this flow.

Two handlers join `lib/api/auth/api.ts`, mirroring the existing owner token pair:

- `checkEmployeeInvite` (`POST /api/auth/employee-invite/check`) — read-only,
  does not consume. Returns `{ valid, email, clubName }` so the register page can
  display the venue and lock the email field.
- `redeemEmployeeInvite` (`POST /api/auth/employee-invite/redeem`) — takes
  `{ token, full_name, password, contact_number? }`. **Email is read from the
  invite row, not the body.** Enforces the 8-character password minimum and email
  uniqueness, then performs the same atomic claim as `redeemVerificationToken`
  (`UPDATE ... WHERE used = false AND revoked = false AND expires_at > now()`
  returning the row, before inserting the user) so a losing race never creates a
  duplicate account. Inserts the user with `role: "club_employee"` and the
  invite's `club_id`, then sets the session cookie.

**`checkinReservation` changes** (`lib/api/reservations/api.ts`):

- Gains `requireEmployee()` and switches from the anon client to
  `supabaseAdmin`.
- After locating the reservation by token, rejects it when
  `reservation.club_id !== session.clubId` — as `notFound`, not `forbidden`, so
  the response does not leak that the code is valid at some other venue.
- Existing conflict cases are preserved: already `checked_in`, and any
  non-`confirmed` status.
- Response is enriched for the success screen: guest name, party size,
  reservation date, and the table label (a lookup against `club_tables`), plus
  event title when `event_id` is set.

### 5. QR payload

`lib/qr.ts` encodes `${NEXT_PUBLIC_APP_URL}/scan/${token}` rather than the bare
token, requiring a new `NEXT_PUBLIC_APP_URL` env var. The email template is
structurally unchanged.

**Backward compatibility:** QRs already emailed encode a bare token and will not
tap-through from a native camera. The manual-entry field on `/scan` accepts
either a bare token or a full URL (taking the trailing path segment), so those
reservations remain checkinable by typing the code.

### 6. UI

All new screens use the bespoke dark palette (`#0a0a0a` / `#141414`) established
by `app/auth/login/page.tsx` and `app/auth/register/page.tsx`, not shadcn/ui
defaults.

**Owner — `app/(owner)/employees/page.tsx`** (client component). Follows the
established sequence: `GET /api/owner/club` to resolve `clubId`, then
`GET /api/owner/employees`. Renders an email input with an Invite button, a
pending-invites list with Revoke, and an employees list with Suspend/Reactivate.
Handles loading, error, and no-club-yet states.

Navigation is registered in `components/Sidebar.tsx` via a new `staffNavigation`
array holding an `Employees` → `/employees` entry, rendered alongside the
existing groups.

> Note: `AGENTS.md` currently describes this file as `components/app-sidebar.tsx`
> with a `navGroups` array. Neither exists — the real file is
> `components/Sidebar.tsx` with four separate `NavigationType[]` arrays
> (`dashboardNavigation`, `customizationNavigation`, `bookingNavigation`,
> `eventsNavigation`). Correct `AGENTS.md` as part of this work.

**Employee registration — `app/auth/employee/register/page.tsx`.** Reads
`?token=` on mount and calls `checkEmployeeInvite`, showing an invalid/expired
state on failure. On success it displays the club name and the locked, invite-
bound email, and collects `full_name`, `password` + confirmation (client-side
match check), and optional `contact_number`. Submitting calls
`redeemEmployeeInvite`, which sets the session cookie, then redirects to `/scan`.

**Employee shell — `app/(employee)/layout.tsx`.** Minimal chrome: club name and
a sign-out control reusing `POST /api/auth/logout`. No sidebar — this is a phone
held at a door.

**`app/(employee)/scan/page.tsx`.** Live `@zxing/browser` camera scanner plus a
manual-entry field. Requests camera permission on mount and degrades to
manual-only if denied or unavailable. On a successful decode it extracts the
token from the URL and POSTs to the check-in endpoint.

**`app/(employee)/scan/[token]/page.tsx`.** The native-camera landing. A client
component that POSTs its token on mount and renders the same result component,
with a link back to `/scan`.

**`components/employee/checkin-result.tsx`.** One shared result component used by
both paths. Success is a large high-contrast green state showing guest name,
party size, and table label. Failure is red with a specific reason — already
checked in, not confirmed, or unknown code — never a generic error. On the
scanner page it auto-resets after a few seconds so the next guest can be scanned
without interaction.

**Login routing.** `app/auth/login/page.tsx` uses the `role` now returned by the
login response to push to `/dashboard` or `/scan`.

### 7. Seeding

`scripts/seed.ts` and `scripts/seed/factories.ts` need care here.

**There is a circular FK.** `users.club_id → clubs` and `clubs.owner_id → users`
means the current `users → clubs` insert order cannot place employees. Insert
order becomes: owners/admins → clubs → employees. Deletes run in reverse, and
`club_employee_invites` joins the wipe list.

Add a fixed, memorable account alongside the existing `owner@otus.dev` and
`admin@otus.dev`: **`employee@otus.dev`** (role `club_employee`, attached to the
first seeded club, forced `active`), sharing the same `SEED_PASSWORD`. Print it
with the others at the end of the run.

## Testing and Verification

This repo has **no test framework**, so verification is a build plus manually
driving the flow.

- `npm run build` — the only full typecheck (`tsconfig` is `noEmit`). The
  `Database` role-union change will surface every call site that needs updating.
- `npm run lint`.
- `npm run seed`, then walk the flow end to end: log in as the owner → invite an
  employee → open the emailed link → register → land on `/scan` → confirm a
  reservation as the owner → scan the QR from the confirmation email via both the
  native camera path and the in-app scanner.
- Negative cases to exercise deliberately: an employee hitting `/dashboard`, an
  owner hitting `/scan`, a revoked invite, an expired invite, a reused invite, a
  token belonging to another club, an already-checked-in reservation, and a
  pending (unconfirmed) reservation.

## Risks

| Risk | Mitigation |
| --- | --- |
| Loosening `verifySession` without tightening `requireOwner` grants employees owner-level API access. | Explicit `role === "owner"` assertion in `requireOwner` and `getOwnerProfile`; exercise the employee-hits-owner-route case manually. |
| Guest self-check-in via the QR link in their own inbox. | `/scan/[token]` requires an employee session; guests hit the login wall. |
| Circular FK breaks the seeder. | Documented insert order: owners → clubs → employees, deletes reversed. |
| Already-emailed QRs stop tapping through. | Manual entry accepts a bare token; those reservations stay checkinable. |
| Camera permission denied on a door phone. | Manual-entry fallback is always present, never hidden behind the scanner. |

## Documentation

`CLAUDE.md` requires `AGENTS.md` to be updated in the same change. This work
touches: the role model, the session contract, route protection, the API handler
inventory, the Storage/QR payload note, the seeding section, and the stale
sidebar reference noted above. `DB.md` needs the new table and the two `users`
changes. `ROUTES.md` needs the new routes.
