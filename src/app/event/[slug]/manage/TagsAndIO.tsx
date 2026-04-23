"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TagsAndIO({
  eventId,
  calendarId,
  initialTags,
}: {
  eventId: string;
  calendarId: string;
  initialTags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/tags`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newTag.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      const body = await res.json();
      setTags((ts) => (ts.find((t) => t.id === body.tag.id) ? ts : [...ts, body.tag]));
      setNewTag("");
      router.refresh();
    }
  }

  async function removeTag(tagId: string) {
    setBusy(true);
    await fetch(`/api/events/${eventId}/tags?tagId=${tagId}`, { method: "DELETE" });
    setTags((ts) => ts.filter((t) => t.id !== tagId));
    setBusy(false);
    router.refresh();
  }

  async function onCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setImportMsg(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/calendars/${calendarId}/import`, {
      method: "POST",
      body: form,
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setImportMsg(body?.error?.message ?? "Import failed.");
    } else {
      setImportMsg(`Imported ${body.imported} contact${body.imported === 1 ? "" : "s"}.`);
    }
    e.target.value = "";
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className="panel rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Tags</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.length === 0 && (
            <span className="text-xs text-ink-400">No tags yet.</span>
          )}
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-ink-700 text-xs"
            >
              {t.name}
              <button
                type="button"
                className="text-ink-400 hover:text-red-400"
                onClick={() => removeTag(t.id)}
              >×</button>
            </span>
          ))}
        </div>
        <form onSubmit={addTag} className="flex gap-2">
          <input
            className="input"
            placeholder="Add tag (e.g., AI, Dinner)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button className="btn-primary" disabled={busy || !newTag.trim()}>Add</button>
        </form>
      </section>

      <section className="panel rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold">Contacts & guests</h3>
        <div className="flex flex-wrap gap-2">
          <label className="btn-ghost cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onCsvUpload}
            />
            Import people (CSV)
          </label>
          <a
            className="btn-ghost"
            href={`/api/events/${eventId}/guests.csv`}
            target="_blank"
            rel="noreferrer"
          >Export guests (CSV)</a>
        </div>
        <p className="text-xs text-ink-400">
          CSV needs an <code>email</code> column. Optional: <code>name</code>,{" "}
          <code>phone</code>, <code>tags</code> (semicolon-separated).
        </p>
        {importMsg && <p className="text-sm text-ink-200">{importMsg}</p>}
      </section>
    </div>
  );
}
