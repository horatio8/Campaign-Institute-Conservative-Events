import { test, expect } from "@playwright/test";

test("landing page renders and links to discover", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Delightful events start here"
  );
  await page.getByRole("link", { name: "Explore events" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Discover");
});

test("OpenAPI spec is served", async ({ request }) => {
  const res = await request.get("/openapi.json");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.openapi).toMatch(/^3/);
  expect(body.paths["/v1/calendar/list-events"]).toBeDefined();
});

test("calendar ICS feed returns ics content", async ({ request }) => {
  const res = await request.get("/api/calendars/atlanta-craft-club/ics");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain("BEGIN:VCALENDAR");
});

test("unauthed /v1 call returns 401 with error envelope", async ({ request }) => {
  const res = await request.get("/api/v1/user/get-self");
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error.type).toBe("unauthenticated");
  expect(body.request_id).toMatch(/^req_/);
});
