import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db";

/**
 * Service-role Supabase client. Bypasses RLS, so it must ONLY ever be imported
 * from server-side code (Route Handlers, server components) — never from a
 * client component. It reads `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC prefix),
 * so it is not available in the browser bundle.
 *
 * Auth needs this because the anon client cannot read the `users` table (RLS),
 * and `password_hash` must never be exposed through the anon key anyway.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
