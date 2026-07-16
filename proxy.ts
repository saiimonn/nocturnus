import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/api/auth/session"

// Guards the (owner) route group. Anonymous or invalid-session requests are
// redirected to the login page. Note: /club/[slug] is a PUBLIC (user) page, so
// only the owner-specific /club/details and /club/layout paths are matched here.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySession(token)
  if (session) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/auth/login", request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reservations/:path*",
    "/owner-events/:path*",
    "/club/details/:path*",
    "/club/layout/:path*",
  ],
}
