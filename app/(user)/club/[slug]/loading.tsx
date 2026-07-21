import { Skeleton } from "@/components/ui/skeleton"

export default function VenueLoading() {
  return (
    <div className="min-h-screen w-full bg-black text-white -mt-20 z-0">
      {/* Hero skeleton */}
      <div className="relative h-105 w-full overflow-hidden md:h-130">
        <Skeleton className="absolute inset-0 rounded-none bg-[#1a1a1a]" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />
        <div className="absolute bottom-0 left-0 w-full px-8 pb-8 md:px-16">
          <Skeleton className="h-3 w-40 bg-[#1a1a1a]" />
          <Skeleton className="mt-2 h-9 w-64 bg-[#1a1a1a]" />
        </div>
      </div>

      {/* Venue details skeleton */}
      <div className="px-8 py-16 md:px-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[160px_1fr_1fr]">
          <Skeleton className="h-4 w-24 bg-[#1a1a1a]" />

          <div className="max-w-2xl space-y-3">
            <Skeleton className="h-4 w-full bg-[#1a1a1a]" />
            <Skeleton className="h-4 w-5/6 bg-[#1a1a1a]" />
            <Skeleton className="h-4 w-2/3 bg-[#1a1a1a]" />

            <div className="mt-8 border-t border-[#1f1f1f] pt-6">
              <Skeleton className="h-3 w-32 bg-[#1a1a1a]" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
                    <Skeleton className="h-3 w-24 bg-[#1a1a1a]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <Skeleton className="h-64 w-full rounded-xl bg-[#1a1a1a]" />
          </div>
        </div>

        {/* Gallery skeleton */}
        <div className="mt-16">
          <Skeleton className="h-4 w-28 bg-[#1a1a1a]" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-4/3 w-full rounded-xl bg-[#1a1a1a]" />
            ))}
          </div>
        </div>
      </div>

      {/* Booking section skeleton */}
      <div className="px-8 pb-16 md:px-16">
        <Skeleton className="h-80 w-full rounded-xl bg-[#1a1a1a]" />
      </div>
    </div>
  )
}
