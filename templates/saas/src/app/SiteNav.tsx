import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { authConfigured } from "@/lib/auth";

/**
 * Header navigation. Clerk's components read the Clerk context, so they are
 * only rendered when a key exists — otherwise they throw and take the whole
 * route down, including the marketing page.
 */
export function SiteNav() {
  if (!authConfigured) {
    return (
      <span
        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
        title="Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and rebuild, or run npm run dev for keyless mode"
      >
        Auth not configured
      </span>
    );
  }

  return (
    <>
      <SignedOut>
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
      </SignedOut>
      <SignedIn>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900 no-underline"
        >
          Dashboard
        </Link>
        <UserButton />
      </SignedIn>
    </>
  );
}
