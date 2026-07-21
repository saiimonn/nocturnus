import { Skeleton } from "@/components/ui/skeleton"

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* Hero skeleton */}
      <div className="relative h-105 w-full overflow-hidden md:h-130">
        <Skeleton className="absolute inset-0 rounded-none bg-[#1a1a1a]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <Skeleton className="h-3 w-36 bg-[#1a1a1a]" />
          <Skeleton className="mt-2 h-9 w-72 bg-[#1a1a1a]" />
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-11 w-36 rounded-md bg-[#1a1a1a]" />
            <Skeleton className="h-11 w-11 rounded-md bg-[#1a1a1a]" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-4 w-4 bg-[#1a1a1a]" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-16 bg-[#1a1a1a]" />
                <Skeleton className="h-3.5 w-28 bg-[#1a1a1a]" />
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Skeleton className="h-4 w-4 bg-[#1a1a1a]" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-14 bg-[#1a1a1a]" />
                <Skeleton className="h-3.5 w-24 bg-[#1a1a1a]" />
                <Skeleton className="h-3 w-32 bg-[#1a1a1a]" />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <Skeleton className="h-4 w-28 bg-[#1a1a1a]" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full bg-[#1a1a1a]" />
                <Skeleton className="h-3.5 w-5/6 bg-[#1a1a1a]" />
                <Skeleton className="h-3.5 w-2/3 bg-[#1a1a1a]" />
              </div>
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-36 bg-[#1a1a1a]" />
              <div className="p-6 rounded-xl border border-zinc-800 bg-[#121212]">
                <Skeleton className="h-4 w-40 bg-[#1a1a1a]" />
                <Skeleton className="mt-2 h-2.5 w-28 bg-[#1a1a1a]" />
                <div className="mt-6 flex justify-between items-end">
                  <Skeleton className="h-3 w-48 bg-[#1a1a1a]" />
                  <Skeleton className="h-10 w-40 rounded-lg bg-[#1a1a1a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
