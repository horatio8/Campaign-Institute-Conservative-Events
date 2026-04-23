import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateEventForm } from "./CreateEventForm";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/create`);

  const memberships = await prisma.calendarMember.findMany({
    where: { userId: user.id },
    include: { calendar: true },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create event</h1>
      <CreateEventForm
        calendars={memberships.map((m) => ({ id: m.calendar.id, name: m.calendar.name, slug: m.calendar.slug }))}
      />
    </div>
  );
}
