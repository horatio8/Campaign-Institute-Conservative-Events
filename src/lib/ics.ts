import { createEvents, type EventAttributes, type DateArray } from "ics";

export type IcsEvent = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  address?: string | null;
  url?: string;
};

function toDateArray(d: Date): DateArray {
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
}

export function buildIcs(events: IcsEvent[]): string {
  const attrs: EventAttributes[] = events.map((e) => ({
    uid: `${e.id}@luma.local`,
    title: e.title,
    description: e.description ?? undefined,
    start: toDateArray(e.startsAt),
    end: toDateArray(e.endsAt),
    startInputType: "utc",
    endInputType: "utc",
    location: e.address ?? undefined,
    url: e.url,
  }));
  const { error, value } = createEvents(attrs);
  if (error) throw error;
  return value ?? "";
}
