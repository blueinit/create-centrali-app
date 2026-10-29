import { CentraliSDK } from "@centrali-io/centrali-sdk";

/**
 * Server-side Centrali client using service account credentials.
 *
 * This template deliberately uses ONE credential path: a server-side service
 * account. Every Centrali call happens in a server component or a route
 * handler, so the secret never reaches the browser.
 *
 * Why not a publishable key? Publishable keys can read collections and — with
 * an explicit per-slug scope — create records. They cannot create a
 * collection: the platform rejects every non-GET `/collections` request made
 * with a publishable key. Since this template's first step is "create your
 * first collection", it needs a service account. Adding browser-side
 * publishable-key access is a separate, additive step once you know which
 * collections and actions you want to expose.
 *
 * SECURITY: never import this from a file carrying the "use client"
 * directive. Keep it to server components, route handlers and server actions.
 */
export function createCentraliServerClient() {
  const missing = (
    ["CENTRALI_WORKSPACE", "CENTRALI_CLIENT_ID", "CENTRALI_CLIENT_SECRET"] as const
  ).filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Centrali credentials: ${missing.join(", ")}. ` +
        "Run `npx @centrali-io/create-centrali-app env`, or copy .env.example " +
        "to .env.local and fill in your service account values, then restart " +
        "the dev server.",
    );
  }

  return new CentraliSDK({
    // Pass the root domain. The SDK derives api.<domain> itself, so both
    // https://centrali.io and https://api.centrali.io resolve correctly.
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    // `workspaceId` is the current SDK option name — pass your workspace slug.
    workspaceId: process.env.CENTRALI_WORKSPACE as string,
    clientId: process.env.CENTRALI_CLIENT_ID,
    clientSecret: process.env.CENTRALI_CLIENT_SECRET,
  });
}

/** True when the server-side credentials this template needs are all present. */
export function hasCentraliCredentials(): boolean {
  return Boolean(
    process.env.CENTRALI_WORKSPACE &&
      process.env.CENTRALI_CLIENT_ID &&
      process.env.CENTRALI_CLIENT_SECRET,
  );
}
