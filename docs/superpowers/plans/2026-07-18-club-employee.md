# Club Employee Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `club_employee` user role scoped to one club, an owner-driven email invite flow, an invite-bound registration page, and a `/scan` page where employees check guests in by QR — showing explicit success/failure states.

**Architecture:** The session JWT currently hardcodes `role: "owner"`; we generalize it to a two-role union and, in the same task, tighten `requireOwner()` so loosening the session does not grant employees owner access. Employees attach to a venue via a new nullable `users.club_id`. Invites live in a new `club_employee_invites` table mirroring the proven hash/expiry/used/revoked shape of `owner_verification_tokens`, but carrying `club_id` + the invited email so a forwarded link is useless. The QR payload becomes a URL so a phone's native camera can tap through to `/scan/[token]`, which is safe only because that route requires an employee session.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (service-role client), Resend + React Email, `qrcode` (generate), `@zxing/browser` (read), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-07-18-club-employee-design.md`

## Global Constraints

- **No test framework exists in this repo.** The only full typecheck is `npm run build` (tsconfig is `noEmit`). Every task verifies with `npm run build` plus a targeted manual check. Do not add a test framework — that is out of scope.
- **Next.js 16 App Router.** Dynamic route `params` is a `Promise` and must be awaited. `RouteContext<T>` already encodes this.
- **Thin-route convention.** Every `app/api/**/route.ts` is a one-line re-export mapping verbs to named handlers in `lib/api/<feature>/api.ts`. No logic in route files.
- **Handlers throw, never hand-build error responses.** Use `badRequest` / `unauthorized` / `forbidden` / `notFound` / `conflict` from `lib/api/shared/errors.ts`; `handle()` serializes them.
- **`supabaseAdmin` (service-role) is server-side only.** Never import it into a client component.
- **Path alias `@/*` maps to the repo root.**
- **Tailwind v4, CSS-first.** No `tailwind.config.*`. `--radius: 0rem` is deliberate — square corners.
- **shadcn/ui is `base-vega` on `@base-ui/react`, not Radix.** Composition uses the `render` prop, not `asChild`.
- **New auth screens use the bespoke dark palette** (`#0a0a0a` page, `#141414` panels), matching `app/auth/login/page.tsx` — deliberately not shadcn/ui.
- **Selects must never include `password_hash` or `token_hash`.**
- **`AGENTS.md` must be updated in this same change** (repo rule in `CLAUDE.md`).
- **Branch:** `feature/club-employee-scan` (already created; the spec commit is on it).
- **Commit messages** end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `supabase/migrations/0002_club_employees.sql` — role value, `users.club_id`, `club_employee_invites`.
- `lib/api/employees/api.ts` — owner-facing employee/invite handlers.
- `app/api/owner/employees/route.ts` — `GET`.
- `app/api/owner/employees/invite/route.ts` — `POST`.
- `app/api/owner/employees/invites/[inviteId]/route.ts` — `DELETE`.
- `app/api/owner/employees/[employeeId]/route.ts` — `PATCH`.
- `app/api/auth/employee-invite/check/route.ts` — `POST`.
- `app/api/auth/employee-invite/redeem/route.ts` — `POST`.
- `emails/employee-invite.tsx` — React Email invite template.
- `app/(owner)/employees/page.tsx` — owner invite/manage screen.
- `app/auth/employee/register/page.tsx` — invite-bound registration.
- `app/(employee)/layout.tsx` — minimal employee shell.
- `app/(employee)/sign-out.tsx` — client sign-out button for the server-component shell.
- `app/(employee)/scan/page.tsx` — live scanner + manual entry.
- `app/(employee)/scan/[token]/page.tsx` — native-camera landing.
- `components/employee/checkin-result.tsx` — shared success/failure UI.

**Modify:**
- `lib/db.ts` — role union, `users.club_id`, `club_employee_invites` types.
- `supabase/schema.sql` — keep canonical DDL in sync with the migration.
- `lib/api/auth/session.ts` — two-role session.
- `lib/api/shared/auth.ts` — tighten `requireOwner`/`getOwnerProfile`, add `requireEmployee`.
- `lib/api/auth/api.ts` — `login` accepts employees; add invite check/redeem.
- `lib/email/client.ts` — generalize `sendReservationEmail` → `sendEmail`.
- `lib/api/reservations/confirmation.ts` — follow the rename.
- `lib/api/reservations/api.ts` — guard + club-scope `checkinReservation`.
- `lib/qr.ts` — encode a URL instead of a bare token.
- `proxy.ts` — role-aware routing.
- `app/auth/login/page.tsx` — redirect by role.
- `components/Sidebar.tsx` — add the Employees nav entry.
- `scripts/seed.ts`, `scripts/seed/factories.ts` — employees + invites, new insert order.
- `AGENTS.md`, `DB.md`, `ROUTES.md`.

---

## Task 1: Install the QR reader dependency

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `@zxing/browser` + `@zxing/library` available to Task 12's scanner.

- [ ] **Step 1: Install**

Run:
```bash
npm install @zxing/browser @zxing/library
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: build completes with no new type errors (installed but not yet imported).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @zxing/browser for QR scanning

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Schema — role, `users.club_id`, invites table

**Files:**
- Create: `supabase/migrations/0002_club_employees.sql`
- Modify: `supabase/schema.sql`, `lib/db.ts`, `DB.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `users.role` accepts `club_employee`; `users.club_id: string | null`; table `club_employee_invites` with columns `id, club_id, email, token_hash, expires_at, used, revoked, invited_by, created_at`. All later tasks type against these.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0002_club_employees.sql`:

```sql
-- Club employees: a third role scoped to exactly one club, plus the invite
-- tokens owners use to create them.

-- 1. Allow the new role. The existing constraint is owner/admin only.
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('owner', 'admin', 'club_employee'));

-- 2. Attach employees to a venue. Null for owner/admin.
alter table public.users
  add column if not exists club_id uuid references public.clubs(id) on delete cascade;

-- An employee must always belong to a club; owners/admins must not.
alter table public.users drop constraint if exists users_club_id_role_check;
alter table public.users
  add constraint users_club_id_role_check
  check (role <> 'club_employee' or club_id is not null);

create index if not exists users_club_id_idx on public.users (club_id);

-- 3. Invite tokens. Mirrors owner_verification_tokens, but deliberately
-- carries club_id + email: an employee invite asserts venue identity, which
-- the owner token deliberately does not.
create table if not exists public.club_employee_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  revoked boolean not null default false,
  invited_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists club_employee_invites_club_id_idx
  on public.club_employee_invites (club_id);

-- At most one live invite per address per club, so an owner cannot pile up
-- duplicate pending invites to the same person.
create unique index if not exists club_employee_invites_one_live_per_email
  on public.club_employee_invites (club_id, lower(email))
  where used = false and revoked = false;

