import Link from "next/link";
import { prisma } from "@/lib/db";
import { EventCard } from "@/components/EventCard";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Tech", "AI", "Crypto", "Food & Drink", "Arts & Culture",
  "Climate", "Fitness", "Wellness", "Business", "Community",
];

export default async function DiscoverPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; city?: string; tag?: string }> }) {
  const { q, city, tag } = await searchParams;

  const events = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startsAt: { gte: new Date() },
      ...(q
        ? { OR: [{ title: { contains: q } }, { descriptionRich: { contains: q } }] }
        : {}),
      ...(city ? { address: { contains: city } } : {}),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 48,
    include: { calendar: true, _count: { select: { guests: true } } },
  });

  const now = new Date();
  const featured = await prisma.event.findMany({
    where: {
      status: "published",
      visibility: "public",
      startsAt: { gte: now },
      featuredUntil: { gt: now },
    },
    orderBy: { startsAt: "asc" },
    take: 6,
    include: { calendar: true, _count: { select: { guests: true } } },
  });

  const calendars = await prisma.calendar.findMany({
    where: { isSuspended: false },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Discover</h1>
        <form className="flex gap-2 ml-auto">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search events…"
            className="input w-64"
          />
          <input
            name="city"
            defaultValue={city}
            placeholder="City"
            className="input w-40"
          />
          <button className="btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/discover?q=${encodeURIComponent(c)}`}
            className="px-3 py-1 rounded-full border border-ink-700 text-sm text-ink-200 hover:border-brand"
          >
            {c}
          </Link>
        ))}
      </div>

      {featured.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Featured events</h2>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {tag && (
        <div className="text-sm text-ink-300">
          Filtering by tag: <span className="text-brand">#{tag}</span>{" "}
          <Link href="/discover" className="text-ink-400 hover:underline">clear</Link>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Featured calendars</h2>
        <div className="flex flex-wrap gap-3">
          {calendars.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="panel px-4 py-3 rounded-lg text-sm hover:border-brand"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-ink-400 text-xs">@{c.slug}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
        {events.length === 0 ? (
          <p className="text-ink-400 text-sm">No events match.</p>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
