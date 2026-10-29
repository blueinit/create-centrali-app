# CWEB-3 — Follow-up gaps

> [!IMPORTANT]
> **Read [`README.md`](./README.md) first — this document is superseded in part (note added 2026-10-29).**
>
> The text below is the record as it stood on **2026-10-28**, when no sandbox workspace or
> credentials existed. It is left unedited so the dated record stands on its own.
>
> The "No Jira tickets were created" note below no longer holds for two items: the
> **deferred email verification lockout** and the **SDK hiding HTTP status on authorization
> failures** were filed for CEN engineering review on 2026-10-29, at the founder's
> direction. Every other item here remains a proposal with no ticket.

**Issue:** [CWEB-3](https://blueinit.atlassian.net/browse/CWEB-3)
**Date:** 2026-10-28

Work found during CWEB-3 that is **out of its bounded scope**. Each item has a reproduction, an impact statement and a proposed owner.

> **No Jira tickets were created.** CWEB-3 says proposed follow-ups must not be turned into tickets automatically. These are proposals for review.

Ownership convention from the audit: platform IAM/data/console behaviour → **CEN**; developer-facing docs/site/starter → **CWEB**; campaign/distribution → **CMKT** after evidence and scope review.

---

## FG-1 — `saas` template cannot build without a Clerk publishable key, but the CLI says it can

**Proposed owner:** CWEB · **Impact:** high (template is offered and does not work) · **Confidence:** reproduced

**Reproduction**

```bash
npx @centrali-io/create-centrali-app@1.0.9 demo --template=saas   # (also on the CWEB-3 branch)
cd demo && npm install && npm run build
```

```
Error occurred prerendering page "/".
Error: @clerk/clerk-react: Missing publishableKey.
  You can get your key at https://dashboard.clerk.com/...
Export encountered an error on /page: /, exiting the build.
```

TypeScript passes (the `string | null` bug in `dashboard/settings/page.tsx` is fixed on the CWEB-3 branch); the failure is at prerender.

**Cause.** `src/app/layout.tsx` wraps every route in `ClerkProvider`, so all 7 routes need a Clerk publishable key at build time. Clerk's keyless mode does not engage during `next build`. Meanwhile `src/index.ts` prints, for this template:

> `# Start the app — auth works instantly (Clerk keyless mode):`

That claim is not accurate for a production build.

**Why not fixed under CWEB-3.** The options each have consequences the ticket reserves: require a Clerk key in `.env.example` and the setup flow (adds a hard third-party prerequisite); scope `ClerkProvider` to `/dashboard` only (restructures the template); or force every route dynamic (degrades the marketing page and hides the real issue). CWEB-3 says to repair bounded starter issues and report independent substantial repair with evidence — this is the latter, and it touches the auth story the ticket explicitly scopes out.

**Proposed scope.** Decide the Clerk prerequisite, implement it, correct the CLI message, and add a build check so the `saas` template cannot regress to a non-building state.

---

## FG-2 — `saas` tenant isolation is unvalidated

**Proposed owner:** CEN (platform behaviour) with CWEB (template) · **Impact:** high if signed-in multi-user use is ever recommended · **Confidence:** unverified by design — this is the ask

**What is known** (source inspection only): isolation in this template is **application-level**. `ensureWorkspace()` derives `orgId` from the Clerk `userId`; routes then filter on `data.orgId`. The underlying Centrali calls use a **service account**, which is not scoped to an organization.

**What is unknown.** Whether the platform prevents a service-account-backed route from reading another organization's records if the application-level filter is wrong, bypassed, or omitted. Nothing in the template's own code enforces that boundary — a single missing `data.orgId` predicate would expose other tenants' data.

**Reproduction to run (needs a sandbox, two identities)**

1. Sign in as user A, let bootstrap create org A, create a project.
2. Sign in as user B (separate org B).
3. As B, call `/api/projects` with A's `orgId` in the body/query.
4. As B, attempt to read A's records by ID.
5. Repeat with the application filter deliberately removed, to see what the **platform** does.

**Expected:** steps 3–4 denied. Step 5 shows whether platform-level protection exists at all or whether isolation rests entirely on application code.

**Note.** Installed Clerk UI is not isolation proof. The audit says this and I am repeating it: do not treat a working sign-in flow as a tenant-boundary guarantee.

---

## FG-3 — Two small SDK error-message defects make first-run failures hard to diagnose

**Proposed owner:** CEN (`services/utils/centrali-sdk`) · **Impact:** medium, affects every new developer · **Confidence:** both reproduced at runtime against SDK 9.5.2

### FG-3a — `CentraliError.message` discards all useful detail

```js
try { await client.collections.list(); } catch (e) {
  e.message    // "Request failed with status code 401"   ← what everyone displays
  e.status     // 401
  e.code       // "invalid_client"
  e.body       // {error:"invalid_client", error_description:"client authentication failed"}
  e.response   // undefined
}
```

The structured detail is all there, but `message` — the field every template, quickstart and `catch (err) { err.message }` surfaces — is generic. The published `nextjs` template rendered exactly `"Request failed with status code 401"` to the developer.

**Proposal:** compose `message` from `code` / `body.error_description` when present, e.g. `"Centrali request failed (401 invalid_client): client authentication failed"`. Backwards-compatible; `status`/`code`/`body` unchanged.

**Secondary note:** because `CentraliError` deliberately does not expose `error.response`, any consumer written against an axios-style `err.response?.status` silently never matches. Worth calling out in the SDK README — I made this exact mistake while writing the repair and caught it only by inspecting the error at runtime.

### FG-3b — omitting `baseUrl` throws a bare `TypeError: Invalid URL`

```js
new CentraliSDK({ workspaceId: "ws", publishableKey: "pk_..." })
// TypeError: Invalid URL
```

`baseUrl` is required, but the failure names neither the option nor the SDK. **Proposal:** validate in the constructor — `"CentraliSDK: baseUrl is required (e.g. https://centrali.io)"`.

This is not hypothetical: the marketing SDK snippet omits `baseUrl` (see FG-5), so the first thing a developer copying it sees is `TypeError: Invalid URL`.

---

## FG-4 — Example API routes have no application-level authorization

**Proposed owner:** CWEB (templates) with CEN review · **Impact:** high before any deploy-oriented promotion · **Confidence:** reproduced

**Reproduction** (against a running dev server, repaired `nextjs` template):

```bash
curl -s -X POST http://localhost:3000/api/collections \
  -H 'Content-Type: application/json' -d '{"name":"X","recordSlug":"x"}'
```

Succeeds with no authentication. The route holds the service account credentials and checks nothing about the caller. Same for `/api/records`, and for the `api` template's `/api/tasks` (the audit's G8).

