# API Routes Reference

Complete REST API surface for Otus (Cebu Nightclub Reservation System). See `DB.md` for schema, `AGENTS.md` for implementation details.

## Overview

- **Base URL:** `http://localhost:3000/api` (dev) or `https://otus.example.com/api` (prod)
- **Format:** JSON request/response
- **Error format:** `{ "error": "<code>", "message": "<human-readable>" }`
- **Status codes:** `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Server Error, `501` Not Implemented

## Authentication

- **Public routes:** No auth required (guest browsing, reservation creation, check-in).
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
Bouncer scans a QR code to check a guest in (low-friction, token-only, no session auth).

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
    "reservation_date": "2024-02-14T22:30:00Z"
  }
}
```

**Errors:**
- `400` if `qr_code_token` missing
- `404` if token doesn't match any reservation
- `409` if reservation is already checked in or not in `confirmed` status

---

### Discount Codes

#### `POST /api/discount-codes/validate`
Validate a promo code at checkout (before reservation submission).

**Request body:**
```json
{
  "club_id": "uuid",
  "code": "SUMMER20",
  "subtotal": 5000.00
}
```

**Response (valid):**
```json
{
  "valid": true,
  "code": "SUMMER20",
  "discount_type": "percentage",
  "discount_value": 20,
  "discount_amount": 1000.00
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "reason": "This code has expired"
}
```

**Errors:**
- `400` if required fields missing or subtotal invalid
- `404` if code doesn't exist for that club
- `500` on DB error

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

### Discount Codes

#### `POST /api/owner/clubs/[clubId]/discount-codes`
Create a promotional code.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid)

**Request body:**
```json
{
  "code": "SUMMER20",
  "discount_type": "percentage|fixed_amount",
  "discount_value": 20,
  "start_date": "2024-02-01T00:00:00Z",
  "end_date": "2024-02-28T23:59:59Z",
  "usage_limit": 100,
  "min_order_value": 3000.00,
  "is_active": true
}
```

---

#### `PATCH /api/owner/clubs/[clubId]/discount-codes/[codeId]`
Update a discount code.

**Auth:** Required (must own clubId)

**Path params:** `clubId` (uuid), `codeId` (uuid)

**Request body:** (all optional)
```json
{
  "code": "...",
  "discount_type": "...",
  "discount_value": 25,
  "start_date": "...",
  "end_date": "...",
  "usage_limit": 150,
  "min_order_value": 4000.00,
  "is_active": false
}
```

---

#### `DELETE /api/owner/clubs/[clubId]/discount-codes/[codeId]`
Delete a promotional code.

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

## Implementation Notes

- All timestamps are ISO 8601 UTC (e.g. `2024-01-15T10:30:00Z`).
- UUIDs are 36-character lowercase strings with hyphens.
- Monetary values (prices, discounts) are decimals with up to 2 decimal places (PHP).
- All request/response bodies use snake_case keys.
- The `X-Guest-Email` header on `GET /api/reservations/[id]` is kept out of the query string to avoid logging guest emails in browser history and access logs.
