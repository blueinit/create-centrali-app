import { CentraliSDK } from "@centrali-io/centrali-sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function readFunctionCode(name: string): string {
  const codePath = path.resolve(projectRoot, "functions", `${name}.js`);
  return fs.readFileSync(codePath, "utf-8");
}

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
      name: "Processed Items",
      recordSlug: "processed-items",
      properties: [
        { name: "title", type: "string" as const, required: true },
        { name: "type", type: "string" as const, required: true },
        { name: "status", type: "string" as const, required: true },
        { name: "priority", type: "string" as const },
        { name: "payload", type: "string" as const },
        { name: "resultSummary", type: "string" as const },
        { name: "processedAt", type: "string" as const },
        { name: "createdAt", type: "string" as const, required: true },
      ],
      schemaDiscoveryMode: "strict" as const,
    },
    {
      name: "Job Logs",
      recordSlug: "job-logs",
      properties: [
        { name: "functionName", type: "string" as const, required: true },
        { name: "level", type: "string" as const, required: true },
        { name: "message", type: "string" as const, required: true },
        { name: "metadata", type: "string" as const },
        { name: "createdAt", type: "string" as const, required: true },
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

  // ── Compute Functions ──────────────────────────────────────

  const existingFns = await client.functions.list();
  const fnMap = new Map(
    (existingFns.data ?? []).map((f: any) => [f.name, f]),
  );

  const functionDefs = [
    { name: "process-item", description: "Processes new items as they are created", timeoutMs: 10000 },
    { name: "generate-report", description: "Generates an hourly summary report", timeoutMs: 30000 },
    { name: "cleanup-old-logs", description: "Deletes log entries older than 7 days", timeoutMs: 60000 },
  ];

  const functionIds = {} as any;

  for (const def of functionDefs) {
    const code = readFunctionCode(def.name);

    if (fnMap.has(def.name)) {
      const existing = fnMap.get(def.name);
      functionIds[def.name] = existing.id;
      await client.functions.update(existing.id, {
        code,
        description: def.description,
        timeoutMs: def.timeoutMs,
      });
      console.log(`  ↻ Updated function "${def.name}"`);
    } else {
      const fnRes = await client.functions.create({
        name: def.name,
        code,
        description: def.description,
        timeoutMs: def.timeoutMs,
      });
      functionIds[def.name] = fnRes.data.id;
      console.log(`  + Created function "${def.name}"`);
    }
  }

  // ── Triggers ───────────────────────────────────────────────

  const existingTriggers = await client.triggers.listAll();
  const triggerNames = new Set(
    (existingTriggers.data ?? []).map((t: any) => t.name),
  );

  const triggers = [
    // Event-driven
    {
      name: "process-item-on-create",
      functionId: functionIds["process-item"],
      executionType: "event-driven" as const,
      description: "Fires when a new item is created",
      triggerMetadata: {
        event: "record_created",
        recordSlug: "processed-items",
      },
    },
    // Scheduled
    {
      name: "generate-report-hourly",
      functionId: functionIds["generate-report"],
      executionType: "scheduled" as const,
      description: "Runs every hour",
      triggerMetadata: {
        scheduleType: "cron",
        cronExpression: "0 * * * *",
        timezone: "UTC",
      },
    },
    {
      name: "cleanup-old-logs-daily",
      functionId: functionIds["cleanup-old-logs"],
      executionType: "scheduled" as const,
      description: "Runs daily at 2 AM UTC",
      triggerMetadata: {
        scheduleType: "cron",
        cronExpression: "0 2 * * *",
        timezone: "UTC",
      },
    },
    // On-demand (for manual invocation from the dashboard)
    {
      name: "process-item-manual",
      functionId: functionIds["process-item"],
      executionType: "on-demand" as const,
      description: "Manually trigger item processing",
      triggerMetadata: { params: {} },
    },
    {
      name: "generate-report-manual",
      functionId: functionIds["generate-report"],
      executionType: "on-demand" as const,
      description: "Manually generate a report",
      triggerMetadata: { params: {} },
    },
    {
      name: "cleanup-old-logs-manual",
      functionId: functionIds["cleanup-old-logs"],
      executionType: "on-demand" as const,
      description: "Manually run log cleanup",
      triggerMetadata: { params: {} },
    },
  ];

  for (const trigger of triggers) {
    if (triggerNames.has(trigger.name)) {
      console.log(`  ✓ Trigger "${trigger.name}" already exists`);
      continue;
    }
    await client.triggers.create(trigger);
    const typeLabel =
      trigger.executionType === "event-driven" ? "event-driven" :
      trigger.executionType === "scheduled" ? "scheduled" :
      "on-demand";
    console.log(`  + Created trigger "${trigger.name}" (${typeLabel})`);
  }

  // ── Seed Data ──────────────────────────────────────────────

  const existing = await client.queryRecords("processed-items", { pageSize: 1 });
  if (existing?.data?.length) {
    console.log("  ✓ Items already seeded");
  } else {
    const now = new Date().toISOString();
    const seeds = [
      { title: "Welcome email batch", type: "notification", status: "pending", priority: "high", createdAt: now },
      { title: "Invoice #1042", type: "order", status: "pending", priority: "normal", createdAt: now },
      { title: "User avatar resize", type: "upload", status: "pending", priority: "low", createdAt: now },
      { title: "Monthly newsletter", type: "notification", status: "pending", priority: "normal", createdAt: now },
    ];

    for (const item of seeds) {
      await client.createRecord("processed-items", item);
    }
    console.log(`  + Seeded ${seeds.length} sample items (processing will start automatically)`);
  }

  console.log();
  console.log("  Done! Your workspace is ready for development.");
  console.log("  Run `npm run dev` to start the app.\n");
}

main().catch((err) => {
  console.error("\n  Setup failed:", err.message ?? err);
  process.exit(1);
});