-- RLS on with no policies: all access goes through the service-role client,
-- matching every other table in this schema.
alter table public.club_employee_invites enable row level security;
```

- [ ] **Step 2: Apply the migration**

Apply it against the dev database (Supabase SQL editor, or `psql` against the project connection string). Confirm it succeeds with no error.

- [ ] **Step 3: Verify the constraint actually bites**

Run this in the SQL editor. It MUST fail:

```sql
insert into public.users (full_name, email, password_hash, role)
values ('Bad Employee', 'bad@example.com', 'x', 'club_employee');
```

Expected: `new row for relation "users" violates check constraint "users_club_id_role_check"`.
If it succeeds, the check constraint did not apply — fix before continuing.

- [ ] **Step 4: Mirror the DDL into `supabase/schema.sql`**

`schema.sql` is the canonical full-schema file kept in sync with migrations. Add `club_id uuid references public.clubs(id) on delete cascade` to the `users` table definition, widen its role check to `('owner', 'admin', 'club_employee')`, add the `users_club_id_role_check` constraint, and append the full `club_employee_invites` table + its two indexes exactly as written in Step 1.

- [ ] **Step 5: Update `lib/db.ts`**

In the `users` block, change the role union in **all three** of `Row`, `Insert`, and `Update` from `"owner" | "admin"` to `"owner" | "admin" | "club_employee"`, and add `club_id`:

```ts
// Row
club_id: string | null
// Insert
club_id?: string | null
// Update
club_id?: string | null
```

Then add a new table block after `owner_verification_tokens`:

```ts
      club_employee_invites: {
        Row: {
          id: string
          club_id: string
          email: string
          token_hash: string
          expires_at: string
          used: boolean
          revoked: boolean
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          email: string
          token_hash: string
          expires_at: string
          used?: boolean
          revoked?: boolean
          invited_by: string
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          email?: string
          token_hash?: string
          expires_at?: string
          used?: boolean
          revoked?: boolean
          invited_by?: string
          created_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 6: Update `DB.md`**

Document the two `users` changes (`role` now accepts `club_employee`; new nullable `club_id` FK with its check constraint) and add a `Club_Employee_Invites` table section listing every column from Step 1, noting the partial unique index and that `token_hash` is a sha256 of a token that only ever appears in plaintext in the invite email.

- [ ] **Step 7: Verify the build passes**

Run: `npm run build`
Expected: PASS. The role-union widening is additive, so existing code still compiles.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0002_club_employees.sql supabase/schema.sql lib/db.ts DB.md
git commit -m "feat(db): add club_employee role, users.club_id, and invite table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Two-role session and guards

This is the highest-risk task in the plan. `requireOwner()` today relies on `verifySession` rejecting non-owners implicitly. The moment `verifySession` admits employees, every owner mutation endpoint is employee-accessible unless `requireOwner` asserts the role itself. Steps 1 and 2 must land together.

**Files:**
- Modify: `lib/api/auth/session.ts`, `lib/api/shared/auth.ts`

**Interfaces:**
- Consumes: `users.club_id` from Task 2.
- Produces:
  - `type SessionRole = "owner" | "club_employee"`
  - `interface Session { userId: string; role: SessionRole }`
  - `createSession(payload: Session): Promise<string>`
  - `verifySession(token: string | undefined): Promise<Session | null>`
  - `requireOwner(): Promise<Session>` (asserts `role === "owner"`)
  - `requireEmployee(): Promise<EmployeeSession>` where `interface EmployeeSession { userId: string; role: "club_employee"; clubId: string }`
  - `getOwnerProfile(): Promise<OwnerProfile | null>` (null for non-owners)

- [ ] **Step 1: Generalize the session module**

Replace the type + both functions in `lib/api/auth/session.ts`:

```ts
export type SessionRole = "owner" | "club_employee"

export interface Session {
  userId: string
  role: SessionRole
}

const SESSION_ROLES: SessionRole[] = ["owner", "club_employee"]

export async function createSession(payload: Session): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) {
    return null
  }
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (
      typeof payload.sub !== "string" ||
      !SESSION_ROLES.includes(payload.role as SessionRole)
    ) {
      return null
    }
    return { userId: payload.sub, role: payload.role as SessionRole }
  } catch {
    return null
  }
}
```

Keep `SESSION_COOKIE`, `MAX_AGE_SECONDS`, `sessionCookieOptions`, and `secretKey()` exactly as they are. Update the module doc comment: it is no longer owner-only.

Delete the `OwnerSession` interface — Step 2 replaces its consumers.

- [ ] **Step 2: Tighten the guards and add `requireEmployee`**

Rewrite `lib/api/shared/auth.ts`:

```ts
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { forbidden, notFound, unauthorized } from "./errors"
import {
  SESSION_COOKIE,
  verifySession,
  type Session,
} from "@/lib/api/auth/session"

export type { Session }

async function readSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}

/**
 * Owner guard. The role assertion here is load-bearing: `verifySession` now
 * admits club employees too, so without this check every owner endpoint would
 * be employee-accessible. Do not remove it.
 */
export async function requireOwner(): Promise<Session> {
  const session = await readSession()
  if (!session) {
    throw unauthorized("Authentication required")
  }
  if (session.role !== "owner") {
    throw forbidden("Owner access required")
  }
  return session
}

export interface EmployeeSession {
  userId: string
  role: "club_employee"
  clubId: string
}

/**
 * Employee guard. Resolves the caller's club from `users.club_id` so callers
 * can scope every operation to that one venue.
 */
export async function requireEmployee(): Promise<EmployeeSession> {
  const session = await readSession()
  if (!session) {
    throw unauthorized("Authentication required")
  }
  if (session.role !== "club_employee") {
    throw forbidden("Employee access required")
  }
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, club_id, status")
    .eq("id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!user) {
    throw unauthorized("Authentication required")
  }
  if (user.status === "suspended") {
    throw forbidden("Account suspended")
  }
  if (!user.club_id) {
    throw forbidden("Employee is not assigned to a club")
  }
  return { userId: user.id, role: "club_employee", clubId: user.club_id }
}

export interface OwnerProfile {
  id: string
  full_name: string
  email: string
}

/**
 * Resolves the session cookie to the owner's display profile, or `null` when
 * there is no valid session, the caller is not an owner, or the user no longer
 * exists. Unlike `requireOwner` this never throws, so server components (which
 * have no `handle()` wrapper to serialize an `ApiError`) can render a
 * signed-out state instead of crashing.
 */
export async function getOwnerProfile(): Promise<OwnerProfile | null> {
  const session = await readSession()
  if (!session || session.role !== "owner") {
    return null
  }
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, full_name, email")
    .eq("id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return user ?? null
}

export async function requireClubOwner(clubId: string): Promise<Session> {
  const session = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    throw notFound("Club not found")
  }
  if (club.owner_id !== session.userId) {
    throw forbidden("You do not own this club")
  }
  return session
}
```

- [ ] **Step 3: Fix the remaining `OwnerSession` references**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -40`
Any file still importing `OwnerSession` (from either module) must import `Session` instead. Fix each one; do not re-add an alias.

- [ ] **Step 4: Update the `createSession` call site**

`lib/api/auth/api.ts` calls `createSession({ userId: user.id, role: "owner" })` in two places (`login`, `redeemVerificationToken`). Both still pass `"owner"` — this is correct and needs no change, but confirm both still typecheck.

- [ ] **Step 5: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Manually verify owner access is unbroken**

Run `npm run dev`, log in as `owner@otus.dev` / `password123`, and load `/dashboard`.
Expected: dashboard renders with the owner's name in the sidebar — proving `getOwnerProfile` still resolves for a real owner after the role check was added.

- [ ] **Step 7: Commit**

```bash
git add lib/api/auth/session.ts lib/api/shared/auth.ts
git commit -m "feat(auth): generalize session to two roles, add requireEmployee

verifySession now admits club_employee, so requireOwner and
getOwnerProfile assert role === owner explicitly. Without that,
loosening the session would grant employees owner-level access.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Login accepts employees and returns the role

**Files:**
- Modify: `lib/api/auth/api.ts:31-74`, `app/auth/login/page.tsx`

**Interfaces:**
- Consumes: `Session`, `createSession` from Task 3.
- Produces: `POST /api/auth/login` response body `{ user: { id, full_name, email, role: "owner" | "club_employee" } }`.

- [ ] **Step 1: Widen the `login` handler**

In `lib/api/auth/api.ts`, replace the role rejection and session creation inside `login`. The generic-401 and suspended-403 behavior is preserved exactly:

```ts
  // Generic 401 for missing user, wrong password, or a role that cannot log in
  // (admin) — never disclose which one failed.
  const loginableRole = user?.role === "owner" || user?.role === "club_employee"
  if (!user || !passwordOk || !loginableRole) {
    throw unauthorized("Invalid email or password")
  }

  if (user.status === "suspended") {
    throw forbidden("Account suspended")
  }

  const token = await createSession({
    userId: user.id,
    role: user.role as "owner" | "club_employee",
  })
```

The `Response.json` block already returns `role`, so it needs no change.

- [ ] **Step 2: Redirect by role on the login page**

In `app/auth/login/page.tsx`, the success branch currently does `router.push("/dashboard")`. Read the role off the response and route accordingly:

```tsx
const data = await response.json()
router.push(data.user?.role === "club_employee" ? "/scan" : "/dashboard")
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Manually verify owner login still lands on the dashboard**

Run `npm run dev`, log in as `owner@otus.dev` / `password123`.
Expected: redirected to `/dashboard`. (The employee path is verified in Task 13 once an employee account exists.)

- [ ] **Step 5: Commit**

```bash
git add lib/api/auth/api.ts app/auth/login/page.tsx
git commit -m "feat(auth): allow club_employee login and route by role

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Role-aware route protection

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `verifySession` returning `Session` (Task 3).
- Produces: owners confined to owner routes, employees confined to `/scan`.

- [ ] **Step 1: Rewrite `proxy.ts`**

```ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/api/auth/session"

// Route prefixes belonging to the (owner) group. Note /club/[slug] is a PUBLIC
// (user) page, so only the owner-specific /club/details and /club/layout paths
// appear here.
const OWNER_PREFIXES = [
  "/dashboard",
  "/reservations",
  "/owner-events",
  "/club/details",
  "/club/layout",
  "/employees",
]

// Guards the (owner) and (employee) route groups. Anonymous requests go to
// login; a signed-in user in the wrong group is sent to their own home rather
// than shown a 403, since each role has exactly one place it belongs.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const { pathname } = request.nextUrl
  const isOwnerRoute = OWNER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isOwnerRoute && session.role !== "owner") {
    return NextResponse.redirect(new URL("/scan", request.url))
  }
  if (pathname.startsWith("/scan") && session.role !== "club_employee") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reservations/:path*",
    "/owner-events/:path*",
    "/club/details/:path*",
    "/club/layout/:path*",
    "/employees/:path*",
    "/scan/:path*",
  ],
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Manually verify owner routing and the scan block**

Run `npm run dev`. Logged out, visit `/dashboard` → redirected to `/auth/login`. Log in as the owner → `/dashboard` renders. Then visit `/scan` → redirected back to `/dashboard` (the owner-blocked-from-scan rule).

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): make route protection role-aware

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Generalize the email client

`sendReservationEmail` is no longer reservation-specific once invites use it. Renaming now keeps the invite code honest rather than importing a misnamed helper.

**Files:**
- Modify: `lib/email/client.ts`, `lib/api/reservations/confirmation.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `sendEmail(args: { to: string; subject: string; react: ReactElement }): Promise<boolean>` — resolves `true` when actually sent, `false` when skipped because `RESEND_API_KEY` is unset. Throws on a real send error.

- [ ] **Step 1: Rename and return a sent flag**

In `lib/email/client.ts`, rename the function and change its return type. The `false` return is what lets the invite handler tell "delivered" from "silently skipped in dev" — a distinction the best-effort reservation path did not need:

```ts
// Sends a transactional email rendered from a React Email element. Returns
// true when a send actually happened, and false when RESEND_API_KEY is unset
// (a dev without email configured) — callers that must not silently succeed,
// like employee invites, check this. Throws if Resend rejects the send.
export async function sendEmail(args: {
  to: string
  subject: string
  react: ReactElement
}): Promise<boolean> {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY is unset — skipping send to",
      args.to,
      `(subject: ${args.subject})`,
    )
    return false
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
  return true
}
```

- [ ] **Step 2: Update the existing caller**

In `lib/api/reservations/confirmation.ts`, change the import and call from `sendReservationEmail` to `sendEmail`. Its return value is ignored — that path stays deliberately best-effort.

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: PASS. If it reports `sendReservationEmail` is not exported anywhere else, that call site was missed — fix it.

- [ ] **Step 4: Commit**

```bash
git add lib/email/client.ts lib/api/reservations/confirmation.ts
git commit -m "refactor(email): rename sendReservationEmail to sendEmail

Returns whether a send actually happened, so callers that must not
silently succeed can tell delivery from a dev-mode skip.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Invite email template

**Files:**
- Create: `emails/employee-invite.tsx`

**Interfaces:**
- Consumes: `@react-email/components`.
- Produces: `EmployeeInviteEmail(props: { clubName: string; inviterName: string; registerUrl: string; expiresAt: string }): ReactElement` — default export.

- [ ] **Step 1: Read the existing template for house style**

Read `emails/reservation-confirmed.tsx`. Match its import style, inline-style approach, and dark visual treatment — do not introduce a different styling system.

- [ ] **Step 2: Write the template**

Create `emails/employee-invite.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add emails/employee-invite.tsx
git commit -m "feat(email): add employee invite template

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Owner employee + invite API

**Files:**
- Create: `lib/api/employees/api.ts`, `app/api/owner/employees/route.ts`, `app/api/owner/employees/invite/route.ts`, `app/api/owner/employees/invites/[inviteId]/route.ts`, `app/api/owner/employees/[employeeId]/route.ts`
- Modify: `.env.local` (add `NEXT_PUBLIC_APP_URL`)

**Interfaces:**
- Consumes: `requireOwner` (Task 3), `sendEmail` (Task 6), `EmployeeInviteEmail` (Task 7), `club_employee_invites` (Task 2).
- Produces:
  - `GET /api/owner/employees` → `{ clubId, employees, invites }`
  - `POST /api/owner/employees/invite` body `{ email }` → `{ invite }` (201)
  - `DELETE /api/owner/employees/invites/[inviteId]` → `{ ok: true }`
  - `PATCH /api/owner/employees/[employeeId]` body `{ status }` → `{ employee }`

- [ ] **Step 1: Add the app URL env var**

Add to `.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

This is the base for both the invite link and (in Task 10) the QR payload. In production it must be the deployed origin with no trailing slash.

- [ ] **Step 2: Write the handler module**

Create `lib/api/employees/api.ts`:

```ts
import { createHash, randomBytes } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireOwner } from "@/lib/api/shared/auth"
import {
  badRequest,
  conflict,
  fromDb,
  handle,
  notFound,
  readJson,
  requireFields,
  type RouteContext,
} from "@/lib/api/shared/errors"
import { sendEmail } from "@/lib/email/client"
import EmployeeInviteEmail from "@/emails/employee-invite"

const INVITE_TTL_DAYS = 7
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}

function appUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set")
  }
  return base.replace(/\/$/, "")
}

/**
 * Resolves the calling owner's single club. An owner owns exactly one club
 * (UNIQUE on clubs.owner_id), so `.maybeSingle()` cannot match multiple rows.
 */
async function requireOwnClub(): Promise<{ ownerId: string; clubId: string; clubName: string; ownerName: string }> {
  const session = await requireOwner()
  const { data: club, error } = await supabaseAdmin
    .from("clubs")
    .select("id, name")
    .eq("owner_id", session.userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  if (!club) {
    throw notFound("You have not registered a club yet")
  }
  const { data: owner, error: ownerError } = await supabaseAdmin
    .from("users")
    .select("full_name")
    .eq("id", session.userId)
    .maybeSingle()
  if (ownerError) {
    throw new Error(ownerError.message)
  }
  return {
    ownerId: session.userId,
    clubId: club.id,
    clubName: club.name,
    ownerName: owner?.full_name ?? "Your club owner",
  }
}

export const listEmployees = handle(async () => {
  const { clubId } = await requireOwnClub()

  // Never select password_hash.
  const employees = fromDb(
    await supabaseAdmin
      .from("users")
      .select("id, full_name, email, contact_number, status, created_at")
      .eq("club_id", clubId)
      .eq("role", "club_employee")
      .order("created_at", { ascending: false }),
  )

  // Never select token_hash. Only live invites are of interest.
  const invites = fromDb(
    await supabaseAdmin
      .from("club_employee_invites")
      .select("id, email, expires_at, created_at")
      .eq("club_id", clubId)
      .eq("used", false)
      .eq("revoked", false)
      .order("created_at", { ascending: false }),
  )

  return Response.json({ clubId, employees, invites })
})

export const inviteEmployee = handle(async (request) => {
  const { clubId, clubName, ownerId, ownerName } = await requireOwnClub()
  const body = await readJson(request)
  requireFields(body, ["email"])

  const email = String(body.email).trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw badRequest("Enter a valid email address")
  }

  const { data: existingUser, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, club_id, role")
    .eq("email", email)
    .maybeSingle()
  if (userError) {
    throw new Error(userError.message)
  }
  if (existingUser) {
    throw conflict(
      existingUser.club_id === clubId && existingUser.role === "club_employee"
        ? "This person is already an employee at your club"
        : "An account with this email already exists",
    )
  }

  const { data: liveInvite, error: liveInviteError } = await supabaseAdmin
    .from("club_employee_invites")
    .select("id")
    .eq("club_id", clubId)
    .eq("email", email)
    .eq("used", false)
    .eq("revoked", false)
    .maybeSingle()
  if (liveInviteError) {
    throw new Error(liveInviteError.message)
  }
  if (liveInvite) {
    throw conflict("An invite is already pending for this email")
  }

  const plaintext = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const invite = fromDb(
    await supabaseAdmin
      .from("club_employee_invites")
      .insert({
        club_id: clubId,
        email,
        token_hash: hashToken(plaintext),
        expires_at: expiresAt.toISOString(),
        invited_by: ownerId,
      })
      .select("id, email, expires_at, created_at")
      .single(),
  )

  const registerUrl = `${appUrl()}/auth/employee/register?token=${plaintext}`

  // Unlike the reservation confirmation — which is deliberately best-effort —
  // a failed invite send must fail the request: a silently-unsent invite looks
  // identical to a delivered one, and the plaintext token is unrecoverable
  // after this handler returns. The row has to be inserted before the send
  // (the token must be persisted to be redeemable), so on failure we delete it
  // again; otherwise the partial unique index would block the owner from
  // retrying the same address.
  let sent = false
  try {
    sent = await sendEmail({
      to: email,
      subject: `You're invited to join ${clubName} on Otus`,
      react: EmployeeInviteEmail({
        clubName,
        inviterName: ownerName,
        registerUrl,
        expiresAt: expiresAt.toDateString(),
      }),
    })
  } catch (e) {
    const { error: cleanupError } = await supabaseAdmin
      .from("club_employee_invites")
      .delete()
      .eq("id", invite.id)
    if (cleanupError) {
      // Log only — the send error is what the owner needs to see. The stale
      // invite can still be cleared with Revoke.
      console.error("[invite] failed to roll back invite row:", cleanupError.message)
    }
    throw new Error(
      `Could not send the invite email: ${e instanceof Error ? e.message : String(e)}`,
    )
  }

  if (!sent) {
    // RESEND_API_KEY is unset (dev). The invite is valid, so keep the row and
    // surface the link on the server console so the flow stays testable.
    console.warn(`[invite] email skipped — registration link: ${registerUrl}`)
  }

  return Response.json({ invite }, { status: 201 })
})

export const revokeInvite = handle<RouteContext<{ inviteId: string }>>(
  async (_request, context) => {
    const { clubId } = await requireOwnClub()
    const { inviteId } = await context.params

    const revoked = fromDb(
      await supabaseAdmin
        .from("club_employee_invites")
        .update({ revoked: true })
        .eq("id", inviteId)
        .eq("club_id", clubId)
        .select("id")
        .maybeSingle(),
    )

    return Response.json({ ok: true, id: revoked.id })
  },
)

export const updateEmployee = handle<RouteContext<{ employeeId: string }>>(
  async (request, context) => {
    const { clubId } = await requireOwnClub()
    const { employeeId } = await context.params
    const body = await readJson(request)
    requireFields(body, ["status"])

    const status = String(body.status)
    if (status !== "active" && status !== "suspended") {
      throw badRequest("status must be one of: active, suspended")
    }

    // Scoping by club_id AND role means an owner can never touch another
    // club's staff, nor their own user row, through this endpoint.
    const employee = fromDb(
      await supabaseAdmin
        .from("users")
        .update({ status })
        .eq("id", employeeId)
        .eq("club_id", clubId)
        .eq("role", "club_employee")
        .select("id, full_name, email, status")
        .maybeSingle(),
    )

    return Response.json({ employee })
  },
)
```

- [ ] **Step 3: Write the four thin routes**

`app/api/owner/employees/route.ts`:
```ts
export { listEmployees as GET } from "@/lib/api/employees/api"
```

`app/api/owner/employees/invite/route.ts`:
```ts
export { inviteEmployee as POST } from "@/lib/api/employees/api"
```

`app/api/owner/employees/invites/[inviteId]/route.ts`:
```ts
export { revokeInvite as DELETE } from "@/lib/api/employees/api"
```

`app/api/owner/employees/[employeeId]/route.ts`:
```ts
export { updateEmployee as PATCH } from "@/lib/api/employees/api"
```

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Manually verify the invite round-trip**

Run `npm run dev` and log in as `owner@otus.dev`. In the browser devtools console on any owner page:

```js
await (await fetch('/api/owner/employees/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'doorstaff@example.com' })
})).json()
```

Expected: `201` with an `invite` object containing `id`, `email`, `expires_at` — and **no** `token_hash`. Check the dev server console for the `[invite] email skipped — registration link: ...` line (or a real delivery if `RESEND_API_KEY` is set). **Save that URL — Task 9 needs it.**

Then re-run the exact same fetch.
Expected: `409` "An invite is already pending for this email" — proving the duplicate guard works.

Then confirm the listing:
```js
await (await fetch('/api/owner/employees')).json()
```
Expected: `invites` contains the pending invite; `employees` is empty.

- [ ] **Step 6: Commit**

```bash
git add lib/api/employees app/api/owner/employees
git commit -m "feat(employees): owner invite, list, revoke, and suspend API

