import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatInTimeZone } from "date-fns-tz";
import { Qr } from "@/components/Qr";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: token },
    include: {
      event: { include: { calendar: true } },
      guest: true,
      ticketType: true,
    },
  });
  if (!ticket) notFound();

  const checkedIn = ticket.guest?.status === "checked_in";

  return (
    <div className="max-w-sm mx-auto space-y-5 pt-4">
      <div className="panel rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="text-xs text-ink-400 uppercase tracking-widest">Your ticket</div>
        <div className="text-center">
          <div className="text-xl font-semibold leading-tight">{ticket.event.title}</div>
          <div className="text-ink-300 text-sm mt-1">
            {formatInTimeZone(ticket.event.startsAt, ticket.event.timezone, "EEE LLL d · h:mm a zzz")}
          </div>
          <div className="text-ink-400 text-xs">
            {ticket.event.locationType === "virtual"
              ? "Virtual"
              : ticket.event.address ?? "TBA"}
          </div>
        </div>
        <Qr value={token} size={240} />
        {checkedIn ? (
          <div className="px-3 py-1 rounded-full bg-green-600 text-white text-xs">
            ✓ Checked in
          </div>
        ) : (
          <div className="text-xs text-ink-400">Show this at the door.</div>
        )}
        {ticket.guest && (
          <div className="text-center text-sm">
            <div className="font-medium">{ticket.guest.displayName}</div>
            <div className="text-ink-400">{ticket.guest.email}</div>
          </div>
        )}
        <div className="text-xs text-ink-400 text-center pt-2 border-t border-ink-700 w-full">
          {ticket.ticketType.name} ·{" "}
          <Link href={`/event/${ticket.event.slug}`} className="link">
            @{ticket.event.calendar.slug}
          </Link>
        </div>
      </div>
    </div>
  );
}
