import { supabase } from "@/lib/supabase"
import EventListingClient from "./components/eventListingClient"

export default async function EventListingPage() {
  // 1. Fetch published events from database
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("event_date", { ascending: true })

  if (eventsError) {
    console.error("Error loading events:", eventsError)
    throw new Error("Failed to load events.")
  }

  // 2. Fetch active clubs from database
  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("*")
    .eq("status", "active")

  if (clubsError) {
    console.error("Error loading clubs:", clubsError)
  }

  return (
    <EventListingClient
      initialEvents={events || []}
      clubs={clubs || []}
    />
  )
}
