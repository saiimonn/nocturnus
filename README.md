# Otus Superadmin Portal

The Superadmin (God-Mode) portal for **Otus**, a Cebu nightclub reservation platform. This is a separate repository from the B2C/B2B consumer app, but it reads and writes the **same Supabase database**.

This portal exists for three core workflows:

1. **B2B white-glove onboarding** — superadmins issue one-time tokens that let venue owners self-register an account and then their own club (owner first, club second).
2. **Global reservation ledger** — a cross-club view of every booking, searchable by guest email, phone, or QR code token.
3. **Financial reconciliation** — tracking PayMongo volume, platform commission, and pending payouts per club.

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
