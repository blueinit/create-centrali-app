/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CENTRALI_API_URL: string;
  readonly VITE_CENTRALI_WORKSPACE: string;
  readonly VITE_CENTRALI_CLIENT_ID: string;
  readonly VITE_CENTRALI_CLIENT_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
