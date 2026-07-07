
"use client";
import DateRangeFilter from "@/components/dateRangeFilter";
import EventCard from "@/components/userEventCard";
import Nav from "@/components/UserNav";
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
    const beforeEnd = !dateRange.endDate || eventDate <= new Date(dateRange.endDate + "T23:59:59");

    return matchesFilter && matchesSearch && afterStart && beforeEnd;
  });
}, [activeFilter, search, dateRange]);

  



    return (
      <div className="flex flex-col flex-1 text-white">




      <div className = "flex flex-col flex-1 items-start justify-center px-6 mt-12">
        

       

        <div className = "relative w-full items-center">
            
                <div className="min-h-screen bg-black text-white">

  

      <div className="px-8 pt-12 pb-6">
        <h1 className = "text-4xl md:text-6xl font-semibold mb-2 tracking-tight">
          FIND YOUR NIGHT
        </h1>
         <p className = "text-xs md:text-sm text-[#a3a3a3] mb-8 text-left">
          Find the energy that matches your night. Curated selection of the finest dance floors and
          hidden spots.
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find the best night around..."
          className="w-full bg-black border max-w-md border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="px-8 flex flex-wrap items-center gap-3 pb-8">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-xs font-semibold rounded border transition ${
              activeFilter === filter
                ? "bg-white text-black border-white"
                : "bg-transparent text-white border-white/20 hover:border-white/50"
            }`}
          >
            {filter}
          </button>
          
        ))
          
        }
        

         <div>
          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </div>
              
       



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



        </div>



      </div>
    </div>
    );
  }