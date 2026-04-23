import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { staff: true },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <table className="w-full text-sm panel rounded-lg overflow-hidden">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left p-2">When</th>
            <th className="text-left p-2">Staff</th>
            <th className="text-left p-2">Action</th>
            <th className="text-left p-2">Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-ink-400 text-center">No entries yet.</td></tr>
          )}
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-ink-700">
              <td className="p-2 text-xs text-ink-400">
                {new Date(e.createdAt).toLocaleString()}
              </td>
              <td className="p-2 text-xs">{e.staff?.email ?? "system"}</td>
              <td className="p-2 font-mono text-xs">{e.action}</td>
              <td className="p-2 font-mono text-xs">{e.targetType}/{e.targetId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
