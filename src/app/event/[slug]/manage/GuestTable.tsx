"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Guest = {
  id: string;
  displayName: string;
  email: string;
  status: string;
  registeredAt: Date;
  checkedInAt: Date | null;
};

export function GuestTable({ eventId, guests }: { eventId: string; guests: Guest[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function update(guestId: string, status: string) {
    setBusy(guestId);
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  const filtered = guests.filter((g) =>
    `${g.displayName} ${g.email}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="panel rounded-lg overflow-hidden">
      <div className="p-3 border-b border-ink-700 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Filter by name or email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Email</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Registered</th>
            <th className="text-right px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="p-6 text-center text-ink-400">No guests yet.</td></tr>
          )}
          {filtered.map((g) => (
            <tr key={g.id} className="border-t border-ink-700">
              <td className="px-3 py-2">{g.displayName}</td>
              <td className="px-3 py-2 text-ink-300">{g.email}</td>
              <td className="px-3 py-2">
                <span className="px-2 py-0.5 rounded bg-ink-800 text-ink-200 text-xs capitalize">
                  {g.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-ink-400 text-xs">
                {new Date(g.registeredAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right space-x-1">
                {g.status === "pending" && (
                  <>
                    <button
                      className="btn-ghost text-xs"
                      disabled={busy === g.id}
                      onClick={() => update(g.id, "approved")}
                    >Approve</button>
                    <button
                      className="btn-ghost text-xs"
                      disabled={busy === g.id}
                      onClick={() => update(g.id, "declined")}
                    >Decline</button>
                  </>
                )}
                {g.status !== "checked_in" && g.status !== "declined" && (
                  <button
                    className="btn-ghost text-xs"
                    disabled={busy === g.id}
                    onClick={() => update(g.id, "checked_in")}
                  >Check in</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
