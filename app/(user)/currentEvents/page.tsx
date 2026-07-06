
"use client";

import EventCard from "@/components/userEventCard";
import Nav from "@/components/UserNav";
import { useState, useMemo } from "react";


// sample pa temporary shii

const EVENTS = [
  {
    id: 1,
    name: "OASIS CEBU",
    status: "TONIGHT",
    location: "Luxury Nightlife • Panagdait, Cebu City",
    date: "Tonight, 10:00 PM",
    category: "Live DJ",
    image: "/images/oasis.jpg",
  },
  {
    id: 2,
    name: "TRADEMARK",
    status: "TONIGHT",
    location: "Underground • Mabolo, Cebu City",
    date: "Tonight, 11:00 PM",
    category: "Lounge",
    image: "/images/trademark.jpg",
  },
  {
    id: 3,
    name: "SENTRAL",
    status: "TONIGHT",
    location: "Rooftop Lounge • IT Park, Cebu",
    date: "Tonight, 9:00 PM",
    category: "Rooftop",
    image: "/images/sentral.jpg",
  },
  {
    id: 4,
    name: "ICON",
    status: "UPCOMING",
    location: "Mainroom • Mabolo, Cebu City",
    date: "Tomorrow, 10:00 PM",
    category: "Live DJ",
    image: "/images/icon.jpg",
  },
  {
    id: 5,
    name: "ICON",
    status: "UPCOMING",
    location: "Mainroom • Mabolo, Cebu City",
    date: "Tomorrow, 10:00 PM",
    category: "Live DJ",
    image: "/images/icon.jpg",
  },
];

const filters = ["ALL", "LIVE DJ", "LOUNGE", "ROOFTOP"];

export default function EventListing() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((event) => {
        const matchesFilter =
          activeFilter === "ALL" ||
          event.category.toUpperCase() === activeFilter;
        const matchesSearch =
          event.name.toLowerCase().includes(search.toLowerCase()) ||
          event.location.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);




    return (
      <div className="flex flex-col flex-1 bg-linear-to-b from-black to-[#202020] text-white">
      <Nav />



      <div className = "flex flex-col flex-1 items-start justify-center px-6 mt-12">
        

       

        <div className = "relative w-full items-center">
            
                <div className="min-h-screen bg-black text-white">
      {/* Nav */}
  

      {/* Hero */}
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
          className="w-full bg-black border border-blue-500 rounded px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        ))}
        <div className="ml-auto flex items-center gap-2 px-4 py-2 text-xs border border-white/20 rounded text-white/70">
          <span className="font-semibold text-white">DATE:</span>
          6 JULY 2026 - 20 JULY 2026
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 pb-16 grid max-w-8xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {filteredEvents.length === 0 && (
          <p className="col-span-full text-white/50 text-sm">
            No events match your filters.
          </p>
        )}
      </div>
    </div>



        </div>



      </div>
    </div>
    );
  }