Invite sends are not best-effort: a send failure rolls back the invite
row so the partial unique index does not block a retry.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Invite check + redeem, and the registration page

**Files:**
- Modify: `lib/api/auth/api.ts`
- Create: `app/api/auth/employee-invite/check/route.ts`, `app/api/auth/employee-invite/redeem/route.ts`, `app/auth/employee/register/page.tsx`

**Interfaces:**
- Consumes: `club_employee_invites` (Task 2), `createSession` (Task 3).
- Produces:
  - `POST /api/auth/employee-invite/check` body `{ token }` → `{ valid: true, email, clubName }`
  - `POST /api/auth/employee-invite/redeem` body `{ token, full_name, password, contact_number? }` → `{ user }` (201) + session cookie

- [ ] **Step 1: Add both handlers to `lib/api/auth/api.ts`**

Append to the file. Note `hashToken` already exists there from the owner flow — reuse it, do not redefine it:

```ts
export const checkEmployeeInvite = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token"])
  const tokenHash = hashToken(String(body.token))

  const { data: invite, error } = await supabaseAdmin
    .from("club_employee_invites")
    .select("email, used, revoked, expires_at, clubs(name)")
    .eq("token_hash", tokenHash)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }

  if (
    !invite ||
    invite.used ||
    invite.revoked ||
    new Date(invite.expires_at) <= new Date()
  ) {
    throw unauthorized("This invitation is invalid or has expired")
  }

  const club = invite.clubs as unknown as { name: string } | null

  return Response.json({
    valid: true,
    email: invite.email,
    clubName: club?.name ?? "your club",
  })
})

export const redeemEmployeeInvite = handle(async (request) => {
  const body = await readJson(request)
  requireFields(body, ["token", "full_name", "password"])

  if (typeof body.full_name !== "string" || body.full_name.trim() === "") {
    throw badRequest("full_name must be a non-empty string")
  }

  const password = String(body.password)
  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters")
  }

  const tokenHash = hashToken(String(body.token))

  // Read the invite first so we know the bound email. The email comes from
  // this row and NEVER from the request body — that binding is what makes a
  // forwarded invite link useless to anyone else.
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("club_employee_invites")
    .select("id, club_id, email")
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .eq("revoked", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  if (inviteError) {
    throw new Error(inviteError.message)
  }
  if (!invite) {
    throw unauthorized("This invitation is invalid or has expired")
  }

  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", invite.email)
    .maybeSingle()
  if (existingUserError) {
    throw new Error(existingUserError.message)
  }
  if (existingUser) {
    throw conflict("An account with this email already exists")
  }

  // Atomically claim the invite before creating the user, so a losing race
  // never produces a duplicate account. Same pattern as the owner flow.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("club_employee_invites")
    .update({ used: true })
    .eq("id", invite.id)
    .eq("used", false)
    .select("id")
    .maybeSingle()
  if (claimError) {
    throw new Error(claimError.message)
  }
  if (!claimed) {
    throw unauthorized("This invitation has already been used")
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = fromDb<NewUserRow>(
    await supabaseAdmin
      .from("users")
      .insert({
        full_name: String(body.full_name).trim(),
        email: invite.email,
        contact_number:
          (body.contact_number as string | undefined)?.trim() || null,
        password_hash: passwordHash,
        role: "club_employee",
        club_id: invite.club_id,
        status: "active",
      })
      .select("id, full_name, email, role")
      .single(),
  )

  const token = await createSession({ userId: user.id, role: "club_employee" })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions)

  return Response.json({ user }, { status: 201 })
})
```

