import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getIds() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, status")
    .limit(5)

  if (error) {
    console.error("Error fetching events:", error)
    return
  }

  console.log("\n--- VALID EVENT IDs ---")
  if (!events || events.length === 0) {
    console.log("No events found in the database. Run 'npm run seed' first.")
  } else {
    events.forEach(e => {
      console.log(`ID: ${e.id} | Title: "${e.title}" | Status: ${e.status}`)
    });
  }
  console.log("------------------------\n")
}

getIds()
