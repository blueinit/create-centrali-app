/**
 * Shown in place of any auth-dependent view when this build has no Clerk key.
 * Renders no Clerk components, so it is safe wherever `authConfigured` is false.
 */
export function AuthSetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-base font-semibold text-amber-900">
          Authentication is not configured
        </h2>
        <p className="mt-2 text-sm text-amber-800">
          This build was produced without a Clerk publishable key, so sign-in is
          switched off and this page cannot load user data.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-amber-800">
          <li>
            Locally, run{" "}
            <code className="rounded bg-amber-100 px-1">npm run dev</code> —
            Clerk uses keyless mode and needs no keys.
          </li>
          <li>
            For a deployed build, set{" "}
            <code className="rounded bg-amber-100 px-1">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-amber-100 px-1">CLERK_SECRET_KEY</code>,
            then rebuild. The publishable key is read at build time, so adding
            it to a finished build has no effect.
          </li>
        </ul>
        <p className="mt-3 text-xs text-amber-700">
          See <code className="rounded bg-amber-100 px-1">DEPLOY.md</code> for
          the full list of environment variables.
        </p>
      </div>
    </div>
  );
}
