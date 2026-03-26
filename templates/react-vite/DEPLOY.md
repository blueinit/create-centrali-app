# Deploying your Centrali app

## Vercel

1. Push your project to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `VITE_CENTRALI_API_URL` | `https://centrali.io` |
   | `VITE_CENTRALI_WORKSPACE` | Your workspace slug |
   | `VITE_CENTRALI_PK` | Your publishable key (`pk_live_...`) |

5. Deploy

### Vercel CLI

```bash
npm i -g vercel
vercel env add VITE_CENTRALI_API_URL production <<< "https://centrali.io"
vercel env add VITE_CENTRALI_WORKSPACE production <<< "your-workspace-slug"
vercel env add VITE_CENTRALI_PK production <<< "pk_live_..."
vercel --prod
```

## Netlify

1. Push your project to GitHub
2. Import in [Netlify](https://app.netlify.com/start)
3. Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Add environment variables (same as above) under **Site settings > Environment variables**
5. Deploy

### Netlify CLI

```bash
npm i -g netlify-cli
netlify env:set VITE_CENTRALI_API_URL "https://centrali.io"
netlify env:set VITE_CENTRALI_WORKSPACE "your-workspace-slug"
netlify env:set VITE_CENTRALI_PK "pk_live_..."
netlify deploy --prod --dir=dist
```

## Any static host

Run `npm run build` and deploy the `dist/` folder to any static hosting provider (Cloudflare Pages, GitHub Pages, AWS S3 + CloudFront, etc.).

Set the environment variables from `.env.example` in your hosting provider's dashboard or CI/CD pipeline before building.

All `VITE_` variables are embedded in the JavaScript bundle at build time — they are not secrets and are safe for client-side use.
