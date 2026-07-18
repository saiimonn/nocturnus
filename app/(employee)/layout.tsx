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
    .maybeSingle<{
      full_name: string
      clubs: { name: string } | null
    }>()

  const club = user?.clubs ?? null

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
