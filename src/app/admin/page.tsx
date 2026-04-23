import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [users, events, calendars, reports, orders, pendingWebhooks, featured] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.calendar.count(),
    prisma.report.count({ where: { status: "open" } }),
    prisma.ticketOrder.count(),
    prisma.webhookDelivery.count({ where: { deliveredAt: null } }),
    prisma.event.count({ where: { featuredUntil: { gt: new Date() } } }),
  ]);

  const recentReports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { reporter: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Users" n={users} href="/admin/users" />
        <Stat label="Calendars" n={calendars} href="/admin/calendars" />
        <Stat label="Events" n={events} href="/admin/events" />
        <Stat label="Orders" n={orders} />
        <Stat label="Open reports" n={reports} href="/admin/reports" accent />
        <Stat label="Featured events" n={featured} href="/admin/events?filter=featured" />
        <Stat label="Pending webhooks" n={pendingWebhooks} href="/admin/webhooks" />
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Latest open reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-ink-400 text-sm">Queue empty.</p>
        ) : (
          <ul className="panel rounded-lg divide-y divide-ink-700">
            {recentReports.map((r) => (
              <li key={r.id} className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div>
                    <span className="text-ink-400">{r.targetType}:</span>{" "}
                    <span className="font-medium">{r.reason}</span>
                  </div>
                  <div className="text-xs text-ink-400">
                    by {r.reporter.email} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <Link href={`/admin/reports/${r.id}`} className="link">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label, n, href, accent,
}: { label: string; n: number; href?: string; accent?: boolean }) {
  const inner = (
    <>
      <div className="text-xs text-ink-400">{label}</div>
      <div className={`text-2xl font-semibold ${accent && n > 0 ? "text-brand" : ""}`}>{n}</div>
    </>
  );
  const base = "panel rounded-lg p-4 block";
  if (href) return <Link href={href} className={`${base} hover:border-brand`}>{inner}</Link>;
  return <div className={base}>{inner}</div>;
}
