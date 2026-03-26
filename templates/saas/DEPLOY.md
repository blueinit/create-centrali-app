# Deploying your SaaS Starter

## Before deploying

In development, Clerk runs in **keyless mode** (no API keys needed). For production, you need Clerk credentials:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) and create an application
2. Copy your **Publishable Key** and **Secret Key**

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
   | `CENTRALI_CLIENT_ID` | Your service account client ID (`ci_...`) |
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
vercel env add CENTRALI_CLIENT_ID production <<< "ci_..."
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
netlify env:set CENTRALI_CLIENT_ID "ci_..."
netlify env:set CENTRALI_CLIENT_SECRET "sk_..."
netlify deploy --prod
```

## Environment variable guide

| Variable | Where it runs | What it does |
|----------|--------------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser + Server | Clerk auth (not needed in dev — keyless mode) |
| `CLERK_SECRET_KEY` | Server only | Clerk server auth (not needed in dev) |
| `NEXT_PUBLIC_CENTRALI_*` | Browser + Server | Embedded in JS bundle at build time. Not secrets. |
| `CENTRALI_CLIENT_ID` | Server only | Service account ID for API routes and server components. |
| `CENTRALI_CLIENT_SECRET` | Server only | Service account secret. **Never expose to browser.** |
