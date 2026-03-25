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
 * Never expose clientSecret to the browser.
 */
export function createCentraliServerClient() {
  return new CentraliSDK({
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.CENTRALI_WORKSPACE || "",
    clientId: process.env.CENTRALI_CLIENT_ID,
    clientSecret: process.env.CENTRALI_CLIENT_SECRET,
  });
}
