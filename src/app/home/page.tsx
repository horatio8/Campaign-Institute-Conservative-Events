import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { EventCard } from "@/components/EventCard";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

export default async function MyHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const hosting = await prisma.event.findMany({
    where: { hosts: { some: { userId: user.id } } },
    orderBy: { startsAt: "desc" },
    include: { calendar: true, _count: { select: { guests: true } } },
  });

  const attending = await prisma.guest.findMany({
    where: { userId: user.id, status: { in: ["registered", "approved", "checked_in"] } },
    orderBy: { event: { startsAt: "asc" } },
    include: { event: { include: { calendar: true } }, ticket: true },
  });

  const calendars = await prisma.calendar.findMany({
    where: { members: { some: { userId: user.id } } },
  });

  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your events</h1>
        <div className="flex gap-2">
          <Link href="/create" className="btn-primary">New event</Link>
          <Link href="/settings/api-keys" className="btn-ghost">API keys</Link>
        </div>
      </section>

      {calendars.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Your calendars</h2>
          <div className="flex flex-wrap gap-2">
            {calendars.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="panel px-4 py-2 rounded-md text-sm hover:border-brand"
              >
                {c.name} <span className="text-ink-400">@{c.slug}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Hosting</h2>
        {hosting.length === 0 ? (
          <p className="text-ink-400 text-sm">You&apos;re not hosting anything yet.</p>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {hosting.map((e) => (
              <div key={e.id} className="space-y-2">
                <EventCard event={e} />
                <Link
                  href={`/event/${e.slug}/manage`}
                  className="block text-xs text-ink-300 hover:text-brand"
                >
                  → Manage ({e._count.guests} guests)
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Attending</h2>
        {attending.length === 0 ? (
          <p className="text-ink-400 text-sm">No tickets yet. Explore{" "}
            <Link href="/discover" className="link">Discover</Link>.
          </p>
        ) : (
          <ul className="panel divide-y divide-ink-700 rounded-lg">
            {attending.map((g) => (
              <li key={g.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/event/${g.event.slug}`} className="font-medium hover:text-brand truncate block">
                    {g.event.title}
                  </Link>
                  <div className="text-xs text-ink-400">
                    {formatInTimeZone(g.event.startsAt, g.event.timezone, "EEE, LLL d · h:mm a zzz")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-ink-800 text-ink-200 capitalize">
                    {g.status.replace("_", " ")}
                  </span>
                  {g.ticket && (
                    <Link
                      href={`/ticket/${g.ticket.qrToken}`}
                      className="btn-ghost text-xs"
                    >
                      Show ticket
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
