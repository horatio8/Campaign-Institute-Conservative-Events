import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

// This is a stub of the internal admin portal described in spec §4.
// In production this sits on a separate auth boundary with SSO-only sign-in.
// For this scaffold we gate it with ADMIN_EMAIL env var.
export default async function AdminPage() {
  const user = await getSessionUser();
  const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim());
  if (!user || !allowlist.includes(user.email)) {
    redirect("/");
  }

  const [users, events, calendars, reports, orders] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.calendar.count(),
    prisma.report.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.ticketOrder.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Users" n={users} />
        <Stat label="Calendars" n={calendars} />
        <Stat label="Events" n={events} />
        <Stat label="Orders" n={orders} />
        <Stat label="Open reports" n={reports.length} />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Open reports</h2>
        {reports.length === 0 ? (
          <p className="text-ink-400 text-sm">Queue empty.</p>
        ) : (
          <ul className="panel rounded-lg divide-y divide-ink-700">
            {reports.map((r) => (
              <li key={r.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <div>{r.reason} <span className="text-ink-400">({r.targetType})</span></div>
                  <div className="text-xs text-ink-400">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <Link href={`/admin/reports/${r.id}`} className="link">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 text-sm text-ink-400">
        <h2 className="text-lg font-semibold text-ink-50">Queues</h2>
        <p>Trust & safety, payments ops, support, growth curation, compliance, platform config,
        feature flags, experiments — each surfaces as a route under <code>/admin/*</code> per
        spec §4. Stubbed here; wire to real data in later sprints.</p>
      </section>
    </div>
  );
}

function Stat({ label, n }: { label: string; n: number }) {
  return (
    <div className="panel rounded-lg p-4">
      <div className="text-xs text-ink-400">{label}</div>
      <div className="text-2xl font-semibold">{n}</div>
    </div>
  );
}
