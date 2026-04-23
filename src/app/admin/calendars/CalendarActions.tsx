"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CalendarActions({
  calendarId, verified, suspended,
}: { calendarId: string; verified: boolean; suspended: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "verify" | "unverify" | "suspend" | "unsuspend") {
    setBusy(true);
    await fetch(`/api/admin/calendars/${calendarId}/${action}`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-1 justify-end">
      <button
        className="btn-ghost text-xs"
        disabled={busy}
        onClick={() => act(verified ? "unverify" : "verify")}
      >
        {verified ? "Unverify" : "Verify"}
      </button>
      <button
        className={`btn-ghost text-xs ${suspended ? "" : "text-red-400"}`}
        disabled={busy}
        onClick={() => act(suspended ? "unsuspend" : "suspend")}
      >
        {suspended ? "Unsuspend" : "Suspend"}
      </button>
    </div>
  );
}
