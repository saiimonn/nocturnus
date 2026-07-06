export default function EventCard({ event }) {
  return (
    <div className="w-full bg-white/5 rounded-lg overflow-hidden border border-white/10">
      
      <div className="relative h-40 bg-white/10">
                <img
                src={event.image}
                alt={event.name}
                className="w-full h-full object-cover"
                />


                <span className="absolute top-2 left-2 bg-purple-600/20 text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide">
                {event.category}
                </span>

      </div>


      <div className="p-4">
        <h3 className="font-bold text-sm tracking-wide">{event.name}</h3>
        <p
          className={`text-xl font-bold italic mb-2 ${
            event.status === "TONIGHT" ? "text-yellow-500" : "text-pink-400"
          }`}
        >
          {event.status}
        </p>
        <p className="text-xs text-white/60 mb-1">{event.location}</p>
        <p className="text-xs text-white/40 mb-3"> {event.date}</p>
        <button className="w-full border border-white/20 rounded py-2 text-xs font-semibold hover:bg-white hover:text-black transition">
          VIEW DETAILS
        </button>
      
      </div>
    
    </div>
  );
}