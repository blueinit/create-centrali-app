# Deploying your API Starter

## Before deploying

Run the setup script if you haven't already:

```bash
npm run setup
```

## Vercel

1. Push your project to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Settings:
   - **Framework Preset:** Next.js (auto-detected)
4. Add environment variables:

   **Centrali — Client-side (safe for browser):**

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CENTRALI_API_URL` | `https://centrali.io` |
   | `NEXT_PUBLIC_CENTRALI_WORKSPACE` | Your workspace slug |
   | `NEXT_PUBLIC_CENTRALI_PK` | Your publishable key (`pk_live_...`) |

   **Centrali — Server-side (API routes only):**

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
| `NEXT_PUBLIC_CENTRALI_*` | Browser + Server | Embedded in JS bundle at build time. Not secrets. |
| `CENTRALI_CLIENT_ID` | Server only | Service account ID for API routes. |
| `CENTRALI_CLIENT_SECRET` | Server only | Service account secret. **Never expose to browser.** |
