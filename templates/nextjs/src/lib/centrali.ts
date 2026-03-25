import { CentraliSDK } from "@centrali-io/centrali-sdk";

export const centrali = new CentraliSDK({
  baseUrl: process.env.CENTRALI_BASE_URL || "https://centrali.io",
  workspaceId: process.env.CENTRALI_WORKSPACE || "",
  token: process.env.CENTRALI_API_KEY || "",
});
