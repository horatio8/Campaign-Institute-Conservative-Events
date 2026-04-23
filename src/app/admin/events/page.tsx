import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatInTimeZone } from "date-fns-tz";
import { EventActions } from "./EventActions";

export const dynamic = "force-dynamic";

export default async function EventsAdminPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { q, filter } = await searchParams;
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      ...(q ? { title: { contains: q } } : {}),
      ...(filter === "featured" ? { featuredUntil: { gt: now } } : {}),
      ...(filter === "cancelled" ? { status: "cancelled" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      calendar: true,
      _count: { select: { guests: true } },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Events</h1>
      <form className="flex gap-2">
        <input
          name="q"
          className="input max-w-md"
          placeholder="Search by title…"
          defaultValue={q}
        />
        <select name="filter" defaultValue={filter ?? ""} className="input max-w-[160px]">
          <option value="">All</option>
          <option value="featured">Featured</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-primary" type="submit">Filter</button>
      </form>

      <table className="w-full text-sm panel rounded-lg overflow-hidden">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left p-2">Title</th>
            <th className="text-left p-2">Calendar</th>
            <th className="text-left p-2">When</th>
            <th className="text-left p-2">Guests</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Featured</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t border-ink-700">
              <td className="p-2">
                <Link href={`/event/${e.slug}`} className="link">{e.title}</Link>
              </td>
              <td className="p-2 text-xs text-ink-400">@{e.calendar.slug}</td>
              <td className="p-2 text-xs">
                {formatInTimeZone(e.startsAt, e.timezone, "LLL d, h:mm a")}
              </td>
              <td className="p-2">{e._count.guests}</td>
              <td className="p-2 capitalize text-xs">{e.status}</td>
              <td className="p-2 text-xs text-ink-400">
                {e.featuredUntil && e.featuredUntil > now
                  ? `until ${e.featuredUntil.toLocaleDateString()}`
                  : "—"}
              </td>
              <td className="p-2 text-right">
                <EventActions
                  eventId={e.id}
                  featured={!!e.featuredUntil && e.featuredUntil > now}
                  cancelled={e.status === "cancelled"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
