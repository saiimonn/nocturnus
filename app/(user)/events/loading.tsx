import { Skeleton } from "@/components/ui/skeleton"

export default function EventsLoading() {
  return (
    <div className="min-h-screen w-full px-8 py-12 text-white md:px-16">
      {/* Header skeleton */}
      <div className="max-w-2xl">
        <Skeleton className="h-12 w-72 bg-[#1a1a1a]" />
        <Skeleton className="mt-4 h-3 w-96 bg-[#1a1a1a]" />

        <Skeleton className="mt-6 h-12 max-w-md rounded-full bg-[#1a1a1a]" />
      </div>

      {/* Filter skeleton */}
      <div className="mt-8 flex gap-3">
        <Skeleton className="h-9 w-28 rounded-full bg-[#1a1a1a]" />
        <Skeleton className="h-9 w-28 rounded-full bg-[#1a1a1a]" />
      </div>

      {/* Event cards skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#111111]"
          >
            <Skeleton className="aspect-video w-full bg-[#1a1a1a]" />
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-4 w-32 bg-[#1a1a1a]" />
                <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
              </div>
              <Skeleton className="mt-2 h-3 w-40 bg-[#1a1a1a]" />
              <Skeleton className="mt-1 h-3 w-24 bg-[#1a1a1a]" />
              <div className="mt-auto pt-5">
                <Skeleton className="h-10 w-full rounded-full bg-[#1a1a1a]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
