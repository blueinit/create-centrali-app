/**
 * Provision this template's demo collection.
 *
 * Run once, after filling in .env.local:
 *
 *   npm run setup
 *
 * This uses the server-side service account — a publishable key cannot create
 * a collection. The script is idempotent: re-running it does not duplicate the
 * collection or the sample record.
 */
import { CentraliSDK } from "@centrali-io/centrali-sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_SLUG = "demo-items";

/**
 * Load a dotenv file without overwriting anything already set.
 *
 * Precedence is deliberate and matches Next.js: a real process environment
 * variable wins over any file, and `.env.local` wins over `.env`. Never let a
 * later file clobber an earlier value.
 */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const projectRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

async function main() {
  const missing = ["CENTRALI_WORKSPACE", "CENTRALI_CLIENT_ID", "CENTRALI_CLIENT_SECRET"].filter(
    (k) => !process.env[k],
  );
  if (missing.length > 0) {
    console.error(
      `\n  Missing ${missing.join(", ")}.\n` +
        "  Run `npx @centrali-io/create-centrali-app env`, or copy .env.example\n" +
        "  to .env.local and fill in your service account credentials.\n",
    );
    process.exit(1);
  }

  const client = new CentraliSDK({
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.CENTRALI_WORKSPACE as string,
    clientId: process.env.CENTRALI_CLIENT_ID,
    clientSecret: process.env.CENTRALI_CLIENT_SECRET,
  });

  console.log("\n  Setting up your Centrali workspace...\n");

  const existing = await client.collections.list();
  const slugs = new Set((existing.data ?? []).map((c: any) => c.recordSlug));

  if (slugs.has(DEMO_SLUG)) {
    console.log(`  ✓ Collection "${DEMO_SLUG}" already exists`);
  } else {
    await client.collections.create({
      name: "Demo Items",
      recordSlug: DEMO_SLUG,
      description: "Created by create-centrali-app for the Next.js starter.",
      properties: [
        { name: "name", type: "string", required: true },
        { name: "description", type: "string" },
      ],
      schemaDiscoveryMode: "strict",
    });
    console.log(`  + Created collection "${DEMO_SLUG}"`);
  }

  // One clearly-labelled sample record, so the UI is not empty on first load.
  // Your own records are what prove persistence — create those from the app.
  const present = await client.records.query(DEMO_SLUG, {
    resource: DEMO_SLUG,
    page: { limit: 1 },
  });
  if (present?.data?.length) {
    console.log("  ✓ Collection already has records");
  } else {
    const created = await client.createRecord(DEMO_SLUG, {
      name: "Sample item (created by npm run setup)",
      description: "Delete this once you have created your own record.",
    });
    console.log(`  + Seeded 1 sample record (id ${(created.data as any)?.id ?? "unknown"})`);
  }

  console.log("\n  Done. Run `npm run dev` and open http://localhost:3000\n");
}

main().catch((err) => {
  // CentraliError exposes status/code/body; `message` alone is generic.
  const status = err?.status;
  const detail =
    (err?.body as any)?.error_description ?? (err?.body as any)?.error ?? err?.code ?? err?.message;
  console.error(`\n  Setup failed${status ? ` (${status})` : ""}: ${detail}`);
  if (status === 401) {
    console.error(
      "  The credentials were rejected. Check CENTRALI_CLIENT_ID / CENTRALI_CLIENT_SECRET\n" +
        "  and that CENTRALI_WORKSPACE is the workspace slug.\n",
    );
  } else if (status === 403) {
    console.error(
      "  Authenticated, but not permitted to create collections. Add the service\n" +
        "  account to workspace_administrators or workspace_developers in\n" +
        "  Console > ACCESS > Service Accounts.\n",
    );
  } else {
    console.error("");
  }
  process.exit(1);
});
