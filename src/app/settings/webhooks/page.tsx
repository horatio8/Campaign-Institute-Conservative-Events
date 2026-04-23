import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { WebhooksClient } from "./WebhooksClient";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const memberships = await prisma.calendarMember.findMany({
    where: { userId: user.id, role: { in: ["owner", "admin"] } },
    include: {
      calendar: {
        include: {
          webhooks: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const calendarsWithDeliveries = await Promise.all(
    memberships.map(async (m) => {
      const recent = await prisma.webhookDelivery.findMany({
        where: { endpoint: { calendarId: m.calendarId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { endpoint: true },
      });
      return {
        id: m.calendar.id,
        name: m.calendar.name,
        endpoints: m.calendar.webhooks.map((w) => ({
          id: w.id,
          url: w.url,
          events: w.events.split(","),
          status: w.status,
          createdAt: w.createdAt,
        })),
        recent: recent.map((d) => ({
          id: d.id,
          event: d.event,
          url: d.endpoint.url,
          statusCode: d.statusCode,
          attempts: d.attempts,
          deliveredAt: d.deliveredAt,
          nextRetryAt: d.nextRetryAt,
          createdAt: d.createdAt,
        })),
      };
    })
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Webhooks</h1>
      <p className="text-ink-300 text-sm">
        Deliveries are signed with HMAC-SHA256 in the{" "}
        <code className="bg-ink-800 px-1 rounded">Luma-Signature</code> header.
      </p>
      {calendarsWithDeliveries.length === 0 ? (
        <p className="text-ink-400 text-sm">
          Create a calendar first.
        </p>
      ) : (
        calendarsWithDeliveries.map((c) => (
          <WebhooksClient key={c.id} calendar={c} />
        ))
      )}
    </div>
  );
}
