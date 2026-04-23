"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b?.error?.message ?? "Something went wrong.");
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setErr(b?.error?.message ?? "Invalid code.");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-10 panel rounded-xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Sign in to Luma</h1>
      <p className="text-ink-300 text-sm mb-6">
        We&apos;ll email you a one-time code.
      </p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <div>
            <label className="label">Code</label>
            <input
              className="input tracking-widest text-center text-lg"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
            <p className="text-xs text-ink-400 mt-2">
              Sent to <span className="text-ink-200">{email}</span>.{" "}
              <button type="button" className="link" onClick={() => setStep("email")}>
                Change
              </button>
            </p>
          </div>
          <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? "Verifying…" : "Sign in"}
          </button>
        </form>
      )}

      {err && <div className="mt-4 text-sm text-red-400">{err}</div>}
    </div>
  );
}
