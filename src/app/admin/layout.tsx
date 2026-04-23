import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/");
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <nav className="panel rounded-xl p-3 h-fit sticky top-20 text-sm">
        <div className="text-xs uppercase tracking-widest text-ink-400 px-2 pb-2">Admin</div>
        <ul className="space-y-0.5">
          {[
            ["/admin", "Overview"],
            ["/admin/users", "Users"],
            ["/admin/events", "Events"],
            ["/admin/calendars", "Calendars"],
            ["/admin/reports", "Reports"],
            ["/admin/audit-log", "Audit log"],
            ["/admin/webhooks", "Webhook deliveries"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="block px-2 py-1.5 rounded hover:bg-ink-800"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  );
}
