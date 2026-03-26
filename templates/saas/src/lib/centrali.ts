import { CentraliSDK } from "@centrali-io/centrali-sdk";

/**
 * Client-side Centrali client using a publishable key.
 * Safe to use in browser/client components.
 */
export function createCentraliClient() {
  return new CentraliSDK({
    baseUrl: process.env.NEXT_PUBLIC_CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.NEXT_PUBLIC_CENTRALI_WORKSPACE || "",
    publishableKey: process.env.NEXT_PUBLIC_CENTRALI_PK,
  });
}

/**
 * Server-side Centrali client using service account credentials.
 * Only use in API routes, server components, or server actions.
 */
export function createCentraliServerClient() {
  if (!process.env.CENTRALI_WORKSPACE || !process.env.CENTRALI_CLIENT_ID) {
    throw new Error(
      "Missing CENTRALI_WORKSPACE or CENTRALI_CLIENT_ID. " +
        "Copy .env.example to .env.local and fill in your Centrali credentials.",
    );
  }
  return new CentraliSDK({
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.CENTRALI_WORKSPACE,
    clientId: process.env.CENTRALI_CLIENT_ID,
    clientSecret: process.env.CENTRALI_CLIENT_SECRET,
  });
}

/**
 * Server-side Centrali client authenticated with a Clerk user's JWT (BYOT).
 * Use this when you need user-scoped operations with Centrali's permission system.
 *
 * Usage in a server component or API route:
 *   const { getToken } = await auth();
 *   const client = getCentraliAuthClient(() => getToken({ template: "centrali" }));
 */
export function getCentraliAuthClient(
  getToken: () => Promise<string | null>,
) {
  return new CentraliSDK({
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.CENTRALI_WORKSPACE || "",
    getToken: getToken as () => Promise<string>,
  });
}
