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

# Use JavaScript instead of TypeScript
npx @centrali-io/create-centrali-app my-app --no-typescript
```

### Templates

| Template | Description |
|----------|-------------|
| **saas** | Next.js 16 + Clerk auth + multi-tenant data + compute functions |
| **api** | Next.js 16 + REST API with CRUD, filtering, pagination + interactive explorer |
| **jobs** | Next.js 16 + Compute functions + scheduled/event triggers + monitoring dashboard |
| **react-vite** | React 19 + Vite + TailwindCSS 4 + Centrali SDK |
| **nextjs** | Next.js 16 + TailwindCSS 4 + Centrali SDK |

All templates include:
- Pre-configured Centrali SDK client
- TailwindCSS 4 styling
- Environment variable setup (`.env.example`)
- TypeScript by default (with `--no-typescript` opt-out)

The **saas**, **api**, and **jobs** templates also include a `centrali-setup` script that provisions collections and seed data in your workspace.

## After Scaffolding

1. `cd my-app`
2. `npm install`
3. Run `npx @centrali-io/create-centrali-app env` to configure credentials
4. `npm run setup` (saas and api templates — creates collections and seed data)
5. `npm run dev`

## Development

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Test locally
node dist/index.js my-test-app
```

## License

MIT
