import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { authConfigured } from "@/lib/auth";

// clerkMiddleware() throws "Missing publishableKey" on every matched request
// when Clerk has no key, which takes down all routes — including the marketing
// page — in a build made without Clerk credentials. Fall straight through
// instead; the pages themselves render a setup notice. See src/lib/auth.ts.
export default authConfigured ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
