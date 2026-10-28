/// <reference types="vite/client" />

// Only the variables this template actually reads. Everything with a VITE_
// prefix is inlined into the browser bundle at build time, so a service
// account client secret must never appear here — use a server-side runtime
// for anything that needs one.
interface ImportMetaEnv {
  readonly VITE_CENTRALI_API_URL: string;
  readonly VITE_CENTRALI_WORKSPACE: string;
  readonly VITE_CENTRALI_PK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
