# create-centrali-app

Scaffold a new Centrali-powered app with one command.

## Usage

```bash
npx @centrali-io/create-centrali-app my-app
```

### Options

```bash
# Choose a specific template
npx @centrali-io/create-centrali-app my-app --template=saas
npx @centrali-io/create-centrali-app my-app --template=api
npx @centrali-io/create-centrali-app my-app --template=jobs
npx @centrali-io/create-centrali-app my-app --template=react-vite
npx @centrali-io/create-centrali-app my-app --template=nextjs

# Fully non-interactive (no prompts at all) — useful in CI
npx @centrali-io/create-centrali-app my-app --template=nextjs --typescript

# Use JavaScript instead of TypeScript
npx @centrali-io/create-centrali-app my-app --no-typescript
```

A project name plus `--template=` still leaves the TypeScript toggle to prompt,
so add `--typescript` (or `--yes`) when you need a non-interactive run.

### Templates

| Template | Description | Credentials |
|----------|-------------|-------------|
| **nextjs** | Next.js 16 + TailwindCSS 4 + Centrali SDK. Collections browser with create/read. | Service account (server-side only) |
| **api** | Next.js 16 + REST API with CRUD, filtering, pagination + interactive explorer | Service account server-side, publishable key in browser |
| **jobs** | Next.js 16 + compute functions + scheduled/event triggers + monitoring dashboard | Service account server-side, publishable key in browser |
| **saas** | Next.js 16 + Clerk auth + multi-tenant data + compute functions | Clerk + service account |
| **react-vite** | React 19 + Vite + TailwindCSS 4 + Centrali SDK | Publishable key (browser) |

All templates include:
- Pre-configured Centrali SDK client (`@centrali-io/centrali-sdk` v9)
- TailwindCSS 4 styling
- An environment example (`.env.example`) and a `.gitignore` that excludes
  `.env`, `.env.local` and build output
- TypeScript by default (with `--no-typescript` opt-out)
- Node.js >= 20.9 (required by Next.js 16)

The **nextjs**, **saas**, **api** and **jobs** templates include a
`centrali-setup` script (`npm run setup`) that provisions the collections and
sample data the template expects, so you do not need a pre-existing collection
in your workspace.

### Credential model

Centrali credentials are not interchangeable, and each template is explicit
about which one it uses:

- **Service account** (`CENTRALI_CLIENT_ID` / `CENTRALI_CLIENT_SECRET`) —
  server-side only. Required to **create a collection**.
- **Publishable key** (`NEXT_PUBLIC_CENTRALI_PK` / `VITE_CENTRALI_PK`) — safe
  in the browser. Can read collections and, with an explicit per-slug scope,
  create records. It **cannot create a collection**: the platform rejects
  every non-GET `/collections` request made with a publishable key.

The `nextjs` template therefore uses a single server-side service account, so
there is one credential path to configure. Never give a `NEXT_PUBLIC_` or
`VITE_` prefix to a client secret — those values are inlined into the browser
bundle.

> **Local demo boundary.** The example API routes hold service account
> credentials and have no application-level access rules. Add your own
> authentication and authorization before exposing them publicly, and use
> separate development and production credentials. See each template's
> `DEPLOY.md`.

## After scaffolding

1. `cd my-app`
2. `npm install`
3. Run `npx @centrali-io/create-centrali-app env` to configure credentials.
   Secrets are entered hidden, masked on screen, and written to `.env.local`
   with mode `0600`.
4. `npm run setup` (nextjs, saas, api and jobs — creates collections and sample data)
5. `npm run dev`

## Development

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Run the regression checks
npm test

# Test locally
node dist/index.js my-test-app --template=nextjs --typescript
```

### Packaging note

npm **unconditionally excludes files named `.gitignore`** from published
tarballs, regardless of the `files` field. Templates therefore store the file
as `templates/<name>/gitignore`, and `scaffold.ts` restores the leading dot
when it copies. If you add a template, use the un-dotted name — the tests in
`test/packaging.test.mjs` enforce this and verify that a project generated
from the packed tarball really does ignore `.env.local`.

Always test the **packed artifact**, not just the repository templates:

```bash
npm pack
cd /tmp && npx /path/to/centrali-io-create-centrali-app-*.tgz demo --template=nextjs --typescript
```

## License

MIT
