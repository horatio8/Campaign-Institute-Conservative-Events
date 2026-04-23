import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatInTimeZone } from "date-fns-tz";
import { GuestTable } from "./GuestTable";
import { BlastForm } from "./BlastForm";
import { TagsAndIO } from "./TagsAndIO";

export const dynamic = "force-dynamic";

export default async function ManagePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      calendar: true,
      hosts: true,
      ticketTypes: true,
      guests: { orderBy: { registeredAt: "desc" } },
      tags: { include: { tag: true } },
      _count: { select: { guests: true } },
    },
  });
  if (!event) notFound();
  if (!event.hosts.some((h) => h.userId === user.id)) {
    redirect(`/event/${slug}`);
  }

  const statusCounts = await prisma.guest.groupBy({
    by: ["status"],
    where: { eventId: event.id },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    statusCounts.map((r) => [r.status, r._count._all])
  );

  const topReferrerRows = await prisma.guest.groupBy({
    by: ["referrerUserId"],
    where: { eventId: event.id, referrerUserId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { referrerUserId: "desc" } },
    take: 5,
  });
  const referrers = await Promise.all(
    topReferrerRows.map(async (row) => {
      const u = row.referrerUserId
        ? await prisma.user.findUnique({ where: { id: row.referrerUserId } })
        : null;
      return {
        name: u?.name ?? u?.email ?? "Unknown",
        count: row._count._all,
      };
    })
  );

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <Link href={`/event/${event.slug}`} className="text-sm text-brand hover:underline">
            ← Event page
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{event.title}</h1>
          <div className="text-ink-300 text-sm">
            {formatInTimeZone(event.startsAt, event.timezone, "EEE LLL d, h:mm a zzz")}
            {" · "}
            {event.calendar.name}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/event/${event.slug}/manage/checkin`} className="btn-primary">
            Check-in
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["registered", "pending", "approved", "waitlisted", "checked_in"].map((s) => (
          <div key={s} className="panel rounded-lg p-4">
            <div className="text-xs text-ink-400 capitalize">{s.replace("_", " ")}</div>
            <div className="text-2xl font-semibold">{counts[s] ?? 0}</div>
          </div>
        ))}
      </section>

      <TagsAndIO
        eventId={event.id}
        calendarId={event.calendarId}
        initialTags={event.tags.map((a) => ({ id: a.tag.id, name: a.tag.name }))}
      />

      <section>
        <h2 className="text-lg font-semibold mb-3">Guests ({event._count.guests})</h2>
        <GuestTable eventId={event.id} guests={event.guests} />
      </section>

      {referrers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Top referrers</h2>
          <ul className="panel rounded-lg divide-y divide-ink-700 max-w-md">
            {referrers.map((r) => (
              <li key={r.name} className="p-3 flex justify-between text-sm">
                <span>{r.name}</span>
                <span className="text-brand">{r.count} invite{r.count === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Send a blast</h2>
        <BlastForm eventId={event.id} />
      </section>
    </div>
  );
}
