import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";

type Format = "dotenv" | "vercel" | "netlify";
type TemplateType = "react-vite" | "nextjs" | "saas" | "unknown";

interface EnvVar {
  key: string;
  value: string;
  description: string;
  secret: boolean;
}

const FORMATS: Format[] = ["dotenv", "vercel", "netlify"];

/** Detect template type from the current directory's package.json */
function detectTemplate(): TemplateType {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) return "unknown";

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps["@clerk/nextjs"]) return "saas";
  if (deps["next"]) return "nextjs";
  if (deps["vite"] || deps["@vitejs/plugin-react"]) return "react-vite";
  return "unknown";
}

/** Read existing .env or .env.example for current values */
function readExistingEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const file of [".env", ".env.local", ".env.example"]) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      // Only use if not a placeholder
      if (val && !val.includes("your_") && !val.includes("your-")) {
        vars[key] = val;
      }
    }
  }
  return vars;
}

/** Get the env var definitions for a template */
function getVarDefs(template: TemplateType): EnvVar[] {
  if (template === "nextjs" || template === "saas") {
    return [
      { key: "NEXT_PUBLIC_CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL", secret: false },
      { key: "NEXT_PUBLIC_CENTRALI_WORKSPACE", value: "", description: "Workspace slug", secret: false },
      { key: "NEXT_PUBLIC_CENTRALI_PK", value: "", description: "Publishable key (pk_live_...)", secret: false },
      { key: "CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL (server)", secret: false },
      { key: "CENTRALI_WORKSPACE", value: "", description: "Workspace slug (server)", secret: false },
      { key: "CENTRALI_CLIENT_ID", value: "", description: "Service account client ID (ci_...)", secret: true },
      { key: "CENTRALI_CLIENT_SECRET", value: "", description: "Service account secret (sk_...)", secret: true },
    ];
  }

  // react-vite or unknown
  return [
    { key: "VITE_CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL", secret: false },
    { key: "VITE_CENTRALI_WORKSPACE", value: "", description: "Workspace slug", secret: false },
    { key: "VITE_CENTRALI_PK", value: "", description: "Publishable key (pk_live_...)", secret: false },
  ];
}

/** Prompt user for missing values */
async function promptForValues(vars: EnvVar[], existing: Record<string, string>): Promise<EnvVar[]> {
  const result: EnvVar[] = [];

  for (const v of vars) {
    const existingVal = existing[v.key];
    if (existingVal) {
      result.push({ ...v, value: existingVal });
      continue;
    }

    // Use default if it has one
    if (v.value) {
      result.push(v);
      continue;
    }

    const { value } = await prompts({
      type: "text",
      name: "value",
      message: `${v.description} (${pc.dim(v.key)}):`,
    }, {
      onCancel: () => {
        console.log(pc.red("\nCancelled."));
        process.exit(1);
      },
    });

    result.push({ ...v, value: value || "" });
  }

  return result;
}

/** Format output */
function formatOutput(vars: EnvVar[], format: Format): string {
  const lines: string[] = [];

  switch (format) {
    case "dotenv":
      for (const v of vars) {
        lines.push(`${v.key}=${v.value}`);
      }
      break;

    case "vercel":
      for (const v of vars) {
        lines.push(`vercel env add ${v.key} production <<< "${v.value}"`);
      }
      break;

    case "netlify":
      for (const v of vars) {
        lines.push(`netlify env:set ${v.key} "${v.value}"`);
      }
      break;
  }

  return lines.join("\n");
}

export async function envCommand(args: string[]) {
  // Parse --format flag
  const formatArg = args.find((a) => a.startsWith("--format="))?.split("=")[1] as Format | undefined;

  // Detect template
  const template = detectTemplate();
  if (template === "unknown") {
    console.log(pc.yellow("Could not detect template type from package.json."));
    console.log(pc.dim("Run this command from a project created with create-centrali-app.\n"));
    console.log("Defaulting to React + Vite env vars.\n");
  } else {
    const templateNames: Record<string, string> = {
      nextjs: "Next.js",
      "react-vite": "React + Vite",
      saas: "SaaS Starter",
    };
    console.log(`Detected template: ${pc.cyan(templateNames[template] ?? template)}\n`);
  }

  // Read existing values
  const existing = readExistingEnv();

  // Get var definitions and prompt for missing values
  const varDefs = getVarDefs(template);
  const vars = await promptForValues(varDefs, existing);

  // Pick format
  let format: Format;
  if (formatArg && FORMATS.includes(formatArg)) {
    format = formatArg;
  } else {
    const { selectedFormat } = await prompts({
      type: "select",
      name: "selectedFormat",
      message: "Output format:",
      choices: [
        { title: ".env file (dotenv)", value: "dotenv" },
        { title: "Vercel CLI commands", value: "vercel" },
        { title: "Netlify CLI commands", value: "netlify" },
      ],
    }, {
      onCancel: () => {
        console.log(pc.red("\nCancelled."));
        process.exit(1);
      },
    });
    format = selectedFormat;
  }

  const output = formatOutput(vars, format);

  console.log();
  if (format === "dotenv") {
    console.log(pc.dim("# Copy to .env.local or .env.production:"));
  } else {
    console.log(pc.dim("# Run these commands:"));
  }
  console.log();
  console.log(output);
  console.log();

  // Offer to write .env.local for dotenv format
  if (format === "dotenv") {
    const { write } = await prompts({
      type: "confirm",
      name: "write",
      message: "Write to .env.local?",
      initial: true,
    });

    if (write) {
      const envPath = path.resolve(process.cwd(), ".env.local");
      fs.writeFileSync(envPath, output + "\n");
      console.log(pc.green(`Written to ${envPath}`));
    }
  }
}
