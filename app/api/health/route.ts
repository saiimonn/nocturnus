import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("clubs").select("id, name, slug").limit(5)

    if (error) {
      return Response.json(
        { status: "error", code: error.code, message: error.message },
        { status: 500 },
      )
    }

    return Response.json({ status: "ok", count: data.length, clubs: data })
  } catch (e) {
    return Response.json(
      { status: "error", message: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
