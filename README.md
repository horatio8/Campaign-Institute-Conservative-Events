# Luma clone

A Next.js implementation of the Luma product, built from `LUMA_CLONE_SPEC.md`.

## What's here

- **Sprint 1 foundations** (spec §10): email-code sign-in, sessions,
  calendar + event creation, public event pages, RSVP (with approval and
  waitlist), iCal feeds, reminders-ready email layer.
- **Host dashboard**: guest table with filter + status actions, blast email,
  check-in page with name/email search, API key management.
- **Discovery**: `/discover` with search, category pills, featured calendars.
  Calendar pages at `/c/[slug]` with subscribe + iCal.
- **Public API** (`/api/v1/*`): every endpoint in spec §5.2, authenticated by
  `x-luma-api-key`, rate-limited per-key, with an OpenAPI 3.1 spec served at
  `/openapi.json`.
- **Webhooks**: HMAC-signed delivery records queued per event per endpoint
  (spec §6.1). Out-of-process worker not included; table is queryable.
- **Admin stub** at `/admin`, gated by `ADMIN_EMAILS`, with stats + the open
  reports queue.

## Run it

```bash
npm install
npx prisma db push
npm run db:seed        # creates demo user, calendars, events, a demo API key
npm run dev
```

Visit http://localhost:3000.

- Sign in with any email — the 6-digit code is printed to the server log
  (`EMAIL_TRANSPORT=console`).
- Demo API key prints during seeding. Try:
  ```bash
  curl -H "x-luma-api-key: <key>" http://localhost:3000/api/v1/calendar/list-events
  ```
- Grab the spec: `curl http://localhost:3000/openapi.json`

## Layout

```
src/
  app/
    layout.tsx                 header + footer chrome
    page.tsx                   landing
    discover/                  search + categories
    c/[slug]/                  calendar pages + subscribe
    event/[slug]/              public event page + RSVP
    event/[slug]/manage/       host dashboard, guests, blast, check-in
    create/                    event-creation form
    signin/                    email-code flow
    home/                      signed-in dashboard
    settings/api-keys/         key management
    admin/                     internal portal (stubbed)
    api/
      auth/                    send-code / verify-code / signout
      events/                  internal REST for the web UI
      calendars/               subscribe, api-keys, ics feed
      v1/                      public API surface (spec §5.2)
    openapi.json/              OpenAPI 3.1 document
  components/                  shared UI (EventCard, …)
  lib/
    db.ts                      PrismaClient singleton
    auth.ts                    email-code sign-in + session cookies
    apikey.ts                  hash, issue, authenticate public keys
    api.ts                     public API helpers (auth, rate-limit, errors)
    email.ts                   pluggable email transport (console default)
    ics.ts                     iCal generator
    ratelimit.ts               in-memory limiter (swap for Redis in prod)
    ids.ts                     slugs, short codes, tokens
    serialize.ts               API response shaping
    webhooks.ts                HMAC signing + delivery enqueue
prisma/
  schema.prisma                full data model (spec §7)
  seed.ts                      demo data + API key
```

## Not yet implemented

See `LUMA_CLONE_SPEC.md` for the 6-sprint roadmap. This scaffold covers
Sprint 1 plus API parity for Sprint 5. Still to build:

- Sprint 2: Stripe Connect, paid tickets, refunds, receipts, coupons UI.
- Sprint 3: recurring/multi-session events, CSV import, mobile check-in.
- Sprint 4: event chat, referrals, discover curation, city landing pages.
- Sprint 5 extras: passkeys, SAML SSO, Zoom/Meet OAuth, wallet passes.
- Sprint 6: full admin portal (trust & safety queues, payments ops).
