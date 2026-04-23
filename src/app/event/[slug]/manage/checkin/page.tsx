import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { CheckinClient } from "./CheckinClient";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/signin");

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { hosts: true },
  });
  if (!event) notFound();
  if (!event.hosts.some((h) => h.userId === user.id)) {
    redirect(`/event/${slug}`);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Check-in · {event.title}</h1>
      <p className="text-ink-300 text-sm">
        Look up a guest by name/email to check them in. Swap this for a camera
        QR scanner (navigator.mediaDevices) in a production build.
      </p>
      <CheckinClient eventId={event.id} />
    </div>
  );
}
