"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Question = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: string[] | null;
};

type Props = {
  eventId: string;
  slug: string;
  signedIn: boolean;
  alreadyRegistered: boolean;
  approvalRequired: boolean;
  guestCount: number;
  capacity: number | null;
  status: string;
  userEmail: string | null;
  questions: Question[];
};

export function RsvpPanel(p: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(p.userEmail ?? "");
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const full = p.capacity != null && p.guestCount >= p.capacity;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch(`/api/events/${p.eventId}/rsvp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, answers }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b?.error?.message ?? "Couldn't register.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="panel rounded-xl p-5 space-y-3 sticky top-20">
      <div className="text-sm text-ink-400">
        {p.guestCount} going{p.capacity ? ` · capacity ${p.capacity}` : ""}
      </div>

      {p.status === "cancelled" ? (
        <div className="text-sm text-red-400">This event was cancelled.</div>
      ) : p.alreadyRegistered ? (
        <div className="space-y-2">
          <div className="text-green-400 text-sm font-medium">You&apos;re in.</div>
          <p className="text-ink-300 text-sm">
            Check your email for a confirmation and calendar invite.
          </p>
          <Link href="/home" className="btn-ghost w-full">Your tickets</Link>
        </div>
      ) : full ? (
        <div className="text-sm text-ink-300">
          This event is at capacity. Join the waitlist below.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {!p.signedIn && (
            <p className="text-xs text-ink-400">
              <Link href={`/signin?next=/event/${p.slug}`} className="link">Sign in</Link>{" "}
              for one-click RSVP, or register below.
            </p>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {p.questions.map((q) => (
            <div key={q.id}>
              <label className="label">
                {q.label}
                {q.required && <span className="text-brand"> *</span>}
              </label>
              {q.type === "long_text" ? (
                <textarea
                  className="textarea"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              ) : q.type === "single" && q.options ? (
                <select
                  className="input"
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                >
                  <option value="">Choose…</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  type={q.type === "email" ? "email" : q.type === "url" ? "url" : "text"}
                  required={q.required}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </div>
          ))}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Registering…" : p.approvalRequired ? "Request to join" : "Register"}
          </button>
          {err && <div className="text-sm text-red-400">{err}</div>}
        </form>
      )}
    </div>
  );
}
