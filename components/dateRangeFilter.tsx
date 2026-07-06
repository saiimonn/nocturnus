"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type DateRange = {
  startDate: string;
  endDate: string;
};

type DateRangeFilterProps = {
  startDate: string;
  endDate: string;
  onChange: (range: DateRange) => void;
};

export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "end">("start");
  const [viewDate, setViewDate] = useState(() => {
    if (startDate) return new Date(`${startDate}T00:00:00`);
    return new Date();
  });

  const hasDate = Boolean(startDate || endDate);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const startDisplay = startDate
    ? new Date(`${startDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select start date";

  const endDisplay = endDate
    ? new Date(`${endDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "None";

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; inCurrentMonth: boolean }> = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const date = new Date(year, month, -i);
      cells.push({ date, inCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const date = new Date(year, month + 1, cells.length - (firstDay + daysInMonth) + 1);
      cells.push({ date, inCurrentMonth: false });
    }

    return cells;
  }, [viewDate]);

  const toISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePickDate = (date: Date) => {
    const picked = toISODate(date);

    if (activeField === "start") {
      const nextEndDate = endDate && endDate < picked ? "" : endDate;
      onChange({ startDate: picked, endDate: nextEndDate });
      setActiveField("end");
      return;
    }

    if (startDate && picked < startDate) {
      onChange({ startDate: picked, endDate: "" });
      setActiveField("end");
      return;
    }

    onChange({ startDate, endDate: picked });
    setIsOpen(false);
  };

  const isSelected = (date: Date) => {
    const value = toISODate(date);
    return value === startDate || value === endDate;
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const value = toISODate(date);
    return value > startDate && value < endDate;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-sm transition hover:border-white/40"
      >
        <CalendarDays
          className={`size-4 transition-all duration-300 ${
            isOpen ? "text-white" : "text-white/80"
          }`}
        />
        <span className="font-semibold tracking-[0.14em]">DATE RANGE</span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`absolute left-0 top-[calc(100%+10px)] z-30 w-72 rounded-xl border border-white/15 bg-[#0c0c0c]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 ease-out ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
            Launch date
          </p>

          <button
            type="button"
            onClick={() => setActiveField("start")}
            className={`mb-3 w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
              activeField === "start"
                ? "border-white/40 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/80"
            }`}
          >
            {startDisplay}
          </button>

          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white">{monthLabel}</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="rounded-md border border-white/10 p-1 text-white/75 transition hover:bg-white/10"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                className="rounded-md border border-white/10 p-1 text-white/75 transition hover:bg-white/10"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/40">
            {weekDays.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {calendarDays.map(({ date, inCurrentMonth }) => {
              const selected = isSelected(date);
              const inRange = isInRange(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handlePickDate(date)}
                  className={`rounded-md py-1.5 transition ${
                    selected
                      ? "bg-blue-500 text-white"
                      : inRange
                        ? "bg-white/10 text-white"
                        : inCurrentMonth
                          ? "text-white/85 hover:bg-white/10"
                          : "text-white/25 hover:bg-white/5"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-white/10 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (endDate) {
                  onChange({ startDate, endDate: "" });
                } else {
                  setActiveField("end");
                }
              }}
              className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-white/75 transition hover:bg-white/5"
            >
              <span>End date</span>
              <span className="text-white/55">{endDisplay}</span>
            </button>
            <div className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-white/60">
              <span>Date format</span>
              <span>Full date</span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ startDate: "", endDate: "" })}
              className="mt-1 flex w-full items-center gap-1 rounded-md px-1 py-1.5 text-white/70 transition hover:bg-white/5"
            >
              <X className="size-3" />
              Clear
            </button>
          </div>
      </div>

      {hasDate && !isOpen && (
        <button
          type="button"
          onClick={() => onChange({ startDate: "", endDate: "" })}
          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  );
}