import type { Event, Guest, TicketType, Coupon, EventTag } from "@prisma/client";

export function serializeEvent(e: Event & { hosts?: { user: { email: string; name: string | null } }[] }) {
  return {
    api_id: `evt_${e.id}`,
    short_code: e.shortCode,
    slug: e.slug,
    name: e.title,
    description: e.descriptionRich,
    cover_url: e.coverUrl,
    start_at: e.startsAt.toISOString(),
    end_at: e.endsAt.toISOString(),
    timezone: e.timezone,
    location_type: e.locationType,
    geo_address_info: e.address ? { address: e.address, lat: e.lat, lon: e.lon } : null,
    virtual_url: e.virtualUrl,
    capacity: e.capacity,
    visibility: e.visibility,
    status: e.status,
    approval_required: e.approvalRequired,
    url: `${process.env.APP_URL ?? "http://localhost:3000"}/event/${e.slug}`,
  };
}

export function serializeGuest(g: Guest) {
  return {
    api_id: `guest_${g.id}`,
    event_api_id: `evt_${g.eventId}`,
    name: g.displayName,
    email: g.email,
    approval_status: g.status,
    registered_at: g.registeredAt.toISOString(),
    checked_in_at: g.checkedInAt?.toISOString() ?? null,
  };
}

export function serializeTicketType(t: TicketType) {
  return {
    api_id: `tkt_${t.id}`,
    event_api_id: `evt_${t.eventId}`,
    name: t.name,
    description: t.description,
    price_cents: t.priceCents,
    currency: t.currency,
    inventory: t.inventory,
    sales_start: t.salesStart?.toISOString() ?? null,
    sales_end: t.salesEnd?.toISOString() ?? null,
    access_level: t.accessLevel,
    is_transferable: t.isTransferable,
  };
}

export function serializeCoupon(c: Coupon) {
  return {
    api_id: `cpn_${c.id}`,
    code: c.code,
    kind: c.kind,
    amount: c.amount,
    quantity: c.quantity,
    redeemed: c.redeemed,
    starts_at: c.startsAt?.toISOString() ?? null,
    ends_at: c.endsAt?.toISOString() ?? null,
  };
}

export function serializeTag(t: EventTag) {
  return { api_id: `tag_${t.id}`, name: t.name };
}

export function pageEnvelope<T>(items: T[], nextCursor: string | null) {
  return {
    entries: items,
    has_more: nextCursor != null,
    next_cursor: nextCursor,
  };
}
