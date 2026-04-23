import Link from "next/link";
import { prisma } from "@/lib/db";
import { EventCard } from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const upcoming = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 6,
    include: { calendar: true, _count: { select: { guests: true } } },
  });

  return (
    <div className="space-y-12">
      <section className="text-center py-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Delightful events start here.
        </h1>
        <p className="mt-4 text-ink-300 max-w-xl mx-auto">
          Set up an event page, invite friends, and sell tickets. Host a memorable experience.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/create" className="btn-primary">Create your first event</Link>
          <Link href="/discover" className="btn-ghost">Explore events</Link>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Popular events</h2>
          <Link href="/discover" className="link text-sm">Explore all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-ink-400 text-sm">No upcoming events yet. Be the first to create one.</p>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
