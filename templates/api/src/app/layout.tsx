import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{projectName}}",
  description: "A REST API powered by Centrali",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 no-underline"
          >
            {"{{projectName}}"}
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 no-underline"
            >
              Home
            </Link>
            <Link
              href="/explorer"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-gray-800"
            >
              API Explorer
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
