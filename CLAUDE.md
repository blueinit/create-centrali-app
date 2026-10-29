# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Related Projects

The main Centrali monorepo is the sibling directory `../centrali`.

## What This Is

`create-centrali-app` is an npm CLI scaffolder (`npx @centrali-io/create-centrali-app my-app`) that generates starter projects for Centrali-powered applications. It ships five templates (`nextjs`, `api`, `jobs`, `saas`, `react-vite`) and an interactive `env` subcommand for configuring environment variables.

## Build & Dev Commands

```bash
npm run build        # Compile TS → dist/ (ES2022, CommonJS)
npm run dev          # Watch mode
node dist/index.js my-test-app   # Test CLI locally after build
```

npm test            # node --test test/*.test.mjs
```

`test/packaging.test.mjs` asserts properties of the **packed artifact** and
the **generated project**, not just the repository templates. The original
`.gitignore` defect was invisible from a source checkout, so prefer checks
that run `npm pack` and scaffold from the tarball.

## Architecture

The CLI source is ~400 lines across three files in `src/`:

- **`index.ts`** — CLI entry point. Parses args, runs interactive prompts (project name, template, TypeScript toggle), then calls `scaffold()`. Also dispatches to the `env` subcommand.
- **`scaffold.ts`** — Recursive template copier. Replaces `{{projectName}}` placeholders and optionally strips TypeScript annotations via regex for `--no-typescript` mode.
- **`env.ts`** — Interactive env var setup. Detects template type from `package.json`, reads existing `.env*` files, prompts for missing values, and outputs in dotenv/Vercel/Netlify formats.

## Templates (`templates/`)

Five complete starter apps live in `templates/` and are copied (with
placeholder substitution) into scaffolded projects:

- **`nextjs/`** — Next.js 16 App Router + TailwindCSS 4. **One** credential
  path: a server-side service account. Server components and route handlers
  only; no publishable-key client. `page.tsx` and `collections/[slug]/page.tsx`
  set `dynamic = "force-dynamic"`.
- **`api/`** — Next.js 16 REST API over a `tasks` collection, with an
  interactive explorer and a `centrali-setup` script.
- **`jobs/`** — Next.js 16 compute functions, triggers and a run dashboard.
- **`saas/`** — Next.js 16 + Clerk, multi-tenant organizations/members.
- **`react-vite/`** — React 19 + Vite + TailwindCSS 4. Browser-only SDK via
  `VITE_` env vars and a publishable key.

Template `package.json` files use `{{projectName}}` which gets replaced during scaffolding.

## Key Patterns

- **JS conversion**: When `--no-typescript` is selected, `scaffold.ts` renames `.ts`→`.js`/`.tsx`→`.jsx`, removes TS-only files (`tsconfig.json`, `env.d.ts`), and strips type annotations with regex. Changes to the regex patterns in `scaffold.ts` must be tested against both templates.
- **Env var prefixes**: React+Vite uses `VITE_CENTRALI_*`, Next.js uses `NEXT_PUBLIC_CENTRALI_*` (client) and `CENTRALI_*` (server). The `env.ts` file maintains the full variable definitions for each template type.
- **Dotfiles in templates**: npm unconditionally excludes files named
  `.gitignore` from published tarballs, whatever `files` says. Templates store
  it as `gitignore`; `RENAME_ON_COPY` in `scaffold.ts` restores the dot. Use
  the un-dotted name for any new template.
- **Credentials are not interchangeable**: a publishable key can read
  collections and (with an explicit per-slug scope) create records, but can
  never create a collection — the data service rejects non-GET `/collections`
  for publishable keys. Anything that provisions a schema needs a service
  account. Never widen publishable-key scope to make an example pass.
- **Never prefix a secret with `NEXT_PUBLIC_` or `VITE_`** — those values are
  inlined into the browser bundle. A test enforces this for `.env.example`
  and `env.d.ts`.
- **Template detection**: `scaffold.ts` stamps `centrali.template` into the
  generated `package.json`; `env.ts` reads it. Do not reintroduce dependency
  sniffing — "has next and a setup script" used to mean the api template until
  the nextjs template gained a setup script.
- **No runtime dependencies beyond `prompts` and `picocolors`** — keep it minimal.

## Publishing

GitHub Actions (`.github/workflows/publish.yml`) publishes to npm on GitHub
release. Version is set from the release tag (strips `v` prefix) via
`npm version --no-git-tag-version`. Uses OIDC provenance.

Because the workflow overrides the version at publish time, `package.json` on
`main` is not automatically bumped and has historically lagged the published
version (it read `0.1.0` while npm `latest` was `1.0.9`). Keep it roughly in
step so the source version is not misleading.
