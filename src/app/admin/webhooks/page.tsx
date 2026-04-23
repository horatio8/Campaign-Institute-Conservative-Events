import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WebhooksAdminPage() {
  const deliveries = await prisma.webhookDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { endpoint: { include: { calendar: true } } },
  });

  const now = Date.now();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Webhook deliveries</h1>
      <p className="text-ink-400 text-sm">
        Tick the dispatcher manually:{" "}
        <code className="bg-ink-800 px-1 rounded">
          POST /api/cron/webhooks
        </code>
      </p>
      <table className="w-full text-sm panel rounded-lg overflow-hidden">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Event</th>
            <th className="text-left p-2">Endpoint</th>
            <th className="text-left p-2">Attempts</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Delivered</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.length === 0 && (
            <tr><td colSpan={6} className="p-4 text-ink-400 text-center">No deliveries yet.</td></tr>
          )}
          {deliveries.map((d) => (
            <tr key={d.id} className="border-t border-ink-700">
              <td className="p-2 text-xs text-ink-400">{new Date(d.createdAt).toLocaleString()}</td>
              <td className="p-2 text-xs">{d.event}</td>
              <td className="p-2 text-xs truncate max-w-[260px]">
                @{d.endpoint.calendar.slug} → {d.endpoint.url}
              </td>
              <td className="p-2 text-xs">{d.attempts}</td>
              <td className="p-2 text-xs">
                {d.deliveredAt ? (
                  <span className="text-green-400">{d.statusCode}</span>
                ) : d.nextRetryAt && d.nextRetryAt.getTime() > now ? (
                  <span className="text-yellow-400">retry at {new Date(d.nextRetryAt).toLocaleTimeString()}</span>
                ) : (
                  <span className="text-ink-400">pending</span>
                )}
              </td>
              <td className="p-2 text-xs text-ink-400">
                {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
