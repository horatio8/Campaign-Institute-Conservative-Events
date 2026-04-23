import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { getSessionUser } from "@/lib/auth";
import { SubscribeButton } from "./SubscribeButton";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calendar = await prisma.calendar.findUnique({
    where: { slug },
    include: {
      events: {
        where: { status: "published", visibility: "public" },
        orderBy: { startsAt: "asc" },
        include: {
          calendar: true,
          _count: { select: { guests: true } },
        },
      },
      _count: { select: { subscribers: true } },
    },
  });
  if (!calendar || calendar.isSuspended) notFound();

  const user = await getSessionUser();
  const isSubscribed = user
    ? (await prisma.subscription.findUnique({
        where: {
          calendarId_userId: { calendarId: calendar.id, userId: user.id },
        },
      })) !== null
    : false;

  const upcoming = calendar.events.filter((e) => e.startsAt >= new Date());
  const past = calendar.events.filter((e) => e.startsAt < new Date()).slice(0, 6);

  return (
    <div className="space-y-8">
      <header className="panel rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-ink-800 rounded-lg flex items-center justify-center text-brand text-xl font-bold">
            {calendar.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{calendar.name}</h1>
            <div className="text-ink-400 text-sm">
              @{calendar.slug} · {calendar._count.subscribers} subscribers
            </div>
            {calendar.description && (
              <p className="mt-2 text-ink-200 text-sm">{calendar.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/api/calendars/${calendar.id}/ics`}
              className="btn-ghost"
            >
              Subscribe via iCal
            </Link>
            <SubscribeButton
              calendarId={calendar.id}
              initial={isSubscribed}
              signedIn={!!user}
            />
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-ink-400 text-sm">No upcoming events.</p>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Past</h2>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
    </div>
  );
}
