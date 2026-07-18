-- ============================================
-- Migration: remove the discount_codes table
-- ============================================
-- Drops the promotional discount-code feature.
-- CASCADE also removes the "Owners manage own
-- discount codes" RLS policy and any FKs that
-- reference this table. Idempotent — safe to
-- re-run.
-- ============================================

DROP TABLE IF EXISTS discount_codes CASCADE;
