/**
 * Shared error reporting for the Centrali route handlers and server pages.
 *
 * The SDK wraps transport errors in `CentraliError`, which exposes `status`,
 * `statusText`, `code`, `body` and `fieldErrors` — it deliberately does NOT
 * expose an axios-style `error.response`. Its `message` is only ever the
 * generic "Request failed with status code 401", so the useful detail lives in
 * `code`/`body`. Credential and permission failures are the most common
 * first-run problems, so they get explicit, actionable guidance here.
 */

interface CentraliErrorLike {
  status?: number;
  statusText?: string;
  code?: string;
  body?: unknown;
  message?: string;
  fieldErrors?: { field: string; message: string }[];
}

/** Map an SDK error to a useful HTTP status for the browser. */
export function statusFor(err: unknown): number {
  const status = (err as CentraliErrorLike)?.status;
  // A 401/403 from Centrali means this app is misconfigured, not that the
  // browser's request was unauthorized — surface it as a server-side problem
  // so it is not mistaken for an end-user permission error.
  if (status === 401 || status === 403) return 500;
  if (typeof status === "number" && status >= 400 && status < 500) return status;
  return 500;
}

/**
 * Turn a Centrali error into something a developer can act on.
 *
 * @param err    The thrown error (normally a `CentraliError`).
 * @param action What was being attempted, e.g. "create a collection".
 */
export function describeCentraliError(err: unknown, action: string): string {
  const e = (err ?? {}) as CentraliErrorLike;
  const detail = extractDetail(e);

  if (e.status === 401) {
    return (
      `Centrali rejected the service account credentials (401 ${e.code ?? ""}): ${detail}. ` +
      "Check CENTRALI_CLIENT_ID and CENTRALI_CLIENT_SECRET, and confirm " +
      "CENTRALI_WORKSPACE is your workspace slug (not its display name)."
    );
  }
  if (e.status === 403) {
    return (
      `The service account authenticated but is not permitted to ${action} (403): ${detail}. ` +
      "Add it to the workspace_administrators or workspace_developers group in " +
      "Console > ACCESS > Service Accounts. Obtaining a token does not by " +
      "itself grant access to a resource."
    );
  }
  if (e.status === 404) {
    return (
      `Centrali could not find the target (404): ${detail}. ` +
      "If this is a collection slug, run `npm run setup` or create the collection first."
    );
  }
  if (e.status === 409) {
    return `That already exists (409): ${detail}.`;
  }
  if (e.status === 400 || e.status === 422) {
    const fields = e.fieldErrors?.length
      ? ` Fields: ${e.fieldErrors.map((f) => `${f.field} (${f.message})`).join("; ")}.`
      : "";
    return (
      `Centrali rejected the request as invalid (${e.status}): ${detail}.${fields} ` +
      "If the collection uses strict schema discovery, every field you send " +
      "must be declared on the collection."
    );
  }
  if (e.status === undefined) {
    return (
      `Could not reach Centrali: ${detail}. ` +
      "Check network access and CENTRALI_API_URL (it should be the root " +
      "domain, e.g. https://centrali.io)."
    );
  }
  return `Centrali returned ${e.status} ${e.statusText ?? ""}: ${detail}`.trim();
}

/** Pull the most specific human-readable detail out of an SDK error. */
function extractDetail(e: CentraliErrorLike): string {
  const body = e.body as Record<string, unknown> | undefined;
  const fromBody =
    body &&
    (body.error_description ?? body.message ?? body.error ?? body.hint);
  if (typeof fromBody === "string" && fromBody) return fromBody;
  if (e.code) return e.code;
  if (typeof e.message === "string" && e.message) return e.message;
  return "no further detail provided";
}
