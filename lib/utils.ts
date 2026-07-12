import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

const MANILA_DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function formatEventDate(dateISO: string) {
  return MANILA_DATE_TIME_FORMATTER.format(new Date(dateISO))
}

export function getManilaDayKey(dateISO: string | Date) {
  return MANILA_DAY_KEY_FORMATTER.format(
    typeof dateISO === "string" ? new Date(dateISO) : dateISO,
  )
}
