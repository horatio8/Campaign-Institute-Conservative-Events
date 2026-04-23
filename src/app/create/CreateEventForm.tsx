"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { calendars: { id: string; name: string; slug: string }[] };

export function CreateEventForm({ calendars }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "");
  const [newCalendarName, setNewCalendarName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(defaultDate(60));
  const [endsAt, setEndsAt] = useState(defaultDate(120));
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [locationType, setLocationType] = useState<"physical" | "virtual" | "hybrid">("physical");
  const [address, setAddress] = useState("");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [capacity, setCapacity] = useState<string>("");
  const [approvalRequired, setApprovalRequired] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const body = {
      calendarId: calendarId || undefined,
      newCalendarName: newCalendarName || undefined,
      title,
      descriptionRich: description,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      timezone,
      locationType,
      address: locationType === "virtual" ? null : address || null,
      virtualUrl: locationType === "physical" ? null : virtualUrl || null,
      capacity: capacity ? Number(capacity) : null,
      approvalRequired,
    };
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b?.error?.message ?? "Couldn't create event.");
      return;
    }
    const data = await res.json();
    router.push(`/event/${data.slug}/manage`);
  }

  return (
    <form onSubmit={onSubmit} className="panel rounded-xl p-6 space-y-4">
      <div>
        <label className="label">Calendar</label>
        {calendars.length > 0 ? (
          <select
            className="input"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
          >
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (@{c.slug})</option>
            ))}
            <option value="">+ Create a new calendar…</option>
          </select>
        ) : null}
        {(!calendarId || calendars.length === 0) && (
          <input
            className="input mt-2"
            placeholder="New calendar name (e.g., Atlanta Craft Club)"
            value={newCalendarName}
            onChange={(e) => setNewCalendarName(e.target.value)}
            required={!calendarId}
          />
        )}
      </div>

      <div>
        <label className="label">Title</label>
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Starts</label>
          <input type="datetime-local" className="input" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="label">Ends</label>
          <input type="datetime-local" className="input" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Timezone (IANA)</label>
        <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      </div>

      <div>
        <label className="label">Location</label>
        <div className="flex gap-2 mb-2">
          {(["physical", "virtual", "hybrid"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`px-3 py-1 rounded-full border text-sm capitalize ${
                locationType === t ? "border-brand text-brand" : "border-ink-700 text-ink-300"
              }`}
              onClick={() => setLocationType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {locationType !== "virtual" && (
          <input
            className="input mb-2"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        )}
        {locationType !== "physical" && (
          <input
            className="input"
            placeholder="Join URL (Zoom, Meet, or custom)"
            value={virtualUrl}
            onChange={(e) => setVirtualUrl(e.target.value)}
          />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Capacity (optional)</label>
          <input
            type="number"
            min={1}
            className="input"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.checked)}
            />
            Require approval
          </label>
        </div>
      </div>

      {err && <div className="text-sm text-red-400">{err}</div>}

      <button className="btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}

function defaultDate(minutesAhead: number) {
  const d = new Date(Date.now() + minutesAhead * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
