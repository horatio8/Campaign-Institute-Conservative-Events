"use client";

import { useState } from "react";

type Match = {
  id: string;
  displayName: string;
  email: string;
  status: string;
};

export function CheckinClient({ eventId }: { eventId: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(
      `/api/events/${eventId}/guest-search?q=${encodeURIComponent(q)}`
    );
    setBusy(false);
    if (res.ok) setResults(await res.json());
  }

  async function check(id: string) {
    const res = await fetch(`/api/events/${eventId}/guests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "checked_in" }),
    });
    if (res.ok) {
      setResults((rs) =>
        rs.map((r) => (r.id === id ? { ...r, status: "checked_in" } : r))
      );
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="input"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !q}>Search</button>
      </form>
      <ul className="panel rounded-lg divide-y divide-ink-700">
        {results.length === 0 && (
          <li className="p-4 text-sm text-ink-400">No matches.</li>
        )}
        {results.map((r) => (
          <li key={r.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.displayName}</div>
              <div className="text-xs text-ink-400">{r.email}</div>
            </div>
            {r.status === "checked_in" ? (
              <span className="text-green-400 text-sm">✓ Checked in</span>
            ) : (
              <button onClick={() => check(r.id)} className="btn-primary">
                Check in
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
