import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReportActions } from "./ReportActions";

export const dynamic = "force-dynamic";

export default async function ReportDetail({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { reporter: true },
  });
  if (!report) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Report {id.slice(-6)}</h1>
      <div className="panel rounded-lg p-4 space-y-2 text-sm">
        <div>
          <span className="text-ink-400">Target:</span> {report.targetType} / {report.targetId}
        </div>
        <div><span className="text-ink-400">Reason:</span> {report.reason}</div>
        {report.notes && <div><span className="text-ink-400">Notes:</span> {report.notes}</div>}
        <div><span className="text-ink-400">Reporter:</span> {report.reporter.email}</div>
        <div><span className="text-ink-400">Status:</span> <span className="capitalize">{report.status}</span></div>
        <div className="text-xs text-ink-400">{new Date(report.createdAt).toLocaleString()}</div>
      </div>
      <ReportActions id={id} status={report.status} />
    </div>
  );
}
