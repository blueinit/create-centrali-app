# CWEB-3 — Starter validation report

> [!IMPORTANT]
> **Read [`README.md`](./README.md) first — this document is superseded in part (note added 2026-10-29).**
>
> The text below is the record as it stood on **2026-10-28**, when no sandbox workspace or
> credentials existed. It is left unedited so the dated record stands on its own.
>
> On 2026-10-29 the authenticated journey was executed against two self-provisioned
> workspaces. The `BLOCKED` rows for **authenticated write, read-back, persistence and
> tenant isolation** are now **PASS**, and `mkdocs build --strict` has since run green in
> CI. The `saas` build failure recorded below is fixed by
> [PR #4](https://github.com/blueinit/create-centrali-app/pull/4). The **403
> insufficient-permission path remains unverified.**

**Issue:** [CWEB-3](https://blueinit.atlassian.net/browse/CWEB-3)
**Executed by:** Gerald (Developer Experience Engineer, Paperclip run CEN-52)
**Date:** 2026-10-28
**Status:** Bounded repairs submitted for review. **Authenticated first-success evidence BLOCKED** — no sandbox workspace or credentials were available.

> **Evidence classes used throughout this report.** Every row is labelled with one of:
> **[S] static source** — read from a pinned commit or an unpacked tarball.
> **[L] local build** — a command run in this environment, exit code recorded.
> **[R-neg] authenticated runtime, negative path only** — a real request to the live API that was *rejected*, using synthetic credentials.
> **[R-pos] authenticated runtime, success** — **none of this class exists in this report.**
>
> A passing build is **not** evidence of working permissions, persistence or tenant isolation. No statement here should be read as such.

---

## 1. Environment and exact versions

| Item | Value | Class |
|---|---|---|
| OS | Linux x86_64 (container) | [L] |
| Node | **v24.22.1** | [L] |
| npm | **11.19.1** | [L] |
| git | 2.47.3 | [L] |
| Starter npm `latest` | **1.0.9**, published 2026-03-27T16:29:26Z | [S] |
| Starter tarball sha256 | `7b1a28f0aefe2af3451ef593f38df90f34fa3473f419146f527194401129e74d` | [S] |
| Starter published `gitHead` | `76cd992d09dccb4ed8558df75821f60a34f9954a` (real commit, 2026-03-27) | [S] |
| Starter repo `main` at audit time | `86a734fb74a9b14bdc5531a64d97a4a35e800e2b` ("Bump SDK to ^4.4.7"), `package.json` version `0.1.0` | [S] |
| SDK npm `latest` | **9.5.2**, published 2026-10-27T18:12:54Z (215 versions) | [S] |
| SDK resolved by published templates | **4.6.0** (from range `^4.4.6`) | [L] |
| Platform repo `main` | `2a7f1ba3b98c3571f826375e4aadde6778a403a0` (2026-10-28 — **newer than the audit's `ab13344a`**) | [S] |
| Docs repo `main` | `7491f0bd9149448df4c47e3d783e0a591529d887` | [S] |
| Marketing repo `main` | `b5372c80b1d6b0e502c00bfdfcb230708abb4ca6` (unchanged since the audit) | [S] |
| Next.js resolved | **16.4.3** (`engines.node >= 20.9.0`) | [L] |
| Vite resolved | **6.4.5** | [L] |

### Commands used

```bash
# Baseline
curl -s https://registry.npmjs.org/@centrali-io%2Fcreate-centrali-app
curl -s https://registry.npmjs.org/@centrali-io%2Fcentrali-sdk
npm pack --dry-run --json                       # in create-centrali-app

# Reproduce the documented flow
npx @centrali-io/create-centrali-app@1.0.9 demo-nextjs --template=nextjs
npm install && npm run build
npx next start -p <port>                        # production-path check

# Proposed release
npm run build && npm test && npm pack
npx ./centrali-io-create-centrali-app-1.1.0.tgz <name> --template=<t> --typescript
```

### Reproduction friction worth recording

The CLI **could not be run non-interactively** at 1.0.9. Passing a project name and `--template=` still left the "Use TypeScript?" toggle prompting, and no `--typescript` or `--yes` flag existed. The first scaffold attempt exited having created nothing; a newline had to be piped into stdin. `quickstart-create-app.md` claimed flags could "skip the prompts". **[L]**

---

## 2. Template inventory (as published at 1.0.9)

All five templates were offered by the CLI menu; the starter guide described only two.

| Template | Files generated | SDK range (published) | `@types/qs` present | Framework | Credential mode in code | `npm run setup` |
|---|---|---|---|---|---|---|
| `nextjs` | 15 | `^4.4.6` | yes | Next ^16 | **Publishable key** for all reads *and* collection creation | no |
| `api` | 22 | `^4.4.6` | no | Next ^16 | Service account (server) + pk declared | yes |
| `jobs` | 30 | `^4.4.6` | no | Next ^16 | Service account (server) + pk declared | yes |
| `saas` | 23 | `^4.4.6` | yes | Next ^16 + Clerk | Clerk + service account | yes |
| `react-vite` | 12 | `^4.4.6` | no | Vite ^6 | Publishable key (browser) | no |

Repo `main` pinned `^4.4.7` (one commit after the 1.0.9 release), which is the whole of the `^4.4.6` vs `^4.4.7` discrepancy the audit noted. **[S]**

### Release provenance — the audit's open question, resolved

The audit recorded "published 1.0.9 versus source package version 0.1.0" and noted that "release provenance and why they diverged were not established."

`.github/workflows/publish.yml` sets the version from the GitHub release tag:

```yaml
- name: Set version from release tag
  run: |
    VERSION="${TAG#v}"
    npm version "$VERSION" --no-git-tag-version
```

So `package.json` on `main` is **never bumped by a release** and simply lagged. Tags `0.2.0` … `1.0.9` all exist in the repository, and published `gitHead 76cd992d` resolves to a real commit in history. **This is not a provenance failure or a mis-publish** — it is a confusing but traceable convention. The repair sets `package.json` to `1.1.0` so the source version stops misreporting. **[S]**

---

## 3. Audit finding revalidation

Re-checked against **current** versions, not the October 28 snapshot values.

| ID | Audit claim | Verdict | Evidence |
|---|---|---|---|
| G1 | Published SDK `^4.4.6` → 4.6.0; repo `^4.4.7`; latest 9.5.2 | **CONFIRMED** | [S][L] |
| G2 | nextjs collection route uses a publishable-key client, which current enforcement denies | **CONFIRMED at platform HEAD `2a7f1ba3`** | [S] |
| G3 | Tarball omits template `.gitignore`; generated `.env.local` not ignored | **CONFIRMED, root-caused, reproduced** | [S][L] |
| G4 | Env helper exposes secrets; later defaults overwrite earlier values; prompts for unused credentials | **CONFIRMED, all three parts** | [S] |
| G5 | Guides differ from templates on versions, template count, schema provisioning and auth | **CONFIRMED, and broader than stated** | [S][L] |
| G6 | Marketing SDK snippet omits required `baseUrl` | **CONFIRMED, reproduced** | [S][L] |
| — | Legacy `queryRecords` URL form is *not* itself a failure | **AUDIT CORRECT — upheld** | [S] |
| — | Published nextjs template builds without credentials | **CONFIRMED** (exit 0) | [L] |

### G2 detail — why this cannot be fixed by scoping

At platform `main` `2a7f1ba3`:

- `services/backend/data/src/app/middleware/enforcePkScope.ts` — `getRequiredScope()` returns `null` for any non-GET `/collections` request, and a `null` required scope produces `403 "This resource is not accessible with a publishable key"`.
- `services/backend/iam/src/utils/scopeValidator.ts` — `RESOURCE_ACTIONS.collections = ['retrieve', 'list']`. **`collections:create` is not an expressible scope**, so this cannot be granted even deliberately.

Records are different: `records: ['retrieve', 'list', 'create']`, so a publishable key *can* create records given an explicit per-slug scope (wildcards are refused for write actions). The platform boundary is coherent; the template was wrong. **No scope was widened in the repair.** **[S]**

### G3 root cause

npm **unconditionally excludes files named `.gitignore`** from published tarballs, regardless of the `files` field. Confirmed on repo `main`: all five template `.gitignore` files are tracked in git, yet `npm pack --dry-run --json` packs 104 files with **zero** gitignore entries. `.env.example` is packed normally, which is why the omission was easy to miss. **[S][L]**

Reproduced against published 1.0.9:

```
$ ls -a demo-nextjs | grep gitignore      # (nothing)
$ git init -q . && git check-ignore -v .env.local
>>> NOT IGNORED
$ git check-ignore .next ; git check-ignore node_modules
>>> NOT IGNORED (both)
```

**Impact:** a developer following the documented flow (scaffold → `npx ... env` → `git init` → `git add .`) commits their publishable key, their service-account client secret, `.next/` and `node_modules`. **[L]**

A second, independent defect: the `nextjs` and `react-vite` template `.gitignore` files omitted `.env.local` entirely (`api`, `jobs`, `saas` included it) — so even running from a source checkout leaked the exact file the `env` command writes.

> Demonstrated with synthetic placeholder values (`sk_SYNTHETIC...`). **No real secret was entered, written or transmitted at any point in this task.**

### G4 detail (`src/env.ts` at `86a734fb`)

| Line | Defect |
|---|---|
| `:95` | `type: "text"` for every prompt, including `CENTRALI_CLIENT_SECRET` — the secret is echoed to the terminal and into scrollback |
| `:212` | `console.log(output)` prints the full dotenv, secrets included |
| `:37` | Reads `.env`, `.env.local`, `.env.example` **in that order**, assigning unconditionally — so `.env.example` is read **last** and its non-placeholder defaults overwrite a real configured value |
| `:60` | The nextjs branch requests both a publishable key and service-account credentials; the template read only one set |
| `:226` | Overwrites an existing `.env.local` with no warning |
| `:138` | Vercel output embeds the secret in `<<< "value"`, a bash/zsh-only herestring, placing secrets in shell history |

---

## 4. New findings (not in the audit)

### N1 — the nextjs credential gate contradicted its own data path (first-success blocker) **[S]**

`templates/nextjs/src/app/page.tsx:6-7` gated on `CENTRALI_WORKSPACE && CENTRALI_CLIENT_ID` and told the user to add *service-account* credentials. Line 50 then called `createCentraliClient()`, which reads only `NEXT_PUBLIC_*` and a publishable key.

- Follow the on-screen instructions exactly → gate passes, every SDK call runs with `workspaceId: ""` and no key.
- Set only the `NEXT_PUBLIC_*` values that `.env.example` and the CLI's closing hint describe → the gate never passes; "Get started" forever.

**No documented credential combination produced a working page.** The same screen also linked `docs.centrali.dev` (wrong TLD) and said copy to `.env`, while the `env` command writes `.env.local`.

### N2 — a credential-less build baked the placeholder into the production route **[L]**

`/` was prerendered as static when credentials were absent at build time:

- build manifest listed `/` under `prerendered routes`; `.next/server/app/index.html` contained "Get started"
- started the production server **with credentials present** → `GET /` still returned the baked page: `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`, `Cache-Control: s-maxage=31536000`

Any host that builds before runtime env is applied could never show collections. `npm run dev` was unaffected, which is why it went unnoticed.

### N3 — four of five published templates failed `npm run build` **[L]**

The audit built only `nextjs`. Building all five:

| Template | 1.0.9 build | Error |
|---|---|---|
| `nextjs` | **PASS** | — |
| `api` | **FAIL** | `TS7016: Could not find a declaration file for module 'qs'` |
| `jobs` | **FAIL** | same |
| `react-vite` | **FAIL** | same, plus `TS6133` unused SDK imports, `ImportMeta.env` missing, `./index.css` unresolved |
| `saas` | **FAIL** | `TS2322: Type 'string \| null' is not assignable to type 'string'` |

**Root cause of the `qs` failures:** SDK **4.6.0 ships 6 files — `dist/index.js` and a root `index.ts`, with no `.d.ts` and no `types` field.** TypeScript therefore falls back to typechecking the SDK's own source, which imports the untyped `qs`. `nextjs` and `saas` got past it only because they happened to carry `@types/qs`; the other three did not.

**SDK 9.5.2 ships `dist/index.d.ts` and declares `types`**, and its `.d.ts` imports only from `axios` (which ships its own types). Upgrading fixes this at the root, and the `@types/qs` workaround is removed rather than spread to the other templates. **[S][L]**

**`saas` is a genuine null-handling bug, not a type nit:** `ensureWorkspace()` never throws and signals failure by returning `orgId: null`; the settings page passed it to a component typed `orgId: string` and queried members with `data.orgId: null`.

### N4 — packaging hygiene in the SDK itself **[S]**

Both SDK 4.6.0 and 9.5.2 tarballs ship a stray nested `centrali-io-centrali-sdk-2.3.0.tgz` inside the published package. Harmless but unintended; reported for CEN. 9.5.2 also ships its full `src/**/*.ts` (51 files).

---

## 5. Repairs submitted

**PR:** [blueinit/create-centrali-app#3](https://github.com/blueinit/create-centrali-app/pull/3) (draft)
**PR:** [blueinit/centrali-docs#22](https://github.com/blueinit/centrali-docs/pull/22) (draft)
Branch: `cweb-3/starter-packaging-and-nextjs-first-success`, commit `e02a995`

| Defect | Repair |
|---|---|
| G3 packaging | Templates store `gitignore`; `scaffold.ts` restores the dot via `RENAME_ON_COPY`. All five ignore lists hardened to cover `.env`, `.env.local`, `.env.*.local` and build output |
| G1 / N3 | All templates → SDK `^9.5.2`; `@types/qs` workaround removed; `engines.node >= 20.9.0` declared |
| G2 / N1 | nextjs uses **one** server-side service-account path; both routes and both server pages converted. Scope **not** widened |
| N2 | `dynamic = "force-dynamic"` on both nextjs server pages |
| G4 | Secrets entered hidden, masked on screen, written at mode `0600`; `.env.local` never silently overwritten; precedence fixed (process env > first file wins; `.env.example` can no longer clobber); per-template variable sets; Vercel output pipes instead of herestring |
| N3 saas | Null guard with an actionable message |
| N3 react-vite | `tsconfig.include` now covers root `env.d.ts`; `env.d.ts` no longer declares `VITE_CENTRALI_CLIENT_SECRET`/`_CLIENT_ID` (a `VITE_`-prefixed secret is inlined into the browser bundle) |
| "new workspace" assumption | `npm run setup` added for nextjs; idempotent |
| CLI not scriptable | `--typescript` / `--yes` flags; `--template` validated |
| `env` misdetection | `scaffold.ts` stamps `centrali.template`; dependency sniffing removed (the old "next + setup script ⇒ api" rule would have misfired as soon as nextjs gained a setup script) |
| Unactionable errors | Shared `lib/errors.ts`. The SDK wraps transport errors and exposes `status`/`statusText`/`code`/`body` — **not** `error.response` — and its `message` is only ever `"Request failed with status code 401"` |
| Deployment safety | Explicit local-demo boundary in `page.tsx`, `DEPLOY.md`, README and the starter guide |
| Stale repo docs | README and `CLAUDE.md` corrected (both said two templates / Next.js 15) |

### Regression checks added

`test/packaging.test.mjs` — 11 checks, **11/11 pass**. They deliberately assert against the **packed tarball** and the **generated project**, because the original defect was invisible from a source checkout. Includes a git-based proof that `.env.local` is ignored in a generated project, a guard that the nextjs template never reintroduces `createCentraliClient`, a `force-dynamic` guard, an SDK-major floor, and a check that no `NEXT_PUBLIC_`/`VITE_` variable is a secret in either `.env.example` or `env.d.ts`.

---

## 6. Scenario results

### Verification items from the ticket

| # | Scenario | Expected | Observed | Result |
|---|---|---|---|---|
| 1 | Record exact versions and commands | — | Section 1 | **PASS** |
| 2 | Clean install, typecheck/build, regression checks | pass | Section 7 | **PASS** (4/5 templates) |
| 3 | Real external SDK authentication | token + authorized call | no credentials available | **BLOCKED** |
| 4 | Developer-created unique record, read back by ID/query, shown in Next.js | visible | not attempted | **BLOCKED** |
| 5 | Same record after refresh and restart | identical | not attempted | **BLOCKED** |
| 6 | Credential/permission failure cases | actionable errors | 401 path exercised live; 403 path **not** exercised | **PARTIAL** |
| 7 | Pack the proposed release and test generated output | works | done, see Section 7 | **PASS** |
| 8 | Re-run from the written instructions with no undocumented setup | works | needs a human + sandbox | **BLOCKED** |

### Item 6, in detail — what was actually exercised **[R-neg]**

Synthetic credentials (`ci_SYNTHETIC` / `sk_SYNTHETIC`) were sent to the **real** endpoint. The service reached the auth server and rejected them:

```
CentraliError
  status     = 401
  statusText = Unauthorized
  code       = invalid_client
  body       = {"error":"invalid_client","error_description":"client authentication failed"}
  message    = Request failed with status code 401
  .response  = undefined
```

Against the repaired route this produced:

```
HTTP 500
{"error":"Centrali rejected the service account credentials (401 invalid_client):
 client authentication failed. Check CENTRALI_CLIENT_ID and CENTRALI_CLIENT_SECRET,
 and confirm CENTRALI_WORKSPACE is your workspace slug (not its display name)."}
```

Input-validation paths were also exercised: `HTTP 400 {"error":"recordSlug is required and must start with..."}` and `HTTP 400 {"error":"collectionSlug is required"}`.

**The 403 insufficient-permission path was NOT exercised.** It requires credentials that authenticate but lack group membership. Its message is implemented but **unverified**.

### N2 fix verified at runtime **[L]**

Same build, two runs. Without credentials: "Get started", and no `x-nextjs-cache`/`x-nextjs-prerender` headers. With credentials present: the Collections view rendered instead of the baked placeholder. Build output confirms `/` moved from `○ (Static)` to `ƒ (Dynamic)`.

---

## 7. Template matrix — before and after

Scaffolded from the **locally packed `1.1.0` tarball**, not from `main`. Default-branch testing alone would not have caught G3.

| Template | 1.0.9 scaffold | 1.0.9 `.gitignore` | 1.0.9 build | **1.1.0 scaffold** | **1.1.0 `.gitignore`** | **1.1.0 install** | **1.1.0 build** | SDK | Framework |
|---|---|---|---|---|---|---|---|---|---|
| `nextjs` | PASS | **MISSING** | PASS | PASS | **PASS** | PASS | **PASS** | 9.5.2 | Next 16.4.3 |
| `api` | PASS | **MISSING** | **FAIL** | PASS | **PASS** | PASS | **PASS** | 9.5.2 | Next 16.4.3 |
| `jobs` | PASS | **MISSING** | **FAIL** | PASS | **PASS** | PASS | **PASS** | 9.5.2 | Next 16.4.3 |
| `react-vite` | PASS | **MISSING** | **FAIL** | PASS | **PASS** | PASS | **PASS** | 9.5.2 | Vite 6.4.5 |
| `saas` | PASS | **MISSING** | **FAIL** | PASS | **PASS** | PASS | **FAIL** | 9.5.2 | Next 16.4.3 |

### Per-template status — no blanket claim

| Template | Status | What that means |
|---|---|---|
| `nextjs` | **Build-verified; runtime unverified** | Packaging, credential path, prerender and error handling repaired and locally verified. Authenticated create/read/persistence **not** demonstrated. |
| `api` | **Build-verified; runtime unverified** | Builds for the first time. Its own credential path was already coherent (service account throughout). Not functionally tested. |
| `jobs` | **Build-verified only** | Builds. Functions/triggers/runs behaviour entirely untested — needs a sandbox and arguably its own ticket. |
| `react-vite` | **Build-verified only** | Builds. Browser publishable-key flow untested. |
| `saas` | **BLOCKED — still fails to build** | Type error fixed; prerender then fails. See below. |

### `saas` — remaining blocker **[L]**

```
Error occurred prerendering page "/".
Error: @clerk/clerk-react: Missing publishableKey.
```

`src/app/layout.tsx` wraps every route in `ClerkProvider`, and Clerk's keyless mode does not engage during `next build`, so all 7 routes need a Clerk publishable key at build time. The CLI prints *"auth works instantly (Clerk keyless mode)"* for this template, which is **not accurate for a production build**.

Fixing this requires a decision about Clerk configuration and touches the auth story CWEB-3 explicitly scopes out, so it was **not** patched. See `follow-up-gaps.md` (FG-1).

---

## 8. Known limitations of this report

1. **No authenticated success of any kind.** No sandbox workspace or credentials were available. Nothing here demonstrates working permissions, persistence, or tenant isolation. Build success is not a substitute.
2. **403 permission path unverified** — implemented, untested.
3. **`mkdocs build --strict` was not run.** No Python or pip in this environment. Link resolution was checked by script (33/33 relative links resolve in changed files), but the site was not built. Worth confirming in CI.
4. **No deployment was performed.** DEPLOY.md changes are reviewed text, not a verified Vercel/Netlify run.
5. **`jobs` and `react-vite` were build-tested only.** Neither template's actual feature set was exercised.
6. **Tenant isolation untested.** The audit's question about whether user A can reach user B's data in the `saas` template remains open and needs a sandbox with two identities.
7. **Deployed vs source docs not distinguished.** This report inspects repository source. Whether `docs.centrali.io` currently serves these commits was not established.
8. **SDK 9.5.2 compatibility is build-level and validator-level, not runtime-level.** Template calls typecheck against 9.5.2 and the canonical query body passes the SDK's bundled validator, but no call was executed successfully against the service.

---

## 9. Next required action

**Provision an isolated non-production development workspace** with (a) a service account authorized to create collections and records, and (b) a publishable key — for synthetic data only. Then items 3, 4, 5, 8, the 403 case and the `saas` tenant-isolation question become executable.

Until then CWEB-3's first-success acceptance criterion cannot be met, and I have not claimed it.
