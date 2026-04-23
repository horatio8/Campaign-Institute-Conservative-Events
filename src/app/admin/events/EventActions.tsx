"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EventActions({
  eventId, featured, cancelled,
}: { eventId: string; featured: boolean; cancelled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleFeature() {
    setBusy(true);
    await fetch(`/api/admin/events/${eventId}/feature`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    setBusy(false);
    router.refresh();
  }

  async function takedown() {
    if (!confirm("Cancel this event and notify guests? (audit logged)")) return;
    setBusy(true);
    await fetch(`/api/admin/events/${eventId}/takedown`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1 justify-end">
      <button
        className={featured ? "btn-ghost text-xs" : "btn-primary text-xs"}
        disabled={busy || cancelled}
        onClick={toggleFeature}
      >
        {featured ? "Unfeature" : "Feature"}
      </button>
      {!cancelled && (
        <button
          className="btn-ghost text-xs text-red-400"
          disabled={busy}
          onClick={takedown}
        >
          Take down
        </button>
      )}
    </div>
  );
}
