import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";

type Format = "dotenv" | "vercel" | "netlify";
type TemplateType = "react-vite" | "nextjs" | "saas" | "api" | "jobs" | "unknown";

interface EnvVar {
  key: string;
  value: string;
  description: string;
  secret: boolean;
}

const FORMATS: Format[] = ["dotenv", "vercel", "netlify"];

/**
 * Files consulted for existing values, in precedence order.
 *
 * The FIRST file to define a key wins, and a value already in the process
 * environment beats every file. `.env.example` ships placeholders, so it is
 * consulted last and only contributes non-placeholder values — it must never
 * overwrite a real credential the developer already configured.
 */
const ENV_FILES = [".env.local", ".env", ".env.example"] as const;

/** Detect which template the current directory was generated from. */
function detectTemplate(): TemplateType {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) return "unknown";

  let pkg: any;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return "unknown";
  }

  // Preferred: the explicit marker written by scaffold().
  const stamped = pkg.centrali?.template;
  if (typeof stamped === "string" && stamped !== "unknown") {
    return stamped as TemplateType;
  }

  // Fallback for projects generated before the marker existed. Order matters:
  // check the most specific signal first. Deliberately no longer keys off
  // "has next and a setup script" — that used to mean the api template until
  // the nextjs template gained a setup script of its own.
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@clerk/nextjs"]) return "saas";
  if (deps["vite"] || deps["@vitejs/plugin-react"]) return "react-vite";
  if (deps["next"]) return "nextjs";
  return "unknown";
}

/**
 * Read existing values from the process environment and the project's dotenv
 * files. First definition wins; placeholders are ignored.
 */
function readExistingEnv(keys: string[]): Record<string, string> {
  const vars: Record<string, string> = {};

  // Highest precedence: the real process environment.
  for (const key of keys) {
    const fromProcess = process.env[key];
    if (fromProcess) vars[key] = fromProcess;
  }

  for (const file of ENV_FILES) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      // Never let a later file overwrite an earlier, higher-precedence value.
      if (key in vars) continue;
      if (val && !isPlaceholder(val)) vars[key] = val;
    }
  }

  return vars;
}

/** Placeholder values shipped in .env.example must not be treated as real. */
function isPlaceholder(value: string): boolean {
  return /your[_-]/i.test(value);
}

const SERVER_VARS: EnvVar[] = [
  { key: "CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL", secret: false },
  { key: "CENTRALI_WORKSPACE", value: "", description: "Workspace slug", secret: false },
  { key: "CENTRALI_CLIENT_ID", value: "", description: "Service account client ID (ci_...)", secret: false },
  { key: "CENTRALI_CLIENT_SECRET", value: "", description: "Service account secret (sk_...)", secret: true },
];

const NEXT_BROWSER_VARS: EnvVar[] = [
  { key: "NEXT_PUBLIC_CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL (browser)", secret: false },
  { key: "NEXT_PUBLIC_CENTRALI_WORKSPACE", value: "", description: "Workspace slug (browser)", secret: false },
  { key: "NEXT_PUBLIC_CENTRALI_PK", value: "", description: "Publishable key (pk_live_...)", secret: false },
];

const VITE_VARS: EnvVar[] = [
  { key: "VITE_CENTRALI_API_URL", value: "https://centrali.io", description: "Centrali API URL", secret: false },
  { key: "VITE_CENTRALI_WORKSPACE", value: "", description: "Workspace slug", secret: false },
  { key: "VITE_CENTRALI_PK", value: "", description: "Publishable key (pk_live_...)", secret: false },
];

/**
 * The variables each template actually reads.
 *
 * Only ask for credentials the selected template uses. Prompting for a
 * service account secret that nothing reads trains people to create and paste
 * secrets they did not need.
 */
function getVarDefs(template: TemplateType): EnvVar[] {
  switch (template) {
    // Uses a single server-side credential path; reads no NEXT_PUBLIC_
    // Centrali variables at all.
    case "nextjs":
      return SERVER_VARS;

    // Service account server-side plus a publishable key in the browser.
    case "api":
    case "jobs":
    case "saas":
      return [...SERVER_VARS, ...NEXT_BROWSER_VARS];

    case "react-vite":
      return VITE_VARS;

    default:
      return VITE_VARS;
  }
}

/** Prompt for any value we could not discover. Secrets are never echoed. */
async function promptForValues(
  vars: EnvVar[],
  existing: Record<string, string>,
): Promise<EnvVar[]> {
  const result: EnvVar[] = [];

  for (const v of vars) {
    const existingVal = existing[v.key];
    if (existingVal) {
      console.log(
        `  ${pc.dim("·")} ${v.key} ${pc.dim(`(keeping existing ${mask(existingVal, v.secret)})`)}`,
      );
      result.push({ ...v, value: existingVal });
      continue;
    }

    if (v.value) {
      result.push(v);
      continue;
    }

    const { value } = await prompts(
      {
        // "password" keeps the secret off the terminal and out of scrollback.
        type: v.secret ? "password" : "text",
        name: "value",
        message: `${v.description} (${pc.dim(v.key)}):`,
      },
      {
        onCancel: () => {
          console.log(pc.red("\nCancelled."));
          process.exit(1);
        },
      },
    );

    result.push({ ...v, value: value || "" });
  }

  return result;
}

