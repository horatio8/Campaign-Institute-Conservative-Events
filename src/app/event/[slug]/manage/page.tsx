import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatInTimeZone } from "date-fns-tz";
import { GuestTable } from "./GuestTable";
import { BlastForm } from "./BlastForm";

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

      <section>
        <h2 className="text-lg font-semibold mb-3">Guests ({event._count.guests})</h2>
        <GuestTable eventId={event.id} guests={event.guests} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Send a blast</h2>
        <BlastForm eventId={event.id} />
      </section>
    </div>
  );
}
