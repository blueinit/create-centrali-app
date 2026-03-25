import { CentraliSDK } from "@centrali-io/centrali-sdk";

export const centrali = new CentraliSDK({
  baseUrl: import.meta.env.VITE_CENTRALI_BASE_URL || "https://centrali.io",
  workspaceId: import.meta.env.VITE_CENTRALI_WORKSPACE || "",
  token: import.meta.env.VITE_CENTRALI_API_KEY || "",
});
