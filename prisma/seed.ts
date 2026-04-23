import { PrismaClient } from "@prisma/client";
import { shortCode, slugify } from "../src/lib/ids";
import { generateApiKey } from "../src/lib/apikey";

const prisma = new PrismaClient();

async function main() {
  const demo = await prisma.user.upsert({
    where: { email: "demo@luma.local" },
    create: { email: "demo@luma.local", name: "Demo Host", timezone: "America/New_York" },
    update: {},
  });
  const ashley = await prisma.user.upsert({
    where: { email: "ashley@luma.local" },
    create: { email: "ashley@luma.local", name: "Ashley", timezone: "America/Los_Angeles" },
    update: {},
  });

  const calendar = await prisma.calendar.upsert({
    where: { slug: "atlanta-craft-club" },
    create: {
      slug: "atlanta-craft-club",
      name: "Atlanta Craft Club",
      description: "Monthly meetups for makers in the ATL.",
      timezone: "America/New_York",
      members: {
        create: [
          { userId: demo.id, role: "owner" },
          { userId: ashley.id, role: "admin" },
        ],
      },
    },
    update: {},
  });

  const tech = await prisma.calendar.upsert({
    where: { slug: "sf-ai-meetup" },
    create: {
      slug: "sf-ai-meetup",
      name: "SF AI Meetup",
      description: "Weekly demos + drinks in SoMa.",
      timezone: "America/Los_Angeles",
      isVerified: true,
      members: { create: { userId: demo.id, role: "owner" } },
    },
    update: {},
  });

  const now = new Date();
  const plus = (days: number, hours = 0) =>
    new Date(now.getTime() + days * 86400_000 + hours * 3600_000);

  const events = [
    {
      calendarId: calendar.id,
      title: "Screen-printing 101",
      description: "Bring a tote. We supply the ink.",
      startsAt: plus(7, 18),
      endsAt: plus(7, 21),
      timezone: "America/New_York",
      locationType: "physical",
      address: "Ponce City Market, Atlanta, GA",
      capacity: 24,
    },
    {
      calendarId: calendar.id,
      title: "Leather Goods Workshop",
      description: "Hand-stitched card wallet. Take it home.",
      startsAt: plus(21, 19),
      endsAt: plus(21, 22),
      timezone: "America/New_York",
      locationType: "physical",
      address: "Studio B, Atlanta, GA",
      capacity: 12,
      approvalRequired: true,
    },
    {
      calendarId: tech.id,
      title: "Agents, Tools, and the Future of APIs",
      description: "Lightning demos from three startups + open bar.",
      startsAt: plus(4, 18),
      endsAt: plus(4, 22),
      timezone: "America/Los_Angeles",
      locationType: "hybrid",
      address: "Shack15, Ferry Building, SF",
      virtualUrl: "https://zoom.us/j/00000",
      capacity: 150,
    },
    {
      calendarId: tech.id,
      title: "Virtual demo day",
      description: "Open mic for anyone shipping something with AI.",
      startsAt: plus(14, 19),
      endsAt: plus(14, 21),
      timezone: "America/Los_Angeles",
      locationType: "virtual",
      virtualUrl: "https://meet.google.com/abc-defg-hij",
    },
  ];

  for (const e of events) {
    const slug = `${slugify(e.title)}-${shortCode(4)}`;
    const ev = await prisma.event.create({
      data: {
        calendarId: e.calendarId,
        slug,
        shortCode: shortCode(7),
        title: e.title,
        descriptionRich: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        timezone: e.timezone,
        locationType: e.locationType,
        address: e.address ?? null,
        virtualUrl: e.virtualUrl ?? null,
        capacity: e.capacity ?? null,
        approvalRequired: e.approvalRequired ?? false,
        hosts: { create: { userId: demo.id, role: "host" } },
        ticketTypes: { create: { name: "Standard", priceCents: 0 } },
      },
    });
    // add a couple demo guests
    await prisma.guest.createMany({
      data: [
        {
          eventId: ev.id,
          displayName: "Pat Kim",
          email: `pat+${ev.id}@luma.local`,
          status: "registered",
        },
        {
          eventId: ev.id,
          displayName: "Sam Rivera",
          email: `sam+${ev.id}@luma.local`,
          status: "registered",
        },
      ],
    });
  }

  const { raw, hash, lastFour } = generateApiKey();
  await prisma.apiKey.create({
    data: {
      calendarId: calendar.id,
      scope: "calendar",
      label: "seed",
      lastFour,
      keyHash: hash,
    },
  });
  console.log(`Seeded. Demo user: demo@luma.local`);
  console.log(`Demo API key (save it): ${raw}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect().finally(() => process.exit(1));
  });
