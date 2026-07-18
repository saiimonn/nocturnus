-- Rate limiting for the unauthenticated auth endpoints
-- (login, verification/check, verification/redeem).
--
-- Fixed-window, per-IP counters. One row per "<scope>:<ip>" key. The window
-- self-resets on write, so row count is bounded by the number of distinct keys
-- rather than by request volume.

CREATE TABLE IF NOT EXISTS rate_limits (
  key              text PRIMARY KEY,
  count            integer NOT NULL DEFAULT 0,
  window_start     timestamptz NOT NULL DEFAULT now()
);

-- No policies = no access via anon/authenticated keys.
-- Only accessible via service_role in Route Handlers.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Atomic increment. A read-then-write from application code races under
-- concurrent requests -- exactly the condition an attacker generates -- so the
-- whole check must be a single statement.
--
-- The INSERT is wrapped in a CTE because RETURN QUERY expects a SELECT-shaped
-- query. Out-params are named hits/reset_at so they cannot collide with the
-- table's own count/window_start columns inside the function body.
CREATE OR REPLACE FUNCTION bump_rate_limit(p_key text, p_window_seconds int)
RETURNS TABLE (hits int, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH bumped AS (
    INSERT INTO rate_limits AS rl (key, count, window_start)
    VALUES (p_key, 1, now())
    ON CONFLICT (key) DO UPDATE
      SET count = CASE
            WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
            THEN 1
            ELSE rl.count + 1
          END,
          window_start = CASE
            WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
            THEN now()
            ELSE rl.window_start
          END
    RETURNING rl.count, rl.window_start
  )
  SELECT bumped.count,
         bumped.window_start + make_interval(secs => p_window_seconds)
  FROM bumped;
END;
$$;

REVOKE ALL ON FUNCTION bump_rate_limit(text, int) FROM PUBLIC, anon, authenticated;
