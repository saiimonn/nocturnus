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

-- An employee must always belong to a club; owners/admins must not. Both
-- directions are enforced: club_id is required when role = 'club_employee'
-- and forbidden (must be null) for every other role.
alter table public.users drop constraint if exists users_club_id_role_check;
alter table public.users
  add constraint users_club_id_role_check
  check (
    (role = 'club_employee' and club_id is not null)
    or (role <> 'club_employee' and club_id is null)
  );

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
