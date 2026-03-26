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

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
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

  // ── Collection ─────────────────────────────────────────────

  const existingCollections = await client.collections.list();
  const existingSlugs = new Set(
    (existingCollections.data ?? []).map((c: any) => c.recordSlug),
  );

  if (existingSlugs.has("tasks")) {
    console.log('  ✓ Collection "tasks" already exists');
  } else {
    await client.collections.create({
      name: "Tasks",
      recordSlug: "tasks",
      properties: [
        { name: "title", type: "string" as const, required: true },
        { name: "description", type: "string" as const },
        { name: "status", type: "string" as const, required: true },
        { name: "priority", type: "string" as const, required: true },
        { name: "assignee", type: "string" as const },
        { name: "dueDate", type: "string" as const },
        { name: "tags", type: "string" as const },
        { name: "createdAt", type: "string" as const, required: true },
        { name: "completedAt", type: "string" as const },
      ],
      schemaDiscoveryMode: "strict" as const,
    });
    console.log('  + Created collection "tasks"');
  }

  // ── Seed Data ──────────────────────────────────────────────

  const existing = await client.queryRecords("tasks", { pageSize: 1 });
  if (existing?.data?.length) {
    console.log("  ✓ Tasks already seeded");
  } else {
    const now = new Date().toISOString();

    const seeds = [
      {
        title: "Design API schema",
        description: "Define the task data model and endpoint structure",
        status: "done",
        priority: "high",
        assignee: "Alice",
        dueDate: daysFromNow(-2),
        tags: "design,api",
        createdAt: daysFromNow(-5),
        completedAt: daysFromNow(-1),
      },
      {
        title: "Implement authentication",
        description: "Add API key or OAuth2 authentication to endpoints",
        status: "todo",
        priority: "urgent",
        assignee: "Bob",
        dueDate: daysFromNow(5),
        tags: "backend,security",
        createdAt: daysFromNow(-3),
      },
      {
        title: "Write unit tests",
        description: "Cover all CRUD endpoints with automated tests",
        status: "in_progress",
        priority: "medium",
        assignee: "Alice",
        dueDate: daysFromNow(3),
        tags: "testing",
        createdAt: daysFromNow(-2),
      },
      {
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for automated builds and deploys",
        status: "todo",
        priority: "high",
        assignee: "Charlie",
        dueDate: daysFromNow(7),
        tags: "devops,infrastructure",
        createdAt: daysFromNow(-1),
      },
      {
        title: "Update documentation",
        description: "Write API reference docs and usage examples",
        status: "todo",
        priority: "low",
        dueDate: daysFromNow(10),
        tags: "docs",
        createdAt: now,
      },
      {
        title: "Fix pagination bug",
        description: "Page 2 returns duplicate records from page 1",
        status: "in_progress",
        priority: "medium",
        assignee: "Bob",
        dueDate: daysFromNow(1),
        tags: "bugfix,api",
        createdAt: daysFromNow(-1),
      },
    ];

    for (const task of seeds) {
      await client.createRecord("tasks", task);
    }
    console.log(`  + Seeded ${seeds.length} sample tasks`);
  }

  console.log();
  console.log("  Done! Your workspace is ready for development.");
  console.log("  Run `npm run dev` to start the app.\n");
}

main().catch((err) => {
  console.error("\n  Setup failed:", err.message ?? err);
  process.exit(1);
});
