"use client";

import { useState } from "react";

export function BlastForm({ eventId }: { eventId: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("registered");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/events/${eventId}/blast`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, body, segment }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data?.error?.message ?? "Couldn't send.");
      return;
    }
    setMsg(`Sent to ${data.recipients} guests.`);
    setSubject(""); setBody("");
  }

  return (
    <form onSubmit={send} className="panel rounded-lg p-4 space-y-3 max-w-2xl">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Subject</label>
          <input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="label">Segment</label>
          <select className="input" value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="registered">Registered</option>
            <option value="approved">Approved</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="checked_in">Checked in</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Body</label>
        <textarea className="textarea" required value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : "Send blast"}</button>
      {msg && <div className="text-sm text-ink-300">{msg}</div>}
    </form>
  );
}
