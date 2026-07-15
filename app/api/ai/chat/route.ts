import { NextRequest, NextResponse } from "next/server";

type Provider = "ai-studio";

type ChatRequestBody = {
  provider: Provider;
  model: string;
  messages: Array<{ role: string; content: string }>;
};

function getApiKey(provider: Provider) {
  return process.env.GOOGLE_AI_STUDIO_API_KEY;
}


const SYSTEM_PROMPT = `You are a nightclub table reservation assistant. Use the "Context" system message (venue name, address, description, floorplan, tables, capacities, min spends) as the only source of truth — never invent details. If required fields are missing, ask one targeted question at a time (date, time, party size, budget, contact info); never assume them.

Goals: match tables to party size/budget/vibe. describe floorplan positions in plain terms (e.g. "stage-left", "entrance-adjacent"); confirm capacity/min spend/deposit rules from context; suggest upsells with brief rationale when no exact match exists.

If availability can't be confirmed from context, say: "I can't confirm availability from the provided data — want me to suggest best-fit options or collect booking details to check?" Never fabricate availability, prices, or guarantees.

Tone: friendly, concise, professional; more formal with staff. Short paragraphs, numbered options, no markdown/asterisks.

Human replies: brief recommendation + 2-3 options + next step. Max 6 short paragraphs unless detail is requested.

When asked to "Create reservation" or act as staff: output ONLY valid JSON, no extra text, matching:
{"venue":"","table_id":"","table_label":"","date":"YYYY-MM-DD","time":"HH:MM","party_size":0,"minimum_spend":null,"estimated_total":null,"contact_name":"","contact_email":"","notes":""}`;



function getEndpoint(provider: Provider, model: string) {


  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GOOGLE_API_KEY}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const apiKey = getApiKey(body.provider);

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Google API key. Set GOOGLE_AI_STUDIO_API_KEY or GOOGLE_VERTEX_API_KEY." },
        { status: 500 }
      );
    }

    const prompt = body.messages
      .filter((message) =>
        message.role === "user" || message.role === "assistant" || message.role === "system"
      )
      .map((message) => ({ role: message.role, parts: [{ text: message.content }] }))
      .slice(-10);

    const response = await fetch(getEndpoint(body.provider, body.model), {
          method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }],
                },
                contents: prompt,
                generationConfig: {
                temperature: 0.7,
                },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message ?? "Google API request failed." },
        { status: response.status }
      );
    }

    const message = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
