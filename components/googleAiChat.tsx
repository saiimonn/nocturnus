"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, X, Sparkles, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type GoogleAiChatProps = {
  title?: string;
  description?: string;
  apiRoute?: string;
  model?: string;
  venue?: VenueContext;
};

type VenueContext = {
  name?: string | null;
  description?: string | null;
  floorplanImageUrl?: string | null;
  address?: string | null;
};

const starterMessages: Message[] = [
  {
    role: "assistant",
    content: "Hello! Ask me anything about venues, bookings, or planning your night.",
  },
];

export function GoogleAiChat({
  venue,
  title = "The Concierge",
  description = `Chat with our AI concierge about ${venue?.name}`,
  apiRoute = "/api/ai/chat",
  model = "gemini-3.1-flash-lite",

}: GoogleAiChatProps) {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmedInput }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const contextParts: string[] = [];
      if (venue?.name) contextParts.push(`Venue: ${venue.name}`);
      if (venue?.address) contextParts.push(`Address: ${venue.address}`);
      if (venue?.description) contextParts.push(`Description: ${venue.description}`);
      if (venue?.floorplanImageUrl) contextParts.push(`Floorplan: ${venue.floorplanImageUrl}`);

      const systemMessage = contextParts.length
        ? { role: "system", content: `Context:\n${contextParts.join("\n\n")}` }
        : null;

      const messagesForApi = systemMessage ? [systemMessage, ...nextMessages] : nextMessages;

      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: messagesForApi,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "The request failed.");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: payload.message ?? "No response returned.",
        },
      ]);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "The request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#f5a623] text-black shadow-[0_0_40px_rgba(245,166,35,0.4)] transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      <section
        className={`fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] max-w-5xl rounded-[24px] border border-white/10 bg-[#070707]/95 p-4 shadow-[0_0_80px_rgba(0,0,0,0.55)] transition-all duration-200 md:p-6 ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-[#c9c9c9]">
            <Sparkles className="size-4 text-[#f5a623]" />
            <span>{title}</span>
          </div>
          <p className="text-sm text-[#8f8f8f]">{description}</p>
        </div>

        <div className="mb-4 flex h-[360px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0c0c0c]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[#f5a623] text-black"
                      : "border border-white/10 bg-white/5 text-[#f2f2f2]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#d2d2d2]">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="border-t border-white/10 bg-[#120000] px-4 py-3 text-sm text-[#ff9a9a]">
              {error}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your prompt…"
            className="flex-1 border-white/10 bg-black/70 text-white"
          />
          <Button type="submit" disabled={loading} className="gap-2">
            <SendHorizonal className="size-4" />
            {loading ? "Sending" : "Send"}
          </Button>
        </form>
      </section>
    </>
  );
}