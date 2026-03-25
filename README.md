# create-centrali-app

Scaffold a new Centrali-powered app with one command.

## Usage

```bash
npx create-centrali-app my-app
```

### Options

```bash
# Choose a specific template
npx create-centrali-app my-app --template=react-vite
npx create-centrali-app my-app --template=nextjs

# Use JavaScript instead of TypeScript
npx create-centrali-app my-app --no-typescript
```

### Templates

| Template | Description |
|----------|-------------|
| **react-vite** | React 19 + Vite + TailwindCSS 4 + Centrali SDK |
| **nextjs** | Next.js 15 + TailwindCSS 4 + Centrali SDK |

Both templates include:
- Pre-configured Centrali SDK client
- TailwindCSS 4 styling
- Environment variable setup (`.env.example`)
- Example data fetching from a Centrali collection
- TypeScript by default (with `--no-typescript` opt-out)

## After Scaffolding

1. `cd my-app`
2. `npm install`
3. Copy `.env.example` to `.env` and add your Centrali credentials
4. Update the collection recordSlug in the example code
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
