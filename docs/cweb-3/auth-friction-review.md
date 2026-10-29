# CWEB-3 — Authentication friction review

> [!IMPORTANT]
> **Read [`README.md`](./README.md) first — this document is superseded in part (note added 2026-10-29).**
>
> The text below is the record as it stood on **2026-10-28**, when no sandbox workspace or
> credentials existed. It is left unedited so the dated record stands on its own.
>
> The "Evidence limitation" note below is no longer accurate: on 2026-10-29 successful
> authenticated requests **were** made, and **tenant isolation was verified** with a
> working-credential control. The review's conclusion — that authentication is not the
> barrier — is unchanged and now rests on runtime evidence rather than source alone. The
> **403 path remains implemented but untriggered.**

**Issue:** [CWEB-3](https://blueinit.atlassian.net/browse/CWEB-3)
**Date:** 2026-10-28
**Scope:** whether authentication is a barrier to using the Centrali starters, per CWEB-3 §3.

---

## Headline answer

**Authentication *policy* was not the barrier. Authentication *plumbing in the starters and docs* was — and it was a hard blocker.**

The platform's credential model is coherent and correctly enforced. Three distinct credential types exist with sensible boundaries, and the data service enforces them exactly as the IAM source describes. Nothing about that design needed to change, and nothing in the repair widened it.

What blocked first success was that **the starter asked for one credential and then used another**, and that **no documentation stated the one rule that matters** — that a publishable key cannot create a collection. A developer following the instructions precisely could not succeed, and the error they got did not tell them why.

**Therefore: no standalone auth redesign ticket is justified.** No new auth framework, no Clerk dependency for basic persistence, and no change to publishable-key scopes. Four bounded items do need CEN review, listed in `follow-up-gaps.md`; none is a redesign.

> **Evidence limitation, stated up front.** No sandbox workspace or credentials were available. This review is based on platform/IAM/SDK **source at `main` `2a7f1ba3`**, starter and docs source, and **negative-path runtime tests** against the live API with synthetic credentials. **No successful authenticated request was made.** Signup, token renewal, resource authorization, and tenant isolation are **not** verified here, and I make no claim about them.

---

## The credential model, as actually implemented

From `services/utils/centrali-sdk/src/types/common.ts` and the IAM/data services at `main`:

| Path | SDK options | Transport | Intended use |
|---|---|---|---|
| Publishable key | `publishableKey` | `x-api-key` header, no refresh | Browser code |
| Bearer / BYOT | `token`, or `getToken()` callback | `Authorization: Bearer`, re-fetched per request | External IdP (Clerk, Auth0) |
| Service account | `clientId` + `clientSecret` | OAuth2 client credentials, token cached and refreshed | Server only |

The SDK **enforces mutual exclusivity at construction**, which is good design and verified at runtime:

```
new CentraliSDK({ baseUrl, workspaceId, publishableKey, clientId, clientSecret })
→ Error: Cannot use publishableKey with clientId/clientSecret. Use one auth method.
```

### Publishable-key enforcement is correct and complete

`services/backend/iam/src/utils/scopeValidator.ts`:

```
records:     ['retrieve', 'list', 'create']
collections: ['retrieve', 'list']
triggers:    ['execute']
files:       ['retrieve', 'create']
```

Plus: wildcard targets are refused for write actions (`records:create:*` is invalid; an explicit slug is required), and `collections:list` is workspace-level two-part.

`services/backend/data/src/app/middleware/enforcePkScope.ts` hard-blocks 13 admin route prefixes outright, and maps the rest to a required scope; an unmappable route is denied.

**Consequence:** `collections:create` is **not an expressible scope**. A publishable key cannot create a collection even if someone tried to grant it. This is a deliberate, well-built boundary — and it is the single most important fact about using Centrali from a browser. **It appeared in no developer-facing document.**

---

## The journey, stage by stage

CWEB-3 §3 asks five specific questions. Answering each:

### Can a developer find/create credentials, identify the slug, get the right permissions, and complete a first real SDK request?

**Credentials and slug: yes.** `docs/getting-started/account-setup.md` is genuinely good. It walks through workspace creation, the slug, a dedicated development service account, adding the account to a group, and — notably — already states *"A token can be issued successfully even when the service account lacks permission to use a resource."* That is exactly the right warning.

**Permissions: yes, with a caveat** — it correctly recommends `workspace_developers` over `workspace_administrators` as the least-privilege option.

**First real SDK request: NO, and this was the blocker.** Not because of auth policy, but because:

- the `nextjs` starter asked for service-account credentials on screen and then issued requests with the publishable-key client (finding N1), so neither credential worked;
- `quickstart-nextjs.md` and `quickstart-node.md` both queried a `products`/`Product` collection they never created, so a fresh signup had nothing to authenticate *against*;
- `account-setup.md` used `CENTRALI_WORKSPACE_SLUG` while the starters used `CENTRALI_WORKSPACE` — a third name for one value.

**Not verified:** fresh signup, email confirmation, and first-time console navigation. I had no account to create.

### Are provisioning credentials and application runtime credentials distinct and correctly documented?

**Distinct: yes, and the distinction is enforced.** Provisioning (collection creation) requires a service account; runtime browser access uses a publishable key.

**Correctly documented: no — this was the single worst gap.** No developer-facing page stated that a publishable key cannot create a collection. The starter guide actively described the opposite, advertising an "inline form to create your first collection" in a template whose credential mode made that impossible. A developer hitting the resulting 403 had nothing to tell them it was a category error rather than a misconfiguration.

Fixed in both PRs: an explicit credential table in `quickstart-create-app.md`, the rule stated in the starter README, `CLAUDE.md`, the template's own `lib/centrali.ts` docblock, and the 403 error text itself.

### Can a developer distinguish service-account, publishable-key and signed-in end-user identity without configuring unused auth paths?

**Now yes; previously no.** The published `nextjs` template's `.env.example` listed *both* a publishable key and service-account credentials, and the `env` helper prompted for both — so a developer created a publishable key the template's gate ignored, and a service account its data path ignored. Two credentials configured, neither functional, no indication which mattered.

The repair gives `nextjs` one credential path and asks only for those four variables. `api`/`jobs`/`saas` legitimately use both and are documented as such.

**Clerk is not required for basic persistence** — confirmed. The `nextjs`, `api`, `jobs` and `react-vite` templates have no Clerk dependency, and the local persistence demo needs no external IdP. CWEB-3's constraint here is satisfied.

### Are missing, invalid and insufficient-permission cases explained clearly?

**Previously: no, at every level.**

The SDK wraps transport errors in `CentraliError` and deliberately does not leak axios internals. Verified shape **[runtime, negative path]**:

```
status = 401 | statusText = Unauthorized | code = invalid_client
body   = {"error":"invalid_client","error_description":"client authentication failed"}
message = "Request failed with status code 401"      ← the only thing most code shows
.response = undefined                                 ← so err.response?.status never matches
```

So the useful detail exists on `status`/`code`/`body`, but `message` — the field every template and both quickstarts surfaced — is generic. The published `nextjs` template rendered exactly `"Request failed with status code 401"` in a red box.

Worse, with **no** credentials configured, the pre-fix template constructed a client with `workspaceId: ""` and no key and issued the request anyway, producing an opaque failure rather than "you have not configured credentials".

**Now:** a shared `lib/errors.ts` reads `status`/`code`/`body` and produces specific guidance for 401, 403, 404, 409, 400/422 and network failure, naming the variable to check in each case. Verified live for 401; **403 is implemented but unverified** (it needs credentials that authenticate yet lack group membership).

**Token issuance ≠ resource access** — the docs already said this; the starters did not act like it. The repaired 403 message says it explicitly at the point of failure.

### For the Next.js path: server-only secrets, route exposure, and credential lifecycle?

**Server-only secrets — now structurally safe.** All credentials are read in server components, route handlers and a Node setup script. None carries a `NEXT_PUBLIC_` prefix. A regression test fails the build if any `NEXT_PUBLIC_`/`VITE_` variable is ever named like a secret, in either `.env.example` or `env.d.ts`.

> Found and fixed along the way: `templates/react-vite/env.d.ts` declared `VITE_CENTRALI_CLIENT_ID` and `VITE_CENTRALI_CLIENT_SECRET`. Nothing read them, but the type declaration is an instruction to the developer — and anything `VITE_`-prefixed is inlined into the browser bundle. Removed.

**Route exposure — real, and now stated rather than hidden.** `/api/collections` and `/api/records` hold service-account credentials and perform **no** application-level authorization. Unauthenticated `curl` against a running dev server creates a collection. This matches the audit's G8 for the `api` template and is equally true here.

This is acceptable for a local demo and unacceptable public. The repair does not add an auth framework — CWEB-3 scopes that out — but makes the boundary impossible to miss: in the running UI, in `DEPLOY.md` (with a "read this before deploying publicly" block), in the README, in the starter guide, and in a docblock on each route.

**Credential lifecycle — partially assessed.** The SDK caches the service-account token and refreshes on 401 with a single-flight guard (`isRefreshingToken`/`tokenRefreshPromise`), which is sound by inspection. `.env.local` is now written at mode `0600`. **Token expiry, renewal under load, and revocation were not exercised** — they need a sandbox.

### The Clerk / BYOT path

Inspected, not exercised. `@clerk/nextjs ^6` with keyless mode; `ensureWorkspace()` creates an organization and membership record on first sign-in, with a retry and a parallel-request recheck.

Two things to record:

1. **It does not affect the other templates' usability.** No Clerk dependency leaks into `nextjs`, `api`, `jobs` or `react-vite`. CWEB-3's "do not require Clerk for basic local persistence" constraint holds.
2. **It currently fails `next build`** — `@clerk/clerk-react: Missing publishableKey` during prerender, because `layout.tsx` wraps every route in `ClerkProvider` and keyless mode does not engage at build time. The CLI nonetheless prints *"auth works instantly (Clerk keyless mode)"*. See `follow-up-gaps.md` FG-1.

**Tenant isolation is NOT validated.** Authorization in this template is application-level: `ensureWorkspace` derives `orgId` from the Clerk `userId`, then routes filter on `data.orgId`. Whether the *platform* prevents a service-account-backed route from reading another org's records is a separate question I could not test. **Installed Clerk UI is not isolation proof**, and I am not treating it as such. This must be tested with two identities in a sandbox before any signed-in multi-user recommendation — `follow-up-gaps.md` FG-2.

---

## Classification of every auth-related issue found

Per CWEB-3's four categories.

| ID | Issue | Class | Disposition |
|---|---|---|---|
| AF-1 | `nextjs` gate required service-account vars; data path used the publishable key. No credential combination worked | **starter defect** | **Fixed** — single server-side path (PR #3) |
| AF-2 | Template attempted collection creation with a publishable key, which the platform can never permit | **starter defect** | **Fixed** — service account; scope not widened (PR #3) |
| AF-3 | No developer-facing doc stated that a publishable key cannot create a collection | **docs friction** | **Fixed** — credential table + README + error text (PR #3, #22) |
| AF-4 | `env` helper prompted for credentials the template never read; `.env.example` listed both paths | **starter/CLI friction** | **Fixed** — per-template variable sets (PR #3) |
| AF-5 | `CentraliError.message` is always `"Request failed with status code N"`; detail only on `status`/`code`/`body`; no `.response` | **SDK defect (minor, DX)** | **Worked around** in the template. Reported for CEN — FG-3 |
| AF-6 | Omitting `baseUrl` throws a bare `TypeError: Invalid URL` with no mention of `baseUrl` | **SDK defect (minor, DX)** | Reported for CEN — FG-3 |
| AF-7 | Secrets prompted as plain text, echoed to terminal and printed in full | **CLI defect (security-shaped)** | **Fixed** — hidden entry, masking, mode `0600` (PR #3) |
| AF-8 | `.env.example` read last, overwriting real credentials with placeholders | **CLI defect** | **Fixed** — precedence corrected (PR #3) |
| AF-9 | Generated projects had no `.gitignore`; credentials would be committed | **packaging defect (security-shaped)** | **Fixed** — `gitignore` rename + regression test (PR #3) |
| AF-10 | `react-vite/env.d.ts` declared `VITE_`-prefixed client secret variables | **starter defect (security-shaped)** | **Fixed** + test guard (PR #3) |
| AF-11 | Example routes hold privileged credentials with no application-level authorization | **by design for local demo; a risk if promoted** | **Documented**, not auth-framework'd. Needs a decision before any public/customer-facing promotion — FG-4 |
| AF-12 | Three variable names for the workspace slug across docs and starters | **docs friction** | **Fixed** — aligned on `CENTRALI_WORKSPACE` (PR #22) |
| AF-13 | `saas` cannot build without a Clerk publishable key, while the CLI advertises keyless | **starter defect, independent** | **Reported, not patched** — FG-1 |
| AF-14 | Tenant isolation in the Clerk path unvalidated | **unknown — needs platform testing** | **Reported** — FG-2 |

**Fixed here: 9. Reported for CEN/follow-up: 5. Platform/IAM policy changes required: 0.**

---

## Unresolved dependencies

1. **No sandbox.** The 403 path, token renewal, revocation, wrong-slug behaviour and all isolation questions are unexecutable. This is the gating dependency.
2. **403 message unverified.** Implemented against the documented contract; never triggered.
3. **Signup and console navigation unassessed.** No account was created.
4. **Realtime/websocket auth not examined.** Out of scope for this journey; flagged so it is not assumed covered.
5. **Deployed-page state unknown.** Source was inspected; whether `docs.centrali.io` serves these commits was not established.

---

## Recommendation

**Do not open a standalone auth investigation or redesign ticket.** CWEB-3 asked for an explicit determination and this is it: the platform's identity and permission model is sound, correctly enforced, and did not need changing. The friction was entirely in the starter's wiring and in documentation that never stated the one binding rule. Both are repaired and under review.

Keep these in scope, in this order:

1. **Provision a sandbox** and close the 403, persistence and isolation gaps. Everything else is blocked on this.
2. **Take FG-3** (two small SDK error-message improvements) to CEN. Cheap, high leverage — the 401 message is the first thing every new developer sees fail.
3. **Decide FG-1** (Clerk keyless vs. required key) before the `saas` template is offered as working.
4. **Settle FG-4** (application authorization for example routes) before any deploy-oriented promotion. The current documented local-demo boundary is honest but is not a production story.
5. **Do not** require Clerk or any external IdP for basic persistence. The current split is correct.
