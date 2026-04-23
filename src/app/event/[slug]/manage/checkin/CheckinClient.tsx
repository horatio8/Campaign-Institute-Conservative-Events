"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Match = {
  id: string;
  displayName: string;
  email: string;
  status: string;
};

type Recent = { ok: boolean; name: string; email: string; status: string; at: number };

export function CheckinClient({ eventId }: { eventId: string }) {
  const [mode, setMode] = useState<"search" | "scan">("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Match[]>([]);
  const [recents, setRecents] = useState<Recent[]>([]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/events/${eventId}/guest-search?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(await res.json());
  }

  async function checkById(id: string) {
    const res = await fetch(`/api/events/${eventId}/guests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "checked_in" }),
    });
    if (res.ok) {
      setResults((rs) =>
        rs.map((r) => (r.id === id ? { ...r, status: "checked_in" } : r))
      );
    }
  }

  async function checkByToken(token: string) {
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrToken: token }),
    });
    const body = await res.json();
    const recent: Recent = {
      ok: res.ok,
      name: body?.guest?.displayName ?? "Unknown",
      email: body?.guest?.email ?? token.slice(-6),
      status: body?.guest?.status ?? "error",
      at: Date.now(),
    };
    setRecents((xs) => [recent, ...xs].slice(0, 10));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={mode === "search" ? "btn-primary" : "btn-ghost"}
          onClick={() => setMode("search")}
        >
          Search
        </button>
        <button
          className={mode === "scan" ? "btn-primary" : "btn-ghost"}
          onClick={() => setMode("scan")}
        >
          Scan QR
        </button>
      </div>

      {mode === "search" ? (
        <>
          <form onSubmit={search} className="flex gap-2">
            <input
              className="input"
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn-primary" disabled={!q}>Search</button>
          </form>
          <ul className="panel rounded-lg divide-y divide-ink-700">
            {results.length === 0 && (
              <li className="p-4 text-sm text-ink-400">No matches.</li>
            )}
            {results.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.displayName}</div>
                  <div className="text-xs text-ink-400">{r.email}</div>
                </div>
                {r.status === "checked_in" ? (
                  <span className="text-green-400 text-sm">✓ Checked in</span>
                ) : (
                  <button onClick={() => checkById(r.id)} className="btn-primary">
                    Check in
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <QrScanner onScan={checkByToken} />
      )}

      {recents.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">Recent scans</h3>
          <ul className="panel rounded-lg divide-y divide-ink-700 text-sm">
            {recents.map((r, i) => (
              <li key={i} className="p-3 flex items-center justify-between">
                <div>
                  <div>{r.name}</div>
                  <div className="text-xs text-ink-400">{r.email}</div>
                </div>
                <span className={r.ok ? "text-green-400" : "text-red-400"}>
                  {r.ok ? "✓ " + r.status.replace("_", " ") : "✗ error"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QrScanner({ onScan }: { onScan: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch (e: unknown) {
        setErr("Camera unavailable. Try the Search tab.");
        return;
      }

      // Prefer native BarcodeDetector when available.
      const BD = (window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
        };
      }).BarcodeDetector;
      if (BD) {
        try {
          detector = new BD({ formats: ["qr_code"] });
        } catch { detector = null; }
      }

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          raf = requestAnimationFrame(tick);
          return;
        }
        let value: string | null = null;
        if (detector) {
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) value = results[0].rawValue;
          } catch { /* swallow */ }
        }
        if (!value) {
          const c = canvasRef.current!;
          const v = videoRef.current;
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            const decoded = jsQR(img.data, c.width, c.height, { inversionAttempts: "dontInvert" });
            if (decoded?.data) value = decoded.data;
          }
        }
        if (value) {
          if (!seen.has(value)) {
            setSeen((s) => new Set(s).add(value!));
            onScan(value);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  return (
    <div className="panel rounded-xl p-3 space-y-2">
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full rounded-md bg-ink-900 aspect-[4/3] object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-xs text-ink-400">Point at a guest's ticket QR.</p>
    </div>
  );
}
