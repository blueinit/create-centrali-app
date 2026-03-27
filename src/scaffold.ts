import fs from "node:fs";
import path from "node:path";
import pc from "picocolors";

const TEMPLATE_DIR = path.join(__dirname, "..", "templates");

// Files to skip when --no-typescript
const TS_ONLY_FILES = new Set(["tsconfig.json", "tsconfig.node.json", "tsconfig.app.json", "env.d.ts", "next-env.d.ts"]);

// Extension mapping for JS mode
const TS_TO_JS: Record<string, string> = {
  ".ts": ".js",
  ".tsx": ".jsx",
};

export function scaffold(projectName: string, template: string, typescript: boolean): void {
  const templateDir = path.join(TEMPLATE_DIR, template);
  const targetDir = path.resolve(process.cwd(), projectName);

  if (!fs.existsSync(templateDir)) {
    console.error(pc.red(`Template "${template}" not found at ${templateDir}`));
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(templateDir, targetDir, projectName, typescript);
}

function copyDir(src: string, dest: string, projectName: string, typescript: boolean): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip node_modules and .git if they somehow end up in templates
    if (entry.name === "node_modules" || entry.name === ".git") continue;

    const srcPath = path.join(src, entry.name);
    let destName = entry.name;

    if (entry.isDirectory()) {
      const destPath = path.join(dest, destName);
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath, projectName, typescript);
    } else {
      // Skip TS-only files in JS mode
      if (!typescript && TS_ONLY_FILES.has(entry.name)) continue;

      // Rename extensions in JS mode
      if (!typescript) {
        const ext = path.extname(destName);
        if (TS_TO_JS[ext]) {
          destName = destName.slice(0, -ext.length) + TS_TO_JS[ext];
        }
      }

      const destPath = path.join(dest, destName);
      let content = fs.readFileSync(srcPath, "utf-8");

      // Replace placeholders
      content = content.replace(/{{projectName}}/g, projectName);

      // Strip type annotations in JS mode (basic: remove `: Type` and `as Type`)
      if (!typescript && (destName.endsWith(".js") || destName.endsWith(".jsx"))) {
        content = stripTypeAnnotations(content);
      }

      fs.writeFileSync(destPath, content);
      console.log(`  ${pc.dim("+")} ${path.relative(process.cwd(), destPath)}`);
    }
  }
}

function stripTypeAnnotations(content: string): string {
  // Remove import type statements
  content = content.replace(/^import\s+type\s+.*;\n/gm, "");
  // Remove type-only imports from mixed import statements
  content = content.replace(/,\s*type\s+\w+/g, "");
  // Remove type export statements (export type/interface)
  content = content.replace(/^export\s+(?:type|interface)\s+[^]*?(?:^};\n|;\n)/gm, "");
  // Remove `as const` assertions
  content = content.replace(/\s+as\s+const\b/g, "");
  // Remove `as Type` casts
  content = content.replace(/\s+as\s+\w+/g, "");
  // Remove generic type params after identifiers: useState<any>, Promise<...>, Record<...>, etc.
  // Only match <...> preceded by a word char, where content doesn't start with / (not closing JSX tags)
  content = content.replace(/(\w)<(?=[^/])(?:[^<>]|<[^<>]*>)*>/g, "$1");
  // Remove destructured param type annotations: `{ params }: { params: Promise }` → `{ params }`
  content = content.replace(/}\s*:\s*\{[^}]*}/g, "}");
  // Remove inline type annotations: `: string`, `: Record`, `: any`, `: number | null`, etc.
  content = content.replace(/:\s*(?:\w+(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*)\s*(?=[=,)\n;{])/g, "");
  // Remove catch clause type annotations: `catch (err: any)` → `catch (err)`
  content = content.replace(/\bcatch\s*\((\w+):\s*\w+\)/g, "catch ($1)");
  // Remove non-null assertions: `foo!.bar` → `foo.bar`, `foo!;` → `foo;`
  content = content.replace(/(\w)\!(\.|;|\)|\,|\s)/g, "$1$2");
  return content;
}
