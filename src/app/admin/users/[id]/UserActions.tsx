"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "suspend" | "unsuspend" | "signout") {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}/${action}`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {suspended ? (
        <button className="btn-ghost" disabled={busy} onClick={() => act("unsuspend")}>
          Unsuspend
        </button>
      ) : (
        <button className="btn-ghost text-red-400" disabled={busy} onClick={() => act("suspend")}>
          Suspend
        </button>
      )}
      <button className="btn-ghost" disabled={busy} onClick={() => act("signout")}>
        Force sign-out
      </button>
    </div>
  );
}
