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
      // In JS mode: skip TS-only files, but emit jsconfig.json for path aliases
      if (!typescript && TS_ONLY_FILES.has(entry.name)) {
        if (entry.name === "tsconfig.json") {
          const tsconfig = JSON.parse(fs.readFileSync(srcPath, "utf-8"));
          if (tsconfig.compilerOptions?.paths) {
            const jsconfig = {
              compilerOptions: {
                baseUrl: ".",
                paths: tsconfig.compilerOptions.paths,
              },
            };
            const jsconfigPath = path.join(dest, "jsconfig.json");
            fs.writeFileSync(jsconfigPath, JSON.stringify(jsconfig, null, 2) + "\n");
            console.log(`  ${pc.dim("+")} ${path.relative(process.cwd(), jsconfigPath)}`);
          }
        }
        continue;
      }

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

      // JS mode transformations
      if (!typescript) {
        if (destName.endsWith(".js") || destName.endsWith(".jsx")) {
          content = stripTypeAnnotations(content);
          // Rewrite .tsx/.ts imports to .jsx/.js
          content = content.replace(/from\s+"([^"]+)\.tsx"/g, 'from "$1.jsx"');
          content = content.replace(/from\s+"([^"]+)\.ts"/g, 'from "$1.js"');
        }
        // Update TS extension references in HTML files
        if (destName.endsWith(".html")) {
          content = content.replace(/\.tsx"/g, '.jsx"');
          content = content.replace(/\.ts"/g, '.js"');
        }
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
  // Remove interface declarations (exported or not) — whole block from `interface Name {` to `}`
  content = content.replace(/^(?:export\s+)?interface\s+\w+(?:\s+extends\s+[\w.]+)?\s*\{[^]*?^}\n?/gm, "");
  // Remove type alias declarations (exported or not)
  content = content.replace(/^(?:export\s+)?type\s+\w+\s*=\s*[^]*?;\n/gm, "");
  // Remove `as const` assertions
  content = content.replace(/\s+as\s+const\b/g, "");
  // Remove `as Type` casts (simple identifiers and arrow function types)
  content = content.replace(/\s+as\s+\([^)]*\)\s*=>\s*[\w.]+/g, "");
  content = content.replace(/\s+as\s+\w+/g, "");
  // Remove generic type params after identifiers: useState<any>, Promise<...>, Record<...>
  // Only match <...> preceded by a word char, where content doesn't start with / (not closing JSX tags)
  content = content.replace(/(\w)<(?=[^/])(?:[^<>]|<[^<>]*>)*>/g, "$1");
  // Remove destructured param type annotations: `{ x }: { x: Type }` → `{ x }`
  // Requires at least one char inside (excludes empty `{}` in ternaries like `} : {}`)
  content = content.replace(/}\s*:\s*\{[^}]+}/g, "}");

  // Remove arrow function type annotations in params: `cb: () => Type` → `cb`
  content = content.replace(/(\w)\s*:\s*\([^)]*\)\s*=>\s*[\w.]+(?:\s*\|\s*[\w.]+)*/g, "$1");
  // Remove string literal union type annotations: `: "a" | "b" | "c"` → ``
  content = content.replace(/:\s*"[^"]*"(?:\s*\|\s*"[^"]*")+\s*(?=[,)])/g, "");

  // Inline type annotations — only strip when the type is clearly a TS type:
  // uppercase-initial (e.g. NextRequest, React.FormEvent) or a known primitive.
  // null/undefined can only appear after | in unions (not standalone) to avoid stripping ternaries.
  const prims = "string|number|boolean|any|void|never|unknown|bigint|symbol|object";
  const allPrims = `${prims}|null|undefined`;
  const primaryType = `(?:[A-Z]\\w*(?:\\.\\w+)*|(?:${prims}))(?:\\[\\])?`;
  const unionMember = `(?:[A-Z]\\w*(?:\\.\\w+)*|(?:${allPrims}))(?:\\[\\])?`;
  const fullType = `${primaryType}(?:\\s*\\|\\s*${unionMember})*`;
  const inlineTypeRe = new RegExp(
    `(?<!["']):\\s*(?:${fullType})\\s*(?=[=,);\\n{])`,
    "g",
  );
  content = content.replace(inlineTypeRe, (match, offset, str) => {
    // Preserve space before = to avoid `const x= value`
    return str[offset + match.length] === "=" ? " " : "";
  });

  // Remove optional param marker left behind: `param?` without type → remove `?`
  // Only when ? is followed by , or ) (function params)
  content = content.replace(/(\w)\?\s*(?=[,)])/g, "$1");

  // Remove catch clause type annotations: `catch (err: any)` → `catch (err)`
  content = content.replace(/\bcatch\s*\(\s*(\w+)\s*:\s*\w+\s*\)/g, "catch ($1)");
  // Remove non-null assertions: `foo!.bar` → `foo.bar`, `foo!;` → `foo;`
  // Handles both word chars and closing parens before !
  content = content.replace(/(\w|\))!(?=[.;),\s])/g, "$1");
  return content;
}