/** Replace all but the last 4 characters of a secret with bullets. */
function mask(value: string, secret: boolean): string {
  if (!secret) return value;
  if (value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

/**
 * Render the output.
 *
 * @param reveal When false, secret values are masked. The on-screen preview
 *               is masked by default; only the file we write, or an explicit
 *               --show-secrets, carries real values.
 */
function formatOutput(vars: EnvVar[], format: Format, reveal: boolean): string {
  const lines: string[] = [];

  for (const v of vars) {
    const value = reveal ? v.value : mask(v.value, v.secret);
    switch (format) {
      case "dotenv":
        lines.push(`${v.key}=${value}`);
        break;
      case "vercel":
        // Pipe the value in rather than embedding it in the command, so
        // secrets do not land in shell history. The old form used `<<<`,
        // which is a bash/zsh-only herestring.
        lines.push(
          reveal
            ? `printf %s ${shellQuote(value)} | vercel env add ${v.key} production`
            : `vercel env add ${v.key} production   # paste ${v.key} when prompted`,
        );
        break;
      case "netlify":
        lines.push(
          reveal
            ? `netlify env:set ${v.key} ${shellQuote(value)}`
            : `netlify env:set ${v.key} <${v.key}>`,
        );
        break;
    }
  }

  return lines.join("\n");
}

/** Single-quote a value for POSIX shells. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export async function envCommand(args: string[]) {
  const formatArg = args.find((a) => a.startsWith("--format="))?.split("=")[1] as Format | undefined;
  // Opt-in escape hatch for non-interactive use, where the caller has already
  // decided that printing secrets to stdout is acceptable.
  const reveal = args.includes("--show-secrets");

  const template = detectTemplate();
  if (template === "unknown") {
    console.log(pc.yellow("Could not detect which template this project uses."));
    console.log(pc.dim("Run this command from a project created with create-centrali-app.\n"));
    console.log("Defaulting to React + Vite env vars.\n");
  } else {
    const templateNames: Record<string, string> = {
      nextjs: "Next.js",
      "react-vite": "React + Vite",
      saas: "SaaS Starter",
      api: "API Starter",
      jobs: "Jobs Starter",
    };
    console.log(`Detected template: ${pc.cyan(templateNames[template] ?? template)}\n`);
  }

  const varDefs = getVarDefs(template);
  const existing = readExistingEnv(varDefs.map((v) => v.key));
  const vars = await promptForValues(varDefs, existing);

  let format: Format;
  if (formatArg && FORMATS.includes(formatArg)) {
    format = formatArg;
  } else {
    const { selectedFormat } = await prompts(
      {
        type: "select",
        name: "selectedFormat",
        message: "Output format:",
        choices: [
          { title: ".env file (dotenv)", value: "dotenv" },
          { title: "Vercel CLI commands", value: "vercel" },
          { title: "Netlify CLI commands", value: "netlify" },
        ],
      },
      {
        onCancel: () => {
          console.log(pc.red("\nCancelled."));
          process.exit(1);
        },
      },
    );
    format = selectedFormat;
  }

  const hasSecrets = vars.some((v) => v.secret && v.value);

  console.log();
  if (format === "dotenv") {
    console.log(pc.dim("# For .env.local (local) or your host's environment settings (production):"));
  } else {
    console.log(pc.dim("# Run these commands:"));
  }
  console.log();
  console.log(formatOutput(vars, format, reveal));
  console.log();
  if (hasSecrets && !reveal) {
    console.log(pc.dim("Secret values are masked above. Pass --show-secrets to print them."));
    console.log();
  }

  if (format === "dotenv") {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const exists = fs.existsSync(envPath);

    const { write } = await prompts({
      type: "confirm",
      name: "write",
      // Overwriting .env.local silently can destroy credentials that are not
      // recoverable from anywhere else, so say so before doing it.
      message: exists
        ? `${pc.yellow(".env.local already exists.")} Overwrite it?`
        : "Write to .env.local?",
      initial: !exists,
    });

    if (write) {
      // 0600: owner read/write only — this file holds credentials.
      fs.writeFileSync(envPath, formatOutput(vars, "dotenv", true) + "\n", { mode: 0o600 });
      console.log(pc.green(`Written to ${envPath}`) + pc.dim(" (mode 0600)"));
      if (!looksGitIgnored(".env.local")) {
        console.log(
          pc.yellow(
            "Warning: .env.local does not appear to be git-ignored. Add it to .gitignore before committing.",
          ),
        );
      }
    } else if (exists) {
      console.log(pc.dim("Left .env.local unchanged."));
    }
  }
}

/** Best-effort check that a path is covered by this project's .gitignore. */
function looksGitIgnored(relPath: string): boolean {
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (!fs.existsSync(gitignorePath)) return false;
  const patterns = fs
    .readFileSync(gitignorePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return patterns.some(
    (p) => p === relPath || p === `/${relPath}` || p === ".env.*.local" || p === ".env*",
  );
}
