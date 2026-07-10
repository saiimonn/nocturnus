# Nocturnus — Cebu Nightclub Reservation System

PWA for digitizing nightclub table reservations and VIP bottle service.

## Stack
- **Framework:** Next.js 16.2.4 (App Router) + React 19.2.4 + TypeScript
- **Styling:** Tailwind CSS v4, tw-animate-css, shadcn/ui (base-vega via Base UI)
- **Icons:** lucide-react
- **Canvas:** Konva + react-konva + use-image
- **Maps:** Leaflet + react-leaflet
- **Smooth scroll:** Lenis
- **Backend:** Supabase (PostgreSQL, PostGIS, Realtime WebSockets)
- **Auth:** Supabase Auth (owners/managers only)
- **Fonts:** Geist + Inter (next/font)

## Architecture — Two Route Groups

### `(user)` — Consumer PWA (Guest Access, No Account)
- Venue discovery, distance-based filtering (PostGIS), interactive floorplan booking.
- Frictionless guest checkout — users input name/email/phone, submit a reservation request.
- If accepted, a `qr_code_token` (UUID) is generated for door check-in.
- After booking, user sees a confirmation page with their QR code (screenshot to save).

### `(owner)` — B2B Dashboard (Authenticated)
- Owner management dashboard, event creation, Konva layout editor, table management.
- Onboarding via Superadmin-generated OTP — superadmin generates a random token and sends it directly to the owner via email/message. Owner enters the token to register. The token has no owner association in the database.
- Owners review incoming reservation requests and accept or decline them. Accepting generates a `qr_code_token` for the reservation.
- Scanner page (`/admin/scanner`) for bouncers to scan guest QR tokens and update the live floorplan status to `checked_in`.

## Core Mechanics

### Blueprint Overlay Floorplan
- Konva `<Group>` tables anchored to a static blueprint image.
- `pos_x` / `pos_y` stored as percentages (0.0–1.0) relative to image dimensions.
- Client-side recalculation for 1:1 layout across all screen sizes.

### Table Pricing
- Base pricing set on `Club_Tables.minimum_spend`.
- Pricing is fixed per table — no per-event overrides.

### Discount Codes
- Owners create discount codes for their club (`Discount_Codes` table).
- Users enter a discount code during checkout — it applies if their table's `minimum_spend` meets the code's `min_order_value`.

### Reservation Lifecycle
1. User submits reservation request → status = `pending`
2. Owner reviews and accepts → status = `confirmed`, `qr_code_token` generated
3. User sees QR on confirmation page (no account needed, screenshot to save)
4. Bouncer scans QR at door via `/admin/scanner` → status = `checked_in`
5. Owner can also decline → status = `cancelled`

## Project Structure
```
app/
  (user)/              — consumer routes (browse, events, clubs, currentEvents)
    browse/components/ — co-located route-specific components
  (owner)/             — owner dashboard (dashboard, events, booking, club mgmt)
  auth/                — login / register
components/
  ui/                  — shadcn/ui primitives (button, dialog, sidebar, etc.)
  *.tsx                — app-specific components (UserNav, Header, Sidebar, Footer, etc.)
lib/
  utils.ts             — cn() helper (clsx + tailwind-merge)
hooks/
  use-mobile.ts
data/
  placeholder.ts       — mock/placeholder data
```

## Conventions
- **Zero-Comment Rule:** No inline or block comments in code.
- Co-locate route-specific components in `app/(route)/components/`.
- Use `cn()` from `@/lib/utils` for class merging.
- Client directives (`'use client'`) for interactivity (lenis, event handlers).
- Dark-first theme; CSS variables in `globals.css` (oklch).
- Tailwind v4 syntax (`@import "tailwindcss"`, `@theme`, `@custom-variant`).

### Konva Rules
- Static images in `<Layer listening={false}>`; interactive tables in a separate `<Layer>`.
- Table placement math derives from image bounding box, not viewport.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## References
- @AGENTS.md — Next.js 16 breaking changes
- @DB.md — database schema (PostgreSQL, UUID PKs, UTC timestamps)
