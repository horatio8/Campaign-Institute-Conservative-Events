import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const reports = await prisma.report.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: true },
  });

  const statuses = ["open", "reviewing", "actioned", "dismissed"];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <div className="flex gap-2 text-sm">
        <Link
          href="/admin/reports"
          className={`px-3 py-1 rounded-full border ${!status ? "border-brand text-brand" : "border-ink-700 text-ink-300"}`}
        >All</Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
            className={`px-3 py-1 rounded-full border capitalize ${status === s ? "border-brand text-brand" : "border-ink-700 text-ink-300"}`}
          >{s}</Link>
        ))}
      </div>
      <ul className="panel rounded-lg divide-y divide-ink-700">
        {reports.length === 0 && <li className="p-4 text-sm text-ink-400">No reports.</li>}
        {reports.map((r) => (
          <li key={r.id} className="p-3 flex justify-between text-sm">
            <div>
              <div>{r.reason} <span className="text-ink-400">on {r.targetType}</span></div>
              <div className="text-xs text-ink-400">
                by {r.reporter.email} · {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-xs capitalize text-ink-300">{r.status}</span>
              <Link href={`/admin/reports/${r.id}`} className="link">Open</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
