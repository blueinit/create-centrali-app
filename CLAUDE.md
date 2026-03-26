# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Related Projects

The main Centrali monorepo is the sibling directory `../centrali` (i.e. `/Users/maryolowu/Workspace/centrali-ecosystem/centrali`).

## What This Is

`create-centrali-app` is an npm CLI scaffolder (`npx @centrali-io/create-centrali-app my-app`) that generates starter projects for Centrali-powered applications. It ships two templates (React+Vite, Next.js) and an interactive `env` subcommand for configuring environment variables.

## Build & Dev Commands

```bash
npm run build        # Compile TS → dist/ (ES2022, CommonJS)
npm run dev          # Watch mode
node dist/index.js my-test-app   # Test CLI locally after build
```

There are no tests in this repo.

## Architecture

The CLI source is ~400 lines across three files in `src/`:

- **`index.ts`** — CLI entry point. Parses args, runs interactive prompts (project name, template, TypeScript toggle), then calls `scaffold()`. Also dispatches to the `env` subcommand.
- **`scaffold.ts`** — Recursive template copier. Replaces `{{projectName}}` placeholders and optionally strips TypeScript annotations via regex for `--no-typescript` mode.
- **`env.ts`** — Interactive env var setup. Detects template type from `package.json`, reads existing `.env*` files, prompts for missing values, and outputs in dotenv/Vercel/Netlify formats.

## Templates (`templates/`)

Two complete starter apps live in `templates/` and are copied verbatim (with placeholder substitution) into scaffolded projects:

- **`react-vite/`** — React 19 + Vite + TailwindCSS 4. Client-only SDK via `VITE_` env vars. Single `App.tsx` with collections/records CRUD example.
- **`nextjs/`** — Next.js 15 App Router + TailwindCSS 4. Dual SDK clients: public key (client) + service account (server). Uses API routes as proxies, dynamic `[slug]` routes, server components by default.

Template `package.json` files use `{{projectName}}` which gets replaced during scaffolding.

## Key Patterns

- **JS conversion**: When `--no-typescript` is selected, `scaffold.ts` renames `.ts`→`.js`/`.tsx`→`.jsx`, removes TS-only files (`tsconfig.json`, `env.d.ts`), and strips type annotations with regex. Changes to the regex patterns in `scaffold.ts` must be tested against both templates.
- **Env var prefixes**: React+Vite uses `VITE_CENTRALI_*`, Next.js uses `NEXT_PUBLIC_CENTRALI_*` (client) and `CENTRALI_*` (server). The `env.ts` file maintains the full variable definitions for each template type.
- **No runtime dependencies beyond `prompts` and `picocolors`** — keep it minimal.

## Publishing

GitHub Actions (`.github/workflows/publish.yml`) publishes to npm on GitHub release. Version is set from the release tag (strips `v` prefix). Uses OIDC provenance.
