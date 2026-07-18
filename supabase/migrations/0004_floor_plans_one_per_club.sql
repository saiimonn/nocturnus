-- A club has exactly one floor plan.
--
-- `createFloorPlan` (lib/api/clubs/api.ts) upserts with `onConflict: "club_id"`
-- and the layout editor reads "the first floor plan" as *the* floor plan, so
-- the one-per-club rule was already load-bearing in application code — but the
-- UNIQUE constraint existed only in the live database, applied out-of-band and
-- recorded in no migration. This backfills that history so a rebuilt database
-- matches production (and so `npm run seed`, which generated multiple floor
-- plans per club, fails loudly against a fresh DB rather than only against the
-- drifted live one).
--
-- Guarded because the live database already carries this constraint.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'floor_plans'::regclass
      AND conname = 'floor_plans_club_id_key'
  ) THEN
    ALTER TABLE floor_plans ADD CONSTRAINT floor_plans_club_id_key UNIQUE (club_id);
  END IF;
END
$$;
