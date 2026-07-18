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