- [ ] **Step 2: Write the two thin routes**

`app/api/auth/employee-invite/check/route.ts`:
```ts
export { checkEmployeeInvite as POST } from "@/lib/api/auth/api"
```

`app/api/auth/employee-invite/redeem/route.ts`:
```ts
export { redeemEmployeeInvite as POST } from "@/lib/api/auth/api"
```

- [ ] **Step 3: Write the registration page**

Create `app/auth/employee/register/page.tsx`. It mirrors the visual language of `app/auth/register/page.tsx` (bespoke dark palette, not shadcn/ui) but is a single step, since the invite supplies the email:

```tsx
"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Phase = "checking" | "invalid" | "ready" | "submitting"

function EmployeeRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [phase, setPhase] = useState<Phase>("checking")
  const [inviteError, setInviteError] = useState("")
  const [email, setEmail] = useState("")
  const [clubName, setClubName] = useState("")

  const [fullName, setFullName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!token) {
      setPhase("invalid")
      setInviteError("This link is missing its invitation code.")
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch("/api/auth/employee-invite/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await response.json()
        if (cancelled) return
        if (!response.ok) {
          setPhase("invalid")
          setInviteError(data.message ?? "This invitation is invalid or has expired.")
          return
        }
        setEmail(data.email)
        setClubName(data.clubName)
        setPhase("ready")
      } catch {
        if (cancelled) return
        setPhase("invalid")
        setInviteError("Could not verify this invitation. Check your connection and try again.")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError("")

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }

    setPhase("submitting")
    try {
      const response = await fetch("/api/auth/employee-invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName,
          password,
          contact_number: contactNumber || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setFormError(data.message ?? "Could not complete registration.")
        setPhase("ready")
        return
      }
      router.push("/scan")
      router.refresh()
    } catch {
      setFormError("Something went wrong. Please try again.")
      setPhase("ready")
    }
  }

  if (phase === "checking") {
    return <p className="text-sm text-neutral-400">Checking your invitation…</p>
  }

  if (phase === "invalid") {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-white">Invitation unavailable</h1>
        <p className="text-sm text-neutral-400">{inviteError}</p>
        <p className="text-sm text-neutral-500">
          Ask your club owner to send a new invitation.
        </p>
      </div>
    )
  }

  const busy = phase === "submitting"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white">Join {clubName}</h1>
        <p className="text-sm text-neutral-400">
          Set up your account to start checking guests in.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wide text-neutral-500">
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          aria-describedby="email-note"
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-neutral-400 outline-none ring-1 ring-neutral-800"
        />
        <p id="email-note" className="text-xs text-neutral-600">
          This invitation is tied to this address and cannot be changed.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="block text-xs uppercase tracking-wide text-neutral-500">
          Full name
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contactNumber" className="block text-xs uppercase tracking-wide text-neutral-500">
          Contact number <span className="text-neutral-700">(optional)</span>
        </label>
        <input
          id="contactNumber"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs uppercase tracking-wide text-neutral-500">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
        <p className="text-xs text-neutral-600">At least 8 characters.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wide text-neutral-500">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
        />
      </div>

      {formError ? <p className="text-sm text-red-400">{formError}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Creating your account…" : "Create account"}
      </button>
    </form>
  )
}

export default function EmployeeRegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm bg-[#141414] p-8">
        <Suspense fallback={<p className="text-sm text-neutral-400">Loading…</p>}>
          <EmployeeRegisterForm />
        </Suspense>
      </div>
    </main>
  )
}
```

Note the `Suspense` wrapper: `useSearchParams` requires it in the App Router, and the build will fail without it.

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Manually register an employee**

Run `npm run dev` and open the registration URL saved from Task 8 Step 5.
Expected: the page shows "Join {club name}", with the email pre-filled and read-only.
Fill in a name and a password of at least 8 characters, submit.
Expected: redirected to `/scan`. It will 404 until Task 12 — that is correct at this point. What matters is that no error appeared and the redirect fired.

- [ ] **Step 6: Verify the invite is now spent and the account is correct**

In the Supabase SQL editor:

```sql
select role, club_id, status from public.users where email = 'doorstaff@example.com';
select used from public.club_employee_invites where email = 'doorstaff@example.com';
```

Expected: one user with `role = 'club_employee'`, a non-null `club_id`, `status = 'active'`; and the invite row with `used = true`.

Then reopen the same registration URL in the browser.
Expected: "Invitation unavailable" — single-use enforced.

- [ ] **Step 7: Commit**

```bash
git add lib/api/auth/api.ts app/api/auth/employee-invite app/auth/employee
git commit -m "feat(auth): employee invite check/redeem and registration page

The account email is read from the invite row, never the request body,
so a forwarded invite link is useless to a third party.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: QR payload becomes a URL

**Files:**
- Modify: `lib/qr.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_APP_URL` (Task 8 Step 1).
- Produces: `generateQrPng(token: string): Promise<Buffer>` — unchanged signature, now encoding a URL. Callers need no change.

- [ ] **Step 1: Encode the scan URL**

Replace `lib/qr.ts`:

```ts
import QRCode from "qrcode"

// Encodes a reservation's qr_code_token as a PNG QR code containing the full
// check-in URL, not the bare token. A phone's native camera app only offers a
// tap-through when the payload is a URL, which is what lets door staff scan
// with the camera they already have.
//
// This is safe only because /scan/[token] requires a club_employee session.
// The QR lives in the guest's own inbox, so an unguarded link would let guests
// check themselves in from home. Do not weaken that guard.
export async function generateQrPng(token: string): Promise<Buffer> {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set")
  }
  const url = `${base.replace(/\/$/, "")}/scan/${encodeURIComponent(token)}`
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  })
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/qr.ts
git commit -m "feat(qr): encode the scan URL so native cameras can tap through

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Guard and club-scope check-in

**Files:**
- Modify: `lib/api/reservations/api.ts:182-215`

**Interfaces:**
- Consumes: `requireEmployee` (Task 3).
- Produces: `POST /api/reservations/checkin` body `{ qr_code_token }` → `{ reservation: { id, status, guest_name, party_size, reservation_date, table_label, event_title } }`. Requires an employee session.

- [ ] **Step 1: Rewrite `checkinReservation`**

Replace the handler. Three changes: the guard, the anon→admin client switch, and the club scope check:

