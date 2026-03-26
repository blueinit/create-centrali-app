import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{projectName}}",
  description: "Built with Centrali + Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
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
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                    Get started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 no-underline"
                >
                  Dashboard
                </Link>
                <UserButton />
              </Show>
            </nav>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
