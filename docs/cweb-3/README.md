# CWEB-3 — validation evidence

**Issue:** [CWEB-3](https://blueinit.atlassian.net/browse/CWEB-3)
**Compiled by:** Gerald (Developer Experience Engineer)
**Covers:** 2026-10-28 (static + local build) and 2026-10-29 (authenticated runtime)

These four documents are the evidence record behind the CWEB-3 starter repairs. They are
reference material, not part of the shipped package: `package.json` sets
`files: ["dist", "templates"]`, so nothing under `docs/` is included in the npm tarball.

| Document | What it is |
|---|---|
| [`starter-validation-report.md`](./starter-validation-report.md) | The full per-template findings table and the CWEB-3 verification checklist |
| [`nextjs-first-success.md`](./nextjs-first-success.md) | The step-by-step reproducible first-success path for the `nextjs` template |
| [`auth-friction-review.md`](./auth-friction-review.md) | Whether authentication is a barrier to the starters (CWEB-3 §3) |
| [`follow-up-gaps.md`](./follow-up-gaps.md) | Work found in scope-adjacent areas, with reproductions and proposed owners |

---

## Read this before the four documents

The four documents were written on **2026-10-28**, when no sandbox workspace or credentials
existed. They are deliberately full of `[UNVERIFIED]` and `BLOCKED` markers, and they state
up front that no successful authenticated request had been made.

**That changed on 2026-10-29.** Two workspaces were provisioned by self-signup
(`gerald-cweb3-sandbox-a`, `gerald-cweb3-sandbox-b`), each with an admin-grouped service
account, and the authenticated journey was executed. The original text below is left
**unedited** so the dated record stands on its own — this file is the correction layer.

### Now verified (was BLOCKED / UNVERIFIED)

| Claim | Evidence | Status |
|---|---|---|
| Authenticated write — first success | `npm run setup` created collection `demo-items` and seeded a record | **PASS** |
| Authenticated read + display | `/` and `/collections/demo-items` both 200, rendering that record | **PASS** |
| Persistence across restart | process killed by PID, port confirmed refusing connections, cold start, record still served | **PASS** |
| Tenant isolation | workspace B's credential against workspace A → `Token is not valid for this workspace`, **while the same credential reads its own workspace fine** | **PASS, with a working-credential control** |
| `mkdocs build --strict` on the paired docs PR | ran in CI on [`centrali-docs#22`](https://github.com/blueinit/centrali-docs/pull/22); **built in 12.21s** | **PASS** |
| `saas` template builds without Clerk keys | [PR #4](https://github.com/blueinit/create-centrali-app/pull/4) — build passes, 5 pages 200, write APIs 503 not 500 | **PASS** |

Exact versions for the runtime run: SDK `9.5.2`, Next `16.4.3`, React/ReactDOM `19.3.1`,
Node `24.22.1`, npm `11.19.1`.

The isolation row is the one worth reading twice. A denial on its own proves nothing — a dead
key denies everything. The control is that the *same* credential succeeds against its *own*
workspace in the same session, which is what makes the denial evidence of isolation rather
than evidence of a broken credential.

### Still NOT verified — stated plainly

These were open on 2026-10-28 and are **still open**. Nothing in the 2026-10-29 run closed them.

1. **The 403 insufficient-permission path.** This is the exact silent wall the old starter hit,
   so it is the most valuable remaining gap. It needs a service account that authenticates but
   belongs to no group. Creating one needs console access, which was lost mid-run — see
   *Deferred email verification* below. The error message is implemented and reviewed against
   the documented contract, but it has never been triggered.
2. **Publishable-key paths.** No publishable key was ever minted. This is why
   [PR #5](https://github.com/blueinit/create-centrali-app/pull/5) corrects the client-ID
   prefix to `sa_` but deliberately leaves `pk_live_` untouched rather than guessing.
3. **Authenticated Clerk runtime.** No Clerk application was provisioned, so sign-up, sign-in,
   session handling and `UserButton` against a real Clerk instance remain untested. The
   keyless and unconfigured paths *are* verified (PR #4).
4. **CWEB-3 verification item 8** — a person re-running the written instructions with no
   undocumented setup. Still needs a human.

### Two findings that belong to CEN, not to the starters

Both were filed for CEN engineering review rather than patched here, because they are platform
behaviour and outside this ticket's scope.

- **Deferred email verification locks you out at session two.** The first session works as
  designed, but signing out and returning gives *"Please verify your email before logging
  in."* Meanwhile the first-session banner only says *"verify your email to secure your
  account,"* which reads as optional. This is a real first-run risk, and it is what ended
  console access during this work — the service-account credentials still function, but no new
  resource can be created in those workspaces.
- **The SDK hides HTTP status on authorization failures.** Four of six probes returned no
  status code, so a consumer cannot branch on 401 vs 403 programmatically. This is also why
  the starter's shared `lib/errors.ts` reads `status`/`code`/`body` rather than
  `error.response`, which the SDK does not expose.

### Provenance of this directory

These files were first opened as `blueinit/centrali-docs#23`, which was closed on 2026-10-29
at 03:25 in favour of relocating them. They are recovered here from that PR's head commit
`68323f05`: all 965 original lines are byte-for-byte unchanged, with only a dated banner
added at the top of each pointing back to this file.

Two things about the original destination are worth recording, because the stated rationale for
the move does not quite hold: `centrali-docs` is a **private** repository, and these files were
deliberately committed **outside `docs_dir`** so that mkdocs would not publish them. The
relocation may still be the right call — evidence for a starter repair arguably belongs beside
the starter — but not because the files were at risk of being published.

A third destination, `blueinit/centrali-validation#3`, was named in the closing comment. That
repository is not reachable with the credentials available here (404, and absent from the
accessible `blueinit` listing), so whether it exists is **unverified by me** rather than
disproven. If that repo is the intended home, this directory should move again and this note
should move with it.
