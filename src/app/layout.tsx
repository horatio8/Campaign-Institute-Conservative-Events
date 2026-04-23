import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Luma — Delightful events start here",
  description: "Create, discover, and attend events — in person or online.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="border-b border-ink-700 bg-ink-900/95 backdrop-blur sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/" className="text-brand text-lg font-bold tracking-tight">
              Luma
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/discover" className="px-3 py-1.5 rounded-md hover:bg-ink-800">Discover</Link>
              {user && (
                <Link href="/home" className="px-3 py-1.5 rounded-md hover:bg-ink-800">My events</Link>
              )}
            </nav>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Link href="/create" className="btn-ghost hidden sm:inline-flex">Create event</Link>
              {user ? (
                <form action="/api/auth/signout" method="post">
                  <button className="btn-ghost" type="submit">
                    Sign out ({user.email})
                  </button>
                </form>
              ) : (
                <Link href="/signin" className="btn-primary">Sign in</Link>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-ink-700 mt-16 text-ink-400 text-xs">
          <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap gap-x-6 gap-y-2">
            <span>Luma clone — spec-built</span>
            <Link href="/openapi.json" className="hover:underline">OpenAPI</Link>
            <Link href="/discover" className="hover:underline">Discover</Link>
            <Link href="/admin" className="hover:underline">Admin</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
