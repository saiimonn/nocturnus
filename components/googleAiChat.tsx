"use client";

import { useState, useEffect, useRef, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Sparkles, SendHorizonal, Maximize2, Minimize2 } from "lucide-react";
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
  clubId?: string;
  inline?: boolean;
};

const starterMessages: Message[] = [
  {
    role: "assistant",
    content: "Hello! Ask me anything about venues, bookings, or planning your night.",
  },
];

// The client/server split below is fixed for the life of the page, so this
// store never has to notify anyone of a change.
const subscribeToNothing = () => () => {};

export function GoogleAiChat({
  clubId,
  title = "The Concierge",
  description = "Chat with our AI concierge",
  apiRoute = "/api/ai/chat",
  model = "gemini-3.1-flash-lite",
  inline = false,
}: GoogleAiChatProps) {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(inline);
  const [fullscreen, setFullscreen] = useState(false);
  const inlineScrollRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const floatingScrollRef = useRef<HTMLDivElement>(null);
  // createPortal needs document.body, which doesn't exist while this component
  // renders on the server. Gate the portal on a client mount so the inline
  // variant (used on club pages) server-renders instead of throwing.
  const isMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  useEffect(() => {
    inlineScrollRef.current?.scrollTo({ top: inlineScrollRef.current.scrollHeight });
    modalScrollRef.current?.scrollTo({ top: modalScrollRef.current.scrollHeight });
    floatingScrollRef.current?.scrollTo({ top: floatingScrollRef.current.scrollHeight });
  }, [messages, loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
      return;
    }

    const MAX_MESSAGES = 14;
    if (messages.length >= MAX_MESSAGES) {
      setError(`Message limit reached. You can only send up to ${MAX_MESSAGES} messages.`);
      return;
    }

    const newMessage: Message = { role: "user", content: trimmedInput };
    const nextMessages: Message[] = [...messages, newMessage].slice(-MAX_MESSAGES);
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    if (inline) setFullscreen(true);

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          clubId,
          messages: nextMessages,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "The request failed.");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: payload.message ?? "No response returned.",
      };

      setMessages([
        ...nextMessages,
        assistantMessage,
      ].slice(-MAX_MESSAGES));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "The request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (inline) {
    return (
      <>
        <div className="flex h-full flex-col rounded-[18px] border border-white/10 bg-[#070707]/95 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-[#c9c9c9]">
                <Sparkles className="size-4 text-[#f5a623]" />
                <span>{title}</span>
              </div>
              <p className="text-sm text-[#8f8f8f]">{description}</p>
            </div>
            <button
              onClick={() => setFullscreen(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#8f8f8f] transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Expand chat"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>

          <div className="mb-4 flex flex-1 flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0c0c0c]">
            <div ref={inlineScrollRef} data-lenis-prevent className="max-h-[500px] flex-1 space-y-3 overflow-y-auto p-4">
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
        </div>

        {isMounted && createPortal(
          <div
            className={`fixed inset-0 z-[100] flex items-stretch justify-end transition-opacity duration-300 ${
              fullscreen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div
              className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300`}
              onClick={() => setFullscreen(false)}
            />
            <div
              className={`relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#070707] p-6 transition-transform duration-300 ease-out ${
                fullscreen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-[#c9c9c9]">
                    <Sparkles className="size-4 text-[#f5a623]" />
                    <span>{title}</span>
                  </div>
                  <p className="text-sm text-[#8f8f8f]">{description}</p>
                </div>
                <button
                  onClick={() => setFullscreen(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#8f8f8f] transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Exit fullscreen"
                >
                  <Minimize2 className="size-4" />
                </button>
              </div>

              <div className="mb-4 flex flex-1 flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#0c0c0c]">
                <div ref={modalScrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message, index) => (
                    <div
                      key={`modal-${message.role}-${index}`}
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
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

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
          <div ref={floatingScrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto p-4">

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