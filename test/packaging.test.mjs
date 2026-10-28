/**
 * Regression checks for the behaviours repaired under CWEB-3.
 *
 * These exercise the *packaged* artifact and the *generated* project, not just
 * the repository templates — the original defect was invisible from a source
 * checkout because `npm pack` silently dropped files that were present in git.
 *
 * Run with: npm test   (node --test test/)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const TEMPLATES = ["api", "jobs", "nextjs", "react-vite", "saas"];

/** Files listed by `npm pack --dry-run`, i.e. what consumers would receive. */
function packedFiles() {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: repoRoot,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  return JSON.parse(out)[0].files.map((f) => f.path);
}

function scaffoldInto(tmpDir, template, extraArgs = []) {
  execFileSync(
    process.execPath,
    [path.join(repoRoot, "dist", "index.js"), "demo", `--template=${template}`, "--typescript", ...extraArgs],
    { cwd: tmpDir, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return path.join(tmpDir, "demo");
}

function withTmpDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cca-test-"));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("templates store the ignore file as `gitignore`, never `.gitignore`", () => {
  // npm unconditionally excludes files named `.gitignore` from tarballs, so a
  // template that uses the dotted name ships without ignore rules.
  for (const t of TEMPLATES) {
    assert.ok(
      fs.existsSync(path.join(repoRoot, "templates", t, "gitignore")),
      `templates/${t}/gitignore is missing`,
    );
    assert.ok(
      !fs.existsSync(path.join(repoRoot, "templates", t, ".gitignore")),
      `templates/${t}/.gitignore must be named "gitignore" or npm will strip it`,
    );
  }
});

test("the published tarball carries an ignore file for every template", () => {
  const files = packedFiles();
  for (const t of TEMPLATES) {
    assert.ok(
      files.includes(`templates/${t}/gitignore`),
      `templates/${t}/gitignore is not in the packed tarball`,
    );
  }
});

test("every template's ignore rules cover env files and build output", () => {
  for (const t of TEMPLATES) {
    const body = fs.readFileSync(path.join(repoRoot, "templates", t, "gitignore"), "utf-8");
    const lines = body.split("\n").map((l) => l.trim());
    for (const required of ["node_modules/", ".env", ".env.local"]) {
      assert.ok(lines.includes(required), `templates/${t}/gitignore is missing "${required}"`);
    }
    const buildDir = t === "react-vite" ? "dist/" : ".next/";
    assert.ok(lines.includes(buildDir), `templates/${t}/gitignore is missing "${buildDir}"`);
  }
});

test("scaffolding produces a .gitignore that ignores .env.local and build output", () => {
  for (const t of TEMPLATES) {
    withTmpDir((tmp) => {
      const project = scaffoldInto(tmp, t);
      const ignorePath = path.join(project, ".gitignore");
      assert.ok(fs.existsSync(ignorePath), `${t}: generated project has no .gitignore`);
      // The un-dotted source name must not survive into the output.
      assert.ok(
        !fs.existsSync(path.join(project, "gitignore")),
        `${t}: generated project still contains an un-dotted "gitignore"`,
      );

      // Prove it with git itself rather than by re-reading our own patterns.
      execFileSync("git", ["init", "-q", "."], { cwd: project, stdio: "ignore" });
      fs.writeFileSync(path.join(project, ".env.local"), "CENTRALI_CLIENT_SECRET=sk_synthetic\n");
      const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: project,
        encoding: "utf-8",
      });
      assert.ok(
        !status.includes(".env.local"),
        `${t}: .env.local is not git-ignored in the generated project`,
      );
    });
  }
});

test("no template pins a Centrali SDK major below the supported one", () => {
  for (const t of TEMPLATES) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "templates", t, "package.json"), "utf-8"),
    );
    const range = pkg.dependencies["@centrali-io/centrali-sdk"];
    assert.ok(range, `${t}: template does not depend on the Centrali SDK`);
    const major = Number(range.replace(/^[^\d]*/, "").split(".")[0]);
    assert.ok(
      major >= 9,
      `${t}: SDK range "${range}" is below v9. Versions before 9 ship no .d.ts, ` +
        `which makes consumers typecheck SDK source and fail on untyped deps.`,
    );
  }
});

