import { supabaseAdmin } from "@/lib/supabase-admin"
import { tooManyRequests } from "@/lib/api/shared/errors"

/**
 * Fixed-window, per-IP rate limiting for unauthenticated endpoints.
 *
 * Counters live in Postgres (`rate_limits`) rather than in memory because this
 * deploys to Vercel, where function instances are ephemeral and concurrent. An
 * in-memory Map would appear to work under manual testing — Fluid Compute
 * reuses instances often enough — and then fail under real load, which is a
 * worse failure mode than not working at all.
 *
 * The counter write costs far less than the bcrypt round it protects, so it is
 * a net win even under attack traffic.
 */

type BumpResult = { hits: number; reset_at: string }

/**
 * The generated `Database` type in lib/db.ts declares
 * `Functions: Record<string, never>`, so `.rpc()` is untyped. Rather than edit
 * generated types, the RPC signature is declared locally and applied with a
 * narrow cast. Fold this into `Database["public"]["Functions"]` the next time
 * the Supabase types are regenerated.
 */
type BumpRateLimitRpc = (
  fn: "bump_rate_limit",
  args: { p_key: string; p_window_seconds: number },
) => PromiseLike<{ data: BumpResult[] | null; error: { message: string } | null }>

/**
 * Resolve the client IP.
 *
 * `x-real-ip` is preferred because Vercel sets it to a single trusted value;
 * `x-forwarded-for` is a chain, whose first entry is the client. Both are
 * client-controllable if the app is ever reached without Vercel's proxy in
 * front, which would let an attacker mint unlimited buckets by rotating the
 * header. That is accepted: bypassing the platform proxy is not reachable on
 * the deployment target.
 *
 * In local development the Next dev server does populate these, resolving to
 * the IPv6 loopback `::1` (verified: keys log as "auth:login:::1"), so the
 * limiter is exercised normally and you can trip your own limits while
 * testing. The `local-unknown` fallback below is therefore defensive rather
 * than the usual local path — it covers any runtime that supplies neither
 * header. It is a shared bucket by design: skipping the limit instead would
 * leave the code path untested.
 */
function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = request.headers.get("x-forwarded-for")
  const first = forwarded?.split(",")[0]?.trim()
  if (first) return first

  return "local-unknown"
}

/**
 * Throws 429 when the caller has exceeded `limit` requests to `scope` within
 * `windowSeconds`. Call this as the first statement in a handler, before
 * reading the body and before any bcrypt work, so blocked requests cost
 * nothing beyond the counter write.
 *
 * Fails open. If the RPC errors, the request is allowed and the failure is
 * logged. Login already requires Supabase to be reachable, so failing open
 * adds no attack surface that is not already present, whereas failing closed
 * would turn a transient database blip into a total authentication outage.
 */
export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const key = `${scope}:${clientIp(request)}`

  const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as BumpRateLimitRpc
  const { data, error } = await rpc("bump_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error(`[rate-limit] counter unavailable for "${key}":`, error.message)
    return
  }

  const row = data?.[0]
  if (!row) {
    console.error(`[rate-limit] no row returned for "${key}"`)
    return
  }

  if (row.hits > limit) {
    const retryAfter = (new Date(row.reset_at).getTime() - Date.now()) / 1000
    throw tooManyRequests(retryAfter)
  }
}
