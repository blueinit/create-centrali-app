# CWEB-3 — Next.js first success: reproducible path

> [!IMPORTANT]
> **Read [`README.md`](./README.md) first — this document is superseded in part (note added 2026-10-29).**
>
> The text below is the record as it stood on **2026-10-28**, when no sandbox workspace or
> credentials existed. It is left unedited so the dated record stands on its own.
>
> On 2026-10-29 **Steps 6, 7 and 8** (authenticated create, read-back and persistence) were
> executed and passed, as did Step 5's success path. Their `[UNVERIFIED]` markers below are
> stale. Step 9's **403 insufficient-permission case is still unverified** — it is the one
> marked *"please run this one"*, and it still needs running.

**Issue:** [CWEB-3](https://blueinit.atlassian.net/browse/CWEB-3)
**Applies to:** `create-centrali-app` branch `cweb-3/starter-packaging-and-nextjs-first-success` ([PR #3](https://github.com/blueinit/create-centrali-app/pull/3)), SDK `9.5.2`, Next `16.4.3`, Node `>= 20.9`.

> ## Status of this document
>
> Steps **1–5** and **9–11** were executed and verified locally in this environment.
> Steps **6–8** (the authenticated create / read / persistence proof) **were not executed** — no sandbox workspace or credentials were available. They are written to be run by a person once one exists, and are marked **[UNVERIFIED]**.
>
> This document is the procedure plus what has and has not been confirmed. It is **not** a claim that first success has been achieved.

---

## Prerequisites

| Requirement | Why |
|---|---|
| **Node.js >= 20.9** | Next 16.4.3 declares `engines.node >= 20.9.0`. The docs previously said "Node.js 18+", which is wrong. |
| A Centrali workspace, and its **slug** | `CENTRALI_WORKSPACE` takes the slug from Console → Settings, not the display name. |
| A **service account** — client ID + secret | Required to create a collection. |
| That service account in **`workspace_developers`** (or `workspace_administrators`) | A token can be issued successfully even when the account lacks permission to use a resource. Membership is what grants access. |

### Which credential, and why

| Credential | Runs | Create a collection? | Create a record? |
|---|---|---|---|
| Service account (`CENTRALI_CLIENT_ID`/`_SECRET`) | server only | **yes** | yes |
| Publishable key (`NEXT_PUBLIC_CENTRALI_PK`) | browser-safe | **no** | yes, with an explicit per-slug scope |

A publishable key cannot create a collection. The data service returns `403 "This resource is not accessible with a publishable key"` for every non-GET `/collections` request, and `collections:create` is not an expressible publishable-key scope — so this cannot be granted even deliberately. Since the first step of this journey *is* creating a collection, this template uses a service account for everything, server-side only.

**Do not** try to make the browser path work by widening a key's scope. The platform boundary is intentional.

---

## Step 1 — Scaffold **[verified]**

```bash
npx @centrali-io/create-centrali-app@1.1.0 my-app --template=nextjs --typescript
cd my-app
```

`--typescript` makes this fully non-interactive. Without it the TypeScript toggle prompts, which is why the published 1.0.9 CLI could not be scripted.

**Confirm:**

```bash
ls -a | grep gitignore          # .gitignore MUST be present
```

If `.gitignore` is missing you are on a build that predates this fix, and `git add .` would commit your credentials.

## Step 2 — Confirm secret files are ignored **[verified]**

Do this *before* writing any credential.

```bash
git init -q .
printf 'CENTRALI_CLIENT_SECRET=sk_placeholder\n' > .env.local
git check-ignore -v .env.local .next node_modules
```

All three must report as ignored. Then remove the placeholder: `rm .env.local`.

## Step 3 — Install **[verified]**

```bash
npm install
node -p "require('@centrali-io/centrali-sdk/package.json').version"   # expect 9.5.2
```

## Step 4 — Configure credentials **[verified]**

```bash
npx @centrali-io/create-centrali-app env
```

The helper detects the template from the `centrali.template` marker and asks only for what this template reads: `CENTRALI_API_URL`, `CENTRALI_WORKSPACE`, `CENTRALI_CLIENT_ID`, `CENTRALI_CLIENT_SECRET`. The secret is entered hidden, masked on screen, and `.env.local` is written at mode `0600`. It will not silently overwrite an existing `.env.local`.

Or by hand — copy `.env.example` to `.env.local`:

```dotenv
CENTRALI_API_URL=https://centrali.io
CENTRALI_WORKSPACE=your-workspace-slug
CENTRALI_CLIENT_ID=ci_...
CENTRALI_CLIENT_SECRET=sk_...
```

Use the **root domain** for `CENTRALI_API_URL` — the SDK derives `api.centrali.io` itself (`getApiUrl()` is idempotent, so `https://api.centrali.io` also works).

**Never** rename these with a `NEXT_PUBLIC_` prefix. That inlines the secret into the JavaScript bundle served to every visitor.

## Step 5 — Provision the collection **[verified: script runs and fails correctly; UNVERIFIED: success path]**

```bash
npm run setup
```

Creates a `demo-items` collection (`name` required string, `description` string, `schemaDiscoveryMode: "strict"`) plus one clearly-labelled sample record. Idempotent — re-running neither duplicates nor errors.

This step exists because a new workspace has no collections. The previous template and both quickstarts assumed a `products`/`Product` collection already existed, which is why they could not work on a fresh signup.

**Verified:** the script's credential-missing and 401 paths behave correctly. **[UNVERIFIED]** the success path — no authorized credentials were available.

## Step 6 — Start the app and create your own record **[UNVERIFIED]**

```bash
npm run dev
```

Open <http://localhost:3000>.

1. `/` lists collections. `demo-items` should appear.
2. Click into it → `/collections/demo-items`.
3. **"+ Add record"**, and enter a value you can recognise later. Use something unique, e.g. `first-success-<your-initials>-<timestamp>`.
4. Submit.

Seed data does not count. The record must be one you created from the running application.

**Record for evidence:** the returned record `id`, the exact `name` value, and the time.

## Step 7 — Read it back **[UNVERIFIED]**

The collection page reads via the canonical query form:

```ts
await centrali.records.query(slug, {
  resource: slug,
  sort: [{ field: "createdAt", direction: "desc" }],
  page: { limit: 100 },
});
```

> This shape was validated offline against SDK 9.5.2's bundled query validator. Note that `sort` is `SortClause[]` (`{field, direction}`) and `page` takes `limit`, **not** `size` — a plausible-looking `sort: ["-createdAt"], page: {size: 100}` is **rejected** by the validator before any request is made.

Confirm the record appears with the `id` from Step 6. Then confirm independently, outside the app:

```bash
# Expect the same id. Shown as a shape, not a runnable command —
# use the SDK or the Console rather than hand-rolling auth headers.
node -e "/* collections.getBySlug('demo-items') then records.query(...) */"
```

Also inspect it in the Centrali console, so the proof is not circular.

## Step 8 — Prove persistence **[UNVERIFIED]**

1. **Refresh** the page. Same `id`, same values.
2. **Stop the dev server** (`Ctrl-C`), start it again, reload. Same `id`.
3. **Production path:**
   ```bash
   npm run build && npm start
   ```
   Same `id` again.

Step 3 matters specifically. Before this repair, a build that ran without credentials baked the "Get started" screen into static HTML and `next start` kept serving it even with valid credentials present (`x-nextjs-cache: HIT`, `Cache-Control: s-maxage=31536000`). Both server pages now set `dynamic = "force-dynamic"`.

**Verified [L]:** on the repaired template, the same build serves "Get started" without credentials and the Collections view once credentials are present. **[UNVERIFIED]** that a real record survives, since no record could be created.

## Step 9 — Check the failure cases **[verified for 401 and validation; UNVERIFIED for 403]**

### Missing credentials **[verified]**

Remove `CENTRALI_CLIENT_SECRET` and reload. Expect the "Get started" screen, not a crash.

### Invalid credentials **[verified against the live endpoint, synthetic values]**

Set `CENTRALI_CLIENT_ID=ci_invalid` / `CENTRALI_CLIENT_SECRET=sk_invalid`:

```
Centrali rejected the service account credentials (401 invalid_client):
client authentication failed. Check CENTRALI_CLIENT_ID and
CENTRALI_CLIENT_SECRET, and confirm CENTRALI_WORKSPACE is your workspace
slug (not its display name).
```

The SDK's own message here is only `"Request failed with status code 401"`; the detail lives on `status`/`code`/`body`, which the template's `lib/errors.ts` reads. Note the SDK does **not** expose an axios-style `error.response`.

### Insufficient permissions **[UNVERIFIED — please run this one]**

Remove the service account from `workspace_developers`, leaving it otherwise valid, then try to create a collection. Expected:

```
The service account authenticated but is not permitted to create a collection
(403): … Add it to the workspace_administrators or workspace_developers group
in Console > ACCESS > Service Accounts. Obtaining a token does not by itself
grant access to a resource.
```

This message is implemented but has never been triggered against a real 403. **Confirming it is the single most valuable check a sandbox would unlock**, because it is the exact wall the old template hit silently.

### Wrong workspace slug **[UNVERIFIED]**

Set `CENTRALI_WORKSPACE` to a non-existent slug. Record what comes back — whether it is a clear 404 or an opaque 401/403 is itself a finding worth reporting (see `auth-friction-review.md`, AF-5).

## Step 10 — Access boundary **[verified by inspection]**

```bash
curl -s -X POST http://localhost:3000/api/collections \
  -H 'Content-Type: application/json' \
  -d '{"name":"Unauthenticated","recordSlug":"unauth-test"}'
```

**This succeeds**, with no authentication, because the route holds the service account credentials and performs no application-level check. That is the intended local-demo behaviour and it is now stated in the UI, `DEPLOY.md`, the README and the starter guide.

**It is also why this template must not be deployed publicly as-is.** Before exposing it:

1. Authenticate the caller in each route handler and server page, and authorize per user.
2. Use a **separate service account and workspace** for production.
3. Decide deliberately what the browser may do — a publishable key with explicit per-slug scopes is the supported mechanism.

A successful deploy is not evidence that access control is correct.

## Step 11 — Clean up **[partially verified]**

```bash
rm -f .env.local                  # verified
```

Then, in the sandbox workspace, delete the `demo-items` collection and its records via the Console or `collections.delete(collectionId)`. **[UNVERIFIED]** — nothing was created, so nothing was cleaned up.

If you entered credentials anywhere during testing, confirm they were not committed:

```bash
git log --all --name-only | grep -E '\.env' || echo "clean"
```

Do not rotate shared credentials as part of this exercise; raise it instead if a rotation looks necessary.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Get started" persists after setting credentials | All three of `CENTRALI_WORKSPACE`, `CENTRALI_CLIENT_ID`, `CENTRALI_CLIENT_SECRET` must be set; dev server must restart | Set all three, restart |
| ...and you are on published 1.0.9 | The gate checked service-account vars but the data path used the publishable key — no credential combination worked (finding N1) | Use the repaired template |
| Production build serves "Get started" forever | Pre-fix static prerender (finding N2) | Repaired template sets `force-dynamic` |
| `403` on create collection | Publishable key in use, **or** service account not in a workspace group | Use a service account; add it to `workspace_developers`. Do not widen key scopes |
| `TS7016: Could not find a declaration file for module 'qs'` | SDK < 9 ships no `.d.ts`, so your build typechecks SDK source (finding N3) | Use SDK `^9.5.2` |
| `.env.local` shows as untracked | Generated project had no `.gitignore` (finding G3) | Repaired template ships one; verify with Step 2 |
| `TypeError: Invalid URL` at construction | `baseUrl` omitted — it is required | Pass `baseUrl: "https://centrali.io"` |
| `Cannot use publishableKey with clientId/clientSecret` | Both auth paths passed to one client | Use one per client instance |
| Deprecation warning about `queryRecords(slug, urlOpts)` | Legacy GET adapter — still supported, just warns | Optional: move to `records.query` with a `QueryDefinition` |

---

## What would make this document "verified"

An isolated non-production workspace with a service account in `workspace_developers` and a publishable key, synthetic data only. With that, Steps 6, 7, 8, the 403 case in Step 9, and Step 11 become executable, and CWEB-3's first-success acceptance criterion can be closed. Without it, this remains a tested procedure with an untested middle.