```ts
export const checkinReservation = handle(async (request) => {
  const session = await requireEmployee()
  const body = await readJson(request)
  requireFields(body, ["qr_code_token"])

  const { data: existing, error } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("qr_code_token", String(body.qr_code_token))
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  // A token from another venue is reported as not-found rather than forbidden,
  // so the response never reveals that the code is valid somewhere else.
  if (!existing || existing.club_id !== session.clubId) {
    throw notFound("No reservation matches that code")
  }
  if (existing.status === "checked_in") {
    throw conflict("This reservation has already been checked in")
  }
  if (existing.status !== "confirmed") {
    throw conflict(`A ${existing.status} reservation cannot be checked in`)
  }

  const reservation = fromDb(
    await supabaseAdmin
      .from("reservations")
      .update({ status: "checked_in" })
      .eq("id", existing.id)
      .select("id, status, guest_name, party_size, reservation_date")
      .maybeSingle(),
  )

  // Resolve display context for the door screen. Neither lookup is allowed to
  // fail the check-in — the guest is already through at this point.
  const { data: table } = await supabaseAdmin
    .from("club_tables")
    .select("label")
    .eq("id", existing.table_id)
    .maybeSingle()

  const event = existing.event_id
    ? (
        await supabaseAdmin
          .from("events")
          .select("title")
          .eq("id", existing.event_id)
          .maybeSingle()
      ).data
    : null

  return Response.json({
    reservation: {
      ...reservation,
      table_label: table?.label ?? null,
      event_title: event?.title ?? null,
    },
  })
})
```

- [ ] **Step 2: Add the `requireEmployee` import**

`lib/api/reservations/api.ts` currently imports only `requireClubOwner` from the shared auth module. Widen it:

```ts
import { requireClubOwner, requireEmployee } from "@/lib/api/shared/auth"
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: PASS. If `supabase` (the anon client) is now unused in this file, remove its import; if other handlers still use it, leave it.

- [ ] **Step 4: Manually verify the endpoint now rejects anonymous callers**

Run `npm run dev`. In a **private/incognito** window (no session cookie), open devtools and run:

```js
await (await fetch('http://localhost:3000/api/reservations/checkin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ qr_code_token: 'anything' })
})).json()
```

Expected: `401 unauthorized`. Before this task the same call reached the database. This is the security gap closing — confirm it.

- [ ] **Step 5: Commit**

```bash
git add lib/api/reservations/api.ts
git commit -m "fix(reservations): require an employee session to check in

checkinReservation was unauthenticated and club-agnostic, so any caller
holding a token could check in a reservation at any club. It now
requires a club_employee session and rejects tokens belonging to another
venue as not-found, so the response does not leak their validity.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Employee shell, scan pages, and result UI

**Files:**
- Create: `components/employee/checkin-result.tsx`, `app/(employee)/layout.tsx`, `app/(employee)/sign-out.tsx`, `app/(employee)/scan/page.tsx`, `app/(employee)/scan/[token]/page.tsx`

**Interfaces:**
- Consumes: `POST /api/reservations/checkin` (Task 11), `@zxing/browser` (Task 1).
- Produces:
  - `type CheckinState = { kind: "idle" } | { kind: "working" } | { kind: "success"; reservation: CheckedInReservation } | { kind: "failure"; message: string }`
  - `interface CheckedInReservation { id: string; guest_name: string; party_size: number; reservation_date: string; table_label: string | null; event_title: string | null }`
  - `checkInToken(token: string): Promise<CheckinState>`
  - `<CheckinResult state={CheckinState} onReset={() => void} />`

- [ ] **Step 1: Write the shared result component**

Create `components/employee/checkin-result.tsx`. It owns both the types and the fetch, so the two pages share one definition of what check-in means:

```tsx
"use client"

export interface CheckedInReservation {
  id: string
  guest_name: string
  party_size: number
  reservation_date: string
  table_label: string | null
  event_title: string | null
}

export type CheckinState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "success"; reservation: CheckedInReservation }
  | { kind: "failure"; message: string }

/**
 * Extracts the token from a scanned payload. QRs encode a full /scan/{token}
 * URL, but older reservations were emailed a bare token, and staff can type
 * either into the manual field — so accept both.
 */
export function extractToken(raw: string): string {
  const value = raw.trim()
  if (!value) return ""
  try {
    const url = new URL(value)
    const segments = url.pathname.split("/").filter(Boolean)
    return decodeURIComponent(segments[segments.length - 1] ?? "")
  } catch {
    return value
  }
}

export async function checkInToken(token: string): Promise<CheckinState> {
  if (!token) {
    return { kind: "failure", message: "No code was read. Try again." }
  }
  try {
    const response = await fetch("/api/reservations/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_code_token: token }),
    })
    const data = await response.json()
    if (!response.ok) {
      return {
        kind: "failure",
        message: data.message ?? "This code could not be checked in.",
      }
    }
    return { kind: "success", reservation: data.reservation }
  } catch {
    return {
      kind: "failure",
      message: "Could not reach the server. Check the connection and try again.",
    }
  }
}

export function CheckinResult({
  state,
  onReset,
}: {
  state: CheckinState
  onReset?: () => void
}) {
  if (state.kind === "idle") return null

  if (state.kind === "working") {
    return (
      <div className="w-full bg-[#141414] p-6 text-center">
        <p className="text-sm text-neutral-400">Checking in…</p>
      </div>
    )
  }

  if (state.kind === "failure") {
    return (
      <div
        role="alert"
        className="w-full border-l-4 border-red-500 bg-red-950/40 p-6 text-center"
      >
        <p className="text-3xl font-bold text-red-400">Not checked in</p>
        <p className="mt-2 text-base text-red-200">{state.message}</p>
        {onReset ? (
          <button
            onClick={onReset}
            className="mt-5 bg-white px-5 py-2 text-sm font-semibold text-[#0a0a0a]"
          >
            Scan next guest
          </button>
        ) : null}
      </div>
    )
  }

  const { reservation } = state
  return (
    <div
      role="status"
      className="w-full border-l-4 border-emerald-500 bg-emerald-950/40 p-6 text-center"
    >
      <p className="text-3xl font-bold text-emerald-400">Checked in</p>
      <p className="mt-3 text-2xl font-semibold text-white">
        {reservation.guest_name}
      </p>
      <p className="mt-1 text-base text-emerald-100">
        Party of {reservation.party_size}
        {reservation.table_label ? ` · Table ${reservation.table_label}` : ""}
      </p>
      {reservation.event_title ? (
        <p className="mt-1 text-sm text-emerald-200/70">{reservation.event_title}</p>
      ) : null}
      {onReset ? (
        <button
          onClick={onReset}
          className="mt-5 bg-white px-5 py-2 text-sm font-semibold text-[#0a0a0a]"
        >
          Scan next guest
        </button>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Write the employee shell**

Create `app/(employee)/layout.tsx`. It is a server component that resolves the employee's club name for the header, and deliberately renders no sidebar — this is a phone held at a door:

```tsx
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { SESSION_COOKIE, verifySession } from "@/lib/api/auth/session"
import { EmployeeSignOut } from "./sign-out"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session || session.role !== "club_employee") {
    redirect("/auth/login")
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("full_name, clubs(name)")
    .eq("id", session.userId)
    .maybeSingle()

  const club = user?.clubs as unknown as { name: string } | null

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{club?.name ?? "Otus"}</p>
          <p className="text-xs text-neutral-500">{user?.full_name ?? ""}</p>
        </div>
        <EmployeeSignOut />
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Write the sign-out control**

Create `app/(employee)/sign-out.tsx` — the layout is a server component, so the button needs its own client boundary:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function EmployeeSignOut() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="text-xs text-neutral-400 underline underline-offset-4 disabled:opacity-50"
    >
      Sign out
    </button>
  )
}
```

- [ ] **Step 4: Write the scanner page**

Create `app/(employee)/scan/page.tsx`:

```tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"
import {
  CheckinResult,
  checkInToken,
  extractToken,
  type CheckinState,
} from "@/components/employee/checkin-result"

