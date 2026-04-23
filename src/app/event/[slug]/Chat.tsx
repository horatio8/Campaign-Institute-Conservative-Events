"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; displayName: string };
};

export function Chat({ eventId, currentUserId }: { eventId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/events/${eventId}/chat`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true); setErr(null);
    const res = await fetch(`/api/events/${eventId}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b?.error?.message ?? "Couldn't send.");
      return;
    }
    setDraft("");
    await load();
  }

  return (
    <div className="panel rounded-xl flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-ink-400 text-sm text-center pt-10">
            No messages yet. Say hi.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div className="text-xs text-ink-400">
                  {m.sender.displayName} · {new Date(m.createdAt).toLocaleTimeString()}
                </div>
                <div
                  className={`px-3 py-2 rounded-xl max-w-[85%] text-sm whitespace-pre-wrap ${
                    mine ? "bg-brand text-brand-fg" : "bg-ink-800"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-ink-700 p-2 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Message the group…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      {err && <div className="text-xs text-red-400 px-3 pb-2">{err}</div>}
    </div>
  );
}