**What CWEB-3 did.** Documented the boundary prominently — in the running UI, `DEPLOY.md` (with a "read this before deploying publicly" block), the README and the starter guide — rather than adding an auth framework, which the ticket scopes out. That is honest, but it is a warning, not a solution.

**What is still needed.** A decision on whether the templates should ship a minimal authorization pattern (route-level session check plus per-user data filtering), or remain explicitly local-only. This gates:

- promoting the starter publicly (audit acquisition hypothesis 3)
- the Vercel deployment story (hypothesis 5)
- any "production-ready" framing

**Do not** resolve this by broadening publishable-key scopes. The platform boundary is deliberate and correct.

---

## FG-5 — Marketing SDK snippet throws before any network request

**Proposed owner:** CMKT (copy) with CWEB (technical accuracy) · **Impact:** medium — it is the public SDK page · **Confidence:** reproduced

Audit finding G6, **revalidated**. Marketing `main` is still `b5372c80b1d6b0e502c00bfdfcb230708abb4ca6` — unchanged.

`components/sections/sdk/JavascriptSdkSection.tsx`:

```js
const client = new CentraliSDK({
  workspaceId: 'your-workspace-id',
  clientId: process.env.CENTRALI_CLIENT_ID!,
  clientSecret: process.env.CENTRALI_CLIENT_SECRET!,
});
```

Run verbatim against SDK 9.5.2: **`TypeError: Invalid URL`** at construction. `baseUrl` is missing and required.

Two further issues in the same snippet:

- It queries a `products` collection with no mention of creating one — the same "assumes the collection exists" problem the Node and Next.js quickstarts had.
- `workspaceId: 'your-workspace-id'` invites a workspace **ID**; the SDK wants the **slug**.

Also from the audit, still open: the SDK package's `repository` field points at `blueinit/centrali-sdk`, which returns 404 to this account. The SDK source actually lives at `blueinit/centrali/services/utils/centrali-sdk`. A 404 here means *unavailable in this access context*, not that the repository never existed — but a public `repository` link that does not resolve is worth correcting.

