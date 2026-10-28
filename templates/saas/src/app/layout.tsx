import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { authConfigured } from "@/lib/auth";
import { SiteNav } from "./SiteNav";
import "./globals.css";

// Every route carries an auth-aware header and the dashboard is per-user, so
// nothing here is safely static. Rendering on demand also keeps a build made
// without credentials from baking a placeholder into the production route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "{{projectName}}",
  description: "Built with Centrali + Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = (
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
            <SiteNav />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );

  // ClerkProvider throws "Missing publishableKey" the moment it renders without
  // a key. Mounting it unconditionally is what made `next build` fail with no
  // Clerk credentials, and what made every route 500 under `next start`.
  // See src/lib/auth.ts.
  return authConfigured ? <ClerkProvider>{shell}</ClerkProvider> : shell;
}
