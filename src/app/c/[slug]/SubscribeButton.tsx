"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscribeButton({
  calendarId, initial, signedIn,
}: { calendarId: string; initial: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push(`/signin`);
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/calendars/${calendarId}/subscribe`, {
      method: subscribed ? "DELETE" : "POST",
    });
    setBusy(false);
    if (res.ok) {
      setSubscribed(!subscribed);
      router.refresh();
    }
  }

  return (
    <button
      className={subscribed ? "btn-ghost" : "btn-primary"}
      onClick={toggle}
      disabled={busy}
    >
      {subscribed ? "Subscribed ✓" : "Subscribe"}
    </button>
  );
}