**Not changed under CWEB-3**, which permits checking marketing snippets "only where directly needed for this starter handoff; no positioning rewrite." **Proposed scope:** add `baseUrl`, show collection creation or link to it, rename the placeholder to `your-workspace-slug`, fix the `repository` field, and pin snippets to a supported SDK version.

---

## FG-6 — `jobs` and `react-vite` templates are build-verified only

**Proposed owner:** CWEB · **Impact:** medium · **Confidence:** build status reproduced; behaviour untested

Both now install and build cleanly on the CWEB-3 branch (they failed on published 1.0.9). **Neither template's actual feature set was exercised.**

- `jobs` — compute functions, scheduled and event triggers, run monitoring, DLQ. 31 generated files, substantially the largest template. Nothing beyond compilation was tested.
- `react-vite` — browser publishable-key flow. Whether a correctly scoped key actually supports the UI's read + create-record operations is untested. This is the one template that genuinely depends on publishable-key scope behaviour, so it is the natural place to verify the scope model end-to-end.

**Proposed scope:** one sandbox pass per template, recording per-feature PASS/FAIL. `jobs` may warrant its own ticket given its size. Per CWEB-3, these carry **no blanket compatibility claim** — see the per-template matrix in `starter-validation-report.md`.

---

## FG-7 — SDK tarball ships a stray nested tarball

**Proposed owner:** CEN · **Impact:** low (hygiene) · **Confidence:** reproduced

Both `@centrali-io/centrali-sdk@4.6.0` and `@9.5.2` include a nested `centrali-io-centrali-sdk-2.3.0.tgz` inside the published package.

```bash
tar tzf sdk-9.5.2.tgz | grep '\.tgz$'
# package/centrali-io-centrali-sdk-2.3.0.tgz
```

Unintended; inflates install size and is confusing when inspecting the package. **Proposal:** add it to `.npmignore` or `files`, and add a pack-contents assertion to the SDK's CI.

**Related, and the reason this matters more than hygiene:** SDK versions **below 9 ship no `.d.ts` and no `types` field** (4.6.0 publishes 6 files: `dist/index.js`, a root `index.ts`, and the stray tarball). Consumers therefore typecheck SDK *source* and fail on its untyped `qs` dependency — which is what broke three of five starter templates. 9.5.2 fixed this. **Proposal:** document a minimum supported SDK major for TypeScript consumers, and keep a `types`/`.d.ts` presence check in SDK CI so it cannot regress.

---

## FG-8 — Starter `package.json` version is structurally misleading

**Proposed owner:** CWEB · **Impact:** low · **Confidence:** root-caused

The audit flagged "published 1.0.9 versus source 0.1.0" and left provenance open. **Resolved:** `.github/workflows/publish.yml` sets the version from the release tag via `npm version --no-git-tag-version`, so `main` is never bumped by a release. Tags `0.2.0`–`1.0.9` exist and the published `gitHead 76cd992d` is a real commit. **This is not a mis-publish.**

It is still misleading — a reader of `main` sees `0.1.0`. The CWEB-3 branch sets it to `1.1.0`. **Proposal:** either keep it in step deliberately, or set it to an obviously-placeholder value (`0.0.0-dev`) with a comment, so it cannot be mistaken for the published version. Worth noting the publish workflow has no release-tag-vs-source sanity check.

---

## Explicitly NOT proposed

Recording these so the absence is deliberate, not an oversight:

| Not proposed | Why |
|---|---|
| A standalone auth investigation or redesign ticket | CWEB-3 asked for an explicit determination. The platform's credential model is sound and correctly enforced; the friction was starter wiring and docs, now repaired. See `auth-friction-review.md`. |
| Broadening publishable-key scopes to allow `collections:create` | The boundary is deliberate and correct. Widening it to make a demo pass would be the wrong fix, and CWEB-3 forbids it. |
| Requiring Clerk or any external IdP for basic persistence | Not needed; four templates work without one. CWEB-3 forbids it. |
| A code-first console onboarding variant (audit G7) | Product/console scope decision, not a starter repair. Unchanged from the audit's position. |
| Any change to public positioning, pricing or campaign work | Outside my remit. CMKT after evidence and scope review. |
| A new hosting product, Python SDK, or marketplace work | Outside the approved product boundary per *01 — Current Direction*. |
