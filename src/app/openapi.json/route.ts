import { NextResponse } from "next/server";

// OpenAPI 3.1 spec mirroring the endpoints in spec §5.
export async function GET() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Luma Clone Public API",
      version: "1.0.0",
      description: "Mirror of the Luma public API surface. All endpoints require an x-luma-api-key header.",
    },
    servers: [{ url: `${base}/api` }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "x-luma-api-key" },
      },
      schemas: {
        Event: {
          type: "object",
          properties: {
            api_id: { type: "string" },
            short_code: { type: "string" },
            slug: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            cover_url: { type: ["string", "null"] },
            start_at: { type: "string", format: "date-time" },
            end_at: { type: "string", format: "date-time" },
            timezone: { type: "string" },
            location_type: { enum: ["physical", "virtual", "hybrid"] },
            capacity: { type: ["integer", "null"] },
            visibility: { enum: ["public", "unlisted", "private"] },
            status: { enum: ["draft", "published", "cancelled"] },
            approval_required: { type: "boolean" },
            url: { type: "string" },
          },
        },
        Calendar: {
          type: "object",
          properties: {
            api_id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: ["string", "null"] },
            timezone: { type: "string" },
            is_verified: { type: "boolean" },
          },
        },
        Guest: {
          type: "object",
          properties: {
            api_id: { type: "string" },
            event_api_id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            approval_status: {
              enum: ["pending", "registered", "approved", "declined", "waitlisted", "checked_in", "cancelled"],
            },
            registered_at: { type: "string", format: "date-time" },
            checked_in_at: { type: ["string", "null"], format: "date-time" },
          },
        },
        TicketType: {
          type: "object",
          properties: {
            api_id: { type: "string" },
            event_api_id: { type: "string" },
            name: { type: "string" },
            price_cents: { type: "integer" },
            currency: { type: "string" },
          },
        },
        Coupon: {
          type: "object",
          properties: {
            api_id: { type: "string" },
            code: { type: "string" },
            kind: { enum: ["fixed", "percent"] },
            amount: { type: "integer" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            entries: { type: "array", items: {} },
            has_more: { type: "boolean" },
            next_cursor: { type: ["string", "null"] },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                type: {
                  enum: [
                    "rate_limited", "unauthenticated", "forbidden", "not_found",
                    "validation_error", "payment_error", "conflict", "server_error",
                  ],
                },
                message: { type: "string" },
              },
            },
            request_id: { type: "string" },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/v1/user/get-self": {
        get: { summary: "Identify the calling key", responses: { "200": { description: "OK" } } },
      },
      "/v1/calendar/get": {
        get: { summary: "Fetch the scoped calendar", responses: { "200": { description: "OK" } } },
      },
      "/v1/calendar/list-events": {
        get: {
          summary: "List events",
          parameters: [
            { name: "pagination_cursor", in: "query", schema: { type: "string" } },
            { name: "pagination_limit", in: "query", schema: { type: "integer" } },
            { name: "after", in: "query", schema: { type: "string" } },
            { name: "before", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/v1/calendar/lookup-event": {
        get: {
          summary: "Resolve a short code to an event",
          parameters: [{ name: "short_code", in: "query", schema: { type: "string" }, required: true }],
          responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
        },
      },
      "/v1/calendar/list-people": { get: { summary: "List people in the calendar CRM" } },
      "/v1/calendar/list-person-tags": { get: { summary: "List person tags" } },
      "/v1/calendar/event-tags/list": { get: { summary: "List event tags" } },
      "/v1/calendar/admins/list": { get: { summary: "List calendar admins" } },
      "/v1/calendar/coupons": { get: { summary: "List calendar coupons" } },
      "/v1/calendar/import-people": {
        post: { summary: "Bulk import people (CRM)" },
      },
      "/v1/calendar/create-coupon": {
        post: { summary: "Create a coupon" },
      },
      "/v1/calendar/create-event-tag": {
        post: { summary: "Create an event tag" },
      },
      "/v1/event/get": {
        get: {
          summary: "Fetch an event by api_id",
          parameters: [{ name: "api_id", in: "query", schema: { type: "string" }, required: true }],
          responses: { "200": { description: "OK" } },
        },
      },
      "/v1/event/get-guest": { get: { summary: "Fetch a guest by api_id" } },
      "/v1/event/get-guests": {
        get: {
          summary: "List guests of an event",
          parameters: [
            { name: "event_api_id", in: "query", schema: { type: "string" }, required: true },
            { name: "approval_status", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "OK" } },
        },
      },
      "/v1/event/coupons": { get: { summary: "List event coupons" } },
      "/v1/event/ticket-types/list": { get: { summary: "List ticket types" } },
      "/v1/entity/lookup": { get: { summary: "Resolve any Luma URL or ID" } },
      "/v1/event/create": { post: { summary: "Create an event" } },
      "/v1/event/update": { post: { summary: "Update an event" } },
      "/v1/event/add-guests": { post: { summary: "Invite / add guests to an event" } },
      "/v1/event/update-guest-status": { post: { summary: "Approve, decline, waitlist, check-in a guest" } },
      "/v1/event/refund-guest": { post: { summary: "Refund a guest's ticket" } },
      "/v1/event/send-blast": { post: { summary: "Email a segment of guests" } },
    },
  });
}
