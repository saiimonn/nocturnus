import Link from "next/link";

export default function EventCard({ event }) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a1a1a] bg-[#111111] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video w-full overflow-hidden bg-black/50">
        <img
          src={event.image}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
          {event.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-medium text-white md:text-base">{event.name}</h3>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${
            event.status === "TONIGHT" ? "text-yellow-500" : "text-pink-400"
          }`}
          >
            {event.status}
          </p>
        </div>

        <p className="mt-1.5 text-[11px] font-medium tracking-wide text-gray-500">{event.location}</p>
        <p className="mt-1 text-[11px] text-gray-500">{event.date}</p>

        <div className="mt-5">
          <Link href={`/events/${event.id}`}>
            <button className="flex w-full items-center justify-center rounded-full bg-[#1a1a1a] py-3 text-[9px] font-bold uppercase tracking-widest text-gray-200 transition-colors hover:bg-[#252525]">
              VIEW DETAILS
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}