const RESET_AFTER_MS = 4000

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [state, setState] = useState<CheckinState>({ kind: "idle" })
  const [cameraError, setCameraError] = useState("")
  const [manualCode, setManualCode] = useState("")

  // Held in a ref so the scan callback (registered once) always sees the
  // current value without re-subscribing the camera on every state change.
  const busyRef = useRef(false)

  const submit = useCallback(async (raw: string) => {
    if (busyRef.current) return
    busyRef.current = true
    setState({ kind: "working" })
    const result = await checkInToken(extractToken(raw))
    setState(result)
  }, [])

  const reset = useCallback(() => {
    busyRef.current = false
    setState({ kind: "idle" })
    setManualCode("")
  }, [])

  // Auto-clear so the next guest can be scanned without touching the screen.
  useEffect(() => {
    if (state.kind !== "success" && state.kind !== "failure") return
    const timer = setTimeout(reset, RESET_AFTER_MS)
    return () => clearTimeout(timer)
  }, [state, reset])

  useEffect(() => {
    const reader = new BrowserQRCodeReader()
    let cancelled = false

    ;(async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result) => {
            if (result) {
              void submit(result.getText())
            }
          },
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      } catch {
        if (!cancelled) {
          setCameraError(
            "Camera unavailable. Enter the code below instead.",
          )
        }
      }
    })()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [submit])

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Scan guest QR</h1>
        <p className="text-sm text-neutral-500">
          Point the camera at the code in the guest&apos;s confirmation email.
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-black ring-1 ring-neutral-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {cameraError ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-neutral-400">
            {cameraError}
          </p>
        ) : null}
      </div>

      <CheckinResult state={state} onReset={reset} />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submit(manualCode)
        }}
        className="space-y-2"
      >
        <label htmlFor="manualCode" className="block text-xs uppercase tracking-wide text-neutral-500">
          Or enter the code manually
        </label>
        <div className="flex gap-2">
          <input
            id="manualCode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Reservation code"
            className="flex-1 bg-[#141414] px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-800 focus:ring-neutral-600"
          />
          <button
            type="submit"
            className="bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a]"
          >
            Check in
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Write the native-camera landing page**

Create `app/(employee)/scan/[token]/page.tsx`. This is what a phone's camera app opens when it reads the QR:

```tsx
"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  CheckinResult,
  checkInToken,
  type CheckinState,
} from "@/components/employee/checkin-result"

export default function ScanTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [state, setState] = useState<CheckinState>({ kind: "working" })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkInToken(decodeURIComponent(token))
      if (!cancelled) {
        setState(result)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="w-full max-w-sm space-y-5">
      <CheckinResult state={state} />
      <Link
        href="/scan"
        className="block bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0a0a0a]"
      >
        Scan next guest
      </Link>
    </div>
  )
}
```

Note `use(params)` — Next 16 delivers `params` as a Promise to client components too.

- [ ] **Step 6: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Manually verify the full door flow**

Run `npm run dev`.

1. Log in as `owner@otus.dev`, go to `/reservations/requests`, and Confirm a pending reservation. This generates its `qr_code_token` and sends the guest email.
2. Read that reservation's token from the Supabase SQL editor:
   ```sql
   select qr_code_token, guest_name, club_id from public.reservations where status = 'confirmed' limit 1;
   ```
3. Log out, then log in as the employee registered in Task 9.
   Expected: you land on `/scan` and the camera preview requests permission.
4. Paste the token into the manual field and submit.
   Expected: a large green "Checked in" panel with the guest name, party size, and table label — auto-clearing after about four seconds.
5. Submit the same token again.
   Expected: a red "Not checked in" panel reading "This reservation has already been checked in".
6. Submit a nonsense string.
   Expected: red, "No reservation matches that code".
7. Visit `http://localhost:3000/scan/<that-same-token>` directly.
   Expected: the `[token]` page renders the already-checked-in red state — confirming the native-camera path reaches the same endpoint.

- [ ] **Step 8: Commit**

```bash
git add components/employee "app/(employee)"
git commit -m "feat(employee): add scan page, native-camera landing, and shell

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Owner employees page and navigation

**Files:**
- Create: `app/(owner)/employees/page.tsx`
- Modify: `components/Sidebar.tsx`

**Interfaces:**
- Consumes: the four endpoints from Task 8.
- Produces: the owner-facing UI. No exports other pages depend on.

- [ ] **Step 1: Write the employees page**

Create `app/(owner)/employees/page.tsx`. It follows the established owner-page pattern — a client component that fetches on mount and renders loading/error/empty states:

```tsx
"use client"

import { useCallback, useEffect, useState } from "react"

interface Employee {
  id: string
  full_name: string
  email: string
  contact_number: string | null
  status: "active" | "suspended"
  created_at: string
}

