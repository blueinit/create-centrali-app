/**
 * Whether Clerk auth is wired up for this build.
 *
 * Clerk runs in **keyless mode** during `next dev`, so local development needs
 * no Clerk credentials at all — that is the zero-config first run this template
 * promises. Keyless mode does **not** engage during `next build` or
 * `next start`, so a production build has to be told whether a real key exists.
 *
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is inlined into the bundle when you build
 * — that is how the key reaches the browser — so this value is decided at build
 * time. Adding Clerk keys *after* the build does not turn auth on; they must be
 * present before `npm run build`. See DEPLOY.md.
 *
 * When this is `false` the app still builds and still serves: every
 * auth-dependent surface renders a setup notice instead of crashing the route
 * with "Missing publishableKey".
 */
export const authConfigured =
  process.env.NODE_ENV !== "production" ||
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
