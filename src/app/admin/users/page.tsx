import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: {
        select: { ownedCalendars: true, guestOf: true, hostOf: true },
      },
    },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Users</h1>
      <form>
        <input
          name="q"
          className="input max-w-md"
          placeholder="Search by email or name…"
          defaultValue={q}
        />
      </form>
      <table className="w-full text-sm panel rounded-lg overflow-hidden">
        <thead className="bg-ink-800 text-ink-300">
          <tr>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Calendars</th>
            <th className="text-left p-2">Hosting</th>
            <th className="text-left p-2">Attending</th>
            <th className="text-left p-2">Joined</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-ink-700">
              <td className="p-2 font-mono text-xs">
                <Link href={`/admin/users/${u.id}`} className="link">{u.email}</Link>
              </td>
              <td className="p-2">{u.name ?? ""}</td>
              <td className="p-2">{u._count.ownedCalendars}</td>
              <td className="p-2">{u._count.hostOf}</td>
              <td className="p-2">{u._count.guestOf}</td>
              <td className="p-2 text-xs text-ink-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="p-2">
                {u.suspendedAt ? (
                  <span className="text-red-400">suspended</span>
                ) : (
                  <span className="text-green-400">active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
