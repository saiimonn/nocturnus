"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  CheckinResult,
  checkInToken,
  type CheckinState,
} from "@/components/employee/checkin-result"

export default function ScanTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [state, setState] = useState<CheckinState>({ kind: "working" })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await checkInToken(decodeURIComponent(token))
      if (!cancelled) {
        setState(result)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="w-full max-w-sm space-y-5">
      <CheckinResult state={state} />
      <Link
        href="/scan"
        className="block bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0a0a0a]"
      >
        Scan next guest
      </Link>
    </div>
  )
}