interface Invite {
  id: string
  email: string
  expires_at: string
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteNotice, setInviteNotice] = useState("")

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/owner/employees")
      const data = await response.json()
      if (!response.ok) {
        setLoadError(data.message ?? "Could not load employees.")
        return
      }
      setEmployees(data.employees ?? [])
      setInvites(data.invites ?? [])
      setLoadError("")
    } catch {
      setLoadError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    setInviteError("")
    setInviteNotice("")
    setInviting(true)
    try {
      const response = await fetch("/api/owner/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        setInviteError(data.message ?? "Could not send the invite.")
        return
      }
      setInviteNotice(`Invitation sent to ${data.invite.email}.`)
      setEmail("")
      await load()
    } catch {
      setInviteError("Could not reach the server.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(inviteId: string) {
    const response = await fetch(`/api/owner/employees/invites/${inviteId}`, {
      method: "DELETE",
    })
    if (response.ok) {
      await load()
    }
  }

  async function handleToggleStatus(employee: Employee) {
    const response = await fetch(`/api/owner/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: employee.status === "active" ? "suspended" : "active",
      }),
    })
    if (response.ok) {
      await load()
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading employees…</p>
  }

  if (loadError) {
    return <p className="p-6 text-sm text-destructive">{loadError}</p>
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="text-sm text-muted-foreground">
          Invite door staff to check guests in. They can only access the scan
          screen.
        </p>
      </div>

      <form onSubmit={handleInvite} className="max-w-md space-y-2">
        <label htmlFor="inviteEmail" className="block text-sm font-medium">
          Invite by email
        </label>
        <div className="flex gap-2">
          <input
            id="inviteEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="flex-1 border bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Invite"}
          </button>
        </div>
        {inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}
        {inviteNotice ? <p className="text-sm text-muted-foreground">{inviteNotice}</p> : null}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending invitations
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="divide-y border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(invite.id)}
                  className="text-xs text-destructive underline underline-offset-4"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Employees
        </h2>
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No employees yet. Invite someone above.
          </p>
        ) : (
          <ul className="divide-y border">
            {employees.map((employee) => (
              <li key={employee.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm">{employee.full_name}</p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      employee.status === "active"
                        ? "text-xs text-emerald-600"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {employee.status === "active" ? "Active" : "Suspended"}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(employee)}
                    className="text-xs underline underline-offset-4"
                  >
                    {employee.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Add the sidebar entry**

`components/Sidebar.tsx` holds four `NavigationType[]` arrays (`dashboardNavigation`, `customizationNavigation`, `bookingNavigation`, `eventsNavigation`), each rendered as its own group. Add a fifth after `eventsNavigation`:

```tsx
const staffNavigation: NavigationType[] = [
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
  }
]
```

Add `Users` to the existing `lucide-react` import. Then render it alongside the others, copying the exact `SidebarGroup` markup already used for `eventsNavigation` and substituting `staffNavigation` — match the surrounding structure rather than inventing new markup.

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Manually verify the page and its guards**

Run `npm run dev`, log in as `owner@otus.dev`, click Employees in the sidebar.
Expected: the page lists the employee registered in Task 9 and any pending invites.

- Invite a fresh address → success notice, and it appears under pending invitations.
- Click Revoke on it → it disappears from the list.
- Click Suspend on the employee → status flips to Suspended.
- Now open a private window and try to log in as that suspended employee.
  Expected: `403` "Account suspended" — proving suspension actually closes door access.
- Reactivate the employee, then log in as them and visit `/employees`.
  Expected: redirected to `/scan` by the proxy.

- [ ] **Step 5: Commit**

```bash
git add "app/(owner)/employees" components/Sidebar.tsx
git commit -m "feat(owner): add employees invite and management page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Seed employees and invites

**Files:**
- Modify: `scripts/seed.ts`, `scripts/seed/factories.ts`

**Interfaces:**
- Consumes: the Task 2 schema.
- Produces: `makeClubEmployee(clubId: string, passwordHash: string, overrides?: Partial<UserInsert>): UserInsert`; a seeded `employee@otus.dev` account.

- [ ] **Step 1: Read the existing factory and seed flow**

Read `scripts/seed/factories.ts` and the insert section of `scripts/seed.ts` in full before editing. The changes below must match the existing style for building rows and the existing logging.

- [ ] **Step 2: Add the employee factory**

In `scripts/seed/factories.ts`, add alongside `makeUser`. Match how `makeUser` builds its row — this version pins the role and requires a club:

```ts
export function makeClubEmployee(
  clubId: string,
  passwordHash: string,
  overrides: Partial<UserInsert> = {},
): UserInsert {
  return {
    full_name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    contact_number: faker.phone.number(),
    password_hash: passwordHash,
    role: "club_employee",
    club_id: clubId,
    status: "active",
    ...overrides,
  }
}
```

Use whatever the file already names its user-insert type; if it imports `Database` directly, use `Database["public"]["Tables"]["users"]["Insert"]`.

- [ ] **Step 3: Fix the insert order for the circular FK**

`users.club_id → clubs` and `clubs.owner_id → users` form a cycle, so employees cannot be inserted in the existing `users → clubs` step. In `scripts/seed.ts`:

- Add `employeesPerClub: 2` to `COUNTS`.
- Add `const FIXED_EMPLOYEE = { email: "employee@otus.dev", full_name: "Demo Door Staff" }` beside `FIXED_OWNER` / `FIXED_ADMIN`.
- Leave the existing owners/admins insert exactly where it is.
- **After** clubs are inserted, add a new step that builds `COUNTS.employeesPerClub` employees per club with `makeClubEmployee(club.id, passwordHash)`, forcing the first employee of the **first** club to `FIXED_EMPLOYEE`'s email and name, then inserts them into `users`.
- Add `"club_employee_invites"` to `WIPE_ORDER`, positioned **before** `"clubs"` and `"users"` (it references both).

- [ ] **Step 4: Print the fixed employee with the other accounts**

Extend the credentials summary at the end of the run so it lists `employee@otus.dev` alongside `owner@otus.dev` and `admin@otus.dev`, with the same shared `SEED_PASSWORD`.

- [ ] **Step 5: Run the seed**

Run: `npm run seed`
Expected: completes with no FK violation, and the summary lists all three fixed accounts.

If it fails with `violates foreign key constraint`, the employee insert is still running before clubs — recheck Step 3.

- [ ] **Step 6: Verify the seeded data**

In the Supabase SQL editor:

```sql
select count(*) from public.users where role = 'club_employee';
select u.email, u.club_id, c.name
from public.users u join public.clubs c on c.id = u.club_id
where u.email = 'employee@otus.dev';
```

Expected: a non-zero count, and `employee@otus.dev` attached to a real club.

- [ ] **Step 7: Verify the seeded employee can work the door**

Run `npm run dev`, log in as `employee@otus.dev` / `password123`.
Expected: redirected to `/scan`, with the correct club name in the header.

- [ ] **Step 8: Commit**

```bash
git add scripts/seed.ts scripts/seed/factories.ts
git commit -m "feat(seed): seed club employees and a fixed employee account

users.club_id and clubs.owner_id form a FK cycle, so employees insert
after clubs rather than in the original users step.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Documentation

The repo rule in `CLAUDE.md` is that `AGENTS.md` must describe what the code actually does. This change invalidates several of its sections.

**Files:**
- Modify: `AGENTS.md`, `ROUTES.md`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing code-facing.

- [ ] **Step 1: Update the Authentication section of `AGENTS.md`**

Rewrite these claims, each of which is now false:

- *"Only `role === "owner"` can log in"* → `owner` and `club_employee` can log in; `admin` cannot.
- The session contract: `OwnerSession` is now `Session { userId, role: "owner" | "club_employee" }`, and `verifySession` admits both roles. State explicitly that `requireOwner()` and `getOwnerProfile()` carry their own `role === "owner"` assertions, and why removing them would grant employees owner access.
- Document `requireEmployee()` — what it returns (`{ userId, role, clubId }`), that it resolves `users.club_id`, and that it rejects suspended accounts.
- **Route protection:** `proxy.ts` is now role-aware, with the `OWNER_PREFIXES` list, `/employees` and `/scan/:path*` added to the matcher, and the cross-role redirects.
- Login UI now routes by role.

- [ ] **Step 2: Document the employee flows**

Add a subsection covering: the `club_employee_invites` table and why it is separate from `owner_verification_tokens` (the owner token is deliberately club-less; an employee invite asserts venue identity); the four owner endpoints; `checkEmployeeInvite`/`redeemEmployeeInvite` and the email-from-invite-row binding; and that **invite email sends are not best-effort** — a failure rolls back the invite row, in deliberate contrast to the reservation confirmation.

- [ ] **Step 3: Correct the check-in and QR descriptions**

- `checkinReservation` now requires `requireEmployee()`, uses the service-role client, and rejects other clubs' tokens as `notFound`. Remove the "door scanner UI ... not yet built" claim.
- `lib/qr.ts` encodes `${NEXT_PUBLIC_APP_URL}/scan/{token}`, not the raw token. Note the guard is what makes this safe.
- Add `NEXT_PUBLIC_APP_URL` to the env vars alongside `RESEND_API_KEY` / `EMAIL_FROM`.

- [ ] **Step 4: Fix the stale sidebar reference**

`AGENTS.md` currently describes navigation as `navGroups` in `components/app-sidebar.tsx`. Neither exists. Correct it to `components/Sidebar.tsx` with its five `NavigationType[]` arrays (`dashboardNavigation`, `customizationNavigation`, `bookingNavigation`, `eventsNavigation`, `staffNavigation`), and note that active state is driven by `href`.

- [ ] **Step 5: Update the Architecture and seeding sections**

- Architecture: a third top-level route group, `app/(employee)/*`, holding only `scan` — minimal chrome, no sidebar.
- Domain Context: add a fourth workflow, "Working the door (employee-only)," and note under workflow 2 that employee onboarding is invite-based and club-bound, unlike the club-less owner token.
- Seeding: employees insert after clubs because of the FK cycle; `employee@otus.dev` is a third fixed account.

- [ ] **Step 6: Update `ROUTES.md`**

Add: `/employees`, `/auth/employee/register`, `/scan`, `/scan/[token]`, and the six new API routes.

- [ ] **Step 7: Verify the docs match reality**

Re-read the changed sections against the code. Every file path, function name, and endpoint mentioned must exist. Grep any path you cite:

```bash
git grep -n "requireEmployee" -- lib
git grep -n "staffNavigation" -- components
```

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md ROUTES.md
git commit -m "docs: document the club_employee role and scan flow

Also corrects a stale sidebar reference: AGENTS.md described
components/app-sidebar.tsx with a navGroups array, but the real file is
components/Sidebar.tsx with per-group NavigationType arrays.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final Verification

After all tasks, run the full negative-case sweep from the spec. Each of these is a security or correctness boundary, not a nicety:

- [ ] Employee visits `/dashboard` → redirected to `/scan`
- [ ] Owner visits `/scan` → redirected to `/dashboard`
- [ ] Logged out, visit `/scan` → redirected to `/auth/login`
- [ ] Anonymous `POST /api/reservations/checkin` → `401`
- [ ] Employee calls `GET /api/owner/employees` → `403` (the `requireOwner` tightening)
- [ ] Revoked invite link → "Invitation unavailable"
- [ ] Already-used invite link → "Invitation unavailable"
- [ ] Expired invite (set `expires_at` to the past in SQL) → "Invitation unavailable"
- [ ] A token from another club → "No reservation matches that code", **not** a forbidden error
- [ ] Already-checked-in reservation → "already been checked in"
- [ ] Pending (unconfirmed) reservation → "A pending reservation cannot be checked in"
- [ ] Camera permission denied → manual entry still works
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
