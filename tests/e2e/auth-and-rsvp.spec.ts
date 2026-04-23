import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("email-code sign-in + RSVP end-to-end", async ({ page, request }) => {
  const email = `pw+${Date.now()}@luma.local`;

  const send = await request.post("/api/auth/send-code", { data: { email } });
  expect(send.ok()).toBeTruthy();

  const user = await prisma.user.findUnique({ where: { email } });
  const login = await prisma.loginCode.findFirst({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });
  expect(login?.code).toMatch(/^\d{6}$/);

  const verify = await request.post("/api/auth/verify-code", {
    data: { email, code: login!.code },
  });
  expect(verify.ok()).toBeTruthy();

  await page.goto("/home");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your events");

  const event = await prisma.event.findFirst({ orderBy: { startsAt: "asc" } });
  expect(event).not.toBeNull();
  await page.goto(`/event/${event!.slug}`);
  await page.getByPlaceholder("Name").or(page.locator("input[type=email]")).first().waitFor();

  const rsvp = await request.post(`/api/events/${event!.id}/rsvp`, {
    data: {
      email: `pw-guest+${Date.now()}@luma.local`,
      name: "Playwright Guest",
    },
  });
  expect(rsvp.ok()).toBeTruthy();
  const body = await rsvp.json();
  expect(body.status).toBe("registered");
  expect(body.referralCode).toMatch(/^[a-z0-9]+$/);
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
