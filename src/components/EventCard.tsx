import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

type Props = {
  event: {
    slug: string;
    title: string;
    coverUrl: string | null;
    startsAt: Date;
    timezone: string;
    locationType: string;
    address: string | null;
    calendar: { name: string; slug: string };
    _count?: { guests: number };
  };
};

export function EventCard({ event }: Props) {
  return (
    <Link
      href={`/event/${event.slug}`}
      className="panel rounded-lg overflow-hidden hover:border-brand transition block"
    >
      <div className="aspect-[16/9] bg-ink-800 flex items-center justify-center">
        {event.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-ink-400 text-sm">No cover</div>
        )}
      </div>
      <div className="p-4 space-y-1">
        <div className="text-xs text-brand">
          {formatInTimeZone(event.startsAt, event.timezone, "EEE, LLL d · h:mm a zzz")}
        </div>
        <div className="text-base font-semibold leading-snug line-clamp-2">{event.title}</div>
        <div className="text-sm text-ink-300 line-clamp-1">
          {event.locationType === "virtual" ? "Virtual" : event.address ?? "TBA"}
        </div>
        <div className="text-xs text-ink-400 flex justify-between pt-1">
          <span>by @{event.calendar.slug}</span>
          {event._count?.guests !== undefined && <span>{event._count.guests} going</span>}
        </div>
      </div>
    </Link>
  );
}
