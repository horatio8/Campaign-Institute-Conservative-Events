import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { UserActions } from "./UserActions";

export const dynamic = "force-dynamic";

export default async function UserDetail({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { createdAt: "desc" }, take: 10 },
      ownedCalendars: { include: { calendar: true } },
      hostOf: { include: { event: true } },
      guestOf: {
        orderBy: { registeredAt: "desc" },
        take: 20,
        include: { event: true },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{user.name ?? user.email}</h1>
          <div className="text-ink-400 text-sm font-mono">{user.email} · {user.id}</div>
        </div>
        <div className="flex-1" />
        <UserActions userId={user.id} suspended={!!user.suspendedAt} />
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="panel rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Calendars ({user.ownedCalendars.length})</h2>
          <ul className="text-sm space-y-1">
            {user.ownedCalendars.map((m) => (
              <li key={m.id}>
                <Link href={`/c/${m.calendar.slug}`} className="link">@{m.calendar.slug}</Link>
                <span className="text-ink-400"> · {m.role}</span>
              </li>
            ))}
            {user.ownedCalendars.length === 0 && <li className="text-ink-400">None</li>}
          </ul>
        </div>
        <div className="panel rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Sessions ({user.sessions.length})</h2>
          <ul className="text-xs space-y-1">
            {user.sessions.map((s) => (
              <li key={s.id}>
                {s.revokedAt ? "revoked" : s.expiresAt < new Date() ? "expired" : "active"} —{" "}
                {new Date(s.createdAt).toLocaleString()}
              </li>
            ))}
            {user.sessions.length === 0 && <li className="text-ink-400">No sessions.</li>}
          </ul>
        </div>
      </section>

      <section className="panel rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Recent RSVPs</h2>
        {user.guestOf.length === 0 ? (
          <p className="text-ink-400 text-sm">None.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {user.guestOf.map((g) => (
              <li key={g.id}>
                <Link href={`/event/${g.event.slug}`} className="link">{g.event.title}</Link>
                <span className="text-ink-400"> · {g.status} · {new Date(g.registeredAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
