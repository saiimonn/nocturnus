import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  badRequest,
  handle,
  notFound,
  readJson,
  requireFields,
} from "@/lib/api/shared/errors"
import type { Database } from "@/lib/db"

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"]
type EventRow = Database["public"]["Tables"]["events"]["Row"]
type OperatingHour = { day: string; open: string; close: string }

const SYSTEM_PROMPT = `You are a nightclub table reservation assistant. Use the "Context" system message (venue name, address, description, floorplan, tables, capacities, min spends) as the only source of truth — never invent details. If required fields are missing, ask one targeted question at a time (date, time, party size, budget, contact info); never assume them.

Goals: match tables to party size/budget/vibe. describe floorplan positions in plain terms (e.g. "stage-left", "entrance-adjacent"); confirm capacity/min spend/deposit rules from context; suggest upsells with brief rationale when no exact match exists.

If availability can't be confirmed from context, say: "I can't confirm availability from the provided data — want me to suggest best-fit options or collect booking details to check?" Never fabricate availability, prices, or guarantees.

Tone: friendly, concise, professional; more formal with staff. Short paragraphs, numbered options, no markdown/asterisks.

Human replies: brief recommendation + 2-3 options + next step. Max 6 short paragraphs unless detail is requested.

When asked to "Create reservation" or act as staff: output ONLY valid JSON, no extra text, matching:
{"venue":"","table_id":"","table_label":"","date":"YYYY-MM-DD","time":"HH:MM","party_size":0,"minimum_spend":null,"estimated_total":null,"contact_name":"","contact_email":"","notes":""}`

async function resolveClub(idOrSlug: string): Promise<ClubRow> {
  const { data, error } = await supabaseAdmin
    .from("clubs")
    .select("*")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .eq("status", "active")
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw notFound("Club not found or not active")
  return data
}

async function buildClubContext(club: ClubRow): Promise<string> {
  const parts: string[] = []
  parts.push(`CLUB: ${club.name}`)
  if (club.description) parts.push(`ABOUT: ${club.description}`)
  parts.push(`ADDRESS: ${club.address}`)

  const hours = club.operating_hours as OperatingHour[] | null
  if (hours?.length) {
    parts.push(`HOURS:\n${hours.map((h) => `  ${h.day}: ${h.open} – ${h.close}`).join("\n")}`)
  }

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("title, event_date, status")
    .eq("club_id", club.id)
    .in("status", ["published", "draft"])
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(5)

  if (events?.length) {
    const eventLines = events.map((e) => `  - ${e.title} — ${e.event_date}`).join("\n")
    parts.push(`UPCOMING EVENTS:\n${eventLines}`)
  }

  const { data: tables } = await supabaseAdmin
    .from("club_tables")
    .select("label, capacity, minimum_spend, category, is_available")
    .eq("club_id", club.id)
    .order("label")

  if (tables?.length) {
    const tableLines = tables.map((t) =>
      `  - ${t.label} (${t.category ?? "unclassified"}, ${t.capacity} pax${t.minimum_spend != null ? `, ₱${t.minimum_spend} min spend` : ""}) — ${t.is_available ? "AVAILABLE" : "RESERVED"}`
    ).join("\n")
    parts.push(`TABLES:\n${tableLines}`)
  }

  return parts.join("\n\n")
}

type Provider = "ai-studio"

function getApiKey() {
  return process.env.GOOGLE_AI_STUDIO_API_KEY
}

function getEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GOOGLE_API_KEY}`
}

export const chatCompletion = handle(async (request: Request) => {
  const body = await readJson(request)
  requireFields(body, ["model", "messages"])

  const apiKey = getApiKey()
  if (!apiKey) {
    return Response.json(
      { error: "Missing Google API key. Set GOOGLE_AI_STUDIO_API_KEY or GOOGLE_VERTEX_API_KEY." },
      { status: 500 }
    )
  }

  const model = body.model as string
  const messages = body.messages as Array<{ role: string; content: string }>
  const clubId = body.clubId as string | undefined

  let systemInstruction = SYSTEM_PROMPT

  if (clubId) {
    const club = await resolveClub(clubId)
    const clubContext = await buildClubContext(club)
    systemInstruction = `${SYSTEM_PROMPT}\n\nContext:\n${clubContext}`
  }

  const prompt = messages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, parts: [{ text: m.content }] }))
    .slice(-10)

  const response = await fetch(getEndpoint(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: prompt,
      generationConfig: { temperature: 0.7 },
    }),
  })

  const payload = await response.json()

  if (!response.ok) {
    return Response.json(
      { error: payload?.error?.message ?? "Google API request failed." },
      { status: response.status }
    )
  }

  const message = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response."
  return Response.json({ message })
})
