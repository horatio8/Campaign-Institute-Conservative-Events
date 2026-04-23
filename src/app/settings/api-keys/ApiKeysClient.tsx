"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Key = { id: string; label: string; lastFour: string; createdAt: Date };
type Cal = { id: string; name: string };

export function ApiKeysClient({ calendar, keys }: { calendar: Cal; keys: Key[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    const res = await fetch(`/api/calendars/${calendar.id}/api-keys`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setBusy(false);
    if (res.ok) {
      const body = await res.json();
      setReveal(body.raw);
      setLabel("");
      router.refresh();
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key?")) return;
    await fetch(`/api/calendars/${calendar.id}/api-keys/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{calendar.name}</h2>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Key label (e.g., production)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn-primary" disabled={busy} onClick={create}>
          {busy ? "Creating…" : "Create key"}
        </button>
      </div>
      {reveal && (
        <div className="mb-4 p-3 rounded-md bg-ink-800 text-sm">
          <div className="text-ink-400 text-xs mb-1">Copy now — you won&apos;t see it again:</div>
          <code className="break-all text-green-400">{reveal}</code>
        </div>
      )}
      <ul className="divide-y divide-ink-700">
        {keys.length === 0 && <li className="py-2 text-sm text-ink-400">No keys yet.</li>}
        {keys.map((k) => (
          <li key={k.id} className="py-2 flex items-center justify-between text-sm">
            <div>
              <div>{k.label || "(unlabeled)"}</div>
              <div className="text-ink-400 text-xs">
                ••••{k.lastFour} · created {new Date(k.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button className="btn-ghost text-xs" onClick={() => revoke(k.id)}>Revoke</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
