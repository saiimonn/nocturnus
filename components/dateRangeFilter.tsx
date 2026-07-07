"use client";

export default function DateRangeFilter({ startDate, endDate, onChange }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs border border-white/20 rounded text-white/70">
      <span className="font-semibold text-white whitespace-nowrap">DATE:</span>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        className="bg-transparent text-white/20 text-xs focus:outline-none [color-scheme:dark]"
      />
      <span className="text-white/40">-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        className="bg-transparent text-white/20 text-xs focus:outline-none [color-scheme:dark]"
      />
    </div>
  );
}