/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CENTRALI_BASE_URL: string;
  readonly VITE_CENTRALI_WORKSPACE: string;
  readonly VITE_CENTRALI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
