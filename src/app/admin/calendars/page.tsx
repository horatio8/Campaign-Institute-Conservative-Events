import Link from "next/link";
import { prisma } from "@/lib/db";
import { CalendarActions } from "./CalendarActions";

export const dynamic = "force-dynamic";

export default async function CalendarsAdminPage() {
  const calendars = await prisma.calendar.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { events: true, subscribers: true } },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Calendars</h1>
      <table className="w-full text-sm panel rounded-lg overflow-hidden">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Slug</th>
            <th className="text-left p-2">Events</th>
            <th className="text-left p-2">Subscribers</th>
            <th className="text-left p-2">Verified</th>
            <th className="text-left p-2">Status</th>
            <th className="text-right p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calendars.map((c) => (
            <tr key={c.id} className="border-t border-ink-700">
              <td className="p-2">{c.name}</td>
              <td className="p-2 text-xs text-ink-400">
                <Link href={`/c/${c.slug}`} className="link">@{c.slug}</Link>
              </td>
              <td className="p-2">{c._count.events}</td>
              <td className="p-2">{c._count.subscribers}</td>
              <td className="p-2 text-xs">{c.isVerified ? "✓" : ""}</td>
              <td className="p-2 text-xs">
                {c.isSuspended
                  ? <span className="text-red-400">suspended</span>
                  : <span className="text-green-400">active</span>}
              </td>
              <td className="p-2 text-right">
                <CalendarActions
                  calendarId={c.id}
                  verified={c.isVerified}
                  suspended={c.isSuspended}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
