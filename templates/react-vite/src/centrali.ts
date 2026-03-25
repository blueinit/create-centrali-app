import { CentraliSDK } from "@centrali-io/centrali-sdk";

export function createCentraliClient() {
  return new CentraliSDK({
    baseUrl: import.meta.env.VITE_CENTRALI_API_URL || "https://centrali.io",
    workspaceId: import.meta.env.VITE_CENTRALI_WORKSPACE || "",
    clientId: import.meta.env.VITE_CENTRALI_CLIENT_ID,
    clientSecret: import.meta.env.VITE_CENTRALI_CLIENT_SECRET,
  });
}
