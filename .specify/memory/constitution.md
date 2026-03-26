<!--
  Sync Impact Report
  ──────────────────
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections: Core Principles (5), Template Standards, Development Workflow, Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check section is generic)
    - .specify/templates/spec-template.md ✅ no changes needed (structure is generic)
    - .specify/templates/tasks-template.md ✅ no changes needed (structure is generic)
  Follow-up TODOs: None
-->

# create-centrali-app Constitution

## Core Principles

### I. Product-First Templates

Every template MUST deliver a "this already works" experience on first
run. Users MUST land in a functioning application with real auth, real
data, and real backend behavior — not a skeleton they need to finish.
Templates are products, not scaffolds.

**Rationale**: The project exists to solve the blank page problem. A
template that requires assembly defeats the purpose.

### II. Zero-Friction First Run

The path from `npx create-centrali-app` to a running app MUST require
the fewest possible configuration steps. External services MUST use
zero-config modes where available (e.g., Clerk keyless mode). Only
Centrali credentials are required at minimum.

**Rationale**: Every config step is a dropout point. Indie hackers and
early builders will abandon tooling that demands upfront registration
with multiple services.

### III. Minimal Dependencies

The CLI itself MUST have no runtime dependencies beyond `prompts` and
`picocolors`. Templates MUST only include dependencies that are
essential to their function. No utility libraries, no CSS-in-JS, no
state management libraries beyond what the framework provides.

**Rationale**: Dependency count directly affects install time, audit
surface, and long-term maintenance burden. The scaffolder runs once;
it must be fast and reliable.

### IV. Idempotent Infrastructure

All bootstrap scripts (`centrali-setup.ts`, `ensureWorkspace`, and
future equivalents) MUST be idempotent. Running them multiple times
MUST produce the same result as running them once. They MUST list
existing resources before creating, and skip anything that already
exists.

**Rationale**: Users will re-run setup accidentally, restart dev
servers, and share workspaces. Non-idempotent bootstrap creates
duplicates, errors, and lost trust.

### V. SDK as Source of Truth

Templates MUST use the Centrali SDK for all backend operations. Direct
API calls are prohibited. If the SDK does not expose a needed
capability, the correct action is to extend the SDK — not to
work around it with raw HTTP in the template.

**Rationale**: Templates serve as reference implementations. If they
bypass the SDK, users will copy that pattern and build fragile
integrations.

## Template Standards

- Each template MUST include: `package.json` (with `{{projectName}}`),
  `.env.example`, `.gitignore`, `DEPLOY.md`, and framework config files.
- Templates MUST support both TypeScript (default) and JavaScript
  (`--no-typescript`). The JS conversion in `scaffold.ts` must be tested
  against every template after changes to regex patterns.
- Env var prefixes MUST follow framework conventions: `VITE_` for Vite,
  `NEXT_PUBLIC_` for Next.js client-side, unprefixed for server-side.
- Bootstrap scripts MUST validate that required env vars exist before
  attempting SDK calls, and exit with a clear error message if missing.
- Compute function source files MUST be plain JavaScript (CommonJS
  `module.exports`) since they run in the Centrali runtime, not the
  user's build.

## Development Workflow

- The CLI source (`src/`) compiles to `dist/` via `tsc`. Templates
  under `templates/` are copied verbatim (not compiled).
- New templates MUST be registered in `src/index.ts` (TEMPLATES array)
  and `src/env.ts` (detection and env var definitions).
- `scaffold.ts` MUST NOT require changes for new templates — it handles
  arbitrary directory structures. If a new template needs special
  scaffold behavior, that is a design smell.
- Publishing is automated via GitHub Actions on release. Version comes
  from the release tag.

## Governance

This constitution governs all development on `create-centrali-app`.
Amendments require:

1. A description of the change and its rationale.
2. Verification that existing templates still comply.
3. Update to the version line below using semver:
   - MAJOR: Principle removed or redefined incompatibly.
   - MINOR: New principle or section added.
   - PATCH: Clarification or wording fix.

All PRs MUST be checked against these principles before merge. Use the
Constitution Check section in plan templates to gate implementation.

Use `CLAUDE.md` for runtime development guidance (build commands,
architecture overview, key patterns).

**Version**: 1.0.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26
