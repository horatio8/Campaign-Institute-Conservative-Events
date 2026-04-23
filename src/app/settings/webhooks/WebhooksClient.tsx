"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALL_EVENTS = [
  "event.created", "event.updated", "event.cancelled",
  "guest.registered", "guest.status_changed", "guest.checked_in",
  "guest.updated", "ticket.refunded", "blast.sent",
];

type Endpoint = {
  id: string;
  url: string;
  events: string[];
  status: string;
  createdAt: Date | string;
};
type Delivery = {
  id: string;
  event: string;
  url: string;
  statusCode: number | null;
  attempts: number;
  deliveredAt: Date | string | null;
  nextRetryAt: Date | string | null;
  createdAt: Date | string;
};

export function WebhooksClient({
  calendar,
}: {
  calendar: { id: string; name: string; endpoints: Endpoint[]; recent: Delivery[] };
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([...ALL_EVENTS]);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  async function create() {
    if (!url) return;
    setBusy(true);
    const res = await fetch(`/api/calendars/${calendar.id}/webhooks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, events: selected }),
    });
    setBusy(false);
    if (res.ok) {
      const body = await res.json();
      setSecret(body.secret);
      setUrl("");
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    await fetch(`/api/calendars/${calendar.id}/webhooks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function toggle(evt: string) {
    setSelected((s) => (s.includes(evt) ? s.filter((e) => e !== evt) : [...s, evt]));
  }

  return (
    <div className="panel rounded-xl p-5 space-y-5">
      <h2 className="font-semibold">{calendar.name}</h2>

      <section className="space-y-3">
        <div>
          <label className="label">Endpoint URL</label>
          <input
            className="input"
            placeholder="https://example.com/webhooks/luma"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div>
          <div className="label">Events</div>
          <div className="flex flex-wrap gap-1">
            {ALL_EVENTS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => toggle(e)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  selected.includes(e)
                    ? "border-brand text-brand"
                    : "border-ink-700 text-ink-300"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" disabled={busy || !url || selected.length === 0} onClick={create}>
          {busy ? "Creating…" : "Add endpoint"}
        </button>
        {secret && (
          <div className="p-3 rounded bg-ink-800 text-sm">
            <div className="text-ink-400 text-xs">Signing secret — save now:</div>
            <code className="break-all text-green-400">{secret}</code>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">Endpoints</h3>
        <ul className="divide-y divide-ink-700">
          {calendar.endpoints.length === 0 && (
            <li className="py-2 text-sm text-ink-400">No endpoints yet.</li>
          )}
          {calendar.endpoints.map((ep) => (
            <li key={ep.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <div className="break-all">{ep.url}</div>
                <div className="text-xs text-ink-400">{ep.events.join(", ")}</div>
              </div>
              <button className="btn-ghost text-xs" onClick={() => remove(ep.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">Recent deliveries</h3>
        {calendar.recent.length === 0 ? (
          <p className="text-ink-400 text-sm">No deliveries yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-ink-400">
              <tr>
                <th className="text-left py-1">event</th>
                <th className="text-left py-1">url</th>
                <th className="text-left py-1">status</th>
                <th className="text-left py-1">attempts</th>
                <th className="text-left py-1">when</th>
              </tr>
            </thead>
            <tbody>
              {calendar.recent.map((d) => (
                <tr key={d.id} className="border-t border-ink-700">
                  <td className="py-1">{d.event}</td>
                  <td className="py-1 truncate max-w-[180px]">{d.url}</td>
                  <td className="py-1">
                    {d.deliveredAt ? (
                      <span className="text-green-400">{d.statusCode}</span>
                    ) : (
                      <span className="text-yellow-400">
                        {d.statusCode ?? "queued"}
                      </span>
                    )}
                  </td>
                  <td className="py-1">{d.attempts}</td>
                  <td className="py-1">{new Date(d.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
