import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lafayette Academy — Personalization Cues",
  description:
    "Instructor dashboard that turns each student's real test scores into AI-generated coaching cues.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                LA
              </span>
              <span className="text-sm font-semibold leading-tight text-slate-900 sm:text-base">
                Lafayette Academy
                <span className="block text-xs font-normal text-slate-500">
                  Personalization Cues
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-slate-600 hover:text-brand"
              >
                Roster
              </Link>
              <Link
                href="/settings"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:border-brand hover:text-brand"
              >
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-xs text-slate-400">
          Demo prototype · seeded sample data · cues generated with your own API
          key (BYOK)
        </footer>
      </body>
    </html>
  );
}
