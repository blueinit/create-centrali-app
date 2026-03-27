import { CentraliSDK } from "@centrali-io/centrali-sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local since tsx doesn't auto-load it like Next.js does
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const projectRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

async function main() {
  if (!process.env.CENTRALI_WORKSPACE || !process.env.CENTRALI_CLIENT_ID) {
    console.error(
      "\n  Missing CENTRALI_WORKSPACE or CENTRALI_CLIENT_ID.\n" +
        "  Copy .env.example to .env.local and fill in your Centrali credentials.\n",
    );
    process.exit(1);
  }

  const client = new CentraliSDK({
    baseUrl: process.env.CENTRALI_API_URL || "https://centrali.io",
    workspaceId: process.env.CENTRALI_WORKSPACE || "",
    clientId: process.env.CENTRALI_CLIENT_ID,
    clientSecret: process.env.CENTRALI_CLIENT_SECRET,
  });

  console.log("\n  Setting up Centrali workspace...");
  console.log();

  // ── Collections ────────────────────────────────────────────

  const existingCollections = await client.collections.list();
  const existingSlugs = new Set(
    (existingCollections.data ?? []).map((c: any) => c.recordSlug),
  );

  const collections = [
    {
      name: "Organizations",
      recordSlug: "organizations",
      properties: [
        { name: "name", type: "string" as const, required: true },
        { name: "plan", type: "string" as const },
        { name: "ownerId", type: "string" as const, required: true },
        { name: "createdAt", type: "string" as const },
      ],
      schemaDiscoveryMode: "strict" as const,
    },
    {
      name: "Projects",
      recordSlug: "projects",
      properties: [
        { name: "orgId", type: "string" as const, required: true },
        { name: "name", type: "string" as const, required: true },
        { name: "status", type: "string" as const },
        { name: "description", type: "string" as const },
        { name: "createdAt", type: "string" as const },
      ],
      schemaDiscoveryMode: "strict" as const,
    },
    {
      name: "Members",
      recordSlug: "members",
      properties: [
        { name: "orgId", type: "string" as const, required: true },
        { name: "userId", type: "string" as const },
        { name: "email", type: "string" as const },
        { name: "role", type: "string" as const, required: true },
        { name: "status", type: "string" as const, required: true },
        { name: "invitedAt", type: "string" as const },
        { name: "createdAt", type: "string" as const },
      ],
      schemaDiscoveryMode: "strict" as const,
    },
  ];

  for (const col of collections) {
    if (existingSlugs.has(col.recordSlug)) {
      console.log(`  ✓ Collection "${col.recordSlug}" already exists`);
      continue;
    }
    await client.collections.create(col);
    console.log(`  + Created collection "${col.recordSlug}"`);
  }

  // ── Compute Function ───────────────────────────────────────

  const codePath = path.resolve(__dirname, "..", "functions", "on-member-invited.js");
  const code = fs.readFileSync(codePath, "utf-8");

  const existingFns = await client.functions.list();
  const fnMap = new Map(
    (existingFns.data ?? []).map((f: any) => [f.name, f]),
  );

  let functionId: string;

  if (fnMap.has("on-member-invited")) {
    const existing = fnMap.get("on-member-invited");
    functionId = existing.id;
    // Always update code so local changes are pushed
    await client.functions.update(functionId, {
      code,
      description: "Runs when a new member record is created",
      timeoutMs: 5000,
    });
    console.log('  ↻ Updated function "on-member-invited"');
  } else {
    const fnRes = await client.functions.create({
      name: "on-member-invited",
      code,
      description: "Runs when a new member record is created",
      timeoutMs: 5000,
    });
    functionId = fnRes.data.id;
    console.log('  + Created function "on-member-invited"');
  }

  // ── Event Trigger ──────────────────────────────────────────

  const existingTriggers = await client.triggers.list();
  const triggerNames = new Set(
    (existingTriggers.data ?? []).map((t: any) => t.name),
  );

  if (triggerNames.has("on-member-invited")) {
    console.log('  ✓ Trigger "on-member-invited" already exists');
  } else {
    await client.triggers.create({
      name: "on-member-invited",
      functionId,
      executionType: "event-driven",
      triggerMetadata: {
        event: "record_created",
        recordSlug: "members",
      },
    });
    console.log('  + Created trigger "on-member-invited"');
  }

  console.log();
  console.log("  Done! Your workspace is ready for development.");
  console.log("  Run `npm run dev` to start the app.\n");
}

main().catch((err) => {
  console.error("\n  Setup failed:", err.message ?? err);
  process.exit(1);
});
