
export default function EventDetailsModal({ event, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      onClick={onClose}
    >
      <div
        className="w-full min-h-[500px] max-w-3xl bg-[#111] border border-white/10 rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-80 bg-white/10">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm hover:bg-black"
            >
            ✕
            </button>
            <span className="absolute top-2 left-2 bg-purple-600/20 text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide">
              {event.category}
            </span>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight mb-1">{event.name}</h2>
          <p
            className={`text-sm font-bold italic mb-4 ${
              event.status === "TONIGHT" ? "text-yellow-500" : "text-pink-400"
            }`}
          >
            {event.status}
          </p>

          <div className="space-y-2 mb-6">
            <p className="text-sm text-white/70">
              <span className="text-white/40">Location: </span>
              {event.location}
            </p>
            <p className="text-sm text-white/70">
              <span className="text-white/40">Time: </span>
              {event.date}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-white text-black rounded py-2 text-xs font-semibold hover:bg-white/90 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}