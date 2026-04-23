import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatInTimeZone } from "date-fns-tz";
import { RsvpPanel } from "./RsvpPanel";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      calendar: true,
      hosts: { include: { user: true }, orderBy: { displayOrder: "asc" } },
      ticketTypes: true,
      _count: { select: { guests: true } },
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!event || event.status !== "published" && event.visibility !== "public") {
    if (!event) notFound();
  }
  if (!event) notFound();

  const existingGuest = user
    ? await prisma.guest.findFirst({
        where: { eventId: event.id, userId: user.id },
      })
    : null;

  const revealLocation =
    !event.hideLocationUntilApproved ||
    !!existingGuest ||
    (user && event.hosts.some((h) => h.userId === user.id));

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="panel rounded-xl overflow-hidden">
          <div className="aspect-[16/9] bg-ink-800">
            {event.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-400">No cover image</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Link href={`/c/${event.calendar.slug}`} className="text-sm text-brand hover:underline">
            @{event.calendar.slug}
          </Link>
          <h1 className="text-3xl font-bold leading-tight">{event.title}</h1>
          <div className="text-ink-300">
            {formatInTimeZone(event.startsAt, event.timezone, "EEEE, LLLL d · h:mm a zzz")}
            {" → "}
            {formatInTimeZone(event.endsAt, event.timezone, "h:mm a")}
          </div>
          <div className="text-ink-300">
            {event.locationType === "virtual"
              ? "Virtual event"
              : revealLocation
              ? event.address ?? "Location TBA"
              : "Location revealed after registration"}
          </div>
        </div>

        {event.hosts.length > 0 && (
          <div>
            <div className="text-sm text-ink-400 mb-2">Hosted by</div>
            <div className="flex flex-wrap gap-2">
              {event.hosts.map((h) => (
                <span key={h.id} className="panel px-3 py-1.5 rounded-full text-sm">
                  {h.user.name ?? h.user.email}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.descriptionRich && (
          <article className="prose-luma max-w-none whitespace-pre-wrap">
            {event.descriptionRich}
          </article>
        )}
      </div>

      <aside className="space-y-4">
        <RsvpPanel
          eventId={event.id}
          slug={event.slug}
          signedIn={!!user}
          alreadyRegistered={!!existingGuest}
          approvalRequired={event.approvalRequired}
          guestCount={event._count.guests}
          capacity={event.capacity}
          status={event.status}
          userEmail={user?.email ?? null}
          questions={event.questions.map((q) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
          }))}
        />
      </aside>
    </div>
  );
}