test("no template declares a NEXT_PUBLIC_ or VITE_ client secret", () => {
  // Anything with these prefixes is inlined into the browser bundle, so a
  // secret named this way is published to every visitor. Check the env
  // examples AND the Vite type declarations, which are just as much an
  // instruction to the developer about what belongs in the bundle.
  const isPublic = (key) => key.startsWith("NEXT_PUBLIC_") || key.startsWith("VITE_");
  const isSecret = (key) => /SECRET|_SK$/i.test(key);

  for (const t of TEMPLATES) {
    const examplePath = path.join(repoRoot, "templates", t, ".env.example");
    if (fs.existsSync(examplePath)) {
      for (const line of fs.readFileSync(examplePath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const key = trimmed.split("=")[0].trim();
        assert.ok(
          !(isPublic(key) && isSecret(key)),
          `${t}/.env.example: ${key} would be exposed to the browser`,
        );
      }
    }

    const envTypes = path.join(repoRoot, "templates", t, "env.d.ts");
    if (fs.existsSync(envTypes)) {
      const declared = fs.readFileSync(envTypes, "utf-8").match(/\b(?:VITE|NEXT_PUBLIC)_[A-Z0-9_]+/g) ?? [];
      for (const key of declared) {
        assert.ok(
          !isSecret(key),
          `${t}/env.d.ts declares ${key}, which would be exposed to the browser`,
        );
      }
    }
  }
});

test("scaffolding stamps the template name so `env` cannot misdetect it", () => {
  for (const t of TEMPLATES) {
    withTmpDir((tmp) => {
      const project = scaffoldInto(tmp, t);
      const pkg = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf-8"));
      assert.equal(pkg.centrali?.template, t, `${t}: template marker was not written`);
    });
  }
});

test("--typescript scaffolds without any prompt (CLI is scriptable)", () => {
  withTmpDir((tmp) => {
    // scaffoldInto passes --typescript and closes stdin; if the CLI still
    // prompted, this would hang or fail rather than produce a project.
    const project = scaffoldInto(tmp, "nextjs");
    assert.ok(fs.existsSync(path.join(project, "tsconfig.json")));
    assert.ok(fs.existsSync(path.join(project, "src", "app", "page.tsx")));
  });
});

test("--no-typescript emits JS and drops tsconfig", () => {
  withTmpDir((tmp) => {
    execFileSync(
      process.execPath,
      [path.join(repoRoot, "dist", "index.js"), "demo", "--template=nextjs", "--no-typescript"],
      { cwd: tmp, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    const project = path.join(tmp, "demo");
    assert.ok(!fs.existsSync(path.join(project, "tsconfig.json")));
    assert.ok(fs.existsSync(path.join(project, "src", "app", "page.jsx")));
    assert.ok(fs.existsSync(path.join(project, ".gitignore")));
  });
});

test("the nextjs template never calls the publishable-key client", () => {
  // A publishable key cannot create a collection — the platform rejects every
  // non-GET /collections request made with one. This template therefore uses
  // one server-side credential path. Reintroducing the browser client here
  // would silently restore a 403 that only shows up against a real workspace.
  const dir = path.join(repoRoot, "templates", "nextjs", "src");
  const offenders = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry.name)) {
        if (fs.readFileSync(p, "utf-8").includes("createCentraliClient")) {
          offenders.push(path.relative(repoRoot, p));
        }
      }
    }
  };
  walk(dir);
  assert.deepEqual(offenders, [], `these files use the publishable-key client: ${offenders}`);
});

test("every Clerk entry point in the saas template is gated on authConfigured", () => {
  // ClerkProvider, clerkMiddleware, auth() and the Clerk UI components all
  // throw "Missing publishableKey" the moment they run without a key. Ungating
  // any one of them breaks `next build` for a project with no Clerk account —
  // and clerkMiddleware in particular takes down every route at runtime,
  // including the marketing page.
  const dir = path.join(repoRoot, "templates", "saas", "src");
  const ungated = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry.name)) {
        const body = fs.readFileSync(p, "utf-8");
        if (body.includes("@clerk/nextjs") && !body.includes("authConfigured")) {
          ungated.push(path.relative(repoRoot, p));
        }
      }
    }
  };
  walk(dir);
  assert.deepEqual(ungated, [], `these files use Clerk without a gate: ${ungated}`);
});

test("saas routes opt out of static prerendering", () => {
  const body = fs.readFileSync(
    path.join(repoRoot, "templates", "saas", "src", "app", "layout.tsx"),
    "utf-8",
  );
  assert.match(
    body,
    /export const dynamic = "force-dynamic"/,
    'templates/saas/src/app/layout.tsx must set dynamic = "force-dynamic"',
  );
});

test("the saas project ignores Clerk's keyless credential file", () => {
  // The first `npm run dev` writes .clerk/.tmp/keyless.json, which holds a
  // temporary Clerk app's publishable key AND secret key. The documented flow
  // is scaffold → dev → git init → git add ., so this must be ignored.
  withTmpDir((tmp) => {
    const project = scaffoldInto(tmp, "saas");
    execFileSync("git", ["init", "-q", "."], { cwd: project, stdio: "ignore" });
    fs.mkdirSync(path.join(project, ".clerk", ".tmp"), { recursive: true });
    fs.writeFileSync(
      path.join(project, ".clerk", ".tmp", "keyless.json"),
      JSON.stringify({ publishableKey: "pk_test_synthetic", secretKey: "sk_test_synthetic" }),
    );
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: project,
      encoding: "utf-8",
    });
    assert.ok(
      !status.includes(".clerk"),
      "saas: Clerk's keyless credential file is not git-ignored",
    );
  });
});

test("nextjs server pages opt out of static prerendering", () => {
  // Without force-dynamic, `next build` bakes the credential-less "Get
  // started" screen into static HTML, and a correctly configured production
  // server keeps serving it (x-nextjs-cache: HIT) forever.
  for (const rel of ["src/app/page.tsx", "src/app/collections/[slug]/page.tsx"]) {
    const body = fs.readFileSync(path.join(repoRoot, "templates", "nextjs", rel), "utf-8");
    assert.match(
      body,
      /export const dynamic = "force-dynamic"/,
      `templates/nextjs/${rel} must set dynamic = "force-dynamic"`,
    );
  }
});
