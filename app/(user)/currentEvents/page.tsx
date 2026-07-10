
"use client";
import DateRangeFilter from "@/components/dateRangeFilter";
import EventCard from "@/components/userEventCard";
import { useState, useMemo } from "react";


function getStatus(dateISO: string) {
  const eventDate = new Date(dateISO);
  const now = new Date();
  const isToday = eventDate.toDateString() === now.toDateString();
  return isToday ? "TONIGHT" : "UPCOMING";
}


// sample pa temporary shii


const EVENTS = [
  {
    id: 1,
    name: "OASIS CEBU",
    location: "Luxury Nightlife • Panagdait, Cebu City",
    dateISO: "2026-07-06T22:00:00",
    date: "Tonight, 10:00 PM",
    category: "Live DJ",
    image: "/image.png",
  },
  {
    id: 2,
    name: "TRADEMARK",
    location: "Underground • Mabolo, Cebu City",
    dateISO: "2026-07-06T23:00:00",
    date: "Tonight, 11:00 PM",
    category: "Lounge",
    image: "/image4.jpg",
  },
  {
    id: 3,
    name: "SENTRAL",
    location: "Rooftop Lounge • IT Park, Cebu",
    dateISO: "2026-07-06T21:00:00",
    date: "Tonight, 9:00 PM",
    category: "Rooftop",
    image: "/image.png",
  },
  {
    id: 4,
    name: "ICON",
    location: "Mainroom • Mabolo, Cebu City",
    dateISO: "2026-07-07T22:00:00",
    date: "Tomorrow, 10:00 PM",
    category: "Live DJ",
    image: "/image.png",
  },
  {
    id: 5,
    name: "ICON LATE NIGHT",
    location: "Mainroom • Mabolo, Cebu City",
    dateISO: "2026-07-08T00:30:00",
    date: "Tomorrow, 12:30 AM",
    category: "Live DJ",
    image: "/image.png",
  },
];
const filters = ["ALL", "LIVE DJ", "LOUNGE", "ROOFTOP"];

export default function EventListing() {
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
      const matchesFilter =
        activeFilter === "ALL" || event.category.toUpperCase() === activeFilter;

      const matchesSearch =
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());

      const eventDate = new Date(event.dateISO);
      const afterStart = !dateRange.startDate || eventDate >= new Date(dateRange.startDate);
      const beforeEnd = !dateRange.endDate || eventDate <= new Date(`${dateRange.endDate}T23:59:59`);

      return matchesFilter && matchesSearch && afterStart && beforeEnd;
    });
  }, [activeFilter, search, dateRange]);

  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Find Your Night
        </h1>
        <p className="mt-4 max-w-md text-[13px] uppercase leading-relaxed tracking-wide text-gray-500">
          Find the energy that matches your night. Curated selection of the finest dance floors
          and hidden spots.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find the best night around..."
          className="mt-6 w-full max-w-md rounded-full border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/25"
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
              activeFilter === filter
                ? "border-white bg-white text-black"
                : "border-white/15 bg-transparent text-white/80 hover:border-white/40 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}

        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>


            <div className="px-8 pb-16 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={{ ...event, status: getStatus(event.dateISO) }} />
                /*get status uhhh makes it write TONIGHT or UPCOMING based on the dateISO*/
              ))}

              {filteredEvents.length === 0 && (
                  <p className="col-span-full text-white/50 text-sm"> No events exists! </p>
              )}
            </div>
        
        </div>
    
  );
}