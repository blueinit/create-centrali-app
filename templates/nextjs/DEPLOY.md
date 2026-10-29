# Deploying your Centrali app

> ## Read this before deploying publicly
>
> This template is a **local development demo**. Its API routes
> (`/api/collections`, `/api/records`) hold service account credentials and
> perform **no application-level authentication or authorization**. Deployed as
> is on a public URL, anyone who finds it can read and write your Centrali
> workspace.
>
> Before you expose it:
>
> 1. Add your own authentication to the route handlers and server pages, and
>    authorize each request against the signed-in user.
> 2. Use a **separate service account and workspace** for production — never
>    the one you developed against.
> 3. Decide deliberately what the browser may do. A publishable key with
>    explicit per-slug scopes is the supported way to let browser code read
>    collections or create records; it can never create a collection.
>
> A successful deploy is not evidence that access control is correct.

## Vercel

1. Push your project to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Settings:
   - **Framework Preset:** Next.js (auto-detected)
4. Add environment variables. This template uses a single server-side
   credential path, so there are no `NEXT_PUBLIC_` Centrali variables to set:

   **Server-side (API routes and server components only):**

   | Variable | Value |
   |----------|-------|
   | `CENTRALI_API_URL` | `https://centrali.io` |
   | `CENTRALI_WORKSPACE` | Your workspace slug |
   | `CENTRALI_CLIENT_ID` | Your service account client ID (`sa_...`) |
   | `CENTRALI_CLIENT_SECRET` | Your service account secret (`sk_...`) |

   > **Security:** `CENTRALI_CLIENT_SECRET` is a server-side secret. Vercel keeps
   > variables without the `NEXT_PUBLIC_` prefix server-side only — they are never
   > exposed to the browser. Never rename these with a `NEXT_PUBLIC_` prefix to
   > "make them available" — that publishes your secret in the JavaScript bundle.

   > **Set these before your first build.** The pages read credentials at
   > request time (`dynamic = "force-dynamic"`), so a build that ran without
   > them still works once they are present — but `npm run setup` must be run
   > once against the target workspace to create the collection.

5. Deploy

### Vercel CLI

```bash
npm i -g vercel
vercel env add NEXT_PUBLIC_CENTRALI_API_URL production <<< "https://centrali.io"
vercel env add NEXT_PUBLIC_CENTRALI_WORKSPACE production <<< "your-workspace-slug"
vercel env add NEXT_PUBLIC_CENTRALI_PK production <<< "pk_live_..."
vercel env add CENTRALI_API_URL production <<< "https://centrali.io"
vercel env add CENTRALI_WORKSPACE production <<< "your-workspace-slug"
vercel env add CENTRALI_CLIENT_ID production <<< "sa_..."
vercel env add CENTRALI_CLIENT_SECRET production <<< "sk_..."
vercel --prod
```

## Netlify

1. Push your project to GitHub
2. Import in [Netlify](https://app.netlify.com/start)
3. Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `.next`
4. Install the [Next.js runtime](https://docs.netlify.com/frameworks/next-js/overview/) (auto-detected for most projects)
5. Add environment variables (same as above) under **Site settings > Environment variables**
6. Deploy

### Netlify CLI

```bash
npm i -g netlify-cli
netlify env:set NEXT_PUBLIC_CENTRALI_API_URL "https://centrali.io"
netlify env:set NEXT_PUBLIC_CENTRALI_WORKSPACE "your-workspace-slug"
netlify env:set NEXT_PUBLIC_CENTRALI_PK "pk_live_..."
netlify env:set CENTRALI_API_URL "https://centrali.io"
netlify env:set CENTRALI_WORKSPACE "your-workspace-slug"
netlify env:set CENTRALI_CLIENT_ID "sa_..."
netlify env:set CENTRALI_CLIENT_SECRET "sk_..."
netlify deploy --prod
```

## Environment variable guide

| Variable | Where it runs | What it does |
|----------|--------------|--------------|
| `NEXT_PUBLIC_CENTRALI_*` | Browser + Server | Embedded in JS bundle at build time. Not secrets. |
| `CENTRALI_CLIENT_ID` | Server only | Service account ID for API routes and server components. |
| `CENTRALI_CLIENT_SECRET` | Server only | Service account secret. **Never expose to browser.** |

`NEXT_PUBLIC_` variables are safe for client-side use — they contain your workspace slug and publishable key, which are designed to be public.

Server-side variables (`CENTRALI_CLIENT_ID`, `CENTRALI_CLIENT_SECRET`) are only available in API routes, server components, and server actions. Both Vercel and Netlify keep non-prefixed variables server-side automatically.
