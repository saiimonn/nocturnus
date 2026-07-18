# API Routes Reference

Complete REST API surface for Otus (Cebu Nightclub Reservation System). See `DB.md` for schema, `AGENTS.md` for implementation details.

## Overview

- **Base URL:** `http://localhost:3000/api` (dev) or `https://otus.example.com/api` (prod)
- **Format:** JSON request/response
- **Error format:** `{ "error": "<code>", "message": "<human-readable>" }`
- **Status codes:** `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Server Error, `501` Not Implemented

## Authentication

- **Public routes:** No auth required (guest browsing, reservation creation, guest reservation lookup). `POST /api/reservations/checkin` is grouped with the public reservation routes below but is **not** public — it requires a `club_employee` session, see its entry.
- **Owner/admin routes:** Require Supabase Auth session (not yet wired; currently return `501 Not Implemented`). Will be passed via `Authorization: Bearer <token>` header once `@supabase/ssr` session layer is built.

## Public Routes (Guest-facing)

### Browse & Discovery

#### `GET /api/clubs`
List all active clubs with basic info for the browse page.

**Response:**
```json
{
  "clubs": [
    {
      "id": "uuid",
      "name": "Club Name",
      "slug": "club-slug",
      "description": "About the club",
      "address": "123 Street",
      "cover_image_url": "https://...",
      "operating_hours": [
        { "day": "Monday", "open": "22:00", "close": "05:00" }
      ]
    }
  ]
}
```

---

#### `GET /api/clubs/[slug]`
Get full club detail by slug (for club page).

**Path params:** `slug` (string, e.g., `"cebu-sunset-lounge"`)

**Response:**
```json
{
  "club": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Club Name",
    "slug": "club-slug",
    "description": "...",
    "address": "...",
    "cover_image_url": "...",
    "operating_hours": [...],
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### `GET /api/clubs/[slug]/images`
Get all gallery images for a club.

**Path params:** `slug` (string)

**Response:**
```json
{
  "images": [
    {
      "id": "uuid",
      "club_id": "uuid",
      "image_url": "https://...",
      "caption": "Optional caption",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `GET /api/clubs/[slug]/floor-plans`
Get all floor plans (distinct physical spaces) for a club.

**Path params:** `slug` (string)

**Response:**
```json
{
  "floorPlans": [
    {
      "id": "uuid",
      "club_id": "uuid",
      "name": "Ground Floor",
      "image_url": "https://...",
      "labels": [
        { "text": "STAGE", "x": 0.5, "y": 0.1 },
        { "text": "BAR", "x": 0.8, "y": 0.5 }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `GET /api/clubs/[slug]/floor-plans/[floorPlanId]/tables`
Get all bookable tables for a specific floor plan.

**Path params:** `slug` (string), `floorPlanId` (uuid)

**Response:**
```json
{
  "tables": [
    {
      "id": "uuid",
      "floor_plan_id": "uuid",
      "club_id": "uuid",
      "label": "VIP-1",
      "capacity": 10,
      "minimum_spend": 5000.00,
      "category": "VIP",
      "pos_x": 0.2,
      "pos_y": 0.3,
      "is_available": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `GET /api/clubs/[slug]/events`
Get all published events for a club.

**Path params:** `slug` (string)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "club_id": "uuid",
      "title": "Ladies Night",
      "description": "...",
      "image_url": "https://...",
      "event_date": "2024-02-14T22:00:00Z",
      "status": "published",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `GET /api/events/[eventId]`
Get a single event by ID.

**Path params:** `eventId` (uuid)

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "club_id": "uuid",
    "title": "...",
    "description": "...",
    "image_url": "...",
    "event_date": "...",
    "status": "published",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### Reservations (Guest Checkout)

#### `POST /api/reservations`
Guest submits a table reservation (no account needed).

**Request body:**
```json
{
  "table_id": "uuid",
  "club_id": "uuid",
  "reservation_date": "2024-02-14T22:30:00Z",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_contact": "+63912345678",
  "party_size": 4,
  "event_id": "uuid (optional)"
}
```

**Response:** `201 Created`
```json
{
  "reservation": {
    "id": "uuid",
    "status": "pending",
    "reservation_date": "2024-02-14T22:30:00Z"
  }
}
```

**Errors:**
- `400` if required fields missing or invalid (party_size must be a positive integer)

---

#### `GET /api/reservations/[id]`
Guest looks up their own reservation status (scoped by email).

**Path params:** `id` (uuid)
**Headers:** `X-Guest-Email: guest@example.com`

**Response:**
```json
{
  "reservation": {
    "id": "uuid",
    "status": "pending|confirmed|cancelled|checked_in",
    "reservation_date": "2024-02-14T22:30:00Z",
    "guest_name": "John Doe",
    "party_size": 4,
    "qr_code_token": "uuid (null if still pending)",
    "club_id": "uuid",
    "table_id": "uuid",
    "event_id": "uuid (null)"
  }
}
```

**Errors:**
- `400` if `X-Guest-Email` header missing
- `404` if no reservation matches that ID + email

---

#### `POST /api/reservations/checkin`
Door staff scan a guest's QR code (which encodes `/scan/{token}`, not a bare token) to check them in.

**Auth:** Required — `club_employee` session (`requireEmployee()`). Listed here alongside the other reservation routes for grouping, but note this is **not** anonymous/guest-facing like the routes above it.

**Request body:**
```json
{
  "qr_code_token": "uuid"
}
```

**Response:**
```json
{
  "reservation": {
    "id": "uuid",
    "status": "checked_in",
    "guest_name": "John Doe",
    "party_size": 4,
    "reservation_date": "2024-02-14T22:30:00Z",
    "table_label": "VIP-1",
    "event_title": "Ladies Night"
  }
}
```

**Errors:**
- `401` if not signed in as a `club_employee`
- `400` if `qr_code_token` missing
- `404` if token doesn't match any reservation **belonging to the caller's club** — a token valid at another club also 404s here, so the response never discloses that the code works elsewhere
- `409` if reservation is already checked in or not in `confirmed` status

---

## Owner/Admin Routes (Authenticated — Currently `501 Not Implemented`)

All owner routes require Supabase Auth session (header: `Authorization: Bearer <token>`). Currently throw `501 Not Implemented` until auth is wired.

### Authentication

#### `POST /api/auth/verification/redeem`
Redeem a one-time owner verification token to create an account.

**Request body:**
```json
{
  "token": "12-character-string",
  "full_name": "Jane Owner",
  "email": "jane@club.com",
  "password": "secure-password",
  "contact_number": "+63912345678 (optional)"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "full_name": "Jane Owner",
    "email": "jane@club.com",
    "role": "owner",
    "status": "active"
  },
  "token": "jwt-auth-token"
}
```

**Errors:**
- `400` if required fields missing
- `400` if token invalid, already used, revoked, or expired
- `409` if email already registered

---

#### `POST /api/auth/employee-invite/check`
Read-only lookup used by the employee registration page to preview an invite before the user commits — does not consume it.

**Auth:** None (the plaintext token in the request body is the credential).

**Request body:**
```json
{
  "token": "url-safe-base64-string"
}
```

**Response:**
```json
{
  "valid": true,
  "email": "staff@club.com",
  "clubName": "Cebu Sunset Lounge"
}
```

**Errors:**
- `400` if `token` missing
- `401` if the invite is invalid, used, revoked, or expired

---

#### `POST /api/auth/employee-invite/redeem`
Redeem a club employee invite to create a `club_employee` account and sign in. The account's email is always taken from the invite row, never from the request body, so a forwarded invite link cannot be used to register a different address.

**Request body:**
```json
{
  "token": "url-safe-base64-string",
  "full_name": "Jane Doorstaff",
  "password": "secure-password",
  "contact_number": "+63912345678 (optional)"
}
```

**Response:** `201 Created`. Also sets the `otus_session` cookie, same as `login`.
```json
{
  "user": {
    "id": "uuid",
    "full_name": "Jane Doorstaff",
    "email": "staff@club.com",
    "role": "club_employee"
  }
}
```

**Errors:**
- `400` if required fields missing, or password under 8 characters
- `401` if the invite is invalid, used, revoked, or expired
- `409` if email already registered

---

### Club Management

#### `POST /api/clubs`
Create a new club (owner onboarding).

**Auth:** Required (owner role)

**Request body:**
```json
{
  "name": "New Club",
  "slug": "new-club",
  "address": "123 Club Street",
  "description": "A trendy spot",
  "operating_hours": [
    { "day": "Friday", "open": "22:00", "close": "05:00" }
  ],
  "cover_image_url": "https://..."
}
```

**Response:** `201 Created`
```json
{
  "club": {
    "id": "uuid",
    "owner_id": "uuid (from session)",
    "name": "New Club",
    ...
  }
}
```

---

#### `PATCH /api/owner/clubs/[clubId]`
Update club details.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)

**Request body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "...",
  "address": "...",
  "operating_hours": [...],
  "cover_image_url": "..."
}
```

---

#### `POST /api/owner/clubs/[clubId]/images`
Add a gallery image.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)

**Request body:**
```json
{
  "image_url": "https://...",
  "caption": "Optional"
}
```

---

#### `DELETE /api/owner/clubs/[clubId]/images/[imageId]`
Remove a gallery image.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `imageId` (uuid)

---

### Employee Management

Door staff (`club_employee`) accounts for the caller's own club. All four routes resolve the caller's club from the session (`requireOwnClub()` → `requireOwner()`); there is no `clubId` path param — an owner can only ever see or touch their own club's staff.

#### `GET /api/owner/employees`
List the caller's club employees plus any pending (unused, unrevoked) invites.

**Auth:** Required (owner role)

**Response:**
```json
{
  "clubId": "uuid",
  "employees": [
    {
      "id": "uuid",
      "full_name": "Jane Doorstaff",
      "email": "staff@club.com",
      "contact_number": "+63912345678",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "invites": [
    {
      "id": "uuid",
      "email": "pending@club.com",
      "expires_at": "2024-01-22T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### `POST /api/owner/employees/invite`
Invite someone to join the caller's club as a `club_employee`. Sends a registration-link email; **the send is not best-effort** — if it fails, the invite row is rolled back and the request fails, because an unsent invite's token is unrecoverable (see `AGENTS.md`).

**Auth:** Required (owner role)

**Request body:**
```json
{
  "email": "staff@club.com"
}
```

**Response:** `201 Created`
```json
{
  "invite": {
    "id": "uuid",
    "email": "staff@club.com",
    "expires_at": "2024-01-22T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` if `email` missing or not a valid address
- `409` if an account or a live invite already exists for that email at this club
- `500` if the invite email fails to send (the invite row is rolled back first)

---

#### `DELETE /api/owner/employees/invites/[inviteId]`
Revoke a pending invite (marks it `revoked`, does not delete the row).

**Auth:** Required (owner role)

**Path params:** `inviteId` (uuid)

**Response:**
```json
{
  "ok": true,
  "id": "uuid"
}
```

**Errors:**
- `404` if the invite doesn't exist or doesn't belong to the caller's club

---

#### `PATCH /api/owner/employees/[employeeId]`
Suspend or reactivate an employee.

**Auth:** Required (owner role)

**Path params:** `employeeId` (uuid)

**Request body:**
```json
{
  "status": "active | suspended"
}
```

**Response:**
```json
{
  "employee": {
    "id": "uuid",
    "full_name": "Jane Doorstaff",
    "email": "staff@club.com",
    "status": "suspended"
  }
}
```

**Errors:**
- `400` if `status` is missing or not `active`/`suspended`
- `404` if the target isn't a `club_employee` belonging to the caller's club (this also blocks an owner from targeting their own user row)

---

### Floor Plans & Tables

#### `POST /api/owner/clubs/[clubId]/floor-plans`
Create a new floor plan.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)

**Request body:**
```json
{
  "name": "VIP Mezzanine",
  "image_url": "https://...",
  "labels": [
    { "text": "STAGE", "x": 0.5, "y": 0.1 }
  ]
}
```

---

#### `PATCH /api/owner/clubs/[clubId]/floor-plans/[floorPlanId]`
Update a floor plan.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `floorPlanId` (uuid)

**Request body:** (all optional)
```json
{
  "name": "...",
  "image_url": "...",
  "labels": [...]
}
```

---

#### `DELETE /api/owner/clubs/[clubId]/floor-plans/[floorPlanId]`
Delete a floor plan and all its tables.

**Auth:** Required (must own clubId)

---

#### `POST /api/owner/clubs/[clubId]/floor-plans/[floorPlanId]/tables`
Create a table on a floor plan.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `floorPlanId` (uuid)

**Request body:**
```json
{
  "label": "VIP-1",
  "capacity": 10,
  "minimum_spend": 5000.00,
  "category": "VIP|regular|booth|bar",
  "pos_x": 0.2,
  "pos_y": 0.3,
  "is_available": true
}
```

---

#### `PATCH /api/owner/clubs/[clubId]/floor-plans/[floorPlanId]/tables/[tableId]`
Update a table.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `floorPlanId` (uuid), `tableId` (uuid)

**Request body:** (all optional)
```json
{
  "label": "...",
  "capacity": 12,
  "minimum_spend": 6000.00,
  "category": "...",
  "pos_x": 0.25,
  "pos_y": 0.35,
  "is_available": false
}
```

---

#### `DELETE /api/owner/clubs/[clubId]/floor-plans/[floorPlanId]/tables/[tableId]`
Delete a table.

**Auth:** Required (must own clubId)

---

### Events

#### `POST /api/owner/clubs/[clubId]/events`
Create an event.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)

**Request body:**
```json
{
  "title": "Ladies Night",
  "description": "...",
  "image_url": "https://...",
  "event_date": "2024-02-14T22:00:00Z",
  "status": "draft|published|cancelled"
}
```

---

#### `PATCH /api/owner/clubs/[clubId]/events/[eventId]`
Update an event.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `eventId` (uuid)

**Request body:** (all optional)
```json
{
  "title": "...",
  "description": "...",
  "image_url": "...",
  "event_date": "...",
  "status": "..."
}
```

---

#### `DELETE /api/owner/clubs/[clubId]/events/[eventId]`
Delete an event.

**Auth:** Required (must own clubId)

---

### Reservations Management

#### `GET /api/owner/clubs/[clubId]/reservations?status=pending|confirmed|cancelled|checked_in`
List all reservations for a club, optionally filtered by status.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)
**Query params:** `status` (optional, filters to one or more status values)

**Response:**
```json
{
  "reservations": [
    {
      "id": "uuid",
      "table_id": "uuid",
      "guest_name": "John Doe",
      "guest_email": "john@example.com",
      "guest_contact": "+63912345678",
      "party_size": 4,
      "reservation_date": "2024-02-14T22:30:00Z",
      "status": "pending",
      "qr_code_token": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

#### `PATCH /api/reservations/[id]`
Owner accepts/declines/cancels a reservation. Accepting generates a `qr_code_token` and moves status to `confirmed`.

**Auth:** Required (must own the club this reservation belongs to)

**Path params:** `id` (uuid)

**Request body:**
```json
{
  "action": "accept|decline|cancel"
}
```

**Response (accept):**
```json
{
  "reservation": {
    "id": "uuid",
    "status": "confirmed",
    "qr_code_token": "uuid (newly generated)",
    "updated_at": "..."
  }
}
```

**Errors:**
- `400` if action is invalid
- `404` if reservation not found or owner doesn't own it
- `409` if reservation is not in `pending` status

---

## Page Routes (Not REST API)

These are Next.js pages, not JSON API endpoints — listed here because they're new and role-gated by `proxy.ts` (see `AGENTS.md`, Route protection). All other pages already existed and aren't re-listed.

| Path | Group | Auth | Notes |
| --- | --- | --- | --- |
| `/employees` | `(owner)` | `owner` session | Lists the caller's club employees and pending invites; invite/revoke/suspend UI. Fetches `GET /api/owner/employees`. |
| `/auth/employee/register` | `app/auth/employee/register` | None (invite token in `?token=` query param is the credential) | Single-step registration page for a redeemed `club_employee_invites` row; calls `checkEmployeeInvite` then `redeemEmployeeInvite`. |
| `/scan` | `(employee)` | `club_employee` session | Landing page for the door-staff check-in flow. |
| `/scan/[token]` | `(employee)` | `club_employee` session | Check-in result for a specific scanned/manually-entered token; calls `POST /api/reservations/checkin`. |

---

## Implementation Notes

- All timestamps are ISO 8601 UTC (e.g. `2024-01-15T10:30:00Z`).
- UUIDs are 36-character lowercase strings with hyphens.
- Monetary values (prices, minimum spend) are decimals with up to 2 decimal places (PHP).
- All request/response bodies use snake_case keys.
- The `X-Guest-Email` header on `GET /api/reservations/[id]` is kept out of the query string to avoid logging guest emails in browser history and access logs.
