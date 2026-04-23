import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ApiKeysClient } from "./ApiKeysClient";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const memberships = await prisma.calendarMember.findMany({
    where: { userId: user.id, role: { in: ["owner", "admin"] } },
    include: {
      calendar: {
        include: { apiKeys: { where: { revokedAt: null } } },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">API keys</h1>
      <p className="text-ink-300 text-sm">
        Scope per calendar. Rate limit: 200 rpm. Include as{" "}
        <code className="bg-ink-800 px-1 rounded">x-luma-api-key</code> header.
      </p>

      {memberships.length === 0 ? (
        <p className="text-ink-400 text-sm">
          You&apos;re not an admin of any calendar yet. Create one from the
          <a className="link" href="/create">{" "}new event flow</a>.
        </p>
      ) : (
        memberships.map((m) => (
          <ApiKeysClient
            key={m.calendarId}
            calendar={{ id: m.calendar.id, name: m.calendar.name }}
            keys={m.calendar.apiKeys.map((k) => ({
              id: k.id,
              label: k.label ?? "",
              lastFour: k.lastFour,
              createdAt: k.createdAt,
            }))}
          />
        ))
      )}
    </div>
  );
}
