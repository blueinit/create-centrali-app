# Deploying your SaaS Starter

## Before deploying

With `npm run dev`, Clerk runs in **keyless mode** — no API keys needed. For production, you need Clerk credentials:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) and create an application
2. Copy your **Publishable Key** and **Secret Key**

> **Set the Clerk keys before you build.** Keyless mode does not engage during
> `next build` or `next start`. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is inlined
> into the browser bundle at build time, so a build produced without it ships
> with auth switched off — sign-in and the dashboard render a
> "Authentication is not configured" notice, and the write APIs return `503`.
> Adding the keys to an already-built deployment does not turn auth on; set them
> as build-time environment variables and redeploy. (Vercel and Netlify both
> expose their environment variables to the build step, so configuring them in
> the dashboard before the first deploy is enough.)

You also need to run the setup script if you haven't already:

```bash
npm run setup
```

## Vercel

1. Push your project to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Settings:
   - **Framework Preset:** Next.js (auto-detected)
4. Add environment variables:

   **Clerk (auth):**

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key (`pk_live_...`) |
   | `CLERK_SECRET_KEY` | Your Clerk secret key (`sk_live_...`) |

   **Centrali — Client-side (safe for browser):**

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CENTRALI_API_URL` | `https://centrali.io` |
   | `NEXT_PUBLIC_CENTRALI_WORKSPACE` | Your workspace slug |
   | `NEXT_PUBLIC_CENTRALI_PK` | Your publishable key (`pk_live_...`) |

   **Centrali — Server-side (API routes and server components only):**

   | Variable | Value |
   |----------|-------|
   | `CENTRALI_API_URL` | `https://centrali.io` |
   | `CENTRALI_WORKSPACE` | Your workspace slug |
   | `CENTRALI_CLIENT_ID` | Your service account client ID (`sa_...`) |
   | `CENTRALI_CLIENT_SECRET` | Your service account secret (`sk_...`) |

5. Deploy

### Vercel CLI

```bash
npm i -g vercel
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production <<< "pk_live_..."
vercel env add CLERK_SECRET_KEY production <<< "sk_live_..."
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
netlify env:set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "pk_live_..."
netlify env:set CLERK_SECRET_KEY "sk_live_..."
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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser + Server | Clerk auth. Not needed for `npm run dev` (keyless mode). **Required at build time** for a deployed build with auth. |
| `CLERK_SECRET_KEY` | Server only | Clerk server auth. Not needed for `npm run dev`. |
| `NEXT_PUBLIC_CENTRALI_*` | Browser + Server | Embedded in JS bundle at build time. Not secrets. |
| `CENTRALI_CLIENT_ID` | Server only | Service account ID for API routes and server components. |
| `CENTRALI_CLIENT_SECRET` | Server only | Service account secret. **Never expose to browser.** |
