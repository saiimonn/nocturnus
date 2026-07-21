-- Persist a table's footprint on the floor plan.
--
-- The layout editor already lets an owner drag a Konva Transformer handle to
-- resize a table, but the resulting dimensions lived only in React state
-- (`dims` in floorplanCanvas.tsx) — seeded from a per-category default and
-- thrown away on reload. The guest viewer never saw them at all; it hardcoded
-- 80x50 (56x56 for bar). These columns make the resize durable and give both
-- render paths a single source of truth.
--
-- Stored as a FRACTION of the canvas (0.0-1.0), matching the existing
-- `pos_x`/`pos_y` convention rather than absolute pixels. Position is already
-- relative, and the two render paths use different pixel geometry — the owner
-- editor is a fixed 800x600 stage, the guest viewer wraps its canvas in a
-- uniform CSS scale() with pinch-zoom to 4x. Relative position + absolute size
-- would drift out of proportion at every zoom level; relative size scales with
-- the room.
--
-- `float` (not `decimal`) to match pos_x/pos_y. This is geometry, not money —
-- sub-pixel rounding is invisible. `minimum_spend` stays decimal because
-- exactness there is load-bearing.
--
-- No `radius` column: circles are the `bar` category and the editor's resize
-- handler already forces them square (it applies max(scaleX, scaleY) to both
-- axes), so radius is exactly width / 2. Storing it would be a third value to
-- keep in sync for no gain.
--
-- Defaults backfill existing rows to the footprint they are already drawn at
-- in the editor, so the migration is visually lossless:
--   rect   110/800 = 0.1375,  65/600 = 0.10833333
--   circle  76/800 = 0.095,   76/600 = 0.12666667  (applied to bar below)

ALTER TABLE club_tables
  ADD COLUMN IF NOT EXISTS width  float NOT NULL DEFAULT 0.1375,
  ADD COLUMN IF NOT EXISTS height float NOT NULL DEFAULT 0.10833333;

-- Bar tables render as circles; give them the square footprint the editor's
-- `defaultDimensions('circle')` would have produced.
UPDATE club_tables
SET width = 0.095, height = 0.12666667
WHERE category = 'bar';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'club_tables'::regclass
      AND conname = 'club_tables_size_check'
  ) THEN
    ALTER TABLE club_tables ADD CONSTRAINT club_tables_size_check
      CHECK (width > 0 AND width <= 1 AND height > 0 AND height <= 1);
  END IF;
END
$$;
