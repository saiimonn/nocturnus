# Otus

The consumer and venue-owner app for **Otus**, a Cebu nightclub reservation platform. It is a separate repository from the superadmin (God-Mode) portal, but reads and writes the **same Supabase database**.

This single Next.js app serves two audiences:

1. **End users (guests, public, no account)** — browse clubs, view events, and book a table as a guest. Guest reservations require no account: identity (`guest_name`/`guest_email`/`guest_contact`) is captured directly on the reservation.
2. **Venue owners (authenticated)** — onboard by redeeming a one-time token (issued elsewhere, by a superadmin) to create an account, then register and run their own club here: details, images, floor plans, tables, events, and reservation management (owner first, club second).

Cross-club administration — token issuance, the global reservation ledger, and financial reconciliation — lives in the separate superadmin portal, not here.

For full architecture, data-layer, auth, and domain details, see [`AGENTS.md`](./AGENTS.md) — it is the single source of truth for how this codebase works and must be kept up to date with every feature change.

## Stack

- **Next.js 16** (App Router) — note this version has breaking API changes vs. older Next; read `node_modules/next/dist/docs/` before writing Next-specific code.
- **Tailwind v4** (CSS-first config, no `tailwind.config.*`)
- **shadcn/ui** (`base-vega` style, built on `@base-ui/react`, not Radix)
- **Supabase** (Postgres + Storage), with a custom credentials auth system (bcrypt + signed JWT session cookie)

## Getting Started

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build (also the only full typecheck)
npm run start    # serve the production build
npm run lint     # eslint
npm run seed     # wipe + reseed Supabase tables with faker data (dev DB only)
```

`npm run seed` requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. See `AGENTS.md` for seeded test accounts and other details.

## Documentation

- [`AGENTS.md`](./AGENTS.md) — architecture, API conventions, auth, and domain context (read this first)
- [`DB.md`](./DB.md) — database schema reference
- [`ROUTES.md`](./ROUTES.md) — route map
