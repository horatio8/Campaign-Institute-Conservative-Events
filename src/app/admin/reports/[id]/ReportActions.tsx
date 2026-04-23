"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: string) {
    setBusy(true);
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  const transitions: Record<string, string[]> = {
    open: ["reviewing", "actioned", "dismissed"],
    reviewing: ["actioned", "dismissed", "open"],
    actioned: ["open"],
    dismissed: ["open"],
  };
  const choices = transitions[status] ?? [];
  if (choices.length === 0) return null;

  return (
    <div className="flex gap-2">
      {choices.map((s) => (
        <button key={s} className="btn-ghost text-xs capitalize" disabled={busy} onClick={() => set(s)}>
          Mark {s}
        </button>
      ))}
    </div>
  );
}
